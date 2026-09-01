import {
  TestDriveRun,
  AgentFriction,
  SecuritySignal,
  TestDriveSummary,
  PlainExplanation,
} from './types/index.js';

export function analyzeTestDrive(run: TestDriveRun): {
  summary: TestDriveSummary;
  frictions: AgentFriction[];
  securitySignals: SecuritySignal[];
  plainExplanation: PlainExplanation;
} {
  const frictions: AgentFriction[] = [];
  const securitySignals: SecuritySignal[] = [];

  const toolNames = run.tools.map((t) => t.name);
  const taskLower = run.task.toLowerCase();

  // 1. Friction Detection: Missing Tool Capabilities for User Goal
  const goalTokens = taskLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 2);
  const hasMatchingTool = toolNames.some((name) => {
    const nLower = name.toLowerCase();
    return goalTokens.some((t) => nLower.includes(t) || t.includes(nLower.replace(/_/g, '')));
  });

  if (!hasMatchingTool && run.tools.length > 0) {
    let candidateToolName = goalTokens.slice(0, 2).join('_') || 'execute_action';
    candidateToolName = candidateToolName.replace(/[^a-zA-Z0-9_]/g, '');

    frictions.push({
      id: `fric-${Date.now()}-missing-capability`,
      type: 'missing_capability',
      severity: 'high',
      title: `Missing WebMCP Capability for "${run.task}"`,
      description: `The AI agent attempted to fulfill goal "${run.task}", but no matching WebMCP tool (e.g. ${candidateToolName}) was exposed on document.modelContext.`,
      evidence: {
        toolsDiscovered: toolNames,
        domElementDetected: run.domInteractions[0]?.selector,
        relevantApiEndpoint: run.network[0]?.url,
      },
      recommendation: `Expose document.modelContext.registerTool({ name: "${candidateToolName}", ... }) so autonomous agents can perform this action programmatically without brittle scraping.`,
      codeSnippet: `// Drop-in Chrome WebMCP Fix for ${run.task}
document.modelContext.registerTool({
  name: '${candidateToolName}',
  description: 'Programmatically fulfill: ${run.task.replace(/'/g, "\\'")}',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search term or target parameter' },
      options: { type: 'object', description: 'Additional action settings' }
    }
  },
  execute: async (input) => {
    // In-page execution handler
    console.log('[WebMCP] Executing ${candidateToolName}:', input);
    return { success: true, timestamp: Date.now() };
  }
});`,
    });
  }

  // 2. Friction Detection: Tool Execution Errors
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

  // 3. Friction Detection: Network Failures (4xx / 5xx) on API / functional endpoints
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

  // 4. Security Signals: Third-party & sensitive data observation
  const thirdPartyRequests = run.network.filter((n) => n.origin === 'third-party');
  if (thirdPartyRequests.length > 0) {
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
  const insecureRequests = run.network.filter((n) => n.url.startsWith('http://'));
  if (insecureRequests.length > 0) {
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

  const summary: TestDriveSummary = {
    taskStatus,
    frictionCount: frictions.length,
    runtimeErrorCount: run.errors.length,
    webmcpToolCount: run.tools.length,
    networkRequestCount: run.network.length,
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
