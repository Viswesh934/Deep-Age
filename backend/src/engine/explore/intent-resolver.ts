import {
  IntentResolutionRequest,
  IntentResolutionResult,
  ActionPlanStep,
  WebMCPTool,
  StateTransitionGraph
} from '../../types/index.js';

import { config } from '../../config/env.js';

export function extractRequestedQuantity(prompt: string): number {
  if (!prompt) return 1;
  const pLower = prompt.toLowerCase();

  // 1. Number words
  if (/\b(two|couple)\b/.test(pLower)) return 2;
  if (/\bthree\b/.test(pLower)) return 3;
  if (/\bfour\b/.test(pLower)) return 4;
  if (/\bfive\b/.test(pLower)) return 5;
  if (/\bsix\b/.test(pLower)) return 6;
  if (/\bseven\b/.test(pLower)) return 7;
  if (/\beight\b/.test(pLower)) return 8;
  if (/\bnine\b/.test(pLower)) return 9;
  if (/\bten\b/.test(pLower)) return 10;

  // 2. Explicit digits (e.g. "2 coffees", "buy 2", "2 bags", "qty: 3")
  const digitMatch =
    pLower.match(/\b(\d+)\s*(?:coffees?|bags?|items?|units?|laptops?|products?|cups?|pack|packs|x)?\b/) ||
    pLower.match(/\b(?:buy|add|order|get|purchase|cart|quantity|qty)\s*[:=]?\s*(\d+)\b/);

  if (digitMatch && digitMatch[1]) {
    const parsed = parseInt(digitMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 99) {
      return parsed;
    }
  }

  return 1;
}

export async function resolveUserIntent(
  request: IntentResolutionRequest,
  tools: WebMCPTool[],
  stateGraph: StateTransitionGraph
): Promise<IntentResolutionResult> {
  const goalLower = request.userGoal.toLowerCase();
  const apiKey = request.openRouterApiKey || config.openRouterApiKey;

  // 1. OpenRouter AI Dynamic LLM Intent Planner (Universal for ANY Web Application & Domain)
  if (apiKey) {
    try {
      console.log('🤖 Querying OpenRouter AI planner for universal WebMCP intent resolution...');
      const openRouterResult = await queryOpenRouterPlanner({ ...request, openRouterApiKey: apiKey }, tools, stateGraph);
      if (openRouterResult && openRouterResult.plan && openRouterResult.plan.length > 0) {
        console.log(`✅ OpenRouter synthesized ${openRouterResult.plan.length}-step action plan for: "${request.userGoal}"`);
        return openRouterResult;
      }
    } catch (err) {
      console.warn('⚠️ OpenRouter planner call failed, falling back to schema-driven planner:', err);
    }
  }

  // 2. Schema-Driven Universal Fallback Planner (Zero Hardcoded Domain Rules)
  const plan: ActionPlanStep[] = [];
  let estimatedRisk: 'public_read' | 'context_read' | 'reversible_write' | 'critical_destructive' = 'public_read';
  const missingPrerequisites: string[] = [];

  const goalTokens = goalLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 1);

  // Score every discovered WebMCP tool by semantic relevance to the user's goal
  const scoredTools = tools.map((tool) => {
    let score = 0;
    const tName = tool.name.toLowerCase();
    const tDesc = (tool.description || '').toLowerCase();
    const nameWords = tName.split(/[_\-]/);

    for (const token of goalTokens) {
      if (tName.includes(token)) score += 5;
      if (nameWords.includes(token)) score += 8;
      if (tDesc.includes(token)) score += 2;
    }

    const schemaProps = Object.keys((tool.inputSchema as any)?.properties || {});
    for (const prop of schemaProps) {
      if (goalTokens.includes(prop.toLowerCase())) score += 3;
    }

    return { tool, score };
  });

  scoredTools.sort((a, b) => b.score - a.score);

  // Select matching tools (or all tools if site exposes 1-3 focused tools)
  const relevantTools = scoredTools.filter((s) => s.score > 0).map((s) => s.tool);
  const candidateTools = relevantTools.length > 0 ? relevantTools : (tools.length <= 3 ? tools : []);

  let stepNum = 1;

  for (const tool of candidateTools) {
    const toolParams: Record<string, any> = {};
    const schemaProps = (tool.inputSchema as any)?.properties || {};
    const requiredProps = (tool.inputSchema as any)?.required || [];

    for (const [propName, propDef] of Object.entries(schemaProps)) {
      const pDef = propDef as any;
      const pNameLower = propName.toLowerCase();

      if (pDef?.enum && Array.isArray(pDef.enum) && pDef.enum.length > 0) {
        const matchingEnum = pDef.enum.find((e: string) => goalLower.includes(String(e).toLowerCase()));
        toolParams[propName] = matchingEnum || pDef.enum[0];
      } else if (pNameLower.includes('query') || pNameLower.includes('search') || pNameLower.includes('prompt') || pNameLower.includes('topic') || pNameLower.includes('text') || pNameLower === 'q') {
        toolParams[propName] = request.userGoal;
      } else if (pNameLower.includes('quantity') || pNameLower.includes('count') || pNameLower.includes('amount') || pNameLower.includes('num')) {
        toolParams[propName] = extractRequestedQuantity(request.userGoal);
      } else if (pNameLower.includes('id') || pNameLower.includes('ref') || pNameLower.includes('target') || pNameLower.includes('model')) {
        toolParams[propName] = stepNum > 1 ? '$step1.results[0].id' : (pDef.default || 'default-item');
      } else if (pDef?.type === 'boolean') {
        toolParams[propName] = !(goalLower.includes('no ') || goalLower.includes('without') || goalLower.includes('disable'));
      } else if (pDef?.type === 'number') {
        toolParams[propName] = pDef.default ?? 1;
      } else {
        toolParams[propName] = pDef?.default || request.userGoal;
      }
    }

    const isDestructive = tool.safetyTier === 'critical_destructive' || tool.name.includes('delete') || tool.name.includes('drop') || tool.name.includes('terminate');
    if (isDestructive) {
      estimatedRisk = 'critical_destructive';
    } else if (tool.safetyTier === 'reversible_write' || tool.name.includes('add') || tool.name.includes('create') || tool.name.includes('update') || tool.name.includes('set')) {
      if (estimatedRisk !== 'critical_destructive') estimatedRisk = 'reversible_write';
    }

    plan.push({
      step: stepNum++,
      toolName: tool.name,
      parameters: toolParams,
      safetyTier: tool.safetyTier || (isDestructive ? 'critical_destructive' : 'public_read'),
      explanation: `Execute ${tool.name} (${tool.description || 'WebMCP tool action'}) to satisfy: "${request.userGoal}".`,
      requiresConfirmation: isDestructive
    });
  }

  if (plan.length === 0) {
    missingPrerequisites.push(`No matching WebMCP tools registered on site for goal: "${request.userGoal}".`);
  }

  const isFeasible = plan.length > 0;

  return {
    feasible: isFeasible,
    intent: request.userGoal,
    currentState: request.currentState || 'ANONYMOUS_BROWSING',
    targetState: isFeasible ? 'ACTION_COMPLETED' : 'BLOCKED',
    plan,
    reasoning: isFeasible
      ? `Generated ${plan.length}-step schema-driven WebMCP execution path.`
      : `Cannot satisfy intent: ${missingPrerequisites.join(', ')}`,
    estimatedRiskTier: estimatedRisk,
    missingPrerequisites: missingPrerequisites.length > 0 ? missingPrerequisites : undefined
  };
}

