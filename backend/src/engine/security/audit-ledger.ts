import { AuditLedgerEntry, WebMCPSafetyTier } from '../../types/index.js';

export class AuditLedgerManager {
  private entries: AuditLedgerEntry[] = [];

  public logAction(entry: {
    toolName: string;
    safetyTier: WebMCPSafetyTier;
    inputsMasked: Record<string, unknown>;
    outputSummary?: string;
    status: 'SUCCESS' | 'BLOCKED' | 'ROLLED_BACK' | 'ERROR';
    humanApproved: boolean;
    biometricSignature?: string;
    durationMs: number;
    isReversible?: boolean;
  }): AuditLedgerEntry {
    const record: AuditLedgerEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      toolName: entry.toolName,
      safetyTier: entry.safetyTier,
      inputsMasked: entry.inputsMasked,
      outputSummary: entry.outputSummary,
      status: entry.status,
      humanApproved: entry.humanApproved,
      biometricSignature: entry.biometricSignature,
      durationMs: entry.durationMs,
      isReversible: entry.isReversible ?? (entry.safetyTier === 'reversible_write'),
      rollbackExecuted: false
    };

    this.entries.unshift(record); // newest first
    return record;
  }

  public getEntries(): AuditLedgerEntry[] {
    return [...this.entries];
  }

  public markRolledBack(id: string): boolean {
    const entry = this.entries.find((e) => e.id === id);
    if (entry) {
      entry.status = 'ROLLED_BACK';
      entry.rollbackExecuted = true;
      return true;
    }
    return false;
  }
}
