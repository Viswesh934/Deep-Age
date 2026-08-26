import { Context } from 'hono';
import { config } from '../config/env.js';

export class WebMCPController {
  public static getTools(c: Context) {
    const host = config.serverUrl;
    return c.json({
      name: 'Deep Age',
      description: 'Agent Observability & WebMCP Inspection Layer for Web Agents',
      serverUrl: host,
      tools: [
        {
          name: 'create_test_drive',
          description: 'Start a real test drive of a target website to capture WebMCP tools, network I/O, DOM controls, and agent friction',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'The website URL to test-drive' },
              task: { type: 'string', description: 'The task or question for the agent' },
              mode: { type: 'string', enum: ['explore', 'debug', 'inspect'], description: 'User mode for evidence analysis' },
            },
            required: ['url', 'task'],
          },
        },
        {
          name: 'get_test_drive_evidence',
          description: 'Fetch the captured evidence, WebMCP tool trace, network requests, friction points, and recommendations for a run',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'The test-drive run ID' },
            },
            required: ['id'],
          },
        },
      ],
    });
  }

  public static getMcpConfig(c: Context) {
    // Dynamic derivation based on Host request headers or environment configuration
    const reqUrl = new URL(c.req.url);
    const host = config.serverUrl || `${reqUrl.protocol}//${reqUrl.host}`;

    const configPayload = {
      mcpServers: {
        'deep-age': {
          url: `${host}/mcp`,
          type: 'sse',
          description: 'Deep Age — AI Agent Website Observability & Chrome WebMCP Diagnostics',
          toolsEndpoint: `${host}/api/webmcp/tools`,
          env: {
            DEEP_AGE_SERVER_URL: host,
            NODE_ENV: config.nodeEnv,
          },
        },
      },
      cliConfig: {
        mcpServers: {
          'deep-age': {
            command: 'node',
            args: ['dist/index.js'],
            env: {
              PORT: String(config.port),
              HEADLESS_BROWSER: 'true',
              PUBLIC_URL: host,
              NODE_ENV: config.nodeEnv,
            },
          },
        },
      },
      endpoints: {
        tools: `${host}/api/webmcp/tools`,
        createTestDrive: `${host}/api/test-drives`,
        health: `${host}/health`,
      },
    };

    return c.json(configPayload);
  }
}
