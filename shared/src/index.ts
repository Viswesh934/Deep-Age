export type UserMode = 'explore' | 'debug' | 'inspect';

export type TestDriveStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  source?: 'modelContext' | 'meta-tag' | 'injected';
}

export interface WebMCPToolCall {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  durationMs: number;
  timestamp: number;
}

export interface NetworkEvent {
  id: string;
  url: string;
  method: string;
  status: number;
  origin: 'first-party' | 'third-party';
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  queryParams?: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
  durationMs: number;
  timestamp: number;
}

export interface DOMInteractionEvent {
  id: string;
  type: 'click' | 'input' | 'navigate' | 'visible_controls';
  selector: string;
  elementTag: string;
  text?: string;
  attributes?: Record<string, string>;
  timestamp: number;
}

export interface ErrorEvent {
  id: string;
  type: 'console' | 'runtime' | 'network' | 'tool';
  message: string;
  stack?: string;
  timestamp: number;
}

export interface AgentFriction {
  id: string;
  type: 'missing_capability' | 'bad_tool_schema' | 'tool_failure' | 'network_failure' | 'ambiguous_interaction' | 'task_failure';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  evidence: {
    toolsDiscovered?: string[];
    failedToolCall?: string;
    relevantApiEndpoint?: string;
    domElementDetected?: string;
    errorMessage?: string;
  };
  recommendation: string;
  codeSnippet?: string;
}

export interface SecuritySignal {
  id: string;
  severity: 'info' | 'warning' | 'alert';
  category: 'third_party_leak' | 'unencrypted_transmission' | 'cross_origin_redirect' | 'excessive_data_collection' | 'unknown_origin';
  title: string;
  observation: string;
  evidence: Record<string, unknown>;
}

export interface TimelineStep {
  id: string;
  phase: 'spawn' | 'navigation' | 'discovery' | 'reasoning' | 'execution' | 'diagnosis';
  label: string;
  detail: string;
  timestamp: number;
  durationMs?: number;
  status: 'success' | 'warning' | 'error' | 'info';
}

export interface TestDriveSummary {
  taskStatus: 'completed' | 'incomplete' | 'failed';
  frictionCount: number;
  runtimeErrorCount: number;
  webmcpToolCount: number;
  networkRequestCount: number;
  durationMs?: number;
  privacyScore?: number; // 0 - 100
}

export interface PlainExplanation {
  exploreSummary: string;
  whatHappened: string;
  whyItHappened: string;
}

export interface TestDriveRun {
  id: string;
  url: string;
  task: string;
  mode: UserMode;
  status: TestDriveStatus;
  createdAt: number;
  completedAt?: number;
  screenshot?: string; // base64 JPEG captured from real Chromium browser
  summary: TestDriveSummary;
  plainExplanation: PlainExplanation;
  timeline: TimelineStep[];
  tools: WebMCPTool[];
  toolCalls: WebMCPToolCall[];
  network: NetworkEvent[];
  domInteractions: DOMInteractionEvent[];
  errors: ErrorEvent[];
  frictions: AgentFriction[];
  securitySignals: SecuritySignal[];
  extractedData?: Record<string, unknown>;
}

export interface CreateTestDriveRequest {
  url: string;
  task: string;
  mode?: UserMode;
}

export interface IngestEventsRequest {
  tools?: WebMCPTool[];
  toolCalls?: WebMCPToolCall[];
  network?: NetworkEvent[];
  domInteractions?: DOMInteractionEvent[];
  errors?: ErrorEvent[];
  extractedData?: Record<string, unknown>;
}
