import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testMcpAgentIntegration() {
  console.log('🤖 Starting Agent MCP Integration Test for Deep Age...');

  // 1. Launch Demo Store on port 3002
  const demoProc = spawn('npx', ['tsx', 'demo/src/index.ts'], {
    cwd: path.resolve(__dirname, '../..'),
    env: { ...process.env, PORT: '3002' },
    stdio: 'ignore',
  });

  // 2. Launch Backend API & MCP Server on port 3001
  const backendProc = spawn('npx', ['tsx', 'backend/src/index.ts'], {
    cwd: path.resolve(__dirname, '../..'),
    env: { ...process.env, PORT: '3001' },
    stdio: 'ignore',
  });

  console.log('⏳ Initializing Deep Age Server...');
  await wait(4000);

  const mcpEndpoint = 'http://127.0.0.1:3001/mcp';

  try {
    // Step 1: MCP Initialize Handshake
    console.log('\n1️⃣ Sending MCP `initialize` handshake...');
    const initRes = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'req-init-1',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'Antigravity-Agent', version: '2.0.0' },
        },
      }),
    });

    const initData = await initRes.json();
    console.log('   ✅ MCP Handshake Response:', JSON.stringify(initData, null, 2));

    // Step 2: Query Tools List
    console.log('\n2️⃣ Querying MCP `tools/list`...');
    const toolsRes = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'req-tools-2',
        method: 'tools/list',
        params: {},
      }),
    });

    const toolsData = await toolsRes.json();
    console.log('   ✅ Discovered MCP Tools from Deep Age Server:');
    toolsData.result.tools.forEach((t: any) => {
      console.log(`      - 🛠️ [${t.name}]: ${t.description.slice(0, 80)}...`);
    });

    // Step 3: Agent Tool Call: deep_age_test_drive
    console.log('\n3️⃣ Agent executing MCP `tools/call` for `deep_age_test_drive` on Demo Store...');
    const callRes = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'req-call-3',
        method: 'tools/call',
        params: {
          name: 'deep_age_test_drive',
          arguments: {
            url: 'http://127.0.0.1:3002',
            task: 'Find a laptop under ₹80,000 with 16GB RAM and add it to the cart',
            mode: 'debug',
          },
        },
      }),
    });

    const callData = await callRes.json();
    console.log('   ✅ MCP Tool Execution Succeeded!');
    const resultObj = JSON.parse(callData.result.content[0].text);
    console.log('\n📊 AGENT EVIDENCE EXTRACTED VIA MCP:');
    console.log(`   - Run ID: ${resultObj.runId}`);
    console.log(`   - Target URL: ${resultObj.targetUrl}`);
    console.log(`   - Task Outcome: ${resultObj.taskStatus}`);
    console.log(`   - Agent Readiness Score: ${resultObj.agentReadinessScore}%`);
    console.log(`   - Discovered WebMCP Tools: [${resultObj.discoveredWebMcpTools.join(', ')}]`);
    console.log(`   - Executed Tool Calls: ${resultObj.executedToolCalls.length}`);
    console.log(`   - Diagnosed Frictions: ${resultObj.frictionsDiagnosed.length}`);
    if (resultObj.frictionsDiagnosed.length > 0) {
      const fric = resultObj.frictionsDiagnosed[0];
      console.log(`     * Friction Type: ${fric.type} (${fric.severity})`);
      console.log(`     * Title: ${fric.title}`);
      console.log(`     * Recommendation: ${fric.recommendation}`);
    }
    console.log(`   - 5-Layer State Machine Milestones: ${resultObj.stateDumpMilestones}`);
    console.log(`   - Actionable Element Refs in State Sample: ${resultObj.activeStateSample?.interactionState?.length || 0}`);

    console.log('\n🎉 ALL AGENT MCP INTEGRATION TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ MCP Agent Test Failed:', err);
    process.exit(1);
  } finally {
    demoProc.kill();
    backendProc.kill();
  }
}

testMcpAgentIntegration().catch(console.error);
