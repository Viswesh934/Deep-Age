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

export interface SeoAudit {
  score: number; // 0 - 100
  title?: string;
  titleLength: number;
  description?: string;
  descriptionLength: number;
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
  hasJsonLd: boolean;
  hasCanonical: boolean;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  issues: string[];
  recommendations: string[];
}

export interface ReadabilityAudit {
  score: number; // 0 - 100
  readingGradeLevel: string;
  fleschKincaidReadingEase: number;
  estimatedReadTimeMinutes: number;
  wordCount: number;
  sentenceCount: number;
  jargonDensity: 'low' | 'moderate' | 'high';
  clarityAssessment: string;
}

export interface FeedDiscoveryAudit {
  rssFeeds: Array<{ title: string; url: string; type: 'rss' | 'atom' | 'json' }>;
  hasRss: boolean;
  hasChangelog: boolean;
  hasSitemap: boolean;
}

export interface MonetizationAudit {
  score: number; // 0 - 100 Ad Readiness & Monetization Score
  adNetworksDetected: string[];
  hasAdsTxt: boolean;
  ctaDensity: number;
  commercialIntent: 'high' | 'moderate' | 'informational';
  viewabilityEstimate: string;
  adSpaceRecommendation: string;
}

