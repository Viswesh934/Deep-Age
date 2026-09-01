# Deep Age — Production Deployment Guide

This document provides a comprehensive, step-by-step guide for deploying **Deep Age** to production using a **Single Unified Cloudflare Worker** architecture:
- **Backend, MCP Server & Demo Storefront**: [Cloudflare Workers](https://workers.cloudflare.com/) (Hono + Cloudflare Browser Rendering + WebMCP Storefront in a single edge deployment)
- **Frontend Workbench**: [Cloudflare Pages](https://pages.cloudflare.com/) or [Vercel](https://vercel.com/) (Vite + React SPA)

---

## 🗺️ Deployment Topology (Single Unified Worker)

```
                                  ┌───────────────────────────────┐
                                  │      User / Coding Agent      │
                                  │ (Browser, Cursor, Claude MCP) │
                                  └───────────────┬───────────────┘
                                                  │
                                  ┌───────────────┴───────────────┐
                                  ▼                               ▼
                     ┌────────────────────────┐      ┌────────────────────────┐
                     │   Frontend Workbench   │      │ Single Unified Worker  │
                     │  (Vercel / CF Pages)   │      │  (Cloudflare Workers)  │
                     │ https://deep-age.vercel│      │ https://deep-age-      │
                     │          .app          │      │   backend.workers.dev  │
                     └────────────┬───────────┘      └────────────┬───────────┘
                                  │                               │
                                  │       HTTP / REST API         │  ┌─────────────────────────┐
                                  └──────────────────────────────►│  │ • /mcp & /mcp.json      │
                                                                  │  │ • /health               │
                                                                  │  │ • /api/test-drives      │
                                                                  │  │ • /.well-known/webmcp   │
                                                                  │  │ • /api/products, /cart  │
                                                                  │  │ • /store, /demo, / (UI) │
                                                                  │  └────────────┬────────────┘
                                                                  │               │
                                                                  │   Cloudflare Browser
                                                                  │   Rendering (Internal)
                                                                  └───────────────┘
```

---

## 📋 Pre-Deployment Checklist

Before deploying, verify that the monorepo builds cleanly:

```bash
# 1. Install all dependencies across workspaces
npm install

# 2. Build all packages (shared, demo, backend, frontend)
npm run build
```

---

## ⚡ Phase 1: Deploy Unified Worker in One Shot (Cloudflare Workers)

The single unified worker serves:
1. **Deep Age Backend API & Agent Runner** (`/health`, `/api/test-drives`, `/api/explore`, `/api/security`)
2. **MCP Server** (`/mcp`, `/mcp.json`, JSON-RPC & SSE)
3. **Reference ElectroVault Storefront & WebMCP 2.0 Feeds** (`/.well-known/webmcp.json`, `/api/products`, `/api/cart`, `/store`, `/demo`, `/`)

### Step 1.1: Enable Cloudflare Browser Rendering
1. In your [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages** > **Browser Rendering**.
2. Click **Enable Browser Rendering** for your account.

### Step 1.2: Set Cloudflare Secrets
Store your OpenRouter LLM API key securely in Cloudflare:

```bash
# Login to Cloudflare Wrangler
npx wrangler login

# Set LLM API Key Secret
cd backend && npx wrangler secret put OPENROUTER_API_KEY
```

### Step 1.3: One-Shot Deploy to Cloudflare Workers
From the repository root, run:

```bash
npm run deploy
```
*(or `npx wrangler deploy --config backend/wrangler.toml`)*

### Step 1.4: Verify Unified Worker Deployment
```bash
# 1. Health Check
curl -s https://deep-age-backend.<your-subdomain>.workers.dev/health

# 2. WebMCP Storefront Manifest
curl -s https://deep-age-backend.<your-subdomain>.workers.dev/.well-known/webmcp.json

# 3. MCP Server Protocol Handshake
curl -s -X POST https://deep-age-backend.<your-subdomain>.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'
```

> 📝 **Note**: Save your deployed Worker URL (e.g. `https://deep-age-backend.<your-subdomain>.workers.dev`). You will use this single URL for both `VITE_BACKEND_URL` and `VITE_DEMO_URL` in the frontend!

---

## 💻 Phase 2: Deploy Frontend Workbench (Cloudflare Pages / Vercel)

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
