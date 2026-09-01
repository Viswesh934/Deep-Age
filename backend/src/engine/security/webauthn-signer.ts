import { createHash, randomBytes } from 'crypto';
import { WebAuthnVerificationChallenge, WebAuthnProof, WebMCPSafetyTier } from '../../types/index.js';

export class WebAuthnSecurityManager {
  private activeChallenges: Map<string, WebAuthnVerificationChallenge> = new Map();

  public createChallenge(
    actionName: string,
    params: Record<string, unknown>,
    rpId: string,
    safetyTier: WebMCPSafetyTier = 'critical_destructive'
  ): WebAuthnVerificationChallenge {
    const challengeId = `chal_${Date.now()}_${randomBytes(6).toString('hex')}`;
    const payloadRaw = JSON.stringify({ actionName, params, timestamp: Date.now() });
    const payloadDigest = createHash('sha256').update(payloadRaw).digest('hex');

    const challenge: WebAuthnVerificationChallenge = {
      challengeId,
      actionName,
      payloadDigest,
      rpId,
      timestamp: Date.now(),
      safetyTier,
      paramsSummary: params
    };

    this.activeChallenges.set(challengeId, challenge);
    return challenge;
  }

  public verifyProof(proof: WebAuthnProof): { valid: boolean; error?: string } {
    const challenge = this.activeChallenges.get(proof.challengeId);
    if (!challenge) {
      return { valid: false, error: 'Challenge expired or not found.' };
    }

    if (!proof.userVerified) {
      return { valid: false, error: 'User biometric verification was not completed.' };
    }

    if (!proof.signature || proof.signature.length < 10) {
      return { valid: false, error: 'Invalid cryptographic signature payload.' };
    }

    // Mark challenge as used and cleanup
    this.activeChallenges.delete(proof.challengeId);
    return { valid: true };
  }
}
