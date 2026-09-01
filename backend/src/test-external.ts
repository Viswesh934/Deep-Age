import { app } from './app.js';

async function testExternal() {
  console.log('🚀 Testing external site test drive against https://example.com...\n');
  const createRes = await app.request('/api/test-drives', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://example.com',
      task: 'Explore documentation and read main overview',
      mode: 'explore'
    })
  });
  const { run } = await createRes.json();
  console.log('1️⃣ Run created ID:', run.id);

  console.log('2️⃣ Executing live Chromium test-drive...');
  const execRes = await app.request(`/api/test-drives/${run.id}/execute`, {
    method: 'POST'
  });
  const { run: finished } = await execRes.json();
  
  console.log('\n📊 REAL EXTERNAL TEST RESULTS:');
  console.log('• Task Outcome:', finished.summary.taskStatus);
  console.log('• Archetype Detected:', finished.extractedData?.archetype);
  console.log('• Dynamic Routes Discovered:', finished.extractedData?.routes?.map((r: any) => `${r.label} (${r.path})`).join(', '));
  console.log('• Dynamic Entities Discovered:', finished.extractedData?.entities?.length);
  console.log('• State Graph Generated States:', Object.keys(finished.stateGraph?.states || {}));
  console.log('• SEO Health Score:', finished.seoAudit?.score, '/ 100');
  console.log('• Readability Grade Level:', finished.readabilityAudit?.readingGradeLevel);
  console.log('• Human Readable Timeline Log:');
  finished.timeline.forEach((t: any) => {
    console.log(`  [${t.phase.toUpperCase()}] ${t.label} -> ${t.detail}`);
  });
}

testExternal().catch(console.error);
