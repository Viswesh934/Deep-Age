import {
  IntentResolutionRequest,
  IntentResolutionResult,
  ActionPlanStep,
  WebMCPTool,
  StateTransitionGraph
} from '@deep-age/shared';

export async function resolveUserIntent(
  request: IntentResolutionRequest,
  tools: WebMCPTool[],
  stateGraph: StateTransitionGraph
): Promise<IntentResolutionResult> {
  const goalLower = request.userGoal.toLowerCase();

  // If user provided an OpenRouter key, try one-shot planning via OpenRouter API
  if (request.openRouterApiKey) {
    try {
      console.log('🤖 Querying OpenRouter for one-shot WebMCP intent resolution...');
      const openRouterResult = await queryOpenRouterPlanner(request, tools, stateGraph);
      if (openRouterResult) {
        console.log('✅ OpenRouter returned valid action plan:', openRouterResult.intent);
        return openRouterResult;
      }
    } catch (err) {
      console.warn('⚠️ OpenRouter planner call failed, falling back to local resolver:', err);
    }
  }

  // Local Deterministic Graph & Intent Resolver Engine
  const plan: ActionPlanStep[] = [];
  let estimatedRisk: 'public_read' | 'context_read' | 'reversible_write' | 'critical_destructive' = 'public_read';
  const missingPrerequisites: string[] = [];

  const wantsSearch = goalLower.includes('find') || goalLower.includes('search') || goalLower.includes('laptop') || goalLower.includes('product');
  const wantsCart = goalLower.includes('cart') || goalLower.includes('add') || goalLower.includes('buy');
  const wantsCheckout = goalLower.includes('checkout') || goalLower.includes('pay') || goalLower.includes('order');
  const wantsReturn = goalLower.includes('return') || goalLower.includes('refund');

  const searchTool = tools.find((t) => t.name.includes('search') || t.name.includes('filter'));
  const cartTool = tools.find((t) => t.name.includes('cart') || t.name.includes('add'));
  const detailsTool = tools.find((t) => t.name.includes('detail') || t.name.includes('get_'));
  const checkoutTool = tools.find((t) => t.name.includes('checkout') || t.name.includes('payment'));

  let stepNum = 1;

  if (wantsSearch) {
    if (searchTool) {
      plan.push({
        step: stepNum++,
        toolName: searchTool.name,
        parameters: { query: request.userGoal, maxPrice: 80000, ram: 16 },
        safetyTier: 'public_read',
        explanation: `Query site catalog using ${searchTool.name} to identify matching entities.`,
        requiresConfirmation: false
      });
    } else {
      missingPrerequisites.push('No search or filter tool exposed on site.');
    }
  }

  if (detailsTool && wantsSearch) {
    plan.push({
      step: stepNum++,
      toolName: detailsTool.name,
      parameters: { productId: '$step1.results[0].id' },
      safetyTier: 'public_read',
      explanation: 'Fetch full item specifications and stock availability.',
      requiresConfirmation: false
    });
  }

  if (wantsCart) {
    if (cartTool) {
      estimatedRisk = 'reversible_write';
      plan.push({
        step: stepNum++,
        toolName: cartTool.name,
        parameters: { productId: '$step1.results[0].id', quantity: 1 },
        safetyTier: 'reversible_write',
        explanation: 'Add matching item to cart session with 10-second rollback window.',
        requiresConfirmation: false
      });
    } else {
      missingPrerequisites.push('Missing add_to_cart capability on site.');
    }
  }

  if (wantsCheckout) {
    estimatedRisk = 'critical_destructive';
    if (checkoutTool) {
      plan.push({
        step: stepNum++,
        toolName: checkoutTool.name,
        parameters: { paymentMethod: 'saved_card' },
        safetyTier: 'critical_destructive',
        explanation: 'Authorize payment. Requires explicit biometric passkey confirmation.',
        requiresConfirmation: true
      });
    } else {
      missingPrerequisites.push('Missing payment/checkout WebMCP tool.');
    }
  }

  if (wantsReturn) {
    plan.push({
      step: stepNum++,
      toolName: 'fetchOrderHistory',
      parameters: { status: 'delivered' },
      safetyTier: 'context_read',
      explanation: 'Retrieve past delivered orders to find eligible return items.',
      requiresConfirmation: false
    });
  }

  const isFeasible = missingPrerequisites.length === 0 && plan.length > 0;

  return {
    feasible: isFeasible,
    intent: request.userGoal,
    currentState: request.currentState || 'ANONYMOUS_BROWSING',
    targetState: wantsCheckout ? 'ORDER_COMPLETED' : wantsCart ? 'CART_ACTIVE' : 'PRODUCT_DETAILS',
    plan,
    reasoning: isFeasible
      ? `Generated ${plan.length}-step execution path across site capability graph.`
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
  const prompt = `You are a WebMCP Intent Planning Engine.
Site: ${request.siteUrl}
Current State: ${request.currentState || 'ANONYMOUS_BROWSING'}
Available WebMCP Tools: ${JSON.stringify(tools)}
State Graph: ${JSON.stringify(stateGraph.states)}
User Goal: "${request.userGoal}"

Analyze the state transition graph and available tools to create an optimal, secure multi-step action plan for an autonomous web agent.
Assign each step a safetyTier ("public_read", "context_read", "reversible_write", or "critical_destructive").
Set requiresConfirmation=true if the action has financial or destructive impact (Tier 3).

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
