# Deep Age — WebMCP & MCP Integration Guide

Deep Age is **WebMCP-native**. It acts as both a WebMCP discovery inspector for target websites and an MCP tool provider for AI agents (ChatGPT in-app browser, Claude, Antigravity, Cursor, etc.).

---

## 1. Where to find MCP Configurations

- **Root MCP Config**: [mcp.json](file:///workspaces/Deep-dream/mcp.json)
- **Live Tool Discovery Endpoint**: `GET /api/webmcp/tools` (serves the JSON schema manifest for WebMCP / MCP clients)
- **In-Browser Registration API**: `window.modelContext.registerTool({...})` or `document.modelContext.registerTool({...})`

---

## 2. Deep Age MCP Tools

When an AI agent connects to Deep Age via MCP, it receives the following capabilities:

### `create_test_drive`
Start a headless test drive of any website.
```json
{
  "url": "http://127.0.0.1:3002",
  "task": "Find a laptop under ₹80,000 with 16GB RAM and add it to the cart",
  "mode": "debug"
}
```

### `get_test_drive_evidence`
Retrieve captured WebMCP tool traces, network requests, friction points, and recommendations.
```json
{
  "id": "td-1787766259974-udkio"
}
```

---

## 3. How Target Websites Expose WebMCP Tools

Target websites register capabilities in their page scripts using the standard WebMCP API:

```javascript
window.modelContext = window.modelContext || {
  tools: [],
  registerTool(tool) {
    this.tools.push(tool);
  }
};

window.modelContext.registerTool({
  name: "search_products",
  description: "Search for catalog items by keyword and category",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" },
      max_price: { type: "number" }
    }
  },
  execute: async (input) => {
    const res = await fetch('/api/products?query=' + encodeURIComponent(input.query || ''));
    return res.json();
  }
});
```

When Deep Age runs a test-drive, it discovers these tools on the live DOM, calls them programmatically, and verifies if required capabilities (like `add_to_cart`) are exposed or missing.
