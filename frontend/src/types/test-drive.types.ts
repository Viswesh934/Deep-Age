import { WebMCPTool, WebMCPToolCall } from './webmcp.types.js';
import { SecuritySignal, AuditLedgerEntry, BotProtectionAudit, HeaderSecurityAudit } from './security.types.js';
import { StateTransitionGraph, SeoAudit, ReadabilityAudit, FeedDiscoveryAudit, MonetizationAudit } from './explore.types.js';

export type UserMode = 'explore' | 'debug' | 'inspect';
export type TestDriveStatus = 'pending' | 'running' | 'completed' | 'failed';

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

export interface DOMTreeNode {
  id: string;
  tag: string;
  role?: string;
  idAttr?: string;
  className?: string;
  selector: string;
  text?: string;
  ariaLabel?: string;
  isInteractive: boolean;
  connectedTool?: string;
  attributes?: Record<string, string>;
  children: DOMTreeNode[];
}

// ==========================================
// 5-LAYER AGENT BROWSER STATE DUMP API
// ==========================================

export interface PageLayer {
  url: string;
  title: string;
  viewport: { width: number; height: number };
  frameTreeDepth?: number;
}

export interface UIStateLayer {
  scroll: { x: number; y: number };
  focusedRef?: string;
  dialogs: Array<{ id: string; title: string; open: boolean }>;
  loading: boolean;
}

export interface SemanticElement {
  ref: string;
  role: 'heading' | 'link' | 'region' | 'article' | 'list' | 'listitem' | 'text' | 'image' | 'dialog' | string;
  name: string;
  level?: number;
  visible: boolean;
  value?: string;
}

export interface InteractionElement {
  ref: string;
  role: 'button' | 'textbox' | 'checkbox' | 'radio' | 'combobox' | 'link' | 'form' | 'slider' | string;
  name: string;
  value?: string;
  placeholder?: string;
  visible: boolean;
  enabled: boolean;
  actions: Array<'click' | 'fill' | 'check' | 'select' | 'focus' | 'hover' | 'submit' | string>;
  selector: string;
  connectedTool?: string;
}

export interface EnvironmentLayer {
  cookieCount: number;
  localStorageKeys: string[];
  sessionStorageKeys?: string[];
  online: boolean;
  discoveredTools: string[];
}

export interface AgentStateDump {
  id: string;
  stateIndex: number;
  timestamp: number;
  label: string;
  page: PageLayer;
  uiState: UIStateLayer;
  semanticTree: SemanticElement[];
  interactionState: InteractionElement[];
  environment: EnvironmentLayer;
  diffFromPrevious?: {
    addedRefs?: string[];
    removedRefs?: string[];
    mutatedValues?: Record<string, { from?: string; to?: string }>;
    scrollChange?: { dx: number; dy: number };
    focusChanged?: { from?: string; to?: string };
    toolCallsExecuted?: string[];
  };
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
  type: 'missing_capability' | 'bad_tool_schema' | 'tool_failure' | 'network_failure' | 'ambiguous_interaction' | 'task_failure' | 'security_block';
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

export interface UIVibeAudit {
  vibeScore: number; // 0 - 100 (100 = Polished Human Craft, <50 = Clunky/AI Cliché Smells)
  aestheticProfile: {
    primaryTone: string;
    colorPalette: Array<{ hex: string; role: string; usageCount: number; isAiCliche: boolean }>;
    fontFamilies: string[];
    aiClicheRisk: 'low' | 'moderate' | 'high' | 'severe';
  };
  aiClichesDetected: Array<{
    id: string;
    type: 'purple_gradient' | 'neon_glow' | 'sparkle_icon_spam' | 'generic_buzzwords' | 'dark_mode_contrast_fail';
    label: string;
    description: string;
    affectedElements?: string[];
    severity: 'high' | 'medium' | 'low';
  }>;
  uiFlaws: Array<{
    id: string;
    category: 'accessibility' | 'layout' | 'color_contrast' | 'interactivity' | 'ai_cliche';
    title: string;
    description: string;
    selector?: string;
    impact: 'high' | 'medium' | 'low';
    fixSuggestion: string;
  }>;
  overallVerdict: string;
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
  domTree?: DOMTreeNode;
  stateDumps?: AgentStateDump[];
  latestStateDump?: AgentStateDump;
  errors: ErrorEvent[];
  frictions: AgentFriction[];
  securitySignals: SecuritySignal[];
  stateGraph?: StateTransitionGraph;
  auditLedger?: AuditLedgerEntry[];
  uiVibeAudit?: UIVibeAudit;
  botProtection?: BotProtectionAudit;
  headerSecurity?: HeaderSecurityAudit;
  seoAudit?: SeoAudit;
  readabilityAudit?: ReadabilityAudit;
  feedDiscovery?: FeedDiscoveryAudit;
  monetizationAudit?: MonetizationAudit;
  openRouterApiKey?: string;
  virtualToolCode?: string;
  isVirtualRun?: boolean;
  extractedData?: Record<string, unknown>;
}

export interface CreateTestDriveRequest {
  url: string;
  task: string;
  mode?: UserMode;
  openRouterApiKey?: string;
  virtualToolCode?: string;
  isVirtualRun?: boolean;
}

export interface IngestEventsRequest {
  tools?: WebMCPTool[];
  toolCalls?: WebMCPToolCall[];
  network?: NetworkEvent[];
  domInteractions?: DOMInteractionEvent[];
  errors?: ErrorEvent[];
  extractedData?: Record<string, unknown>;
}
