import {
  TestDriveRun,
  AgentFriction,
  SecuritySignal,
  TestDriveSummary,
  PlainExplanation,
} from '../types/index.js';

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

    // 1. Friction Detection: Semantic Tool Capability Check (Pure Token Matching, Zero Hardcoded Lists)
    const taskTokens = taskLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 2);
    const hasMatchingTool = toolNames.some((name) => {
      const nLower = name.toLowerCase();
      return taskTokens.some((t) => nLower.includes(t) || t.includes(nLower.replace(/_/g, '')));
    });

    if (!hasMatchingTool && run.tools.length > 0) {
      const candidateToolName = taskTokens.slice(0, 2).join('_') || 'execute_task';
      frictions.push({
        id: `fric-${Date.now()}-missing-capability`,
        type: 'missing_capability',
        severity: 'high',
        title: `Missing WebMCP Tool for "${run.task}"`,
        description: `The user requested "${run.task}", but the website only exposes tools (${toolNames.join(', ') || 'none'}) and lacks a declarative WebMCP tool matching this goal.`,
        evidence: {
          toolsDiscovered: toolNames,
          domElementDetected: run.domInteractions[0]?.selector,
          relevantApiEndpoint: run.network[0]?.url,
        },
        recommendation: `Register document.modelContext.registerTool({ name: "${candidateToolName}", ... }) so autonomous agents can complete this action programmatically without brittle DOM scraping.`,
        codeSnippet: `// Drop-in WebMCP Fix for ${run.task}
document.modelContext.registerTool({
  name: '${candidateToolName}',
  description: 'Programmatically fulfill: ${run.task.replace(/'/g, "\\'")}',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Action parameter or target' },
      options: { type: 'object', description: 'Action configuration' }
    }
  },
  execute: async (input) => {
    console.log('[WebMCP] Executing ${candidateToolName}:', input);
    return { success: true, timestamp: Date.now() };
  }
});`,
      });
    }

    // 2. Friction Detection: Generic Zero WebMCP Tools for external sites
    if (run.tools.length === 0) {
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
