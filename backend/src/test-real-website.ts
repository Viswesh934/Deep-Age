import { executeRealTestDrive } from './engine/agent-runner.js';
import { TestDriveRun } from '@deep-age/shared';

async function testRealWebsite() {
  const targetUrl = process.argv[2] || 'https://news.ycombinator.com';
  console.log(`🌐 TEST-DRIVING REAL EXTERNAL WEBSITE: ${targetUrl} ...\n`);

  const run: TestDriveRun = {
    id: `real-${Date.now()}`,
    url: targetUrl,
    task: 'Inspect page capabilities, find top stories, and detect WebMCP tools',
    mode: 'debug',
    status: 'pending',
    createdAt: Date.now(),
    summary: {
      taskStatus: 'incomplete',
      frictionCount: 0,
      runtimeErrorCount: 0,
      webmcpToolCount: 0,
      networkRequestCount: 0,
    },
    plainExplanation: {
      exploreSummary: '',
      whatHappened: '',
      whyItHappened: '',
    },
    tools: [],
    toolCalls: [],
    network: [],
    domInteractions: [],
    errors: [],
    frictions: [],
    securitySignals: [],
    timeline: [],
  };

  const result = await executeRealTestDrive(run);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎯 TARGET URL:            ${result.url}`);
  console.log(`📸 REAL SCREENSHOT:       ${Boolean(result.screenshot)} (${result.screenshot?.length || 0} bytes base64)`);
  console.log(`🌐 REAL NETWORK PACKETS:  ${result.network.length} intercepted`);
  console.log(`🖱️ REAL DOM CONTROLS:     ${result.domInteractions.length} interactive elements`);
  console.log(`⚡ WEBMCP TOOLS FOUND:    ${result.tools.length} discovered`);
  console.log(`⚠️ AGENT FRICTION POINTS: ${result.frictions.length} diagnosed`);
  console.log(`🛡️ PRIVACY & THREAT SCORE:${result.summary.privacyScore} / 100`);
  console.log(`⏱️ TIMELINE PHASES:       ${result.timeline.map(t => t.label).join(' -> ')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (result.domInteractions.length > 0) {
    console.log('Sample DOM Controls on live website:');
    result.domInteractions.slice(0, 5).forEach((d) => {
      console.log(`  - <${d.elementTag}> ${d.selector}: "${d.text}"`);
    });
  }

  if (result.network.length > 0) {
    console.log('\nSample Real Network Calls on live website:');
    result.network.slice(0, 5).forEach((n) => {
      console.log(`  - ${n.method} ${n.url.slice(0, 60)} (${n.status}, ${n.durationMs}ms, ${n.origin})`);
    });
  }

  if (result.frictions.length > 0) {
    console.log('\nDiagnosed Friction on live website:');
    result.frictions.forEach((f) => {
      console.log(`  - [${f.severity.toUpperCase()}] ${f.title}`);
      console.log(`    Fix: ${f.recommendation}`);
    });
  }
}

testRealWebsite().catch(console.error);
