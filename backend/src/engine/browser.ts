import type { Browser } from 'puppeteer';
import { config } from '../config/env.js';

export interface LaunchBrowserOptions {
  browserBinding?: any; // Cloudflare Worker env.MYBROWSER binding
  wsEndpoint?: string;
}

export async function launchBrowser(options?: LaunchBrowserOptions): Promise<Browser | any> {
  // 1. Cloudflare Browser Rendering binding (for Cloudflare Workers runtime)
  const cfBinding = options?.browserBinding || (typeof globalThis !== 'undefined' && (globalThis as any).MYBROWSER);
  if (cfBinding) {
    try {
      const cfPuppeteer = await import('@cloudflare/puppeteer');
      return await cfPuppeteer.default.launch(cfBinding);
    } catch (err) {
      console.warn('[BrowserLauncher] Cloudflare browser binding launch failed, falling back:', err);
    }
  }

  // 2. Remote WebSocket endpoint (e.g. Browserless, remote Cloudflare browser endpoint)
  const wsEndpoint = options?.wsEndpoint || (typeof process !== 'undefined' && process.env?.BROWSER_WS_ENDPOINT);
  if (wsEndpoint) {
    const puppeteer = await import('puppeteer');
    return await puppeteer.default.connect({ browserWSEndpoint: wsEndpoint });
  }

  // 3. Local Node / Docker Chromium fallback (only in Node.js runtime)
  if (typeof process !== 'undefined' && process.release?.name === 'node') {
    const puppeteer = await import('puppeteer');
    return await puppeteer.default.launch({
      headless: config.browser.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  }

  throw new Error('No compatible browser execution environment found (Cloudflare MYBROWSER binding or WebSocket endpoint required).');
}

