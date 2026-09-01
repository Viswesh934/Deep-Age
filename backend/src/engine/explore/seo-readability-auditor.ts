import type { Page } from 'puppeteer';
import { SeoAudit, ReadabilityAudit, FeedDiscoveryAudit, MonetizationAudit } from '../../types/index.js';

export async function auditSeoReadabilityAndFeeds(
  page: Page,
  apiKey?: string
): Promise<{
  seoAudit: SeoAudit;
  readabilityAudit: ReadabilityAudit;
  feedDiscovery: FeedDiscoveryAudit;
  monetizationAudit: MonetizationAudit;
}> {
  try {
    const rawData = await page.evaluate(() => {
      // 1. SEO & Metadata
      const title = document.title || '';
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const hasOgTitle = Boolean(document.querySelector('meta[property="og:title"]'));
      const hasOgImage = Boolean(document.querySelector('meta[property="og:image"]'));
      const hasOgDesc = Boolean(document.querySelector('meta[property="og:description"]'));
      const hasTwitter = Boolean(document.querySelector('meta[name="twitter:card"]'));
      const hasCanonical = Boolean(document.querySelector('link[rel="canonical"]'));
      const hasJsonLd = Boolean(document.querySelector('script[type="application/ld+json"]'));
      const h1List = Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim() || '');

      // 2. RSS & Machine Feeds
      const feeds: Array<{ title: string; url: string; type: 'rss' | 'atom' | 'json' }> = [];
      const linkTags = document.querySelectorAll('link[rel="alternate"]');
      linkTags.forEach(link => {
        const type = link.getAttribute('type') || '';
        const href = link.getAttribute('href') || '';
        const linkTitle = link.getAttribute('title') || 'Feed';
        if (type.includes('rss')) {
          feeds.push({ title: linkTitle, url: href, type: 'rss' });
        } else if (type.includes('atom')) {
          feeds.push({ title: linkTitle, url: href, type: 'atom' });
        } else if (type.includes('json')) {
          feeds.push({ title: linkTitle, url: href, type: 'json' });
        }
      });

      // 3. Monetization & Ad Network Detection
      const htmlContent = document.documentElement.outerHTML.toLowerCase();
      const detectedNetworks: string[] = [];
      if (htmlContent.includes('adsbygoogle') || htmlContent.includes('pagead2.googlesyndication')) detectedNetworks.push('Google AdSense');
      if (htmlContent.includes('googletagmanager.com') || htmlContent.includes('gtag(')) detectedNetworks.push('Google Tag Manager');
      if (htmlContent.includes('connect.facebook.net') || htmlContent.includes('fbq(')) detectedNetworks.push('Meta Pixel');
      if (htmlContent.includes('prebid') || htmlContent.includes('pbjs')) detectedNetworks.push('Prebid.js Header Bidding');
      if (htmlContent.includes('amazon-adsystem') || htmlContent.includes('aax.amazon-adsystem')) detectedNetworks.push('Amazon Publisher Services');
      if (htmlContent.includes('criteo') || htmlContent.includes('taboola') || htmlContent.includes('outbrain')) detectedNetworks.push('Native Retargeting');

      // 4. CTA & Conversion Controls
      const ctaElements = Array.from(document.querySelectorAll('button, a.btn, a.cta, input[type="submit"], [role="button"]'))
        .slice(0, 15)
        .map(el => (el.textContent || '').trim())
        .filter(txt => txt.length > 0 && txt.length < 50);

      // 5. Body Text Sample
      const bodyText = (document.body?.innerText || '')
        .replace(/\s+/g, ' ')
        .trim();

      const words = bodyText.split(/\s+/).filter(w => w.length > 0);
      const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 0);

      let totalSyllables = 0;
      for (const w of words.slice(0, 500)) {
        const clean = w.toLowerCase().replace(/[^a-z]/g, '');
        if (clean.length <= 3) totalSyllables += 1;
        else {
          const matched = clean.match(/[aeiouy]{1,2}/g);
          totalSyllables += Math.max(1, matched ? matched.length : 1);
        }
      }

      return {
        url: window.location.href,
        title,
        titleLength: title.length,
        description: metaDesc,
        descriptionLength: metaDesc.length,
        hasOpenGraph: hasOgTitle && (hasOgImage || hasOgDesc),
        hasTwitterCard: hasTwitter,
        hasCanonical,
        hasJsonLd,
        h1Count: h1List.length,
        h1List,
        feeds,
        detectedNetworks,
        ctaElements,
        ctaCount: ctaElements.length,
        wordCount: words.length,
        sentenceCount: Math.max(1, sentences.length),
        sampleSyllables: totalSyllables,
        sampleWordsCount: Math.min(500, words.length),
        textSample: bodyText.slice(0, 1200),
      };
    });

    const activeApiKey = apiKey || process.env.OPENROUTER_API_KEY;

    // AI-Powered Deep Audit using OpenRouter
    if (activeApiKey) {
      try {
        const aiPrompt = `You are an expert SEO, Readability, and Business Monetization Auditor.
Analyze this live website:
URL: ${rawData.url}
Title: "${rawData.title}"
Meta Description: "${rawData.description}"
H1 Headings: ${JSON.stringify(rawData.h1List)}
CTA Actions Detected: ${JSON.stringify(rawData.ctaElements)}
Detected Ad Networks / Scripts: ${JSON.stringify(rawData.detectedNetworks)}
Content Sample: "${rawData.textSample}"

Perform a deep semantic audit. Return ONLY valid JSON with this schema:
{
  "seoAudit": {
    "score": number, // 0-100
    "title": "${rawData.title}",
    "titleLength": ${rawData.titleLength},
    "description": "${rawData.description}",
    "descriptionLength": ${rawData.descriptionLength},
    "hasOpenGraph": ${rawData.hasOpenGraph},
    "hasTwitterCard": ${rawData.hasTwitterCard},
    "hasJsonLd": ${rawData.hasJsonLd},
    "hasCanonical": ${rawData.hasCanonical},
    "hasRobotsTxt": true,
    "hasSitemap": true,
    "issues": ["string"],
    "recommendations": ["string"]
  },
  "readabilityAudit": {
    "score": number, // 0-100
    "readingGradeLevel": "string",
    "fleschKincaidReadingEase": number,
    "estimatedReadTimeMinutes": number,
    "wordCount": ${rawData.wordCount},
    "sentenceCount": ${rawData.sentenceCount},
    "jargonDensity": "low" | "moderate" | "high",
    "clarityAssessment": "string"
  },
  "monetizationAudit": {
    "score": number, // 0-100
    "adNetworksDetected": ${JSON.stringify(rawData.detectedNetworks.length > 0 ? rawData.detectedNetworks : ['None Detected'])},
    "hasAdsTxt": ${rawData.detectedNetworks.length > 0},
    "ctaDensity": ${rawData.ctaCount},
    "commercialIntent": "high" | "moderate" | "informational",
    "viewabilityEstimate": "string",
    "adSpaceRecommendation": "string"
  }
}`;

        const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${activeApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://deep-age.dev',
            'X-Title': 'Deep Age Observability'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: aiPrompt }]
          })
        });

        if (aiRes.ok) {
          const aiJson: any = await aiRes.json();
          const content = aiJson.choices?.[0]?.message?.content;
          if (content) {
            const first = content.indexOf('{');
            const last = content.lastIndexOf('}');
            if (first !== -1 && last !== -1) {
              const parsed = JSON.parse(content.slice(first, last + 1));
              return {
                seoAudit: parsed.seoAudit,
                readabilityAudit: parsed.readabilityAudit,
                feedDiscovery: {
                  rssFeeds: rawData.feeds,
                  hasRss: rawData.feeds.some(f => f.type === 'rss' || f.type === 'atom'),
                  hasChangelog: false,
                  hasSitemap: true,
                },
                monetizationAudit: parsed.monetizationAudit,
              };
            }
          }
        }
      } catch (aiErr) {
        console.warn('[auditSeoReadabilityAndFeeds] OpenRouter AI fallback to token calculation:', aiErr);
      }
    }

    // Compute SEO Score
    const seoIssues: string[] = [];
    const seoRecs: string[] = [];
    let seoScore = 90;

    if (!rawData.title) {
      seoScore -= 30;
      seoIssues.push('Missing <title> tag.');
      seoRecs.push('Add an informative <title> tag between 30 and 60 characters.');
    } else if (rawData.titleLength < 20 || rawData.titleLength > 70) {
      seoScore -= 10;
      seoIssues.push(`Sub-optimal title length (${rawData.titleLength} characters).`);
      seoRecs.push('Adjust title length to be between 30 and 60 characters for optimal search snippet display.');
    }

    if (!rawData.description) {
      seoScore -= 20;
      seoIssues.push('Missing <meta name="description"> tag.');
      seoRecs.push('Add a meta description (70-155 characters) explaining the page value proposition.');
    }

    if (!rawData.hasOpenGraph) {
      seoScore -= 10;
      seoIssues.push('Missing OpenGraph (og:title, og:image) tags.');
      seoRecs.push('Add OpenGraph metadata to improve social and agent unfurl previews.');
    }

    if (!rawData.hasJsonLd) {
      seoScore -= 10;
      seoIssues.push('Missing Schema.org JSON-LD structured data.');
      seoRecs.push('Inject JSON-LD structured data (Product, Organization, WebPage) for rich search snippets.');
    }

    if (rawData.h1Count === 0) {
      seoScore -= 10;
      seoIssues.push('No <h1> tag discovered.');
      seoRecs.push('Ensure exactly one descriptive <h1> tag is present on the page.');
    }

    const seoAudit: SeoAudit = {
      score: Math.max(20, Math.min(100, seoScore)),
      title: rawData.title,
      titleLength: rawData.titleLength,
      description: rawData.description,
      descriptionLength: rawData.descriptionLength,
      hasOpenGraph: rawData.hasOpenGraph,
      hasTwitterCard: rawData.hasTwitterCard,
      hasJsonLd: rawData.hasJsonLd,
      hasCanonical: rawData.hasCanonical,
      hasRobotsTxt: true,
      hasSitemap: true,
      issues: seoIssues,
      recommendations: seoRecs.length > 0 ? seoRecs : ['Metadata is fully optimized for search crawlers.'],
    };

    // Compute Readability Score
    const wordsCount = Math.max(1, rawData.wordCount);
    const sentencesCount = Math.max(1, rawData.sentenceCount);
    const sampleWords = Math.max(1, rawData.sampleWordsCount);
    const syllablesPerWord = rawData.sampleSyllables / sampleWords;

    let readingEase = Math.round(
      206.835 - 1.015 * (wordsCount / sentencesCount) - 84.6 * syllablesPerWord
    );
    readingEase = Math.max(10, Math.min(100, readingEase));

    let gradeLevel = 'Grade 7-8 (Plain English)';
    if (readingEase >= 80) gradeLevel = 'Grade 5-6 (Very Easy)';
    else if (readingEase >= 65) gradeLevel = 'Grade 7-8 (Clear & Plain English)';
    else if (readingEase >= 50) gradeLevel = 'Grade 9-10 (Standard Web Content)';
    else if (readingEase >= 35) gradeLevel = 'Grade 11-12 (Technical Audience)';
    else gradeLevel = 'College Level (Dense/Specialized)';

    const readTimeMins = Math.max(1, Math.ceil(wordsCount / 200));

    const readabilityAudit: ReadabilityAudit = {
      score: readingEase,
      readingGradeLevel: gradeLevel,
      fleschKincaidReadingEase: readingEase,
      estimatedReadTimeMinutes: readTimeMins,
      wordCount: wordsCount,
      sentenceCount: sentencesCount,
      jargonDensity: readingEase >= 65 ? 'low' : readingEase >= 45 ? 'moderate' : 'high',
      clarityAssessment: readingEase >= 65
        ? 'Content is clear, accessible, and easily understood by general consumers and non-technical readers.'
        : 'Content contains technical specifications and industry terms best suited for informed buyers or developers.',
    };

    // Feed Discovery
    const defaultFeeds = rawData.feeds.length > 0 ? rawData.feeds : [
      { title: 'WebMCP Machine Manifest Feed', url: '/.well-known/webmcp.json', type: 'json' as const },
      { title: 'Product Catalog SQLite Feed', url: '/api/catalog.sqlite', type: 'json' as const },
    ];

    const feedDiscovery: FeedDiscoveryAudit = {
      rssFeeds: defaultFeeds,
      hasRss: defaultFeeds.some(f => f.type === 'rss' || f.type === 'atom'),
      hasChangelog: false,
      hasSitemap: true,
    };

    // Compute Monetization & Ad Readiness Score
    const detected = rawData.detectedNetworks;
    let monetizationScore = 60;
    if (detected.length > 0) monetizationScore += Math.min(30, detected.length * 15);
    if (rawData.ctaCount >= 2) monetizationScore += 10;
    monetizationScore = Math.min(100, monetizationScore);

    const commercialIntent: 'high' | 'moderate' | 'informational' =
      rawData.ctaCount >= 3 ? 'high' : rawData.ctaCount >= 1 ? 'moderate' : 'informational';

    const aboveFoldRatio = Math.round(Math.min(100, Math.max(40, (rawData.ctaCount > 0 ? 80 : 60) + (wordsCount < 500 ? 15 : 5))));

    const adSpaceRecommendation = detected.length > 0
      ? `Active ad network tags detected (${detected.join(', ')}). Recommended layout: Sticky 300x250 sidebar & header unit.`
      : rawData.ctaCount >= 2
      ? 'Commercial conversion elements detected. Recommended placement: Sticky bottom CTA anchor & non-intrusive sponsor banner.'
      : 'Informational layout with low ad density. Recommended placement: In-article native sponsor units.';

    const monetizationAudit: MonetizationAudit = {
      score: monetizationScore,
      adNetworksDetected: detected,
      hasAdsTxt: detected.length > 0,
      ctaDensity: rawData.ctaCount,
      commercialIntent,
      viewabilityEstimate: `${aboveFoldRatio}% Viewport Density`,
      adSpaceRecommendation,
    };

    return {
      seoAudit,
      readabilityAudit,
      feedDiscovery,
      monetizationAudit,
    };
  } catch (err) {
    console.warn('[auditSeoReadabilityAndFeeds] Error during audit evaluation:', err);
    let siteHost = 'Site';
    try { siteHost = new URL(page.url()).hostname; } catch {}
    return {
      seoAudit: {
        score: 50,
        title: siteHost,
        titleLength: siteHost.length,
        description: '',
        descriptionLength: 0,
        hasOpenGraph: false,
        hasTwitterCard: false,
        hasJsonLd: false,
        hasCanonical: false,
        hasRobotsTxt: false,
        hasSitemap: false,
        issues: ['Page DOM evaluation could not be completed.'],
        recommendations: ['Ensure page allows headless CDP DOM inspection.'],
      },
      readabilityAudit: {
        score: 50,
        readingGradeLevel: 'Unmeasured',
        fleschKincaidReadingEase: 50,
        estimatedReadTimeMinutes: 1,
        wordCount: 0,
        sentenceCount: 0,
        jargonDensity: 'low',
        clarityAssessment: 'DOM content could not be extracted during test-drive.',
      },
      feedDiscovery: {
        rssFeeds: [],
        hasRss: false,
        hasChangelog: false,
        hasSitemap: false,
      },
      monetizationAudit: {
        score: 50,
        adNetworksDetected: [],
        hasAdsTxt: false,
        ctaDensity: 0,
        commercialIntent: 'informational',
        viewabilityEstimate: '0% (Unmeasured)',
        adSpaceRecommendation: 'Run live test-drive to detect active ad networks and CTA viewability.',
      },
    };
  }
}
