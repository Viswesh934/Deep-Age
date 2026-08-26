import puppeteer, { Browser } from 'puppeteer';
import { config } from '../config/env.js';

export async function launchBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    headless: config.browser.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
}
