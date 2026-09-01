# Deep Age

> **Test-drive any website as an AI agent.**
> Observability, Friction Diagnostics, and WebMCP Inspection Layer for Autonomous Web Agents.

[![Deep-Age WebMCP Ready](https://img.shields.io/badge/Deep_Age-Agent_Ready_(100%25)-emerald?style=flat-square&logo=googlechrome)](https://github.com/Viswesh934/Deep-Age)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-2024--11--05-orange)](https://modelcontextprotocol.io/)

---

## 🌟 What is Deep Age?

The goal is **not** to build another browser or another chatbot.  
The goal is: **Understand what actually happens when an AI agent tries to use a website.**

When an AI agent interacts with a web page, things frequently break in subtle ways:
- The website has an API (e.g. `POST /api/cart`) and a DOM button, but **never registered a WebMCP tool** (`document.modelContext.registerTool`) for agents to programmatically complete actions.
- Input schemas are missing, ambiguous, or fail validation.
- Critical actions fail silently, throw invisible runtime exceptions, or leak private data across third-party trackers.
- UI elements lack stable semantic element references (`ref: e1`, `ref: e17`) needed for reliable agent action planning.

**Deep Age** sits between the agent and the target website, capturing multi-modal evidence across:
- **WebMCP Capabilities & Schemas** (`window.modelContext` / `document.modelContext`)
- **5-Layer Browser State Machine** (Page, UI State, Semantic Tree, Interaction State with Element Refs, Environment)
- **DOM Component Tree & Interactive Controls**
- **Autonomous Tool Execution & Intent Resolution**
- **Network Requests, Status Codes, and Latency**
- **Friction Diagnostics & Instant Drop-in Remediation Patches**
- **Security Signals, Bot Defense Triggers, and Honeypot Telemetry**

---

## 📸 Interface Preview

<div align="center">
  <img src="docs/assets/01-landing-hero.png" alt="Deep Age Landing & Agent Bench" width="850" />
  <p><em>Deep Age Interactive Agent Test-Drive Bench & MCP Gateway</em></p>
</div>

<div align="center">
  <img src="docs/assets/02-browser-state-scrubber.png" alt="5-Layer Browser State Scrubber" width="850" />
  <p><em>5-Layer Browser State Scrubber & Actionable Element Refs (e1–e39)</em></p>
</div>

---

## 🎭 Three User Modes

Deep Age provides three distinct views over the same underlying execution evidence:

```
                          ┌──────────────────────────┐
                          │ Deep Age Evidence Engine │
                          └─────────────┬────────────┘
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
   ┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
   │  1. Explore       │      │  2. Debug         │      │  3. Inspect       │
   │  (Normal User)    │      │  (Dev / PM)       │      │  (Security User)  │
   ├───────────────────┤      ├───────────────────┤      ├───────────────────┤
   │ Plain-English     │      │ Full technical    │      │ Contacted hosts,  │
   │ explanation of    │      │ trace, WebMCP,    │      │ 3rd party I/O,    │
   │ what happened and │      │ network I/O,      │      │ payload leakage,  │
   │ why it happened.  │      │ friction & fixes. │      │ security signals. │
   └───────────────────┘      └───────────────────┘      └───────────────────┘
```

1. **Explore (Plain English)**:
   * *“Why did checkout fail?”* / *“Where did this price come from?”*
   * Delivers a plain-English explanation with execution milestones, metadata feeds, and readability analysis.
2. **Debug (Product Owner / Developer)**:
   * *“Why couldn't the agent add the laptop to the cart?”*
   * Pinpoints exact evidence: `POST /api/cart` exists, but no `add_to_cart` WebMCP tool was registered.
   * Delivers instant copyable patches: `document.modelContext.registerTool({ name: "add_to_cart", ... })`.
3. **Inspect (Security & Telemetry)**:
   * *“What external endpoints and third-party trackers are contacted during agent execution?”*
   * Reports factual observations: 3rd-party domains contacted, redirects, unencrypted transmissions, and prompt injection honeypot defenses.

---

## 🧠 5-Layer Browser State Machine

Deep Age moves beyond raw HTML dumps into an **AI-optimized 5-layer browser state model**:

```json
{
  "page": {
    "url": "http://127.0.0.1:3002",
    "title": "ElectroVault Storefront",
    "viewport": { "width": 1440, "height": 900 }
  },
  "uiState": {
    "scroll": { "x": 0, "y": 0 },
    "focusedRef": "e13",
    "dialogs": [],
    "loading": false
  },
  "semanticTree": [
    { "ref": "e1", "role": "banner", "name": "Header Navigation", "visible": true },
    { "ref": "e2", "role": "main", "name": "Product Grid", "visible": true }
  ],
  "interactionState": [
    {
      "ref": "e13",
      "role": "button",
      "name": "Add to Cart",
      "visible": true,
      "enabled": true,
      "actions": ["click"]
    }
  ],
  "environment": {
    "online": true,
    "discoveredTools": ["search_products", "filter_products", "view_cart"]
  }
}
```

---

## 🔌 Model Context Protocol (MCP) Integration

Deep Age exposes a compliant MCP server (protocol version `2024-11-05`), allowing Cursor, Claude Desktop, Antigravity, and autonomous agents to test-drive websites directly.

### Connecting to Coding Agents

Add Deep Age to your agent configuration:

#### Cursor / Windsurf (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "deep-age": {
      "url": "http://127.0.0.1:3001/mcp",
      "type": "sse",
      "description": "Deep Age AI Agent Observability & WebMCP Diagnostics Engine"
    }
  }
}
```

#### Claude Desktop (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "deep-age": {
      "command": "npx",
      "args": ["-y", "@deep-age/mcp-server", "--endpoint", "http://127.0.0.1:3001/mcp"]
    }
  }
}
```

### Available MCP Tools

| MCP Tool | Description |
| :--- | :--- |
| `deep_age_test_drive` | Autonomously test-drives any target URL, discovers WebMCP tools, captures 5-layer state dump, and diagnoses friction. |
| `deep_age_get_run` | Fetches complete execution evidence, DOM trees, network waterfall, and remediation patches for a run ID. |
| `deep_age_inspect_webmcp` | Discovers registered WebMCP tools and JSON schemas from `window.modelContext` or `document.modelContext`. |

---

## 🚀 Quickstart

### Prerequisites
- Node.js `>= 20.x`
- npm `>= 10.x`

### 1. Install Dependencies
```bash
npm install
```

### 2. Build All Packages
```bash
npm run build
```

### 3. Run Live Verification Tests
```bash
npm test
```

### 4. Start the Application
```bash
# Start Backend API & MCP Server (Port 3001)
npm run dev --workspace=@deep-age/backend

# Start Target Demo Store (Port 3002)
npm run dev --workspace=@deep-age/demo

# Start Frontend Workbench (Port 5173)
npm run dev --workspace=@deep-age/frontend
```

---

## 📁 Repository Structure

```
Deep-Age/
├── backend/          # Hono API, Agent Engine, MCP Server, Friction Analyzer
├── frontend/         # React 18, Vite, Tailwind CSS, Developer Workbench
├── shared/           # Universal TypeScript types and schemas
├── demo/             # Controlled reference e-commerce storefront
├── docs/             # Architecture documentation and screenshot assets
└── package.json      # Monorepo workspace configuration
```

---

## 📄 License

MIT License. Built for the autonomous web agent ecosystem.
