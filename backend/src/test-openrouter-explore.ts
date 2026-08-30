import { resolveUserIntent } from './engine/explore/intent-resolver.js';
import { buildSiteStateGraph } from './engine/explore/state-graph.js';
import { WebMCPTool } from '@deep-age/shared';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

async function runOpenRouterLiveTest() {
  console.log('🤖 Testing Live OpenRouter Integration with WebMCP Explore Graph...\n');

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set in environment!');
  }

  console.log(`🔑 OpenRouter Key loaded: ${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}`);

  const demoTools: WebMCPTool[] = [
    {
      name: 'search_products',
      description: 'Search catalog by keyword, ram, maxPrice, and category.',
      inputSchema: { query: 'string', maxPrice: 'number', ram: 'number' },
      safetyTier: 'public_read',
      category: 'search'
    },
    {
      name: 'get_product_details',
      description: 'Get specifications, warranty, reviews, and stock availability.',
      inputSchema: { productId: 'string' },
      safetyTier: 'public_read',
      category: 'commerce'
    },
    {
      name: 'add_to_cart',
      description: 'Add a specific product ID and quantity to the user shopping cart.',
      inputSchema: { productId: 'string', quantity: 'number' },
      safetyTier: 'reversible_write',
      category: 'commerce'
    },
    {
      name: 'complete_checkout',
      description: 'Authorize payment and finalize order with delivery address.',
      inputSchema: { paymentMethod: 'string', addressId: 'string' },
      safetyTier: 'critical_destructive',
      category: 'commerce',
      requiresConfirmation: true
    }
  ];

  const siteUrl = 'http://127.0.0.1:3002';
  const stateGraph = buildSiteStateGraph(siteUrl, demoTools);

  const testGoal = 'Find a 16GB developer laptop under ₹80,000 and add it to my cart';
  console.log(`🎯 Test User Goal: "${testGoal}"\n`);

  console.log('📡 Sending one-shot reasoning prompt to OpenRouter...');
  const result = await resolveUserIntent(
    {
      siteUrl,
      userGoal: testGoal,
      openRouterApiKey: apiKey
    },
    demoTools,
    stateGraph
  );

  console.log('\n================ OPENROUTER REASONING RESPONSE ================');
  console.log(`Feasible: ${result.feasible}`);
  console.log(`Current State: ${result.currentState} ➡️ Target State: ${result.targetState}`);
  console.log(`Estimated Risk Tier: ${result.estimatedRiskTier.toUpperCase()}`);
  console.log(`Reasoning: ${result.reasoning}\n`);

  console.log('📋 Generated Action Plan:');
  result.plan.forEach((step) => {
    console.log(`  [Step ${step.step}] ${step.toolName}()`);
    console.log(`     - Parameters: ${JSON.stringify(step.parameters)}`);
    console.log(`     - Safety Tier: ${step.safetyTier}`);
    console.log(`     - Requires Confirmation: ${step.requiresConfirmation}`);
    console.log(`     - Explanation: ${step.explanation}`);
  });
  console.log('===============================================================\n');

  if (result.plan.length === 0) {
    throw new Error('OpenRouter did not generate action steps.');
  }

  console.log('🎉 LIVE OPENROUTER WEBMCP EXPLORE TEST COMPLETED SUCCESSFULLY!');
}

runOpenRouterLiveTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
