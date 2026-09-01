import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { productsRouter } from './routes/products.routes.js';
import { cartRouter } from './routes/cart.routes.js';
import { webmcpRouter } from './routes/webmcp.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { storefrontRouter } from './routes/storefront.routes.js';
import { PRODUCTS, getAddToCartCapability } from './data/products.js';

export const demoApp = new Hono();

// Middleware
demoApp.use('*', cors());
demoApp.get('/favicon.ico', (c) => c.body(null, 204));

// 1. Chrome WebMCP Standard Manifest Feed
demoApp.get('/.well-known/webmcp.json', (c) => {
  const isAddToCartEnabled = getAddToCartCapability();
  return c.json({
    schema_version: '1.0.0',
    name: 'ElectroVault Developer & Creator Store',
    description: 'Hardware, laptops, and developer accessories reference application with WebMCP 2.0 interface',
    origin: c.req.url,
    capabilities: {
      discovery_method: 'document.modelContext',
      tools_endpoint: '/api/webmcp/tools',
      safety_matrix_supported: true,
      saga_rollback_supported: true,
    },
    tools: [
      { name: 'search_products', endpoint: '/api/products', method: 'GET', safety_tier: 'public_read' },
      { name: 'filter_products', endpoint: '/api/products', method: 'GET', safety_tier: 'public_read' },
      { name: 'get_product_details', endpoint: '/api/products/:id', method: 'GET', safety_tier: 'public_read' },
      { name: 'get_product_reviews', endpoint: '/api/products/:id/reviews', method: 'GET', safety_tier: 'public_read' },
      { name: 'view_cart', endpoint: '/api/cart', method: 'GET', safety_tier: 'context_read' },
      ...(isAddToCartEnabled
        ? [{ name: 'add_to_cart', endpoint: '/api/cart', method: 'POST', safety_tier: 'reversible_write' }]
        : []),
      { name: 'apply_promo_code', endpoint: '/api/cart/promo', method: 'POST', safety_tier: 'reversible_write' },
      { name: 'remove_promo_code', endpoint: '/api/cart/promo', method: 'DELETE', safety_tier: 'reversible_write' },
      { name: 'complete_checkout', endpoint: '/api/cart/checkout', method: 'POST', safety_tier: 'critical_destructive' },
    ],
  });
});

// 2. State Machine Capability Graph Feed
demoApp.get('/api/state-graph', (c) => {
  return c.json({
    initialState: 'ANONYMOUS_BROWSING',
    states: {
      ANONYMOUS_BROWSING: {
        tools: ['search_products', 'filter_products'],
        transitions: { VIEW_DETAILS: 'PRODUCT_DETAILS', OPEN_CART: 'CART_ACTIVE' },
      },
      PRODUCT_DETAILS: {
        tools: ['get_product_details', 'get_product_reviews', 'add_to_cart'],
        transitions: { ADD_ITEM: 'CART_ACTIVE', BACK: 'ANONYMOUS_BROWSING' },
      },
      CART_ACTIVE: {
        tools: ['view_cart', 'apply_promo_code', 'remove_promo_code'],
        transitions: { PROCEED_CHECKOUT: 'CHECKOUT_GATEWAY', CONTINUE_SHOPPING: 'ANONYMOUS_BROWSING' },
      },
      CHECKOUT_GATEWAY: {
        tools: ['complete_checkout'],
        transitions: { AUTHORIZE: 'ORDER_CONFIRMED', CANCEL: 'CART_ACTIVE' },
      },
      ORDER_CONFIRMED: {
        tools: ['view_cart'],
        transitions: { NEW_PURCHASE: 'ANONYMOUS_BROWSING' },
      },
    },
  });
});

// 3. Portable SQLite / SQL Script Catalog Feed
demoApp.get('/api/catalog.sqlite', (c) => {
  let sql = `-- ElectroVault Product Catalog SQLite Export\n`;
  sql += `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT, category TEXT, price INTEGER, ram INTEGER, in_stock INTEGER, summary TEXT);\n`;
  sql += `CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, product_id TEXT, author TEXT, rating INTEGER, comment TEXT);\n\n`;

  for (const p of PRODUCTS) {
    sql += `INSERT OR REPLACE INTO products VALUES ('${p.id}', '${p.name.replace(/'/g, "''")}', '${p.category}', ${p.price}, ${p.ram}, ${p.inStock ? 1 : 0}, '${p.summary.replace(/'/g, "''")}');\n`;
    for (const r of p.reviews) {
      sql += `INSERT OR REPLACE INTO reviews VALUES ('${r.id}', '${p.id}', '${r.author.replace(/'/g, "''")}', ${r.rating}, '${r.comment.replace(/'/g, "''")}');\n`;
    }
  }

  c.header('Content-Type', 'application/sql');
  c.header('Content-Disposition', 'attachment; filename="electrovault_catalog.sql"');
  return c.text(sql);
});

// Routes
demoApp.route('/api/products', productsRouter);
demoApp.route('/api/cart', cartRouter);
demoApp.route('/api/webmcp', webmcpRouter);
demoApp.route('/api/admin', adminRouter);
demoApp.route('/', storefrontRouter);

