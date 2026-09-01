import type { Browser, Page } from 'puppeteer';
import {
  TestDriveRun,
  WebMCPToolCall,
  ErrorEvent,
  TimelineStep,
  WebMCPTool,
} from '../types/index.js';
import { config } from '../config/env.js';
import { launchBrowser, LaunchBrowserOptions } from './browser.js';
import { NetworkInterceptor } from './network-interceptor.js';
import { DOMInspector } from './dom-inspector.js';
import { WebMCPInspector } from './webmcp-inspector.js';
import { analyzerService } from '../services/analyzer.service.js';
import { resolveUserIntent, extractRequestedQuantity } from './explore/intent-resolver.js';
import { buildSiteStateGraph } from './explore/state-graph.js';
import { extractLiveSiteStructure } from './explore/site-crawler.js';
import { AgentStateDumper } from './agent-state-dumper.js';
import { auditUIVibe } from './ui-vibe-auditor.js';
import { auditBotProtectionAndHeaders } from './security/security-hygiene-auditor.js';
import { auditSeoReadabilityAndFeeds } from './explore/seo-readability-auditor.js';

function humanizeToolName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function summarizeToolOutput(toolName: string, output: any): string {
  if (!output) return 'Completed step with no output data.';
  if (typeof output === 'string') return output;
  if (output.message) return output.message;
  if (output.error) return `Error: ${output.error}`;
  if (Array.isArray(output.products)) {
    const pNames = output.products.slice(0, 2).map((p: any) => p.name || p.title || p.id).join(', ');
    return `Found ${output.products.length} product(s)${pNames ? `: ${pNames}` : ''}`;
  }
  if (output.product) {
    return `Loaded specifications for "${output.product.name || output.product.title || output.product.id}"`;
  }
  if (output.cart) {
    return `Cart updated: ${output.cart.count || 0} item(s), total: ₹${(output.cart.finalTotal || output.cart.subtotal || 0).toLocaleString()}`;
  }
  if (Array.isArray(output)) {
    return `Retrieved list with ${output.length} item(s)`;
  }
  const keys = Object.keys(output).slice(0, 4).join(', ');
  return `Retrieved response payload with properties: ${keys}`;
}

