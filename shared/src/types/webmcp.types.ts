export type WebMCPSafetyTier = 'public_read' | 'context_read' | 'reversible_write' | 'critical_destructive';

export type WebMCPToolCategory = 'navigation' | 'search' | 'commerce' | 'settings' | 'auth' | 'content';

export interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  safetyTier?: WebMCPSafetyTier;
  category?: WebMCPToolCategory;
  requiresConfirmation?: boolean;
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
  safetyTier?: WebMCPSafetyTier;
  isReversible?: boolean;
  compensationId?: string;
  biometricProof?: string;
}
