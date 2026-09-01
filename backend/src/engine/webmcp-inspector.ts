import type { Page } from 'puppeteer';
import { WebMCPTool, WebMCPToolCall } from '../types/index.js';

export class WebMCPInspector {
  public static async discoverTools(page: Page, targetUrl: string): Promise<WebMCPTool[]> {
    const discovered: WebMCPTool[] = [];

    // 1. Inspect Chrome WebMCP standard (document.modelContext & window.modelContext)
    const inPageTools = (await page.evaluate(`(() => {
      const results = [];
      let ctx = undefined;
      try {
        if (window.modelContext && Array.isArray(window.modelContext.tools)) {
          ctx = window.modelContext;
        }
      } catch (e) {}
      if (!ctx) {
        try {
          if (document.modelContext && Array.isArray(document.modelContext.tools)) {
            ctx = document.modelContext;
          }
        } catch (e) {}
      }

      if (ctx && Array.isArray(ctx.tools)) {
        for (let i = 0; i < ctx.tools.length; i++) {
          const t = ctx.tools[i];
          results.push({
            name: t.name,
            description: t.description || '',
            inputSchema: t.inputSchema || {},
            source: 'modelContext',
          });
        }
      }
      return results;
    })()`)) as WebMCPTool[];

    discovered.push(...inPageTools);

    // 2. Discover via standard WebMCP endpoint if exposed by target host
    try {
      const endpointUrl = new URL('/api/webmcp/tools', targetUrl).toString();
      const endpointRes = await fetch(endpointUrl, { signal: AbortSignal.timeout(3000) }).catch(() => null);
      if (endpointRes && endpointRes.ok) {
        const data = (await endpointRes.json()) as { tools?: WebMCPTool[] };
        if (Array.isArray(data.tools)) {
          for (const t of data.tools) {
            if (!discovered.some((dt) => dt.name === t.name)) {
              discovered.push({ ...t, source: 'modelContext' });
            }
          }
        }
      }
    } catch {
      // optional endpoint
    }

    return discovered;
  }

  public static async executeTool(
    page: Page,
    toolName: string,
    input: Record<string, unknown>
  ): Promise<WebMCPToolCall> {
    const startCall = Date.now();
    try {
      const output = await page.evaluate(
        `(async (name, args) => {
          let ctx = undefined;
          try {
            if (window.modelContext && Array.isArray(window.modelContext.tools)) {
              ctx = window.modelContext;
            }
          } catch (e) {}
          if (!ctx) {
            try {
              if (document.modelContext && Array.isArray(document.modelContext.tools)) {
                ctx = document.modelContext;
              }
            } catch (e) {}
          }

          const target = ctx && ctx.tools ? ctx.tools.find(function(t) { return t.name === name; }) : null;
          if (target && typeof target.execute === 'function') {
            return await target.execute(args);
          }
          throw new Error('WebMCP Tool "' + name + '" is not registered or callable on modelContext');
        })(${JSON.stringify(toolName)}, ${JSON.stringify(input)})`
      );

      return {
        id: `tc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        toolName,
        input,
        output,
        durationMs: Date.now() - startCall,
        timestamp: Date.now(),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        id: `tc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        toolName,
        input,
        error: message,
        durationMs: Date.now() - startCall,
        timestamp: Date.now(),
      };
    }
  }
}
