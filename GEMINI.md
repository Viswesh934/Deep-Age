# Deep Age Workspace Agent Rules

Deep Age is an autonomous AI agent observability engine and WebMCP diagnostic platform.

## Remote MCP Server Configuration (Windows / Linux / macOS)
Use the remote SSE endpoint to avoid Windows CLI process spawn and path escaping limitations:
```json
{
  "mcpServers": {
    "deep-age": {
      "url": "https://deep-age-backend.sigireddyviswesh.workers.dev/mcp",
      "type": "sse",
      "description": "Deep Age — WebMCP Diagnostics & Autonomous Observability"
    }
  }
}
```

## Core Agent Workflows:
- **Test-Driving Websites**: Use `deep_age_test_drive` with `{ url, task, mode: "debug" }`.
- **Offline Knowledge Extraction**: Use `deep_age_export_sqlite` to generate full `.sql` SQLite database scripts.
- **State Analysis**: Use `deep_age_get_state_graph` and `deep_age_get_dom_tree` to map site transitions and component trees.
- **Security & Privacy Audits**: Use `deep_age_scan_security` to scan for prompt injections and mask PII.
