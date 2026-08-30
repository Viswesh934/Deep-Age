import { IndirectInjectionScanResult } from '@deep-age/shared';

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /system\s*:\s*override/i,
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /javascript\s*:/i,
  /transfer\s+all\s+funds/i,
  /send\s+password/i,
  /exfiltrate/i,
  /drop\s+table/i
];

export function scanForPromptInjection(content: string): IndirectInjectionScanResult {
  const detectedPatterns: string[] = [];

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(content)) {
      detectedPatterns.push(pattern.source);
    }
  }

  let sanitized = content;
  // Neutralize script tags and prompt escape delimiters
  sanitized = sanitized.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '[REMOVED_SCRIPT]');
  sanitized = sanitized.replace(/```system/gi, '```site_content');

  const score = detectedPatterns.length > 0 ? Math.min(1.0, 0.4 + detectedPatterns.length * 0.3) : 0;

  return {
    isSafe: detectedPatterns.length === 0,
    score,
    detectedPatterns,
    sanitizedContent: sanitized
  };
}