async function queryOpenRouterPlanner(
  request: IntentResolutionRequest,
  tools: WebMCPTool[],
  stateGraph: StateTransitionGraph
): Promise<IntentResolutionResult | null> {
  const prompt = `You are a Universal WebMCP Autonomous Intent Planning Engine.
You plan actions for ANY web application archetype: 3D modeling tools (Three.js/Spline/Blender), documentation & knowledge portals, developer consoles, creative canvas tools, audio/video editors, productivity suites, and commerce.

Site URL: ${request.siteUrl}
Current State: ${request.currentState || 'ANONYMOUS_BROWSING'}
Available WebMCP Tools & Schemas:
${JSON.stringify(tools, null, 2)}

State Graph:
${JSON.stringify(stateGraph.states, null, 2)}

User Goal: "${request.userGoal}"

Instructions:
1. Analyze the user's goal and map it to the optimal sequence of available WebMCP tools.
2. Carefully inspect each tool's JSON Schema (property types, enums, required fields) and construct valid, exact input parameters matching the user's intent.
3. Extract precise parameters from the prompt (e.g. 3D coordinates, query strings, quantities, angles, file formats, options).
4. Assign each step a safetyTier ("public_read", "context_read", "reversible_write", or "critical_destructive").
5. Set requiresConfirmation=true ONLY if the action has financial or irreversible destructive impact.

Respond ONLY with a JSON object matching this schema:
{
  "feasible": boolean,
  "intent": string,
  "currentState": string,
  "targetState": string,
  "plan": [
    {
      "step": number,
      "toolName": string,
      "parameters": object,
      "safetyTier": "public_read" | "context_read" | "reversible_write" | "critical_destructive",
      "explanation": string,
      "requiresConfirmation": boolean
    }
  ],
  "reasoning": string,
  "estimatedRiskTier": "public_read" | "context_read" | "reversible_write" | "critical_destructive",
  "missingPrerequisites": string[]
}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${request.openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://deep-age.dev',
      'X-Title': 'Deep Age WebMCP Agent'
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.warn(`OpenRouter HTTP ${response.status}: ${errorBody}`);
    return null;
  }

  const data: any = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) return null;

  try {
    const firstBrace = rawContent.indexOf('{');
    const lastBrace = rawContent.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      return null;
    }
    let jsonStr = rawContent.slice(firstBrace, lastBrace + 1);
    // Strip single-line and multi-line comments from LLM json response
    jsonStr = jsonStr.replace(/\/\/.*$/gm, '');
    jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(jsonStr) as IntentResolutionResult;
  } catch (parseErr) {
    console.warn('Failed to parse OpenRouter JSON:', parseErr, rawContent);
    return null;
  }
}
