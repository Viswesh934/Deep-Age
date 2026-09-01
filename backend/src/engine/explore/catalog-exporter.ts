import { WebMCPTool, ExploreCatalogEntity, SiteExploreSnapshot } from '../../types/index.js';
import { buildSiteStateGraph } from './state-graph.js';

export function generateSqliteExploreScript(
  siteUrl: string,
  tools: WebMCPTool[],
  catalog: ExploreCatalogEntity[]
): string {
  const lines: string[] = [
    `-- WebMCP 2.0 Portable Site Exploration Snapshot`,
    `-- Site: ${siteUrl}`,
    `-- Generated: ${new Date().toISOString()}`,
    ``,
    `CREATE TABLE IF NOT EXISTS site_meta (`,
    `    key TEXT PRIMARY KEY,`,
    `    value TEXT`,
    `);`,
    ``,
    `INSERT INTO site_meta (key, value) VALUES ('site_url', '${siteUrl}');`,
    `INSERT INTO site_meta (key, value) VALUES ('version', '2.0.0');`,
    `INSERT INTO site_meta (key, value) VALUES ('tools_count', '${tools.length}');`,
    ``,
    `CREATE TABLE IF NOT EXISTS tools (`,
    `    name TEXT PRIMARY KEY,`,
    `    description TEXT NOT NULL,`,
    `    safety_tier TEXT NOT NULL,`,
    `    category TEXT,`,
    `    input_schema TEXT NOT NULL`,
    `);`,
    ``
  ];

  for (const tool of tools) {
    const escapedDesc = (tool.description || '').replace(/'/g, "''");
    const escapedSchema = JSON.stringify(tool.inputSchema || {}).replace(/'/g, "''");
    lines.push(
      `INSERT INTO tools (name, description, safety_tier, category, input_schema) VALUES ('${tool.name}', '${escapedDesc}', '${tool.safetyTier || 'public_read'}', '${tool.category || 'commerce'}', '${escapedSchema}');`
    );
  }

  lines.push(
    ``,
    `CREATE TABLE IF NOT EXISTS catalog_entities (`,
    `    id TEXT PRIMARY KEY,`,
    `    entity_type TEXT NOT NULL,`,
    `    title TEXT NOT NULL,`,
    `    summary TEXT NOT NULL,`,
    `    price_cents INTEGER,`,
    `    tags TEXT,`,
    `    action_tool TEXT`,
    `);`,
    ``
  );

  for (const item of catalog) {
    const escapedTitle = item.title.replace(/'/g, "''");
    const escapedSummary = item.summary.replace(/'/g, "''");
    const tagsJson = JSON.stringify(item.tags || []).replace(/'/g, "''");
    lines.push(
      `INSERT INTO catalog_entities (id, entity_type, title, summary, price_cents, tags, action_tool) VALUES ('${item.id}', '${item.entityType}', '${escapedTitle}', '${escapedSummary}', ${item.priceCents || 0}, '${tagsJson}', '${item.actionTool || ''}');`
    );
  }

  return lines.join('\n');
}

export function generateWebMcpManifest(
  siteUrl: string,
  tools: WebMCPTool[]
): Record<string, unknown> {
  return {
    $schema: 'https://webmcp.io/schemas/v2/manifest.json',
    siteUrl,
    version: '2.0.0',
    generatedAt: Date.now(),
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      safetyTier: t.safetyTier || 'public_read',
      category: t.category || 'commerce',
      parameters: t.inputSchema || {},
      requiresConfirmation: t.requiresConfirmation || false
    }))
  };
}

export function buildExploreSnapshot(
  siteUrl: string,
  tools: WebMCPTool[],
  catalog: ExploreCatalogEntity[]
): SiteExploreSnapshot {
  const stateGraph = buildSiteStateGraph(siteUrl, tools);

  return {
    siteUrl,
    generatedAt: Date.now(),
    routesCount: Object.keys(stateGraph.states).length,
    toolsCount: tools.length,
    entitiesCount: catalog.length,
    sqliteDownloadUrl: `/api/explore/snapshot/sqlite?url=${encodeURIComponent(siteUrl)}`,
    manifestDownloadUrl: `/api/explore/snapshot/manifest?url=${encodeURIComponent(siteUrl)}`,
    stateGraph,
    catalog
  };
}
