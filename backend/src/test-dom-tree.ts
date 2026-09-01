import { app } from './app.js';

async function testDom() {
  const createRes = await app.request('/api/test-drives', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'http://127.0.0.1:3002',
      task: 'Explore store',
      mode: 'explore'
    })
  });
  const { run } = await createRes.json();
  const execRes = await app.request(`/api/test-drives/${run.id}/execute`, { method: 'POST' });
  const { run: finished } = await execRes.json();

  console.log('Finished run domTree:');
  console.log('Tag:', finished.domTree?.tag);
  console.log('Children count on root:', finished.domTree?.children?.length);
  function printTree(node: any, depth = 0) {
    console.log('  '.repeat(depth) + `<${node.tag}> [${node.selector}] (children: ${node.children?.length || 0}) ${node.text ? `"${node.text.slice(0, 30)}"` : ''}`);
    if (node.children) {
      node.children.slice(0, 4).forEach((c: any) => printTree(c, depth + 1));
    }
  }
  printTree(finished.domTree);
}

testDom().catch(console.error);
