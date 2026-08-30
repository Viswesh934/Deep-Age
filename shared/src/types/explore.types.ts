import { WebMCPSafetyTier } from './webmcp.types.js';

export interface StateTransitionEdge {
  targetState: string;
  actionTool?: string;
  description: string;
  guard?: string;
  requiresAuth?: boolean;
}

export interface SiteStateNode {
  id: string;
  label: string;
  description: string;
  routePath?: string;
  availableTools: string[];
  blockedTools?: Array<{ name: string; reason: string }>;
  transitions: Record<string, StateTransitionEdge>;
}

export interface StateTransitionGraph {
  siteUrl: string;
  initialState: string;
  states: Record<string, SiteStateNode>;
  version?: string;
}

export interface ActionPlanStep {
  step: number;
  toolName: string;
  parameters: Record<string, unknown>;
  safetyTier: WebMCPSafetyTier;
  explanation: string;
  requiresConfirmation: boolean;
}

export interface IntentResolutionRequest {
  siteUrl: string;
  userGoal: string;
  currentState?: string;
  userContext?: {
    isAuthenticated?: boolean;
    hasCartItems?: boolean;
    preferences?: Record<string, unknown>;
  };
  openRouterApiKey?: string;
}

export interface IntentResolutionResult {
  feasible: boolean;
  intent: string;
  currentState: string;
  targetState?: string;
  plan: ActionPlanStep[];
  reasoning: string;
  estimatedRiskTier: WebMCPSafetyTier;
  missingPrerequisites?: string[];
}

export interface ExploreCatalogEntity {
  id: string;
  entityType: 'product' | 'article' | 'service' | 'action';
  title: string;
  summary: string;
  priceCents?: number;
  tags: string[];
  actionTool?: string;
  actionParams?: Record<string, unknown>;
}

export interface SiteExploreSnapshot {
  siteUrl: string;
  generatedAt: number;
  routesCount: number;
  toolsCount: number;
  entitiesCount: number;
  sqliteDownloadUrl: string;
  manifestDownloadUrl: string;
  stateGraph: StateTransitionGraph;
  catalog: ExploreCatalogEntity[];
}
