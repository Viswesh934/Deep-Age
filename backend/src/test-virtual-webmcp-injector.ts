import { app } from './app.js';
import { startDemoServer, setAddToCartCapability } from '../../demo/src/index.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

async function runVirtualInjectorVerification() {
  console.log('⚡ TESTING VIRTUAL WEBMCP LIVE IN-BROWSER INJECTION & OPENROUTER AI REASONING...\n');

  // Step 1: Start Demo Store in FRICTION STATE (missing add_to_cart)
  setAddToCartCapability(false);
  let demoServer: { close: () => void; port: number };
  try {
    demoServer = await startDemoServer(3002, '127.0.0.1');
  } catch {
    demoServer = await startDemoServer(0, '127.0.0.1');
  }

  const demoUrl = `http://127.0.0.1:${demoServer.port}`;

  try {
    // -------------------------------------------------------------
    // Test 1: Run against broken target site (Friction detected)
    // -------------------------------------------------------------
    console.log(`1️⃣ Running Test Drive against live store with missing add_to_cart (${demoUrl})...`);
    const createRes1 = await app.request('/api/test-drives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: demoUrl,
        task: 'Find a 16GB developer laptop under ₹80,000 and add it to my cart',
        mode: 'debug',
      }),
    });
    const { run: run1 } = await createRes1.json();

    const execRes1 = await app.request(`/api/test-drives/${run1.id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const { run: result1 } = await execRes1.json();

    console.log(`   - Task Status: ${result1.summary.taskStatus.toUpperCase()}`);
    console.log(`   - Discovered Tools: [${result1.tools.map((t: any) => t.name).join(', ')}]`);
    console.log(`   - Frictions Detected: ${result1.frictions.length}`);
    const fixCode = result1.frictions[0]?.codeSnippet;
    console.log(`   - Generated 1-Click Code Fix:\n${fixCode ? fixCode.slice(0, 120) + '...' : 'NONE'}\n`);

    if (result1.summary.taskStatus !== 'incomplete' || !fixCode) {
      throw new Error('Test 1 failed: Expected incomplete status with generated codeSnippet.');
    }

    // -------------------------------------------------------------
    // Test 2: In-Memory Virtual WebMCP Injection Test (Zero site code changed!)
    // -------------------------------------------------------------
    console.log('2️⃣ Testing VIRTUAL WEBMCP LIVE INJECTION (Target site code remains UNTOUCHED!)...');
    const createRes2 = await app.request('/api/test-drives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: demoUrl, // Still points to broken demoUrl!
        task: 'Find a 16GB developer laptop under ₹80,000 and add it to my cart',
        mode: 'debug',
        virtualToolCode: fixCode, // Inject the generated fix directly into Chromium memory!
        isVirtualRun: true,
      }),
    });
    const { run: run2 } = await createRes2.json();

    const execRes2 = await app.request(`/api/test-drives/${run2.id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const { run: result2 } = await execRes2.json();

    console.log('\n   📊 VIRTUAL INJECTION EXECUTION RESULTS:');
    console.log(`   - Is Virtual Run: ${result2.isVirtualRun}`);
    console.log(`   - Tools Discovered: [${result2.tools.map((t: any) => t.name).join(', ')}]`);
    console.log(`   - Real In-Page Tool Executions: ${result2.toolCalls.length}`);
    result2.toolCalls.forEach((call: any) => {
      console.log(`     * ${call.toolName}() -> ${JSON.stringify(call.output)} (${call.durationMs}ms)`);
    });
    console.log(`   - Task Outcome: ${result2.summary.taskStatus.toUpperCase()}`);
    console.log(`   - Frictions: ${result2.summary.frictionCount}`);

    const hasVirtualStep = result2.timeline.some((t: any) => t.label === 'VIRTUAL_WEBMCP_INJECTED');
    console.log(`   - Virtual Injection Timeline Event: ${hasVirtualStep ? 'VERIFIED ✅' : 'FAILED ❌'}`);

    if (result2.summary.taskStatus !== 'completed' || result2.summary.frictionCount !== 0 || !hasVirtualStep) {
      throw new Error('Test 2 failed: Expected virtual injection to produce 100% completed run with 0 friction.');
    }

    console.log('\n🎉 ALL VIRTUAL WEBMCP LIVE INJECTION & AI REASONING TESTS PASSED 100%!');
  } finally {
    demoServer.close();
  }
}

runVirtualInjectorVerification().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
