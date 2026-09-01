import type { Page } from 'puppeteer';
import { BotProtectionAudit, HeaderSecurityAudit, NetworkEvent, SecuritySignal } from '../../types/index.js';

export async function auditBotProtectionAndHeaders(
  page: Page,
  networkEvents: NetworkEvent[]
): Promise<{
  botProtection: BotProtectionAudit;
  headerSecurity: HeaderSecurityAudit;
  signals: SecuritySignal[];
}> {
  const signals: SecuritySignal[] = [];

  // 1. Audit Bot Protection & CAPTCHA Challenges
  let botAudit: BotProtectionAudit = {
    botProtectionDetected: false,
    provider: 'None',
    challengeType: 'none',
    agentPassable: true,
    fingerprintsDetected: [],
  };

  try {
    const detected = await page.evaluate(() => {
      const html = document.documentElement.outerHTML.toLowerCase();
      const fingerprints: string[] = [];
      let provider: 'Cloudflare Turnstile' | 'Google reCAPTCHA' | 'hCaptcha' | 'DataDome' | 'AWS WAF / Shield' | 'Akamai' | 'Custom WAF' | 'None' = 'None';
      let challengeType: 'interactive_captcha' | 'invisible_turnstile' | 'js_fingerprint' | 'rate_limit_429' | 'none' = 'none';

      // Cloudflare Turnstile / Bot Management
      if (html.includes('challenges.cloudflare.com') || html.includes('cf-turnstile') || html.includes('cf-chl-bypass') || document.querySelector('.cf-turnstile, iframe[src*="cloudflare"]')) {
        provider = 'Cloudflare Turnstile';
        challengeType = 'invisible_turnstile';
        fingerprints.push('Cloudflare Managed Challenge / Turnstile Script');
      }
      // Google reCAPTCHA
      else if (html.includes('google.com/recaptcha') || html.includes('g-recaptcha') || (window as any).grecaptcha) {
        provider = 'Google reCAPTCHA';
        challengeType = 'interactive_captcha';
        fingerprints.push('Google reCAPTCHA v2/v3 Token Ingestion');
      }
      // hCaptcha
      else if (html.includes('hcaptcha.com') || html.includes('h-captcha') || (window as any).hcaptcha) {
        provider = 'hCaptcha';
        challengeType = 'interactive_captcha';
        fingerprints.push('hCaptcha Interactive Challenge Frame');
      }
      // DataDome
      else if (html.includes('datadome.js') || document.cookie.includes('datadome')) {
        provider = 'DataDome';
        challengeType = 'js_fingerprint';
        fingerprints.push('DataDome Behavioral JavaScript Sensor');
      }
      // Generic Bot Interstitial
      else if (document.title.toLowerCase().includes('just a moment') || document.title.toLowerCase().includes('access denied') || document.title.toLowerCase().includes('security check')) {
        provider = 'Custom WAF';
        challengeType = 'interactive_captcha';
        fingerprints.push('WAF Challenge Title Interstitial');
      }

      return {
        detected: provider !== 'None',
        provider,
        challengeType,
        fingerprints,
      };
    });

    if (detected.detected) {
      botAudit = {
        botProtectionDetected: true,
        provider: detected.provider,
        challengeType: detected.challengeType,
        agentPassable: detected.challengeType === 'invisible_turnstile', // invisible turnstile might pass; interactive captcha blocks agents
        fingerprintsDetected: detected.fingerprints,
        bypassRecommendation:
          detected.provider === 'Cloudflare Turnstile'
            ? 'Expose native Chrome WebMCP tools so agents do not trigger browser automation WAF heuristics.'
            : 'Interactive CAPTCHA detected. Configure an automated WebAuthn or WebMCP API token bridge.',
      };

      signals.push({
        id: `sec-bot-${Date.now()}`,
        severity: detected.challengeType === 'interactive_captcha' ? 'alert' : 'warning',
        category: 'bot_protection',
        title: `${detected.provider} Active`,
        observation: `Website engages ${detected.provider} (${detected.challengeType}) which can impede headless AI agent automation.`,
        evidence: {
          provider: detected.provider,
          fingerprints: detected.fingerprints,
        },
      });
    }
  } catch (err) {
    console.warn('[BotProtectionAuditor] Failed to evaluate in page:', err);
  }

  // 2. Audit Exposed Headers & Security Headers Hygiene
  const exposedHeaders: Array<{ header: string; value: string; risk: 'high' | 'medium' | 'low'; description: string }> = [];
  const missingHeaders: Array<{ header: string; importance: 'high' | 'medium' | 'low'; fixSnippet: string }> = [];

  // Check the main document response headers
  const mainDocEvent = networkEvents.find(n => n.status >= 200 && n.status < 400 && n.responseHeaders) || networkEvents[0];
  const headers = mainDocEvent?.responseHeaders || {};
  const normalizedHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    normalizedHeaders[k.toLowerCase()] = v;
  }

  // Check for fingerprinting leaks
  if (normalizedHeaders['server']) {
    exposedHeaders.push({
      header: 'Server',
      value: normalizedHeaders['server'],
      risk: 'medium',
      description: `Reveals backend web server software (${normalizedHeaders['server']}), aiding automated attacker reconnaissance.`,
    });
  }
  if (normalizedHeaders['x-powered-by']) {
    exposedHeaders.push({
      header: 'X-Powered-By',
      value: normalizedHeaders['x-powered-by'],
      risk: 'high',
      description: `Exposes application framework technology (${normalizedHeaders['x-powered-by']}).`,
    });
  }
  if (normalizedHeaders['x-aspnet-version'] || normalizedHeaders['x-runtime']) {
    const val = normalizedHeaders['x-aspnet-version'] || normalizedHeaders['x-runtime'];
    exposedHeaders.push({
      header: 'X-Runtime / Version',
      value: val,
      risk: 'medium',
      description: 'Reveals backend execution engine runtime metadata.',
    });
  }

  // Check missing critical security headers
  if (!normalizedHeaders['content-security-policy']) {
    missingHeaders.push({
      header: 'Content-Security-Policy',
      importance: 'high',
      fixSnippet: "Content-Security-Policy: default-src 'self'; script-src 'self' https:;",
    });
  }
  if (!normalizedHeaders['strict-transport-security'] && !mainDocEvent?.url.includes('127.0.0.1') && !mainDocEvent?.url.includes('localhost')) {
    missingHeaders.push({
      header: 'Strict-Transport-Security',
      importance: 'high',
      fixSnippet: 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
    });
  }
  if (!normalizedHeaders['x-content-type-options']) {
    missingHeaders.push({
      header: 'X-Content-Type-Options',
      importance: 'medium',
      fixSnippet: 'X-Content-Type-Options: nosniff',
    });
  }
  if (!normalizedHeaders['x-frame-options']) {
    missingHeaders.push({
      header: 'X-Frame-Options',
      importance: 'medium',
      fixSnippet: 'X-Frame-Options: SAMEORIGIN',
    });
  }
  if (!normalizedHeaders['referrer-policy']) {
    missingHeaders.push({
      header: 'Referrer-Policy',
      importance: 'low',
      fixSnippet: 'Referrer-Policy: strict-origin-when-cross-origin',
    });
  }

  // CORS check
  const acao = normalizedHeaders['access-control-allow-origin'];
  const acac = normalizedHeaders['access-control-allow-credentials'];
  const isWildcard = acao === '*';
  const allowCredentials = acac === 'true';
  const corsRisk: 'safe' | 'permissive' | 'vulnerable' =
    isWildcard && allowCredentials ? 'vulnerable' : isWildcard ? 'permissive' : 'safe';

  // Compute Header Security Score
  let headerScore = 100;
  headerScore -= exposedHeaders.length * 12;
  headerScore -= missingHeaders.filter(m => m.importance === 'high').length * 15;
  headerScore -= missingHeaders.filter(m => m.importance === 'medium').length * 8;
  if (corsRisk === 'vulnerable') headerScore -= 20;
  headerScore = Math.max(10, Math.min(100, headerScore));

  if (exposedHeaders.length > 0) {
    signals.push({
      id: `sec-hdr-exp-${Date.now()}`,
      severity: 'warning',
      category: 'exposed_headers',
      title: `${exposedHeaders.length} Server Fingerprint Header(s) Exposed`,
      observation: `Observed backend server identification headers: ${exposedHeaders.map(h => `${h.header}: ${h.value}`).join(', ')}.`,
      evidence: { exposedHeaders },
    });
  }

  if (missingHeaders.length >= 2) {
    signals.push({
      id: `sec-hdr-miss-${Date.now()}`,
      severity: 'info',
      category: 'missing_security_headers',
      title: `${missingHeaders.length} Recommended Security Headers Missing`,
      observation: `Missing defense-in-depth headers: ${missingHeaders.map(m => m.header).join(', ')}.`,
      evidence: { missingHeaders },
    });
  }

  return {
    botProtection: botAudit,
    headerSecurity: {
      score: headerScore,
      exposedHeaders,
      missingHeaders,
      corsStatus: {
        isWildcard,
        allowCredentials,
        risk: corsRisk,
      },
    },
    signals,
  };
}