export async function executeRealTestDrive(run: TestDriveRun, options?: LaunchBrowserOptions): Promise<TestDriveRun> {
  const startTime = Date.now();
  let browser: Browser | null = null;
  const capturedErrors: ErrorEvent[] = [];
  const capturedToolCalls: WebMCPToolCall[] = [];
  const timeline: TimelineStep[] = [];
  let screenshot: string | undefined = undefined;

  timeline.push({
    id: 'step-spawn',
    phase: 'spawn',
    label: 'Launch Headless Sandbox',
    detail: 'Initialized isolated Chromium browser instance with Chrome WebMCP hooks',
    timestamp: Date.now(),
    status: 'info',
  });

  try {
    browser = await launchBrowser(options);
    if (!browser) {
      throw new Error('Failed to instantiate browser instance.');
    }
    const page: Page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // 1. Setup Network Interception
    const networkInterceptor = new NetworkInterceptor(run.url);
    networkInterceptor.setup(page);

    // 2. Setup Error Listeners
    page.on('pageerror', (err: unknown) => {
      const e = err instanceof Error ? err : new Error(String(err));
      capturedErrors.push({
        id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'runtime',
        message: e.message,
        stack: e.stack,
        timestamp: Date.now(),
      });
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        capturedErrors.push({
          id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'console',
          message: msg.text(),
          timestamp: Date.now(),
        });
      }
    });

    page.on('requestfailed', (req) => {
      capturedErrors.push({
        id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'network',
        message: `Request failed: ${req.method()} ${req.url()} (${req.failure()?.errorText || 'Unknown'})`,
        timestamp: Date.now(),
      });
    });

    // 3. Always inject standard WebMCP runtime environment (window.modelContext & document.modelContext)
    const baseWebMcpScript = `
      (function() {
        try {
          if (!window.modelContext) {
            window.modelContext = {
              tools: [],
              registerTool: function(tool) {
                this.tools = (this.tools || []).filter(function(t) { return t.name !== tool.name; });
                this.tools.push(tool);
                return tool;
              },
              unregisterTool: function(name) {
                this.tools = (this.tools || []).filter(function(t) { return t.name !== name; });
              }
            };
          }
          try {
            Object.defineProperty(document, 'modelContext', {
              value: window.modelContext,
              writable: true,
              configurable: true
            });
          } catch (e) {
            try { document.modelContext = window.modelContext; } catch(err) {}
          }
          ${run.virtualToolCode ? run.virtualToolCode : ''}
        } catch (err) {
          console.error('[DeepAge WebMCP Injector Error]:', err);
        }
      })();
    `;

    await page.evaluateOnNewDocument(baseWebMcpScript);

    if (run.virtualToolCode) {
      run.isVirtualRun = true;
      timeline.push({
        id: 'step-virtual-inject',
        phase: 'spawn',
        label: 'VIRTUAL_WEBMCP_INJECTED',
        detail: 'Injected virtual WebMCP tool fix directly into live browser memory for instant zero-friction verification',
        timestamp: Date.now(),
        status: 'info',
      });
    }

    // 4. Navigate to live target website
    const navStart = Date.now();
    await page.goto(run.url, {
      waitUntil: 'domcontentloaded',
      timeout: config.browser.timeoutMs,
    });
    const navDuration = Date.now() - navStart;

    // Apply virtual tools again after DOM is ready in case target site re-initialized window.modelContext
    if (run.virtualToolCode) {
      await page.evaluate((code: string) => {
        try {
          (window as any).modelContext = (window as any).modelContext || {
            tools: [],
            registerTool: function(tool: any) {
              this.tools = (this.tools || []).filter(function(t: any) { return t.name !== tool.name; });
              this.tools.push(Object.assign({}, tool, { source: 'injected' }));
            }
          };
          try {
            Object.defineProperty(document, 'modelContext', {
              value: (window as any).modelContext,
              writable: true,
              configurable: true
            });
          } catch (e) {
            try { (document as any).modelContext = (window as any).modelContext; } catch(err) {}
          }
          (0, eval)(code);
        } catch (err) {
          console.error('[DeepAge Virtual Injector OnEvaluate Error]:', err);
        }
      }, run.virtualToolCode);
    }

    timeline.push({
      id: 'step-nav',
      phase: 'navigation',
      label: 'Page Loaded Successfully',
      detail: `Successfully navigated to ${run.url} and loaded DOM tree in ${navDuration}ms`,
      timestamp: Date.now(),
      durationMs: navDuration,
      status: 'success',
    });

    // 5. Discover WebMCP tools & DOM controls & Dynamic Site Structure
    const discStart = Date.now();
    const discoveredTools = await WebMCPInspector.discoverTools(page, run.url);
    const domResult = await DOMInspector.inspect(page);
    const domControls = domResult.controls;
    const domTree = domResult.tree;
    run.domTree = domTree;
    const liveSiteData = await extractLiveSiteStructure(page, run.url);
    const discDuration = Date.now() - discStart;

    run.extractedData = {
      entities: liveSiteData.entities,
      routes: liveSiteData.routes,
      archetype: liveSiteData.archetype,
    };

    timeline.push({
      id: 'step-disc',
      phase: 'discovery',
      label: 'Discovered Tools & Elements',
      detail: `Identified ${discoveredTools.length} WebMCP tool(s), ${domControls.length} interactive control(s), and ${liveSiteData.routes.length} navigation route(s)`,
      timestamp: Date.now(),
      durationMs: discDuration,
      status: discoveredTools.length > 0 ? 'success' : 'warning',
    });

    // 5.1 Capture Initial 5-Layer Agent State Dump (STATE_001)
    const stateDumps: any[] = [];
    try {
      const initialDump = await AgentStateDumper.captureStateDump(page, 1, 'Initial Page Loaded', discoveredTools);
      stateDumps.push(initialDump);
    } catch (dumpErr) {
      console.warn('[StateDump Capture Error]:', dumpErr);
    }

    // 6. Dynamic LLM Planning & Autonomous Tool Execution Loop
    const apiKey = run.openRouterApiKey || config.openRouterApiKey || process.env.OPENROUTER_API_KEY;
    const stateGraph = buildSiteStateGraph(run.url, discoveredTools, liveSiteData);
    run.stateGraph = stateGraph;

    const intentResult = await resolveUserIntent(
      {
        siteUrl: run.url,
        userGoal: run.task,
        openRouterApiKey: apiKey,
      },
      discoveredTools,
      stateGraph
    );

    timeline.push({
      id: 'step-reason-llm',
      phase: 'reasoning',
      label: 'AI Action Plan',
      detail: intentResult.reasoning || `Synthesized ${intentResult.plan.length}-step action plan for goal: "${run.task}"`,
      timestamp: Date.now(),
      status: intentResult.feasible ? 'success' : 'warning',
    });

    let lastOutput: any = null;
    const toolDiscoveredEntityIds: string[] = [];
    const discoveredProductIds: string[] = [];
    if (liveSiteData.entities && liveSiteData.entities.length > 0) {
      for (const ent of liveSiteData.entities) {
        if (ent.id && !discoveredProductIds.includes(ent.id)) {
          discoveredProductIds.push(ent.id);
        }
      }
    }

    // Execute each resolved step inside live Chromium
    for (const step of intentResult.plan) {
      const matchingTool = discoveredTools.find((t) =>
        t.name === step.toolName ||
        t.name.toLowerCase() === step.toolName.toLowerCase() ||
        t.name.replace(/_/g, '').toLowerCase() === step.toolName.replace(/_/g, '').toLowerCase()
      );

      if (matchingTool) {
        // Resolve dynamic parameter dependencies from previous steps
        const preferredEntityId = toolDiscoveredEntityIds[0] || discoveredProductIds[0];
        const resolvedParams = { ...step.parameters };
        for (const [k, v] of Object.entries(resolvedParams)) {
          if (typeof v === 'string') {
            const vLower = v.toLowerCase();
            if (
              vLower.includes('$') ||
              vLower.includes('<') ||
              vLower.includes('placeholder') ||
              vLower.includes('the_') ||
              vLower.includes('selected') ||
              vLower.includes('actual')
            ) {
              if (k.toLowerCase().includes('product') || k.toLowerCase().includes('id') || k.toLowerCase().includes('item')) {
                resolvedParams[k] = preferredEntityId || 'item-1';
              }
            }
          }
        }

        // Generic Schema-Driven Parameter Resolution for ANY WebMCP tool (3D, docs, canvas, SaaS, commerce)
        const schemaProps = (matchingTool.inputSchema as any)?.properties || {};
        for (const [propName, propDef] of Object.entries(schemaProps)) {
          const pDef = propDef as any;
          const pNameLower = propName.toLowerCase();

          // 1. Enum Validation & Auto-Correction
          if (pDef?.enum && Array.isArray(pDef.enum) && pDef.enum.length > 0) {
            const currentVal = resolvedParams[propName];
            if (!pDef.enum.includes(currentVal)) {
              // Pick matching enum from user prompt or use first valid enum
              const matchingEnum = pDef.enum.find((e: any) => run.task.toLowerCase().includes(String(e).toLowerCase()));
              resolvedParams[propName] = matchingEnum || pDef.enum[0];
            }
          }

          // 2. ID / Ref resolution
          if (pNameLower.includes('id') || pNameLower.includes('ref') || pNameLower.includes('item') || pNameLower.includes('model') || pNameLower.includes('doc')) {
            const currentVal = resolvedParams[propName];
            const isPlaceholder = typeof currentVal === 'string' && (currentVal.startsWith('$') || currentVal.startsWith('<') || currentVal.includes('placeholder'));
            if (!currentVal || isPlaceholder) {
              const knownId = toolDiscoveredEntityIds[0] || discoveredProductIds[0];
              if (knownId) {
                resolvedParams[propName] = knownId;
              }
            }
          }

          // 3. Dynamic numeric parameters (quantity, count, zoom, fov, limit)
          if (pNameLower.includes('quantity') || pNameLower.includes('count') || pNameLower.includes('amount')) {
            const explicitQty =
              typeof step.parameters?.[propName] === 'number' && step.parameters[propName] > 0
                ? step.parameters[propName]
                : typeof resolvedParams[propName] === 'number' && resolvedParams[propName] > 0
                  ? resolvedParams[propName]
                  : extractRequestedQuantity(run.task);
            resolvedParams[propName] = explicitQty;
          }

          // 4. Dynamic query strings / prompt fields
          if (pNameLower.includes('query') || pNameLower.includes('search') || pNameLower.includes('prompt') || pNameLower.includes('topic') || pNameLower === 'q') {
            if (!resolvedParams[propName] || (typeof resolvedParams[propName] === 'string' && resolvedParams[propName].startsWith('$'))) {
              resolvedParams[propName] = run.task;
            }
          }
        }

        timeline.push({
          id: `step-reason-${step.step}`,
          phase: 'reasoning',
          label: `Plan Step ${step.step}: ${humanizeToolName(matchingTool.name)}`,
          detail: `${step.explanation || 'Dispatching WebMCP tool'} [${step.safetyTier.replace(/_/g, ' ').toUpperCase()}]`,
          timestamp: Date.now(),
          status: 'info',
        });

        const call = await WebMCPInspector.executeTool(page, matchingTool.name, resolvedParams);
        capturedToolCalls.push(call);
        lastOutput = call.output;

        // Collect newly discovered entity IDs from actual tool execution output
        if (call.output && typeof call.output === 'object') {
          if (Array.isArray((call.output as any).products)) {
            for (const p of (call.output as any).products) {
              if (p && p.id && !toolDiscoveredEntityIds.includes(p.id)) {
                toolDiscoveredEntityIds.push(p.id);
              }
            }
          }
          if ((call.output as any).product && (call.output as any).product.id) {
            if (!toolDiscoveredEntityIds.includes((call.output as any).product.id)) {
              toolDiscoveredEntityIds.push((call.output as any).product.id);
            }
          }
        }

        timeline.push({
          id: `step-exec-${step.step}`,
          phase: 'execution',
          label: `Executed ${humanizeToolName(matchingTool.name)}`,
          detail: call.error
            ? `Execution error: ${call.error}`
            : `${summarizeToolOutput(matchingTool.name, call.output)} (${call.durationMs}ms)`,
          timestamp: Date.now(),
          durationMs: call.durationMs,
          status: call.error ? 'error' : 'success',
        });

        // Capture State Dump Transition (STATE_00N)
        try {
          const prevDump = stateDumps[stateDumps.length - 1];
          const nextDump = await AgentStateDumper.captureStateDump(
            page,
            stateDumps.length + 1,
            `After ${humanizeToolName(matchingTool.name)}`,
            discoveredTools,
            prevDump
          );
          stateDumps.push(nextDump);
        } catch (e) {
          // state dump capture optional
        }
      } else if (step.toolName && step.toolName !== 'N/A' && step.toolName.toLowerCase() !== 'none') {
        timeline.push({
          id: `step-fric-${step.step}`,
          phase: 'diagnosis',
          label: `Friction: Missing "${step.toolName}" Tool`,
          detail: `Goal required tool "${step.toolName}" (${step.explanation}), but target website omitted document.modelContext.registerTool("${step.toolName}")`,
          timestamp: Date.now(),
          status: 'warning',
        });
      } else {
        timeline.push({
          id: `step-nav-${step.step}`,
          phase: 'reasoning',
          label: `Planning Step ${step.step}`,
          detail: step.explanation || 'Navigating site state graph towards target state',
          timestamp: Date.now(),
          status: 'info',
        });
      }
    }

    // Capture Real Page Screenshot
    try {
      screenshot = await page.screenshot({
        encoding: 'base64',
        type: 'jpeg',
        quality: 75,
      });
    } catch {
      // screenshot optional
    }

    // 7. Perform Automated UI Vibe Check & Flaw Scan
    try {
      const uiVibeAudit = await auditUIVibe(page, domControls);
      run.uiVibeAudit = uiVibeAudit;
    } catch (e) {
      console.warn('[UI Vibe Audit Error]:', e);
    }

    // 8. Perform Bot Protection & Exposed Header Audit
    try {
      const secAudits = await auditBotProtectionAndHeaders(page, networkInterceptor.getEvents());
      run.botProtection = secAudits.botProtection;
      run.headerSecurity = secAudits.headerSecurity;
      if (secAudits.signals.length > 0) {
        run.securitySignals.push(...secAudits.signals);
      }
    } catch (e) {
      console.warn('[Bot/Header Security Audit Error]:', e);
    }

    // 9. Perform SEO, Readability, and Machine Feed Discovery Audit
    try {
      const expAudits = await auditSeoReadabilityAndFeeds(page);
      run.seoAudit = expAudits.seoAudit;
      run.readabilityAudit = expAudits.readabilityAudit;
      run.feedDiscovery = expAudits.feedDiscovery;
    } catch (e) {
      console.warn('[SEO/Readability Audit Error]:', e);
    }

    // 10. Assign captured evidence to run
    run.tools = discoveredTools;
    run.toolCalls = capturedToolCalls;
    run.network = networkInterceptor.getEvents();
    run.domInteractions = domControls;
    run.stateDumps = stateDumps;
    run.latestStateDump = stateDumps[stateDumps.length - 1];
    run.errors = capturedErrors;
    run.screenshot = screenshot;
    run.timeline = timeline;

  } catch (browserError: unknown) {
    const message = browserError instanceof Error ? browserError.message : String(browserError);
    console.error('[AgentRunner Execution Error]:', browserError);
    capturedErrors.push({
      id: `err-${Date.now()}-nav`,
      type: 'runtime',
      message: `Failed to load target URL ${run.url}: ${message}`,
      timestamp: Date.now(),
    });
    run.errors = capturedErrors;
    run.timeline = timeline;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // 8. Perform friction and multi-mode analysis
  const analysis = analyzerService.analyze(run);
  run.summary = analysis.summary;
  run.summary.durationMs = Date.now() - startTime;
  run.frictions = analysis.frictions;
  run.securitySignals = analysis.securitySignals;
  run.plainExplanation = analysis.plainExplanation;
  run.status = analysis.summary.taskStatus === 'completed' ? 'completed' : 'failed';
  run.completedAt = Date.now();

  return run;
}
