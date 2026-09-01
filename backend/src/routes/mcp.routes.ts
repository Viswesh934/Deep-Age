import { Hono, Context } from 'hono';
import { storeService } from '../services/store.service.js';
import { executeRealTestDrive } from '../engine/agent-runner.js';
import { config } from '../config/env.js';
import { TestDriveRun } from '../types/index.js';

import { generateSqliteExploreScript } from '../engine/explore/catalog-exporter.js';
import { buildSiteStateGraph } from '../engine/explore/state-graph.js';
import { scanForPromptInjection } from '../engine/security/injection-firewall.js';
import { PIIRedactor } from '../engine/security/pii-redactor.js';

export const mcpRouter = new Hono();

// MCP Tool Definitions
const MCP_TOOLS = [
  {
    name: 'deep_age_test_drive',
    description:
      'Autonomously test-drive any target website URL as an AI agent. Discovers WebMCP tools, captures live network I/O, 5-layer browser state dump, diagnoses agent friction points, and returns drop-in code fixes.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The website URL to test-drive (e.g. http://127.0.0.1:3002)' },
        task: { type: 'string', description: 'The goal or user prompt for the agent' },
        mode: { type: 'string', enum: ['explore', 'debug', 'inspect'], description: 'Analysis mode', default: 'debug' },
      },
      required: ['url', 'task'],
    },
  },
  {
    name: 'deep_age_export_sqlite',
    description:
      'Export and download a portable SQLite database script (.sql) containing the website catalog, schema, metadata, and WebMCP knowledge graph for local storage or SQL querying.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Target website URL (e.g. http://127.0.0.1:3002)' },
      },
      required: ['url'],
    },
  },
  {
    name: 'deep_age_get_state_graph',
    description:
      'Retrieve the interactive state transition graph of reachable website page states, DOM components, and required WebMCP tool transitions.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Target website URL' },
        id: { type: 'string', description: 'Optional specific test-drive run ID' },
      },
      required: ['url'],
    },
  },
  {
    name: 'deep_age_get_dom_tree',
    description:
      'Retrieve the hierarchical DOM relation tree and accessibility semantic structure with interactive element selectors, aria-roles, and bound WebMCP actions.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Optional test-drive run ID' },
        url: { type: 'string', description: 'Target website URL' },
      },
    },
  },
  {
    name: 'deep_age_get_state_dumps',
    description:
      'Retrieve the chronological 5-layer browser state snapshots (Page, UI scroll/focus, Semantic accessibility tree, WebMCP in-memory tools, and Console/Network errors) across execution milestones.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Test-drive run ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deep_age_scan_security',
    description:
      'Scan text, inputs, or website payloads for indirect prompt injection attacks, adversarial instructions, and detect/redact sensitive PII (credit cards, emails, phones, SSNs).',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Content, prompt, or user text to scan and redact' },
      },
      required: ['text'],
    },
  },
  {
    name: 'deep_age_get_run',
    description:
      'Fetch comprehensive evidence for a completed test-drive run including 5-layer browser state snapshots, WebMCP discovered tools, friction points, and DOM component tree.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The test-drive run ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deep_age_inspect_webmcp',
    description:
      'Inspect a website to discover all registered WebMCP capabilities and tool schemas in window.modelContext or document.modelContext.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Target website URL' },
      },
      required: ['url'],
    },
  },
];

