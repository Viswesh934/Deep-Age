import { PIIScanResult, MaskedDataToken } from '@deep-age/shared';

// Regular expressions for PII detection
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const CREDIT_CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
const PHONE_REGEX = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;

export class PIIRedactor {
  private tokenMap: Map<string, string> = new Map();
  private reverseMap: Map<string, string> = new Map();
  private counter: number = 1;

  public redact(text: string): PIIScanResult {
    const tokens: MaskedDataToken[] = [];
    let masked = text;

    // Redact Emails
    masked = masked.replace(EMAIL_REGEX, (match) => {
      const token = this.getOrCreateToken(match, 'EMAIL');
      tokens.push({ token, type: 'EMAIL', originalLength: match.length });
      return token;
    });

    // Redact Credit Cards
    masked = masked.replace(CREDIT_CARD_REGEX, (match) => {
      const token = this.getOrCreateToken(match, 'CREDIT_CARD');
      tokens.push({ token, type: 'CREDIT_CARD', originalLength: match.length });
      return token;
    });

    // Redact SSNs
    masked = masked.replace(SSN_REGEX, (match) => {
      const token = this.getOrCreateToken(match, 'SSN');
      tokens.push({ token, type: 'SSN', originalLength: match.length });
      return token;
    });

    // Redact Phone Numbers
    masked = masked.replace(PHONE_REGEX, (match) => {
      const token = this.getOrCreateToken(match, 'PHONE');
      tokens.push({ token, type: 'PHONE', originalLength: match.length });
      return token;
    });

    return {
      hasPII: tokens.length > 0,
      maskedText: masked,
      tokens,
      detectedCount: tokens.length
    };
  }

  public restore(maskedText: string): string {
    let restored = maskedText;
    for (const [token, original] of this.reverseMap.entries()) {
      restored = restored.split(token).join(original);
    }
    return restored;
  }

  private getOrCreateToken(raw: string, type: 'EMAIL' | 'CREDIT_CARD' | 'PHONE' | 'SSN'): string {
    if (this.tokenMap.has(raw)) {
      return this.tokenMap.get(raw)!;
    }
    const token = `[MASKED_${type}_${this.counter++}]`;
    this.tokenMap.set(raw, token);
    this.reverseMap.set(token, raw);
    return token;
  }

  public clear(): void {
    this.tokenMap.clear();
    this.reverseMap.clear();
    this.counter = 1;
  }
}
