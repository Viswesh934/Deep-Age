import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { productsRouter } from './routes/products.routes.js';
import { cartRouter } from './routes/cart.routes.js';
import { webmcpRouter } from './routes/webmcp.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { storefrontRouter } from './routes/storefront.routes.js';
export const demoApp = new Hono();
// Middleware
demoApp.use('*', cors());
demoApp.get('/favicon.ico', (c) => c.body(null, 204));
// Routes
demoApp.route('/api/products', productsRouter);
demoApp.route('/api/cart', cartRouter);
demoApp.route('/api/webmcp', webmcpRouter);
demoApp.route('/api/admin', adminRouter);
demoApp.route('/', storefrontRouter);
