import type { Page, HTTPRequest, HTTPResponse } from 'puppeteer';
import { NetworkEvent } from '../types/index.js';

export class NetworkInterceptor {
  private requestTimestamps = new Map<string, number>();
  private capturedEvents: NetworkEvent[] = [];
  private pageHostname: string;

  constructor(targetUrl: string) {
    try {
      this.pageHostname = new URL(targetUrl).hostname;
    } catch {
      this.pageHostname = 'localhost';
    }
  }

  public setup(page: Page): void {
    page.on('request', (req: HTTPRequest) => {
      this.requestTimestamps.set(req.url(), Date.now());
    });

    page.on('response', async (res: HTTPResponse) => {
      try {
        const req = res.request();
        const reqUrl = req.url();
        const startTime = this.requestTimestamps.get(reqUrl) || Date.now();
        const durationMs = Date.now() - startTime;

        let origin: 'first-party' | 'third-party' = 'first-party';
        try {
          const reqHostname = new URL(reqUrl).hostname;
          if (reqHostname !== this.pageHostname && !reqHostname.includes(this.pageHostname)) {
            origin = 'third-party';
          }
        } catch {
          // fallback
        }

        let postData: unknown = undefined;
        try {
          const rawPost = req.postData();
          if (rawPost) postData = JSON.parse(rawPost);
        } catch {
          postData = req.postData();
        }

        const queryParams: Record<string, string> = {};
        try {
          const u = new URL(reqUrl);
          u.searchParams.forEach((v, k) => {
            queryParams[k] = v;
          });
        } catch {
          // ignore
        }

        this.capturedEvents.push({
          id: `net-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          url: reqUrl,
          method: req.method(),
          status: res.status(),
          origin,
          requestHeaders: req.headers(),
          responseHeaders: res.headers(),
          queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
          requestBody: postData,
          durationMs,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Error in network response interceptor:', err);
      }
    });
  }

  public getEvents(): NetworkEvent[] {
    return this.capturedEvents;
  }
}
