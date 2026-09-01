import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { apiRouter } from './routes/index.js';
import { WebMCPController } from './controllers/webmcp.controller.js';

import { mcpRouter } from './routes/mcp.routes.js';

export const app = new Hono();

// Global CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Root MCP Discovery & Protocol Handler
app.get('/mcp.json', WebMCPController.getMcpConfig);
app.route('/mcp', mcpRouter);

// Mount modular API routes
app.route('/', apiRouter);
