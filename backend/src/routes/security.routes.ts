import { Hono } from 'hono';
import { scanForPromptInjection } from '../engine/security/injection-firewall.js';
import { PIIRedactor } from '../engine/security/pii-redactor.js';
import { WebAuthnSecurityManager } from '../engine/security/webauthn-signer.js';
import { AuditLedgerManager } from '../engine/security/audit-ledger.js';
import { BrowserSagaManager } from '../engine/security/saga-manager.js';

export const securityRouter = new Hono();

const piiRedactor = new PIIRedactor();
const webauthnManager = new WebAuthnSecurityManager();
export const globalAuditLedger = new AuditLedgerManager();
export const globalSagaManager = new BrowserSagaManager();

// Seed initial audit log for demo visibility
globalAuditLedger.logAction({
  toolName: 'search_products',
  safetyTier: 'public_read',
  inputsMasked: { query: 'laptop 16gb ram' },
  outputSummary: 'Found 4 products',
  status: 'SUCCESS',
  humanApproved: true,
  durationMs: 14
});

// POST /api/security/scan-injection
securityRouter.post('/scan-injection', async (c) => {
  const body = await c.req.json();
  const content = body.content || '';
  const result = scanForPromptInjection(content);
  return c.json({ success: true, result });
});

// POST /api/security/redact-pii
securityRouter.post('/redact-pii', async (c) => {
  const body = await c.req.json();
  const text = body.text || '';
  const result = piiRedactor.redact(text);
  return c.json({ success: true, result });
});

// POST /api/security/webauthn/challenge
securityRouter.post('/webauthn/challenge', async (c) => {
  const body = await c.req.json();
  const actionName = body.actionName || 'complete_checkout';
  const params = body.params || {};
  const rpId = body.rpId || 'localhost';

  const challenge = webauthnManager.createChallenge(actionName, params, rpId);
  return c.json({ success: true, challenge });
});

// POST /api/security/webauthn/verify
securityRouter.post('/webauthn/verify', async (c) => {
  const body = await c.req.json();
  const verification = webauthnManager.verifyProof(body.proof);
  
  if (verification.valid) {
    globalAuditLedger.logAction({
      toolName: body.actionName || 'complete_checkout',
      safetyTier: 'critical_destructive',
      inputsMasked: body.params || {},
      outputSummary: 'Order #9042 authorized and confirmed via Biometric WebAuthn Passkey.',
      status: 'SUCCESS',
      humanApproved: true,
      biometricSignature: body.proof?.signature?.substring(0, 32) + '...',
      durationMs: 420
    });
  }

  return c.json({ success: verification.valid, error: verification.error });
});

// GET /api/security/audit-ledger
securityRouter.get('/audit-ledger', (c) => {
  const entries = globalAuditLedger.getEntries();
  return c.json({ success: true, entries });
});

// POST /api/security/rollback
securityRouter.post('/rollback', async (c) => {
  const body = await c.req.json();
  const actionId = body.actionId;
  if (actionId) {
    globalAuditLedger.markRolledBack(actionId);
    await globalSagaManager.rollbackSpecific(actionId);
    return c.json({ success: true, message: `Action ${actionId} successfully rolled back.` });
  }

  const results = await globalSagaManager.rollbackAll();
  return c.json({ success: true, results });
});
