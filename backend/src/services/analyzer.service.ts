import {
  TestDriveRun,
  AgentFriction,
  SecuritySignal,
  TestDriveSummary,
  PlainExplanation,
} from '@deep-age/shared';

export class AnalyzerService {
  public analyze(run: TestDriveRun): {
    summary: TestDriveSummary;
    frictions: AgentFriction[];
    securitySignals: SecuritySignal[];
    plainExplanation: PlainExplanation;
  } {
    const frictions: AgentFriction[] = [];
    const securitySignals: SecuritySignal[] = [];

    const toolNames = run.tools.map((t) => t.name);
    const taskLower = run.task.toLowerCase();

    // 1. Friction Detection: Missing Cart / Action Capabilities
    const wantsAdd = (taskLower.includes('add') && taskLower.includes('cart')) || taskLower.includes('add to cart');
    const hasAddToCartTool = toolNames.some((name) =>
      name === 'add_to_cart' || name === 'add_item' || name === 'add_product' || name === 'add_to_bag'
    );
    const hasCartApi = run.network.some((n) =>
      n.url.toLowerCase().includes('/cart') || n.url.toLowerCase().includes('/api/cart')
    );
    const hasCartDom = run.domInteractions.some((d) =>
      d.selector.toLowerCase().includes('cart') || (d.text && d.text.toLowerCase().includes('add to cart'))
    );

    if (wantsAdd && !hasAddToCartTool) {
      frictions.push({
        id: `fric-${Date.now()}-1`,
        type: 'missing_capability',
        severity: 'high',
        title: 'Missing WebMCP Capability for Cart Operation',
        description:
          'The agent attempted to perform a cart action, but no corresponding WebMCP tool (e.g., add_to_cart) was exposed by the website.',
        evidence: {
          toolsDiscovered: toolNames,
          relevantApiEndpoint: hasCartApi ? 'POST /api/cart' : undefined,
          domElementDetected: hasCartDom ? 'button.add-to-cart' : undefined,
        },
        recommendation:
          'Expose document.modelContext.registerTool({ name: "add_to_cart", inputSchema: { product_id: "string" } }) so agents can complete purchase journeys programmatically.',
        codeSnippet: `// Drop-in Chrome WebMCP Fix
document.modelContext.registerTool({
  name: 'add_to_cart',
  description: 'Add a specified product item to the user shopping cart',
  inputSchema: {
    type: 'object',
    properties: {
      product_id: { type: 'string', description: 'Target product ID' },
      quantity: { type: 'number', description: 'Quantity (default 1)' }
    },
    required: ['product_id']
  },
  execute: async (input) => {
    const pId = (input && (input.product_id || input.productId)) || 'lap-901';
    const qty = (input && input.quantity) || 1;
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: pId, quantity: qty })
    });
    return res.json();
  }
});`,
      });
    }

    // 2. Friction Detection: Generic Zero WebMCP Tools for external sites
    if (run.tools.length === 0 && !wantsAdd) {
      let hostname = 'target';
      try {
        hostname = new URL(run.url).hostname;
      } catch {}

      frictions.push({
        id: `fric-${Date.now()}-nowebmcp`,
        type: 'missing_capability',
        severity: 'medium',
        title: 'Zero Chrome WebMCP Tools Exposed',
        description: `The website at ${run.url} has ${run.domInteractions.length} interactive DOM controls, but exposes 0 declarative WebMCP tools on document.modelContext.`,
        evidence: {
          toolsDiscovered: [],
          domElementDetected: run.domInteractions[0]?.selector,
        },
        recommendation: `Add Chrome WebMCP declarations on ${hostname} so autonomous AI agents can query content and trigger actions programmatically without brittle DOM scraping.`,
        codeSnippet: `// Chrome WebMCP Standard (document.modelContext)
document.modelContext.registerTool({
  name: 'query_${hostname.replace(/[^a-zA-Z0-9]/g, '_')}_data',
  description: 'Programmatic interface for AI agents on ${hostname}',
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string' } }
  },
  execute: async (input) => {
    // In-page execution handler
    return { success: true, url: window.location.href };
  }
});`,
      });
    }

    // 3. Friction Detection: Tool Execution Errors
    for (const call of run.toolCalls) {
      if (call.error) {
        frictions.push({
          id: `fric-${Date.now()}-${call.id}`,
          type: 'tool_failure',
          severity: 'high',
          title: `Tool Execution Failed: ${call.toolName}`,
          description: `Calling ${call.toolName} returned an error: ${call.error}`,
          evidence: {
            failedToolCall: call.toolName,
            errorMessage: call.error,
          },
          recommendation: `Check the handler logic and input parameters for ${call.toolName}.`,
        });
      }
    }

    // 4. Friction Detection: Network Failures (4xx / 5xx) on API / functional endpoints
    for (const net of run.network) {
      if (net.status >= 400 && !net.url.includes('/favicon.ico')) {
        frictions.push({
          id: `fric-${Date.now()}-${net.id}`,
          type: 'network_failure',
          severity: net.status >= 500 ? 'high' : 'medium',
          title: `HTTP ${net.status} on ${net.method} ${new URL(net.url).pathname}`,
          description: `Network request to ${net.url} failed with status ${net.status}`,
          evidence: {
            relevantApiEndpoint: `${net.method} ${net.url}`,
            errorMessage: `Status code ${net.status}`,
          },
          recommendation: `Ensure backend API endpoint ${net.url} handles agent requests and valid session tokens.`,
        });
      }
    }

    // 5. Security Signals: Third-party & sensitive data observation
    let privacyDeductions = 0;
    const thirdPartyRequests = run.network.filter((n) => n.origin === 'third-party');
    if (thirdPartyRequests.length > 0) {
      privacyDeductions += thirdPartyRequests.length * 5;
      const domains = Array.from(
        new Set(
          thirdPartyRequests.map((r) => {
            try {
              return new URL(r.url).hostname;
            } catch {
              return r.url;
            }
          })
        )
      );

      securitySignals.push({
        id: `sec-${Date.now()}-1`,
        severity: 'info',
        category: 'third_party_leak',
        title: `${domains.length} Third-Party Host(s) Contacted`,
        observation: `Observed ${thirdPartyRequests.length} external network calls to: ${domains.join(', ')}.`,
        evidence: {
          contactedDomains: domains,
          requestCount: thirdPartyRequests.length,
        },
      });
    }

    // Check for HTTP unencrypted requests
    const insecureRequests = run.network.filter((n) => n.url.startsWith('http://') && !n.url.includes('localhost') && !n.url.includes('127.0.0.1'));
    if (insecureRequests.length > 0) {
      privacyDeductions += insecureRequests.length * 15;
      securitySignals.push({
        id: `sec-${Date.now()}-2`,
        severity: 'warning',
        category: 'unencrypted_transmission',
        title: 'Unencrypted HTTP Requests Detected',
        observation: `Observed ${insecureRequests.length} request(s) transmitted over plaintext HTTP.`,
        evidence: {
          urls: insecureRequests.map((r) => r.url),
        },
      });
    }

    // Check for query parameters carrying sensitive tokens
    for (const net of run.network) {
      if (net.queryParams) {
        const sensitiveKeys = ['token', 'key', 'secret', 'password', 'auth', 'apikey'].filter((k) =>
          Object.keys(net.queryParams || {}).some((q) => q.toLowerCase().includes(k))
        );
        if (sensitiveKeys.length > 0) {
          privacyDeductions += sensitiveKeys.length * 10;
          securitySignals.push({
            id: `sec-${Date.now()}-${net.id}`,
            severity: 'warning',
            category: 'excessive_data_collection',
            title: 'Potential Sensitive Data in Query Parameters',
            observation: `Request to ${net.url} includes sensitive parameter keys: ${sensitiveKeys.join(', ')}.`,
            evidence: {
              url: net.url,
              keys: sensitiveKeys,
            },
          });
        }
      }
    }

    // Determine overall task outcome
    const taskStatus: 'completed' | 'incomplete' | 'failed' =
      frictions.some((f) => f.severity === 'high') || run.errors.length > 0
        ? 'incomplete'
        : 'completed';

    const privacyScore = Math.max(10, 100 - privacyDeductions);

    const summary: TestDriveSummary = {
      taskStatus,
      frictionCount: frictions.length,
      runtimeErrorCount: run.errors.length,
      webmcpToolCount: run.tools.length,
      networkRequestCount: run.network.length,
      privacyScore,
    };

    // Synthesize Plain English Explanations
    const plainExplanation: PlainExplanation = {
      exploreSummary:
        taskStatus === 'completed'
          ? `The agent successfully navigated the site and completed the task "${run.task}".`
          : `The agent could not complete the task "${run.task}" because required capabilities were missing on the website.`,
      whatHappened:
        frictions.length > 0
          ? `The agent searched and inspected available tools on ${run.url}. It discovered ${run.tools.length} WebMCP tool(s) (${toolNames.join(', ') || 'none'}), but encountered ${frictions.length} friction point(s) while trying to fulfill your request.`
          : `The agent discovered ${run.tools.length} tool(s) on ${run.url} and executed all required steps with 0 friction points.`,
      whyItHappened:
        frictions.length > 0
          ? frictions.map((f) => `• ${f.title}: ${f.description}`).join('\n')
          : 'All required tool capabilities, network endpoints, and DOM elements were accessible to the agent.',
    };

    return {
      summary,
      frictions,
      securitySignals,
      plainExplanation,
    };
  }
}

export const analyzerService = new AnalyzerService();
