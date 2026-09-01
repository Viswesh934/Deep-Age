import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { apiRouter } from './routes/index.js';
import { WebMCPController } from './controllers/webmcp.controller.js';
import { mcpRouter } from './routes/mcp.routes.js';
import { demoApp } from '@deep-age/demo';

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

// Mount modular API routes (Backend diagnostics, test drives, security, explorer)
app.route('/', apiRouter);

// Mount Reference Demo Storefront & WebMCP routes (Single Unified Worker)
// Serves: /.well-known/webmcp.json, /api/products, /api/cart, /api/admin, /api/state-graph, /store, /demo, /
app.route('/store', demoApp);
app.route('/demo', demoApp);
app.route('/', demoApp);

