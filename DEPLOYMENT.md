# Deep Age — Production Deployment Guide

This document provides a comprehensive, step-by-step guide for deploying the **Deep Age** monorepo to production:
- **Backend & MCP Server**: [Cloudflare Workers](https://workers.cloudflare.com/) (Hono + Cloudflare Browser Rendering / Puppeteer)
- **Frontend Workbench**: [Vercel](https://vercel.com/) (Vite + React SPA)
- **Reference Demo Store**: [Vercel](https://vercel.com/) (Hono Serverless API & Storefront)

---

## 🗺️ Deployment Topology

```
                                  ┌───────────────────────────────┐
                                  │      User / Coding Agent      │
                                  │ (Browser, Cursor, Claude MCP) │
                                  └───────────────┬───────────────┘
                                                  │
                  ┌───────────────────────────────┼──────────────────────────────┐
                  ▼                               ▼                              ▼
     ┌────────────────────────┐      ┌────────────────────────┐     ┌────────────────────────┐
     │   Frontend Workbench   │      │    Backend API & MCP   │     │    Demo Storefront     │
     │        (Vercel)        │      │  (Cloudflare Workers)  │     │        (Vercel)        │
     │ https://deep-age.vercel│      │ https://deep-age.worker│     │ https://deep-age-demo. │
     │          .app          │      │          .dev          │     │       vercel.app       │
     └────────────┬───────────┘      └────────────┬───────────┘     └────────────┬───────────┘
                  │                               │                              │
                  │       HTTP / REST API         │      Cloudflare Browser      │
                  └──────────────────────────────►│      Rendering Binding       │
                                                  │ ────────────────────────────►│
                                                  │      (Evaluates WebMCP)      │
                                                  └──────────────────────────────┘
```

---

## 📋 Pre-Deployment Checklist

Before deploying, verify that the monorepo builds and tests pass cleanly:

```bash
# 1. Install all dependencies across workspaces
npm install

# 2. Build all packages (shared, backend, frontend, demo)
npm run build

# 3. Execute the automated verification test suite
npm test
```

---

## 🚀 Phase 1: Deploy Reference Demo Store (Vercel)

The demo store provides the reference e-commerce target with registered WebMCP tools (`.well-known/webmcp.json`).

### Step 1.1: Import Project in Vercel
1. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Select your `Deep-Age` repository.
3. In **Project Settings**:
   * **Root Directory**: `demo`
   * **Framework Preset**: `Other`
   * **Build Command**: `npm run build`
   * **Output Directory**: `.`
4. Click **Deploy**.

### Step 1.2: Verify Demo Deployment
Once deployed, verify the WebMCP manifest endpoint:
```bash
curl -s https://<your-demo-subdomain>.vercel.app/.well-known/webmcp.json
```
*Expected output*: JSON object containing `schema_version`, `capabilities`, and list of 8 reference tools.

> 📝 **Note**: Save your deployed Demo Store URL (e.g., `https://deep-age-demo.vercel.app`). You will need it for the Backend and Frontend configurations.

---

## ⚡ Phase 2: Deploy Backend & MCP Server (Cloudflare Workers)

The backend runs on Cloudflare Workers using the Hono framework and leverages Cloudflare's native **Browser Rendering** binding to execute browser agent sessions.

### Step 2.1: Enable Cloudflare Browser Rendering
1. In your [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages** > **Browser Rendering**.
2. Click **Enable Browser Rendering** for your account.

### Step 2.2: Configure `wrangler.toml`
Ensure `backend/wrangler.toml` is configured:

```toml
name = "deep-age-backend"
main = "src/index.ts"
compatibility_date = "2024-04-05"
compatibility_flags = ["nodejs_compat"]

# Cloudflare Browser Rendering Binding
[browser]
binding = "MYBROWSER"

# Environment Variables
[vars]
NODE_ENV = "production"
PORT = "8787"
DEMO_URL = "https://<your-demo-subdomain>.vercel.app"
```

### Step 2.3: Set Cloudflare Secrets
Store required API keys securely in Cloudflare:

```bash
cd backend

# Login to Cloudflare Wrangler
npx wrangler login

# Set LLM API Key Secret
npx wrangler secret put OPENROUTER_API_KEY
# Enter your API key when prompted
```

### Step 2.4: Deploy to Cloudflare Workers
```bash
# Run Wrangler deploy from the backend workspace
npm run deploy --workspace=@deep-age/backend
# Or directly inside backend/
cd backend && npx wrangler deploy
```

### Step 2.5: Verify Backend & MCP Server
```bash
# 1. Health Check
curl -s https://deep-age-backend.<your-subdomain>.workers.dev/health

# 2. MCP Server Protocol Handshake
curl -s -X POST https://deep-age-backend.<your-subdomain>.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'
```

> 📝 **Note**: Save your deployed Worker URL (e.g., `https://deep-age-backend.<your-subdomain>.workers.dev`).

---

## 💻 Phase 3: Deploy Frontend Workbench (Vercel)

The frontend is a Vite + React application providing the Developer Workbench, Browser State Scrubber, and MCP connection settings.

### Step 3.1: Import Frontend Project in Vercel
1. In Vercel, click **Add New Project** and select `Deep-Age`.
2. Configure **Project Settings**:
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`

### Step 3.2: Configure Environment Variables in Vercel
Add the following Environment Variables in the Vercel Dashboard (**Project Settings** > **Environment Variables**):

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_BACKEND_URL` | Deployed Cloudflare Worker URL | `https://deep-age-backend.<your-subdomain>.workers.dev` |
| `VITE_DEMO_URL` | Deployed Demo Storefront URL | `https://deep-age-demo.vercel.app` |

### Step 3.3: Verify SPA Routing
The repository includes [`frontend/vercel.json`](file:///workspaces/Deep-Age/frontend/vercel.json) to handle client-side routing rewrites:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 3.4: Deploy Frontend
Click **Deploy** in Vercel.

---

## 🔒 Environment Variables Reference Matrix

| Scope | Variable | Required | Default / Description |
| :--- | :--- | :---: | :--- |
| **Backend** | `NODE_ENV` | Yes | `production` |
| **Backend** | `PORT` | No | `8787` (Cloudflare) / `3001` (Local) |
| **Backend** | `DEMO_URL` | Yes | Target default URL (e.g., `https://deep-age-demo.vercel.app`) |
| **Backend** | `OPENROUTER_API_KEY` | Yes | Secret for Autonomous Agent Intent Resolution |
| **Backend** | `BROWSER_WS_ENDPOINT`| No | Remote WebSocket browser fallback (if not using `MYBROWSER`) |
| **Frontend**| `VITE_BACKEND_URL` | Yes | Backend Worker API URL |
| **Frontend**| `VITE_DEMO_URL` | Yes | Demo storefront URL |
| **Demo**    | `PORT` | No | `3002` |
| **Demo**    | `NODE_ENV` | Yes | `production` |

---

## 🧪 Post-Deployment Verification Checklist

Execute these checks after all three components are deployed:

- [ ] **Backend Health**: `GET https://<worker-domain>/health` returns `{"status":"ok"}`.
- [ ] **MCP Discovery**: `GET https://<worker-domain>/mcp.json` returns valid MCP configuration.
- [ ] **MCP JSON-RPC**: `POST https://<worker-domain>/mcp` with method `tools/list` returns 3 tools:
  - `deep_age_test_drive`
  - `deep_age_get_run`
  - `deep_age_inspect_webmcp`
- [ ] **Demo Manifest**: `GET https://<demo-domain>/.well-known/webmcp.json` returns registered tools.
- [ ] **Frontend Routing**: Direct navigation to `https://<frontend-domain>/debug` loads the Developer Workbench without 404s.
- [ ] **Live Test Drive**: Launching a test drive from the Frontend successfully completes and renders the **5-layer Browser State Scrubber** and **Friction Triage**.
- [ ] **MCP Connection to Cursor / Claude**: Adding the `mcpServers` config to Cursor or Claude Desktop connects to the deployed `/mcp` endpoint.

---

## 🛠️ Troubleshooting & FAQs

### 1. Cloudflare Browser Rendering returns `Binding not found`
* Ensure you enabled Browser Rendering in the Cloudflare Dashboard and that `[browser] binding = "MYBROWSER"` is present in `wrangler.toml`.

### 2. Frontend shows CORS errors connecting to Backend
* The backend includes wildcard CORS middleware (`demoApp.use('*', cors())`). If using custom headers, verify that `Authorization` and `Content-Type` are allowed in `backend/src/app.ts`.

### 3. Vercel SPA 404 on page reload
* Ensure [`frontend/vercel.json`](file:///workspaces/Deep-Age/frontend/vercel.json) is deployed alongside the frontend build so Vercel rewrites all routes to `/index.html`.
