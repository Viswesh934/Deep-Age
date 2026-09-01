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

function extractDynamicEntitiesFromRun(matchingRun?: TestDriveRun): ExploreCatalogEntity[] {
  if (matchingRun?.extractedData && Array.isArray((matchingRun.extractedData as any).entities)) {
    return (matchingRun.extractedData as any).entities;
  }
  if (matchingRun && matchingRun.tools && matchingRun.tools.length > 0) {
    return matchingRun.tools.map((t, idx) => ({
      id: `tool-${idx + 1}`,
      entityType: 'action',
      title: t.name,
      summary: t.description || `Exposed WebMCP tool ${t.name}`,
      tags: ['webmcp', 'action'],
      actionTool: t.name,
    }));
  }
  return [];
}

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
  const { siteUrl, userGoal, openRouterApiKey } = await c.req.json();
  if (!userGoal) {
    return c.json({ success: false, error: 'User goal is required' }, 400);
  }

  const runs: TestDriveRun[] = await storeService.list();
  const matchingRun = runs.find((r: TestDriveRun) => r.url.includes(siteUrl) || (siteUrl && siteUrl.includes(r.url))) || runs[0];
  const tools: WebMCPTool[] = matchingRun ? matchingRun.tools : [];
  const stateGraph = matchingRun?.stateGraph || buildSiteStateGraph(siteUrl || 'http://127.0.0.1:3002', tools);

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

  const dynamicCatalog = extractDynamicEntitiesFromRun(matchingRun);

  const snapshot = buildExploreSnapshot(url, tools, dynamicCatalog);
  return c.json({ success: true, snapshot });
});

// GET /api/explore/snapshot/sqlite
exploreRouter.get('/snapshot/sqlite', async (c) => {
  const url = c.req.query('url') || 'http://127.0.0.1:3002';
  const runs: TestDriveRun[] = await storeService.list();
  const matchingRun = runs.find((r: TestDriveRun) => r.url.includes(url) || url.includes(r.url)) || runs[0];
  const tools: WebMCPTool[] = matchingRun ? matchingRun.tools : [];

  const dynamicCatalog = extractDynamicEntitiesFromRun(matchingRun);

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
