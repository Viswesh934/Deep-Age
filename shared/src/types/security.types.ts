import { WebMCPSafetyTier } from './webmcp.types.js';

export interface SecuritySignal {
  id: string;
  severity: 'info' | 'warning' | 'alert';
  category: 'third_party_leak' | 'unencrypted_transmission' | 'cross_origin_redirect' | 'excessive_data_collection' | 'unknown_origin' | 'prompt_injection' | 'pii_leak';
  title: string;
  observation: string;
  evidence: Record<string, unknown>;
}

export interface IndirectInjectionScanResult {
  isSafe: boolean;
  score: number; // 0 (safe) to 1.0 (malicious)
  detectedPatterns: string[];
  sanitizedContent: string;
}

export interface MaskedDataToken {
  token: string;
  type: 'EMAIL' | 'CREDIT_CARD' | 'PHONE' | 'SSN' | 'API_KEY';
  originalLength: number;
}

export interface PIIScanResult {
  hasPII: boolean;
  maskedText: string;
  tokens: MaskedDataToken[];
  detectedCount: number;
}

export interface WebAuthnVerificationChallenge {
  challengeId: string;
  actionName: string;
  payloadDigest: string;
  rpId: string;
  timestamp: number;
  safetyTier: WebMCPSafetyTier;
  paramsSummary: Record<string, unknown>;
}

export interface WebAuthnProof {
  challengeId: string;
  credentialId: string;
  clientDataJSON: string;
  signature: string;
  userVerified: boolean;
}

export interface CircuitBreakerStatus {
  isTripped: boolean;
  currentDepth: number;
  maxDepth: number;
  cycleDetected: boolean;
  estimatedCostUsd: number;
  maxBudgetUsd: number;
  reason?: string;
}

export interface AuditLedgerEntry {
  id: string;
  timestamp: number;
  toolName: string;
  safetyTier: WebMCPSafetyTier;
  inputsMasked: Record<string, unknown>;
  outputSummary?: string;
  status: 'SUCCESS' | 'BLOCKED' | 'ROLLED_BACK' | 'ERROR';
  humanApproved: boolean;
  biometricSignature?: string;
  durationMs: number;
  isReversible: boolean;
  rollbackExecuted?: boolean;
}

export interface SagaCompensatingAction {
  id: string;
  toolName: string;
  rollbackActionName: string;
  rollbackParams: Record<string, unknown>;
  timestamp: number;
  executed: boolean;
}
