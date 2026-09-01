import { Hono } from 'hono';
import { buildSiteStateGraph } from '../engine/explore/state-graph.js';
import { resolveUserIntent } from '../engine/explore/intent-resolver.js';
import {
  generateSqliteExploreScript,
  generateWebMcpManifest,
  buildExploreSnapshot
} from '../engine/explore/catalog-exporter.js';
import { storeService } from '../services/store.service.js';
import { ExploreCatalogEntity, WebMCPTool, TestDriveRun } from '../types/index.js';

export const exploreRouter = new Hono();

// Default generic fallback entities for exploration snapshot
const DEFAULT_EXPLORE_ENTITIES: ExploreCatalogEntity[] = [
  {
    id: 'res-01',
    entityType: 'service',
    title: 'Application Core Workspace',
    summary: 'Primary interactive canvas, documentation hub, or application viewport.',
    tags: ['workspace', 'core', 'interactive'],
    actionTool: 'explore_workspace',
  },
  {
    id: 'res-02',
    entityType: 'article',
    title: 'Technical Documentation & Specifications',
    summary: 'API references, user manuals, and configuration parameters.',
    tags: ['docs', 'specifications', 'api'],
    actionTool: 'query_docs',
  },
  {
    id: 'res-03',
    entityType: 'service',
    title: 'Settings & Environment Configuration',
    summary: 'Preferences, sessions, and environment variables.',
    tags: ['settings', 'config'],
    actionTool: 'update_settings',
  }
];

// GET /api/explore/graph?url=...
exploreRouter.get('/graph', async (c) => {
  const url = c.req.query('url') || 'http://127.0.0.1:3002';
  
  // Find tools and stateGraph from latest run
  const runs: TestDriveRun[] = await storeService.list();
  const matchingRun = runs.find((r: TestDriveRun) => r.url.includes(url) || url.includes(r.url)) || runs[0];

  if (matchingRun && matchingRun.stateGraph) {
    return c.json({ success: true, graph: matchingRun.stateGraph });
  }

  const tools: WebMCPTool[] = matchingRun ? matchingRun.tools : [];
  const graph = buildSiteStateGraph(url, tools);
  return c.json({ success: true, graph });
});

// POST /api/explore/resolve-intent
exploreRouter.post('/resolve-intent', async (c) => {
  const body = await c.req.json();
  const siteUrl = body.siteUrl || 'http://127.0.0.1:3002';
  const userGoal = body.userGoal || 'Find relevant resources and explore features';
  const openRouterApiKey = body.openRouterApiKey || process.env.OPENROUTER_API_KEY;

  const runs: TestDriveRun[] = await storeService.list();
  const matchingRun = runs.find((r: TestDriveRun) => r.url.includes(siteUrl) || siteUrl.includes(r.url)) || runs[0];
  const tools: WebMCPTool[] = matchingRun ? matchingRun.tools : [];

  const stateGraph = (matchingRun && matchingRun.stateGraph)
    ? matchingRun.stateGraph
    : buildSiteStateGraph(siteUrl, tools);

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
  const tools: WebMCPTool[] = matchingRun ? matchingRun.tools : [];

  const dynamicCatalog = (matchingRun?.extractedData as any)?.entities || DEFAULT_EXPLORE_ENTITIES;

  const snapshot = buildExploreSnapshot(url, tools, dynamicCatalog);
  return c.json({ success: true, snapshot });
});

// GET /api/explore/snapshot/sqlite
exploreRouter.get('/snapshot/sqlite', async (c) => {
  const url = c.req.query('url') || 'http://127.0.0.1:3002';
  const runs: TestDriveRun[] = await storeService.list();
  const matchingRun = runs.find((r: TestDriveRun) => r.url.includes(url) || url.includes(r.url)) || runs[0];
  const tools: WebMCPTool[] = matchingRun ? matchingRun.tools : [];

  const dynamicCatalog = (matchingRun?.extractedData as any)?.entities || DEFAULT_EXPLORE_ENTITIES;

  const sqlScript = generateSqliteExploreScript(url, tools, dynamicCatalog);
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
