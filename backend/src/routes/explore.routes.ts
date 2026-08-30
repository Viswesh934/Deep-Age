import { Hono } from 'hono';
import { buildSiteStateGraph } from '../engine/explore/state-graph.js';
import { resolveUserIntent } from '../engine/explore/intent-resolver.js';
import {
  generateSqliteExploreScript,
  generateWebMcpManifest,
  buildExploreSnapshot
} from '../engine/explore/catalog-exporter.js';
import { storeService } from '../services/store.service.js';
import { ExploreCatalogEntity, WebMCPTool, TestDriveRun } from '@deep-age/shared';

export const exploreRouter = new Hono();

// Default mock/demo catalog for exploration snapshot
const DEMO_CATALOG: ExploreCatalogEntity[] = [
  {
    id: 'lap-901',
    entityType: 'product',
    title: 'UltraBook Pro 14 (16GB RAM, 512GB SSD)',
    summary: 'High performance ultra-slim developer laptop with 16GB RAM under budget.',
    priceCents: 7499900,
    tags: ['laptop', '16gb', 'ultrabook', 'developer'],
    actionTool: 'add_to_cart',
    actionParams: { product_id: 'lap-901' }
  },
  {
    id: 'lap-902',
    entityType: 'product',
    title: 'GamerMax 15 (16GB RAM, RTX 4060)',
    summary: 'Dedicated gaming laptop with high refresh rate display.',
    priceCents: 8500000,
    tags: ['laptop', '16gb', 'gaming'],
    actionTool: 'add_to_cart',
    actionParams: { product_id: 'lap-902' }
  },
  {
    id: 'lap-903',
    entityType: 'product',
    title: 'AirBook Slim (8GB RAM)',
    summary: 'Budget friendly everyday browsing notebook.',
    priceCents: 6200000,
    tags: ['laptop', '8gb', 'budget'],
    actionTool: 'add_to_cart',
    actionParams: { product_id: 'lap-903' }
  }
];

// GET /api/explore/graph?url=...
exploreRouter.get('/graph', async (c) => {
  const url = c.req.query('url') || 'http://127.0.0.1:3002';
  
  // Find tools from latest run or default tools
  const runs: TestDriveRun[] = await storeService.list();
  const matchingRun = runs.find((r: TestDriveRun) => r.url.includes(url) || url.includes(r.url)) || runs[0];
  const tools: WebMCPTool[] = matchingRun ? matchingRun.tools : [
    { name: 'search_products', description: 'Search catalog', inputSchema: {}, safetyTier: 'public_read', category: 'search' },
    { name: 'add_to_cart', description: 'Add item to cart', inputSchema: {}, safetyTier: 'reversible_write', category: 'commerce' },
    { name: 'complete_checkout', description: 'Authorize payment', inputSchema: {}, safetyTier: 'critical_destructive', category: 'commerce', requiresConfirmation: true }
  ];

  const graph = buildSiteStateGraph(url, tools);
  return c.json({ success: true, graph });
});

// POST /api/explore/resolve-intent
exploreRouter.post('/resolve-intent', async (c) => {
  const body = await c.req.json();
  const siteUrl = body.siteUrl || 'http://127.0.0.1:3002';
  const userGoal = body.userGoal || 'Find a laptop with 16GB RAM under 80,000';
  const openRouterApiKey = body.openRouterApiKey || process.env.OPENROUTER_API_KEY;

  const runs: TestDriveRun[] = await storeService.list();
  const matchingRun = runs.find((r: TestDriveRun) => r.url.includes(siteUrl) || siteUrl.includes(r.url)) || runs[0];
  const tools: WebMCPTool[] = matchingRun ? matchingRun.tools : [
    { name: 'search_products', description: 'Search catalog products', inputSchema: {}, safetyTier: 'public_read', category: 'search' },
    { name: 'filter_products', description: 'Filter by price and RAM', inputSchema: {}, safetyTier: 'public_read', category: 'search' },
    { name: 'get_product_details', description: 'Get item specs', inputSchema: {}, safetyTier: 'public_read', category: 'commerce' },
    { name: 'add_to_cart', description: 'Add product to cart', inputSchema: {}, safetyTier: 'reversible_write', category: 'commerce' }
  ];

  const stateGraph = buildSiteStateGraph(siteUrl, tools);

  const result = await resolveUserIntent(
    { siteUrl, userGoal, openRouterApiKey },
    tools,
    stateGraph
  );

  return c.json({ success: true, result });
});

// GET /api/explore/snapshot
exploreRouter.get('/snapshot', async (c) => {
  const url = c.req.query('url') || 'http://127.0.0.1:3002';
  const runs: TestDriveRun[] = await storeService.list();
  const matchingRun = runs.find((r: TestDriveRun) => r.url.includes(url) || url.includes(r.url)) || runs[0];
  const tools: WebMCPTool[] = matchingRun ? matchingRun.tools : [
    { name: 'search_products', description: 'Search catalog', inputSchema: {}, safetyTier: 'public_read' },
    { name: 'add_to_cart', description: 'Add to cart', inputSchema: {}, safetyTier: 'reversible_write' }
  ];

  const snapshot = buildExploreSnapshot(url, tools, DEMO_CATALOG);
  return c.json({ success: true, snapshot });
});

// GET /api/explore/snapshot/sqlite
exploreRouter.get('/snapshot/sqlite', async (c) => {
  const url = c.req.query('url') || 'http://127.0.0.1:3002';
  const runs: TestDriveRun[] = await storeService.list();
  const matchingRun = runs.find((r: TestDriveRun) => r.url.includes(url) || url.includes(r.url)) || runs[0];
  const tools: WebMCPTool[] = matchingRun ? matchingRun.tools : [];

  const sqlScript = generateSqliteExploreScript(url, tools, DEMO_CATALOG);
  c.header('Content-Type', 'application/sql');
  c.header('Content-Disposition', `attachment; filename="site_explore_${Date.now()}.sql"`);
  return c.text(sqlScript);
});

// GET /api/explore/snapshot/manifest
exploreRouter.get('/snapshot/manifest', async (c) => {
  const url = c.req.query('url') || 'http://127.0.0.1:3002';
  const runs: TestDriveRun[] = await storeService.list();
  const matchingRun = runs.find((r: TestDriveRun) => r.url.includes(url) || url.includes(r.url)) || runs[0];
  const tools: WebMCPTool[] = matchingRun ? matchingRun.tools : [];

  const manifest = generateWebMcpManifest(url, tools);
  return c.json(manifest);
});
