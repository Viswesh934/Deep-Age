import { handle } from '@hono/node-server/vercel';
import { demoApp } from '../src/app.js';

export const config = {
  runtime: 'nodejs',
};

export default handle(demoApp);
