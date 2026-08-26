import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { apiRouter } from './routes/index.js';
import { WebMCPController } from './controllers/webmcp.controller.js';

export const app = new Hono();

// Global CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Root MCP Discovery
app.get('/mcp.json', WebMCPController.getMcpConfig);

// Mount modular API routes
app.route('/', apiRouter);
