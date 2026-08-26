import { Hono } from 'hono';
import { WebMCPController } from '../controllers/webmcp.controller.js';

export const webmcpRouter = new Hono();

webmcpRouter.get('/tools', WebMCPController.getTools);
webmcpRouter.get('/config', WebMCPController.getMcpConfig);
