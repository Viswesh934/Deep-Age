import { serve } from '@hono/node-server';
import { app } from './app.js';
import { config } from './config/env.js';

console.log(`🚀 Starting Deep Age Backend in ${config.nodeEnv} mode on port ${config.port}...`);

serve({
  fetch: app.fetch,
  port: config.port,
}, (info) => {
  console.log(`✅ Deep Age Backend is listening at http://localhost:${info.port}`);
});
