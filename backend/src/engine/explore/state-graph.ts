import { StateTransitionGraph, SiteStateNode, WebMCPTool } from '../../types/index.js';
import { ExtractedSiteData } from './site-crawler.js';

export function buildSiteStateGraph(
  siteUrl: string,
  discoveredTools: WebMCPTool[],
  siteData?: ExtractedSiteData
): StateTransitionGraph {
  const toolNames = discoveredTools.map((t) => t.name);
  const states: Record<string, SiteStateNode> = {};

  // 1. Extract Real Discovered Internal Routes
  const discoveredRoutes = (siteData?.routes && siteData.routes.length > 0)
    ? siteData.routes
    : [
        { path: '/', label: 'Home Entry', description: `Main landing & entry point for ${siteUrl}` },
        { path: '/explore', label: 'Explore & Workspace', description: 'Interactive application workspace & navigation' },
        { path: '/details', label: 'Item & Details', description: 'Resource details, documentation, or entity viewer' },
        { path: '/settings', label: 'Settings & Config', description: 'Preferences, sessions, and environment settings' },
      ];

  const primaryRoutes = discoveredRoutes.slice(0, 8);

  // 2. Build State Nodes for Real Page Routes
  primaryRoutes.forEach((route, idx) => {
    const cleanId = route.path === '/'
      ? 'ENTRY_HUB'
      : `STATE_${route.path.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase().replace(/^_+|_+$/g, '')}`;

    const nextRoute = primaryRoutes[(idx + 1) % primaryRoutes.length];
    const nextStateId = nextRoute.path === '/'
      ? 'ENTRY_HUB'
      : `STATE_${nextRoute.path.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase().replace(/^_+|_+$/g, '')}`;

    states[cleanId] = {
      id: cleanId,
      label: route.label || cleanId.replace('STATE_', '').replace(/_/g, ' '),
      description: route.description || `State context at route ${route.path}`,
      routePath: route.path,
      availableTools: toolNames,
      transitions: {
        navigateNext: {
          targetState: nextStateId,
          description: `Navigate to ${nextRoute.label} (${nextRoute.path})`,
        },
        returnEntry: {
          targetState: 'ENTRY_HUB',
          description: `Return to root entry state (${siteUrl})`,
        },
      },
    };
  });

  // Ensure ENTRY_HUB exists
  if (!states['ENTRY_HUB']) {
    states['ENTRY_HUB'] = {
      id: 'ENTRY_HUB',
      label: 'Root Entry',
      description: `Initial application state for ${siteUrl}`,
      routePath: '/',
      availableTools: toolNames,
      transitions: {
        returnEntry: {
          targetState: 'ENTRY_HUB',
          description: 'Refresh entry state',
        },
      },
    };
  }

  // 3. Dynamically Generate Interactive Action States for Discovered WebMCP Tools
  for (const tool of discoveredTools) {
    const actionStateId = `ACTION_${tool.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
    const isDestructive = tool.safetyTier === 'critical_destructive' || tool.name.includes('delete') || tool.name.includes('pay');

    states[actionStateId] = {
      id: actionStateId,
      label: `${tool.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Active`,
      description: tool.description || `Interactive state triggered by ${tool.name}`,
      routePath: states['ENTRY_HUB'].routePath,
      availableTools: toolNames,
      transitions: {
        completeAction: {
          targetState: 'ENTRY_HUB',
          actionTool: tool.name,
          description: `Execute ${tool.name} and return to entry context.`,
          requiresAuth: isDestructive,
        },
      },
    };

    // Link ENTRY_HUB to this action tool transition
    states['ENTRY_HUB'].transitions[tool.name] = {
      targetState: actionStateId,
      actionTool: tool.name,
      description: `Trigger ${tool.name}: ${tool.description || 'WebMCP action'}`,
    };
  }

  const initialKey = states['ENTRY_HUB'] ? 'ENTRY_HUB' : Object.keys(states)[0] || 'ENTRY_HUB';

  return {
    siteUrl,
    initialState: initialKey,
    states,
    version: '2.2.0',
  };
}

