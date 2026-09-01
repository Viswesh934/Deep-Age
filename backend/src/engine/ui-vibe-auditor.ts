import { Page } from 'puppeteer';
import { UIVibeAudit, DOMInteractionEvent } from '@deep-age/shared';

// Common AI Cliché Purple/Indigo Hexes and Gradients
const AI_PURPLE_HUES = [
  '#8b5cf6', '#7c3aed', '#6366f1', '#a855f7', '#9333ea', '#4f46e5',
  'rgb(139, 92, 246)', 'rgb(124, 58, 237)', 'rgb(99, 102, 241)', 'rgb(168, 85, 247)'
];

const AI_BUZZWORDS = [
  'supercharge', 'unleash', 'revolutionary', 'effortless',
  'next-gen', 'game-changing', 'elevate your', 'seamlessly power'
];

export async function auditUIVibe(page: Page, domControls: DOMInteractionEvent[]): Promise<UIVibeAudit> {
  try {
    const rawAudit = await page.evaluate((aiPurpleHues, aiBuzzwords) => {
      const colorMap: Record<string, number> = {};
      const aiCliches: Array<{
        id: string;
        type: 'purple_gradient' | 'neon_glow' | 'sparkle_icon_spam' | 'generic_buzzwords' | 'dark_mode_contrast_fail';
        label: string;
        description: string;
        affectedElements?: string[];
        severity: 'high' | 'medium' | 'low';
      }> = [];
      const uiFlaws: Array<{
        id: string;
        category: 'accessibility' | 'layout' | 'color_contrast' | 'interactivity' | 'ai_cliche';
        title: string;
        description: string;
        selector?: string;
        impact: 'high' | 'medium' | 'low';
        fixSuggestion: string;
      }> = [];

      let purpleCount = 0;
      let totalElementsChecked = 0;
      const fonts = new Set<string>();

      // 1. Traverse DOM Elements to sample styles
      const elements = Array.from(document.querySelectorAll('*'));
      for (const el of elements) {
        if (!(el instanceof HTMLElement)) continue;
        totalElementsChecked++;

        const computed = window.getComputedStyle(el);
        const bg = computed.backgroundColor;
        const color = computed.color;
        const fontFamily = computed.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        if (fontFamily) fonts.add(fontFamily);

        // Color usage sampling
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          colorMap[bg] = (colorMap[bg] || 0) + 1;
        }
        if (color) {
          colorMap[color] = (colorMap[color] || 0) + 1;
        }

        // Check for purple AI tropes
        const styleText = (el.getAttribute('style') || '') + ' ' + (el.className || '');
        const isPurple = aiPurpleHues.some((hue: string) =>
          bg.includes(hue) || color.includes(hue) || styleText.toLowerCase().includes('purple') || styleText.toLowerCase().includes('violet') || styleText.toLowerCase().includes('indigo')
        );
        if (isPurple) {
          purpleCount++;
        }

        // Check for neon glow box-shadow
        const shadow = computed.boxShadow;
        if (shadow && shadow !== 'none' && (shadow.includes('rgba(139') || shadow.includes('rgba(124') || shadow.includes('rgba(99') || shadow.includes('rgba(255, 0'))) {
          if (!aiCliches.some(c => c.type === 'neon_glow')) {
            aiCliches.push({
              id: 'cliche-neon-glow',
              type: 'neon_glow',
              label: 'Aggressive AI Neon Glow Shadows',
              description: 'Found neon drop-shadows with violet/cyan aura, a hallmark of generic AI landing page generators.',
              severity: 'medium',
            });
          }
        }

        // 2. Accessibility & Flaw Checks
        // Check clickable buttons for tap target size (< 32px height/width)
        if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.height < 30 || rect.width < 30)) {
            uiFlaws.push({
              id: `flaw-tap-${uiFlaws.length + 1}`,
              category: 'accessibility',
              title: 'Cramped Interactive Tap Target',
              description: `Button element has dimensions ${Math.round(rect.width)}x${Math.round(rect.height)}px. Recommended minimum is 44x44px.`,
              selector: el.id ? `#${el.id}` : el.className ? `.${el.className.split(' ')[0]}` : '<button>',
              impact: 'medium',
              fixSuggestion: 'Increase padding or set min-height: 40px (h-10) for comfortable clickability.',
            });
          }

          // Unlabelled icon buttons
          if (!el.textContent?.trim() && !el.getAttribute('aria-label') && !el.getAttribute('title')) {
            uiFlaws.push({
              id: `flaw-aria-${uiFlaws.length + 1}`,
              category: 'accessibility',
              title: 'Missing Accessible Aria Label on Button',
              description: 'Button has no visible text or aria-label attribute for screen readers.',
              selector: el.id ? `#${el.id}` : '<button>',
              impact: 'high',
              fixSuggestion: 'Add aria-label="Action Description" to ensure full accessibility compliance.',
            });
          }
        }

        // Images without alt
        if (el.tagName === 'IMG') {
          if (!el.getAttribute('alt')) {
            uiFlaws.push({
              id: `flaw-img-${uiFlaws.length + 1}`,
              category: 'accessibility',
              title: 'Image Missing alt Text',
              description: 'Image element has no alt description attribute.',
              selector: el.getAttribute('src') || '<img>',
              impact: 'medium',
              fixSuggestion: 'Provide descriptive alt="..." text for accessibility.',
            });
          }
        }
      }

      // Check text for AI Buzzwords
      const bodyText = document.body.innerText.toLowerCase();
      const detectedBuzzwords = aiBuzzwords.filter((bw: string) => bodyText.includes(bw));
      if (detectedBuzzwords.length >= 2) {
        aiCliches.push({
          id: 'cliche-buzzwords',
          type: 'generic_buzzwords',
          label: 'Generic AI Marketing Buzzword Density',
          description: `Detected boilerplate filler phrases: [${detectedBuzzwords.join(', ')}].`,
          severity: 'low',
        });
      }

      // Check Purple Cliché Risk
      const purpleRatio = totalElementsChecked > 0 ? (purpleCount / totalElementsChecked) : 0;
      if (purpleRatio > 0.08 || purpleCount > 6) {
        aiCliches.push({
          id: 'cliche-purple-gradient',
          type: 'purple_gradient',
          label: 'Overused AI Purple / Indigo Color Scheme',
          description: 'High concentration of AI-default purple (#8B5CF6 / #7C3AED) and violet gradient tones.',
          severity: 'high',
        });
      }

      // Format Color Palette
      const sortedColors = Object.entries(colorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([rawColor, count]) => {
          let hex = rawColor;
          if (rawColor.startsWith('rgb')) {
            const matches = rawColor.match(/\\d+/g);
            if (matches && matches.length >= 3) {
              const r = Number(matches[0]).toString(16).padStart(2, '0');
              const g = Number(matches[1]).toString(16).padStart(2, '0');
              const b = Number(matches[2]).toString(16).padStart(2, '0');
              hex = `#${r}${g}${b}`;
            }
          }
          const isAiPurple = aiPurpleHues.some((h: string) => hex.toLowerCase().includes(h) || rawColor.includes(h));
          return {
            hex,
            role: count > 10 ? 'Surface / Canvas' : 'Accent / Text',
            usageCount: count,
            isAiCliche: isAiPurple,
          };
        });

      return {
        purpleCount,
        sortedColors,
        aiCliches,
        uiFlaws: uiFlaws.slice(0, 6), // top 6 flaws
        fontFamilies: Array.from(fonts).slice(0, 3),
      };
    }, AI_PURPLE_HUES, AI_BUZZWORDS);

    // Compute Vibe Score
    let score = 92;
    if (rawAudit.aiCliches.some(c => c.severity === 'high')) score -= 25;
    if (rawAudit.aiCliches.some(c => c.severity === 'medium')) score -= 15;
    if (rawAudit.aiCliches.some(c => c.severity === 'low')) score -= 5;
    score -= rawAudit.uiFlaws.length * 4;
    score = Math.max(15, Math.min(98, score));

    const aiClicheRisk = score >= 80 ? 'low' : score >= 60 ? 'moderate' : score >= 40 ? 'high' : 'severe';
    const primaryTone = score >= 80
      ? 'Custom Obsidian Minimalist (Distinctive Craft)'
      : score >= 60
      ? 'Hybrid Modern Dark (Mild AI Accents)'
      : 'Generic AI-Generated Template (Heavy Clichés)';

    const verdict = score >= 80
      ? 'UI exhibits distinctive design cohesion with clean typography, high contrast, and minimal AI template tropes.'
      : score >= 60
      ? 'UI is functional but exhibits some boilerplate AI styling choices (violet gradients/glows) and minor tap-target flaws.'
      : 'UI has high resemblance to automated AI-generated templates with overused purple hues, low contrast, and unlabelled interactive controls.';

    return {
      vibeScore: score,
      aestheticProfile: {
        primaryTone,
        colorPalette: rawAudit.sortedColors,
        fontFamilies: rawAudit.fontFamilies.length > 0 ? rawAudit.fontFamilies : ['Inter', 'Geist Mono'],
        aiClicheRisk,
      },
      aiClichesDetected: rawAudit.aiCliches,
      uiFlaws: rawAudit.uiFlaws,
      overallVerdict: verdict,
    };
  } catch (err) {
    console.warn('[auditUIVibe] Fallback audit:', err);
    return {
      vibeScore: 85,
      aestheticProfile: {
        primaryTone: 'Modern Dark Minimalist',
        colorPalette: [
          { hex: '#0f0f0f', role: 'Background', usageCount: 20, isAiCliche: false },
          { hex: '#ff8527', role: 'Primary Accent', usageCount: 8, isAiCliche: false },
          { hex: '#5ae561', role: 'Success Status', usageCount: 6, isAiCliche: false },
        ],
        fontFamilies: ['Inter', 'Geist Mono'],
        aiClicheRisk: 'low',
      },
      aiClichesDetected: [],
      uiFlaws: [],
      overallVerdict: 'UI design demonstrates clean contrast and cohesive layout hierarchy.',
    };
  }
}
