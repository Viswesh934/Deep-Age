import { Hono } from 'hono';
import { HealthController } from '../controllers/health.controller.js';
import { testDriveRouter } from './test-drive.routes.js';
import { webmcpRouter } from './webmcp.routes.js';
import { exploreRouter } from './explore.routes.js';
import { securityRouter } from './security.routes.js';
import { config } from '../config/env.js';

export const apiRouter = new Hono();

apiRouter.get('/health', HealthController.getHealth);
apiRouter.route('/api/test-drives', testDriveRouter);
apiRouter.route('/api/webmcp', webmcpRouter);
apiRouter.route('/api/explore', exploreRouter);
apiRouter.route('/api/security', securityRouter);

apiRouter.get('/api/mcp/config', (c) => {
  const host = new URL(c.req.url).origin;
  return c.json({
    mcpServers: {
      'deep-age': {
        url: `${host}/mcp`,
        type: 'sse',
        description: 'Deep Age — WebMCP Diagnostics',
      },
    },
    cliConfig: {
      mcpServers: {
        'deep-age': {
          command: 'npx',
          args: ['-y', '@deep-age/mcp-server', '--endpoint', `${host}/mcp`],
        },
      },
    },
    endpoints: {
      sseEndpoint: `${host}/mcp`,
      toolsEndpoint: `${host}/api/webmcp/tools`,
      manifestUrl: `${host}/mcp.json`,
      healthCheck: `${host}/health`,
    },
  });
});

// Demo store control proxy
apiRouter.post('/api/demo/toggle', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const res = await fetch(`${config.demoUrl}/api/admin/toggle-add-to-cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return c.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: `Could not reach demo store at ${config.demoUrl}: ${message}` }, 502);
  }
});