// MCP JSON-RPC 2.0 Handler
mcpRouter.post('/', async (c: Context) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { id, jsonrpc, method, params } = body;

    // Handle MCP Initialize
    if (method === 'initialize') {
      return c.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: false },
            resources: {},
            prompts: {},
          },
          serverInfo: {
            name: 'deep-age',
            version: '0.1.0',
          },
        },
      });
    }

    // Handle MCP Tools List
    if (method === 'tools/list') {
      return c.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS,
        },
      });
    }

    // Handle MCP Tool Calls
    if (method === 'tools/call') {
      const toolName = params?.name;
      const args = params?.arguments || {};

      if (toolName === 'deep_age_test_drive') {
        const targetUrl = args.url || config.demoUrl;
        const targetTask = args.task || 'Find a laptop under ₹80,000 with 16GB RAM and add it to the cart';
        const targetMode = args.mode || 'debug';

        const runId = `td-mcp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const initialRun: TestDriveRun = {
          id: runId,
          url: targetUrl,
          task: targetTask,
          mode: targetMode,
          status: 'running',
          createdAt: Date.now(),
          summary: {
            taskStatus: 'incomplete',
            frictionCount: 0,
            runtimeErrorCount: 0,
            webmcpToolCount: 0,
            networkRequestCount: 0,
          },
          plainExplanation: {
            exploreSummary: 'Test drive initiated via MCP Protocol.',
            whatHappened: 'Agent test-drive running.',
            whyItHappened: '',
          },
          tools: [],
          toolCalls: [],
          network: [],
          domInteractions: [],
          errors: [],
          frictions: [],
          securitySignals: [],
          timeline: [],
        };

        await storeService.set(runId, initialRun);
        const executedRun = await executeRealTestDrive(initialRun, {});
        await storeService.set(runId, executedRun);

        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    runId: executedRun.id,
                    targetUrl: executedRun.url,
                    taskStatus: executedRun.summary.taskStatus,
                    agentReadinessScore: executedRun.summary.taskStatus === 'completed' ? 100 : 69,
                    discoveredWebMcpTools: executedRun.tools.map((t) => t.name),
                    executedToolCalls: executedRun.toolCalls.map((tc) => ({
                      tool: tc.toolName,
                      input: tc.input,
                      durationMs: tc.durationMs,
                      hasError: Boolean(tc.error),
                    })),
                    frictionsDiagnosed: executedRun.frictions.map((f) => ({
                      id: f.id,
                      type: f.type,
                      severity: f.severity,
                      title: f.title,
                      description: f.description,
                      recommendation: f.recommendation,
                      codeSnippet: f.codeSnippet,
                    })),
                    stateDumpMilestones: (executedRun.stateDumps || []).length,
                    activeStateSample: executedRun.stateDumps?.[executedRun.stateDumps.length - 1] || null,
                  },
                  null,
                  2
                ),
              },
            ],
          },
        });
      }

      if (toolName === 'deep_age_export_sqlite') {
        const targetUrl = args.url || config.demoUrl;
        const runs = await storeService.list();
        const matchingRun = runs.find((r) => r.url === targetUrl || r.url.includes(targetUrl));
        const tools = matchingRun ? matchingRun.tools : [];
        const extracted = matchingRun?.extractedData as any;
        const catalog = (extracted?.entities || []).map((e: any) => ({
          id: e.id,
          entityType: e.entityType || 'product',
          title: e.title,
          summary: e.summary,
          priceCents: (e.priceCents || 0),
          tags: e.tags || [],
          actionTool: e.actionTool || 'add_to_cart',
          actionParams: e.actionParams || { product_id: e.id },
        }));

        const sqlScript = generateSqliteExploreScript(targetUrl, tools, catalog);

        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: sqlScript,
              },
            ],
          },
        });
      }

      if (toolName === 'deep_age_get_state_graph') {
        const targetUrl = args.url || config.demoUrl;
        const runs = await storeService.list();
        const matchingRun = args.id ? runs.find((r) => r.id === args.id) : runs.find((r) => r.url === targetUrl);

        if (matchingRun && matchingRun.stateGraph) {
          return c.json({
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(matchingRun.stateGraph, null, 2),
                },
              ],
            },
          });
        }

        const graph = buildSiteStateGraph(targetUrl, matchingRun ? matchingRun.tools : [], matchingRun?.extractedData as any);
        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(graph, null, 2),
              },
            ],
          },
        });
      }

      if (toolName === 'deep_age_scan_security') {
        const text = args.text || '';
        const injectionResult = scanForPromptInjection(text);
        const piiRedactor = new PIIRedactor();
        const piiResult = piiRedactor.redact(text);

        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    isSafe: injectionResult.isSafe && !piiResult.hasPII,
                    promptInjectionScan: injectionResult,
                    piiMaskingScan: piiResult,
                    sanitizedPrompt: piiResult.maskedText,
                  },
                  null,
                  2
                ),
              },
            ],
          },
        });
      }

      if (toolName === 'deep_age_get_dom_tree') {
        const targetId = args.id;
        const targetUrl = args.url;
        const runs = await storeService.list();
        const matchingRun = targetId ? runs.find((r) => r.id === targetId) : runs.find((r) => r.url === targetUrl);

        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    url: targetUrl || matchingRun?.url,
                    domTree: matchingRun?.domTree || null,
                    interactiveControls: matchingRun?.domInteractions || [],
                  },
                  null,
                  2
                ),
              },
            ],
          },
        });
      }

      if (toolName === 'deep_age_get_state_dumps') {
        const targetId = args.id;
        if (!targetId) {
          return c.json({ jsonrpc: '2.0', id, error: { code: -32602, message: 'Missing run id' } });
        }
        const run = await storeService.get(targetId);
        if (!run) {
          return c.json({ jsonrpc: '2.0', id, error: { code: -32602, message: `Run not found: ${targetId}` } });
        }

        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(run.stateDumps || [], null, 2),
              },
            ],
          },
        });
      }

      if (toolName === 'deep_age_get_run') {
        const targetId = args.id;
        if (!targetId) {
          return c.json({ jsonrpc: '2.0', id, error: { code: -32602, message: 'Missing run id' } });
        }
        const run = await storeService.get(targetId);
        if (!run) {
          return c.json({ jsonrpc: '2.0', id, error: { code: -32602, message: `Run not found: ${targetId}` } });
        }

        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(run, null, 2),
              },
            ],
          },
        });
      }

      if (toolName === 'deep_age_inspect_webmcp') {
        const targetUrl = args.url || config.demoUrl;
        const runs = await storeService.list();
        const matchingRun = runs.find((r) => r.url === targetUrl);

        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    url: targetUrl,
                    discoveredTools: matchingRun?.tools || [],
                  },
                  null,
                  2
                ),
              },
            ],
          },
        });
      }

      return c.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${toolName}` },
      });
    }

    // Default Ping / Fallback
    if (method === 'ping') {
      return c.json({ jsonrpc: '2.0', id, result: {} });
    }

    return c.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Unknown method: ${method}` },
    });
  } catch (err: any) {
    return c.json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32603, message: err.message || 'Internal MCP error' },
    });
  }
});

// MCP SSE Stream & Handshake Endpoint (Official MCP 2024-11-05 Specification)
mcpRouter.get('/', (c: Context) => {
  const acceptHeader = c.req.header('Accept') || '';
  if (acceptHeader.includes('text/event-stream') || c.req.query('transport') === 'sse') {
    const sessionId = `mcp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const postEndpoint = `/mcp?sessionId=${sessionId}`;

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        // Emit initial endpoint event per MCP SSE spec
        controller.enqueue(encoder.encode(`event: endpoint\ndata: ${postEndpoint}\n\n`));
      },
      cancel() {},
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return c.text(
    'Deep Age Model Context Protocol (MCP) Server Active.\n\n' +
    '• SSE Stream: GET /mcp (with Accept: text/event-stream)\n' +
    '• JSON-RPC 2.0: POST /mcp\n' +
    '• Discovery: GET /mcp.json\n'
  );
});
