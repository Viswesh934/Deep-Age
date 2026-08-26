import { Browser, Page } from 'puppeteer';
import {
  TestDriveRun,
  WebMCPToolCall,
  ErrorEvent,
  TimelineStep,
} from '@deep-age/shared';
import { config } from '../config/env.js';
import { launchBrowser } from './browser.js';
import { NetworkInterceptor } from './network-interceptor.js';
import { DOMInspector } from './dom-inspector.js';
import { WebMCPInspector } from './webmcp-inspector.js';
import { analyzerService } from '../services/analyzer.service.js';

export async function executeRealTestDrive(run: TestDriveRun): Promise<TestDriveRun> {
  const startTime = Date.now();
  let browser: Browser | null = null;
  const capturedErrors: ErrorEvent[] = [];
  const capturedToolCalls: WebMCPToolCall[] = [];
  const timeline: TimelineStep[] = [];
  let screenshot: string | undefined = undefined;

  timeline.push({
    id: 'step-spawn',
    phase: 'spawn',
    label: 'SPAWN_CHROMIUM_SANDBOX',
    detail: 'Launched isolated headless browser session with WebMCP capabilities',
    timestamp: Date.now(),
    status: 'info',
  });

  try {
    const t0 = Date.now();
    browser = await launchBrowser();
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

    // 3. Navigate to live target website
    const navStart = Date.now();
    await page.goto(run.url, {
      waitUntil: 'domcontentloaded',
      timeout: config.browser.timeoutMs,
    });
    const navDuration = Date.now() - navStart;

    timeline.push({
      id: 'step-nav',
      phase: 'navigation',
      label: 'HTTP_PAGE_LOADED',
      detail: `Successfully navigated to ${run.url} in ${navDuration}ms`,
      timestamp: Date.now(),
      durationMs: navDuration,
      status: 'success',
    });

    // 4. Discover WebMCP tools & DOM controls
    const discStart = Date.now();
    const discoveredTools = await WebMCPInspector.discoverTools(page, run.url);
    const domControls = await DOMInspector.inspect(page);
    const discDuration = Date.now() - discStart;

    timeline.push({
      id: 'step-disc',
      phase: 'discovery',
      label: 'WEBMCP_TOOLS_DISCOVERED',
      detail: `Identified ${discoveredTools.length} WebMCP tool(s) and ${domControls.length} DOM interactive control(s)`,
      timestamp: Date.now(),
      durationMs: discDuration,
      status: discoveredTools.length > 0 ? 'success' : 'warning',
    });

    // 5. Execute agent workflow based on task intent
    const taskLower = run.task.toLowerCase();

    // Step A: Search / filter
    const searchTool = discoveredTools.find((t) => t.name === 'search_products' || t.name === 'filter_products');
    if (searchTool) {
      const toolInput = searchTool.name === 'filter_products'
        ? { ram_gb: 16, max_price: 80000 }
        : { query: 'laptop', max_price: 80000 };

      timeline.push({
        id: 'step-reason-1',
        phase: 'reasoning',
        label: 'AGENT_INTENT_DISPATCH',
        detail: `Mapped task intent to tool "${searchTool.name}" with params ${JSON.stringify(toolInput)}`,
        timestamp: Date.now(),
        status: 'info',
      });

      const call = await WebMCPInspector.executeTool(page, searchTool.name, toolInput);
      capturedToolCalls.push(call);

      timeline.push({
        id: 'step-exec-1',
        phase: 'execution',
        label: `CALL_${searchTool.name.toUpperCase()}`,
        detail: call.error ? `Execution error: ${call.error}` : `Retrieved data in ${call.durationMs}ms`,
        timestamp: Date.now(),
        durationMs: call.durationMs,
        status: call.error ? 'error' : 'success',
      });
    }

    // Step B: Cart operation
    if (taskLower.includes('cart') || taskLower.includes('add') || taskLower.includes('buy')) {
      const cartTool = discoveredTools.find((t) => t.name === 'add_to_cart' || t.name === 'add_item');
      if (cartTool) {
        const toolInput = { product_id: 'lap-901', quantity: 1 };
        timeline.push({
          id: 'step-reason-2',
          phase: 'reasoning',
          label: 'AGENT_INTENT_DISPATCH',
          detail: `Mapped cart action to tool "${cartTool.name}"`,
          timestamp: Date.now(),
          status: 'info',
        });

        const call = await WebMCPInspector.executeTool(page, cartTool.name, toolInput);
        capturedToolCalls.push(call);

        timeline.push({
          id: 'step-exec-2',
          phase: 'execution',
          label: `CALL_${cartTool.name.toUpperCase()}`,
          detail: call.error ? `Execution error: ${call.error}` : `Cart updated successfully (${call.durationMs}ms)`,
          timestamp: Date.now(),
          durationMs: call.durationMs,
          status: call.error ? 'error' : 'success',
        });
      } else {
        timeline.push({
          id: 'step-fric-cart',
          phase: 'diagnosis',
          label: 'FRICTION_INTERCEPT',
          detail: 'Task required cart addition, but target site omitted document.modelContext.registerTool("add_to_cart")',
          timestamp: Date.now(),
          status: 'warning',
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

    // 6. Assign captured evidence to run
    run.tools = discoveredTools;
    run.toolCalls = capturedToolCalls;
    run.network = networkInterceptor.getEvents();
    run.domInteractions = domControls;
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

  // 7. Perform friction and multi-mode analysis
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
