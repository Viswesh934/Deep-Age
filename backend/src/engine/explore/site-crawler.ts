import { Page } from 'puppeteer';
import { ExploreCatalogEntity } from '@deep-age/shared';

export interface ExtractedSiteData {
  siteUrl: string;
  title: string;
  description: string;
  archetype: 'ecommerce' | 'docs' | 'news_community' | 'saas_app' | 'general_web';
  routes: Array<{ path: string; label: string; description: string }>;
  entities: ExploreCatalogEntity[];
}

export async function extractLiveSiteStructure(page: Page, siteUrl: string): Promise<ExtractedSiteData> {
  try {
    const raw = await page.evaluate((currentUrl: string) => {
      const origin = window.location.origin;
      const title = document.title || 'Target Website';
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

      // 1. Discover Internal Navigation Links & Routes
      const discoveredRoutesMap = new Map<string, string>();
      discoveredRoutesMap.set('/', 'Home');

      const anchors = document.querySelectorAll('a[href]');
      anchors.forEach((a) => {
        const href = a.getAttribute('href');
        const text = (a.textContent || '').trim();
        if (!href) return;

        let cleanPath = '';
        try {
          if (href.startsWith('/')) {
            cleanPath = href.split('?')[0].split('#')[0];
          } else if (href.startsWith(origin)) {
            cleanPath = new URL(href).pathname;
          }
        } catch {}

        if (
          cleanPath &&
          cleanPath !== '/' &&
          !cleanPath.endsWith('.png') &&
          !cleanPath.endsWith('.jpg') &&
          !cleanPath.endsWith('.svg') &&
          !cleanPath.endsWith('.css') &&
          !cleanPath.endsWith('.js') &&
          cleanPath.length < 50
        ) {
          if (!discoveredRoutesMap.has(cleanPath) && discoveredRoutesMap.size < 12) {
            discoveredRoutesMap.set(cleanPath, text || cleanPath.replace(/^\//, '').replace(/-/g, ' '));
          }
        }
      });

      const routes: Array<{ path: string; label: string; description: string }> = [];
      discoveredRoutesMap.forEach((label, path) => {
        let cleanLabel = label.length > 25 ? label.substring(0, 22) + '...' : label;
        if (!cleanLabel || cleanLabel.includes('/')) {
          cleanLabel = path === '/' ? 'Home Overview' : path.replace(/^\//, '').replace(/[_-]/g, ' ').toUpperCase();
        }
        routes.push({
          path,
          label: cleanLabel,
          description: `Internal page route for ${cleanLabel} at ${path}`,
        });
      });

      // 2. Archetype Detection
      const htmlText = (document.body?.innerText || '').toLowerCase();
      let archetype: 'ecommerce' | 'docs' | 'news_community' | 'saas_app' | 'general_web' = 'general_web';

      if (htmlText.includes('cart') || htmlText.includes('checkout') || htmlText.includes('price') || htmlText.includes('buy') || htmlText.includes('stock')) {
        archetype = 'ecommerce';
      } else if (htmlText.includes('documentation') || htmlText.includes('api reference') || htmlText.includes('getting started') || htmlText.includes('sdk')) {
        archetype = 'docs';
      } else if (htmlText.includes('comments') || htmlText.includes('submit') || htmlText.includes('points') || htmlText.includes('by ') || htmlText.includes('posted')) {
        archetype = 'news_community';
      } else if (htmlText.includes('dashboard') || htmlText.includes('sign in') || htmlText.includes('pricing') || htmlText.includes('features')) {
        archetype = 'saas_app';
      }

      // 3. Dynamic Entity Extraction (Articles, Products, List Items, Cards)
      const entities: Array<{
        id: string;
        entityType: 'product' | 'article' | 'service' | 'action';
        title: string;
        summary: string;
        priceCents?: number;
        tags: string[];
      }> = [];

      // Extract headings as content entities
      const headings = document.querySelectorAll('h2, h3, article, .item, .product, .card, tr.athing');
      let count = 0;
      headings.forEach((h, idx) => {
        if (count >= 10) return;
        const headingText = (h.textContent || '').replace(/\s+/g, ' ').trim();
        if (headingText.length > 8 && headingText.length < 120) {
          // Check for price
          const priceMatch = headingText.match(/[$₹€£]\s?([0-9,]+(\.[0-9]{2})?)/);
          const priceCents = priceMatch ? Math.round(parseFloat(priceMatch[1].replace(/,/g, '')) * 100) : undefined;

          entities.push({
            id: `entity-${idx + 1}`,
            entityType: archetype === 'ecommerce' ? 'product' : 'article',
            title: headingText.substring(0, 80),
            summary: `Discovered on ${window.location.hostname}: ${headingText.substring(0, 140)}`,
            priceCents,
            tags: [archetype, window.location.hostname.replace(/[^a-z0-9]/gi, '')],
          });
          count++;
        }
      });

      return {
        title,
        description: metaDesc,
        archetype,
        routes,
        entities,
      };
    }, siteUrl);

    // Fallback if no entities extracted
    let entities: ExploreCatalogEntity[] = raw.entities.map(e => ({
      id: e.id,
      entityType: e.entityType,
      title: e.title,
      summary: e.summary,
      priceCents: e.priceCents,
      tags: e.tags,
    }));

    if (entities.length === 0) {
      let hostname = 'target';
      try { hostname = new URL(siteUrl).hostname; } catch {}
      entities = [
        {
          id: 'item-1',
          entityType: 'article',
          title: raw.title || `${hostname} Main Resource`,
          summary: raw.description || `Primary landing page and resources at ${siteUrl}`,
          tags: ['web', hostname],
        },
        {
          id: 'item-2',
          entityType: 'action',
          title: `Explore ${hostname} Navigation`,
          summary: `Discovered ${raw.routes.length} navigation paths and interactive DOM controls.`,
          tags: ['navigation', hostname],
        }
      ];
    }

    return {
      siteUrl,
      title: raw.title,
      description: raw.description,
      archetype: raw.archetype,
      routes: raw.routes,
      entities,
    };
  } catch (err) {
    console.warn('[SiteCrawler] Failed to extract live structure:', err);
    let hostname = 'site';
    try { hostname = new URL(siteUrl).hostname; } catch {}
    return {
      siteUrl,
      title: `${hostname} Web Resource`,
      description: `Live web destination at ${siteUrl}`,
      archetype: 'general_web',
      routes: [
        { path: '/', label: 'Home Overview', description: 'Main landing page' },
        { path: '/search', label: 'Search & Explore', description: 'Search directory' },
        { path: '/about', label: 'About & Information', description: 'Site details' },
      ],
      entities: [
        {
          id: 'ent-1',
          entityType: 'article',
          title: `${hostname} Index Page`,
          summary: `Discovered live web endpoint at ${siteUrl}`,
          tags: ['web', hostname],
        },
      ],
    };
  }
}
