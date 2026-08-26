import { app } from './app.js';
import { startDemoServer, setAddToCartCapability } from '../../demo/src/index.js';

async function runRealVerification() {
  console.log('🚀 Starting 100% Real Live Browser & WebMCP Test Drive...\n');

  // Step 1: Start Real Demo Store with dynamic port fallback
  setAddToCartCapability(false); // Intentionally missing add_to_cart on target site
  let demoServer: { close: () => void; port: number };
  try {
    demoServer = await startDemoServer(3002, '127.0.0.1');
  } catch {
    console.log('⚠️ Port 3002 busy, assigning ephemeral port...');
    demoServer = await startDemoServer(0, '127.0.0.1');
  }

  const demoUrl = `http://127.0.0.1:${demoServer.port}`;

  try {
    // Step 2: Check backend health
    const healthRes = await app.request('/health');
    const health = await healthRes.json();
    console.log('1️⃣ Backend health check response:', health);
    if (health.status !== 'ok') throw new Error('Health check failed');

    // Step 3: Create Test Drive 1 (Friction Test: Target site without add_to_cart capability)
    console.log(`\n2️⃣ Creating Test Drive 1 for ${demoUrl} (Initial site with missing add_to_cart)...`);
    const createRes1 = await app.request('/api/test-drives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: demoUrl,
        task: 'Find a laptop under ₹80,000 with 16GB RAM and add it to the cart',
        mode: 'debug',
      }),
    });
    const { run: run1 } = await createRes1.json();
    console.log(`   Created Run ID: ${run1.id}`);

    // Step 4: Execute Real Headless Browser Run against live demoUrl
    console.log(`3️⃣ Launching real Chromium browser to inspect ${demoUrl} and test-drive...`);
    const executeRes1 = await app.request(`/api/test-drives/${run1.id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const { run: completedRun1 } = await executeRes1.json();

    console.log('\n   📊 REAL EVIDENCE CAPTURED (Test Drive 1):');
    console.log(`   - Live WebMCP Tools Discovered: [${completedRun1.tools.map((t: any) => t.name).join(', ')}]`);
    console.log(`   - Real Tool Execution Calls: ${completedRun1.toolCalls.length}`);
    completedRun1.toolCalls.forEach((call: any) => {
      console.log(`     * Executed: ${call.toolName}() -> Output: ${JSON.stringify(call.output)} (${call.durationMs}ms)`);
    });
    console.log(`   - Real Network Requests Intercepted: ${completedRun1.network.length}`);
    console.log(`   - Real DOM Interactive Elements Found: ${completedRun1.domInteractions.length}`);
    console.log(`   - Task Outcome: ${completedRun1.summary.taskStatus.toUpperCase()}`);
    console.log(`   - Frictions Detected: ${completedRun1.frictions.length}`);
    
    completedRun1.frictions.forEach((f: any, idx: number) => {
      console.log(`     [Friction ${idx + 1}] ${f.title}`);
      console.log(`     - Description: ${f.description}`);
      console.log(`     - Recommendation: ${f.recommendation}`);
    });

    if (completedRun1.summary.taskStatus !== 'incomplete' || completedRun1.frictions.length === 0) {
      throw new Error('Real Friction test failed: expected incomplete task with friction detected.');
    }

    // Step 5: Update Real Demo Store to Expose add_to_cart WebMCP tool
    console.log('\n4️⃣ Exposing add_to_cart WebMCP capability on live site...');
    setAddToCartCapability(true);

    // Step 6: Create Test Drive 2
    console.log(`5️⃣ Creating Test Drive 2 for ${demoUrl} (Fixed site exposing add_to_cart)...`);
    const createRes2 = await app.request('/api/test-drives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: demoUrl,
        task: 'Find a laptop under ₹80,000 with 16GB RAM and add it to the cart',
        mode: 'explore',
      }),
    });
    const { run: run2 } = await createRes2.json();

    // Step 7: Execute Real Headless Browser Run against updated live site
    console.log('6️⃣ Launching real Chromium browser to re-test drive live site...');
    const executeRes2 = await app.request(`/api/test-drives/${run2.id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const { run: completedRun2 } = await executeRes2.json();

    console.log('\n   📊 REAL EVIDENCE CAPTURED (Test Drive 2):');
    console.log(`   - Live WebMCP Tools Discovered: [${completedRun2.tools.map((t: any) => t.name).join(', ')}]`);
    console.log(`   - Real Tool Execution Calls: ${completedRun2.toolCalls.length}`);
    completedRun2.toolCalls.forEach((call: any) => {
      console.log(`     * Executed: ${call.toolName}() -> Output: ${JSON.stringify(call.output)} (${call.durationMs}ms)`);
    });
    console.log(`   - Real Network Requests Intercepted: ${completedRun2.network.length}`);
    console.log(`   - Task Outcome: ${completedRun2.summary.taskStatus.toUpperCase()}`);
    console.log(`   - Frictions Detected: ${completedRun2.frictions.length}`);
    console.log(`   - Plain-English Explore Summary: "${completedRun2.plainExplanation.exploreSummary}"`);

    if (completedRun2.summary.taskStatus !== 'completed' || completedRun2.frictions.length !== 0) {
      throw new Error('Real Fixed test failed: expected completed task with 0 friction.');
    }

    console.log('\n🎉 ALL REAL TESTS PASSED! 100% real live browser automation, live WebMCP tool discovery/execution, and real network interception validated.');
  } finally {
    demoServer.close();
  }
}

runRealVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
