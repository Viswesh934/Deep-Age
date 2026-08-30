import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or local dir
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const port = Number(process.env.BACKEND_PORT || process.env.PORT) || 3001;
const codespaceName = process.env.CODESPACE_NAME;
const defaultPublicUrl = codespaceName
  ? `https://${codespaceName}-${port}.app.github.dev`
  : `http://127.0.0.1:${port}`;

export const config = {
  port,
  nodeEnv: process.env.NODE_ENV || 'development',
  serverUrl: process.env.PUBLIC_URL || process.env.SERVER_URL || process.env.DEEP_AGE_URL || defaultPublicUrl,
  demoUrl: process.env.VITE_DEMO_URL || `http://127.0.0.1:${process.env.DEMO_PORT || 3002}`,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  browser: {
    headless: process.env.HEADLESS_BROWSER !== 'false',
    timeoutMs: Number(process.env.BROWSER_TIMEOUT_MS) || 30000,
  },
};
