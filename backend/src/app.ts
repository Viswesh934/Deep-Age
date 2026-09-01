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

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="8" fill="#111113" /><path d="M10 8h6a8 8 0 0 1 0 16h-6z" fill="none" stroke="#ff8527" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /><circle cx="15.5" cy="16" r="2" fill="#5ae561" /></svg>`;

// Favicon handlers
app.get('/favicon.svg', (c) => {
  c.header('Content-Type', 'image/svg+xml');
  return c.body(FAVICON_SVG);
});
app.get('/favicon.ico', (c) => {
  c.header('Content-Type', 'image/svg+xml');
  return c.body(FAVICON_SVG);
});

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

