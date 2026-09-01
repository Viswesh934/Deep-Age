import { app } from './app.js';
import { config } from './config/env.js';

// Cloudflare Workers entry export
export default app;

// Node.js standalone runtime fallback
if (typeof process !== 'undefined' && process.release && process.release.name === 'node') {
  import('@hono/node-server').then(({ serve }) => {
    console.log(`🚀 Starting Deep Age Backend in ${config.nodeEnv} mode on port ${config.port}...`);
    serve({
      fetch: app.fetch,
      port: config.port,
    }, (info) => {
      console.log(`✅ Deep Age Backend is listening at http://localhost:${info.port}`);
    });
  }).catch(() => {});
}
