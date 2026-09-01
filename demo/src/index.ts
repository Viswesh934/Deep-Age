import { serve } from '@hono/node-server';
import { demoApp } from './app.js';
import { config } from './config/env.js';
import { fileURLToPath } from 'url';

export { demoApp } from './app.js';
export { setAddToCartCapability, getAddToCartCapability } from './data/products.js';
export default demoApp;

export function startDemoServer(port = config.port, hostname = '127.0.0.1'): Promise<{ close: () => void; port: number }> {
  return new Promise((resolve, reject) => {
    try {
      const server = serve({ fetch: demoApp.fetch, port, hostname }, (info) => {
        console.log(`🛒 Demo Store running at http://${hostname}:${info.port}`);
        resolve({
          close: () => server.close(),
          port: info.port,
        });
      });
      server.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Start standalone only if this file is the direct entrypoint
const isDirectEntry = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectEntry) {
  console.log(`🚀 Starting ElectroVault Demo Store on port ${config.port}...`);
  startDemoServer(config.port, '0.0.0.0');
}
