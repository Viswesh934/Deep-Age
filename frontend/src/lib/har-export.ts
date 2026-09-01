import { TestDriveRun } from '@/types';

export function generateHarFile(run: TestDriveRun): string {
  const startTime = new Date(run.createdAt).toISOString();
  
  const entries = run.network.map((req, index) => {
    const headers = Object.entries(req.requestHeaders || {}).map(([name, value]) => ({
      name,
      value: String(value),
    }));

    const responseHeaders = Object.entries(req.responseHeaders || {}).map(([name, value]) => ({
      name,
      value: String(value),
    }));

    const mimeType = req.responseHeaders?.['content-type'] || 'application/json';

    return {
      startedDateTime: new Date(req.timestamp || run.createdAt + index * 100).toISOString(),
      time: req.durationMs || 50,
      request: {
        method: req.method || 'GET',
        url: req.url,
        httpVersion: 'HTTP/1.1',
        cookies: [],
        headers,
        queryString: Object.entries(req.queryParams || {}).map(([name, value]) => ({
          name,
          value: String(value),
        })),
        headersSize: -1,
        bodySize: req.requestBody ? JSON.stringify(req.requestBody).length : 0,
      },
      response: {
        status: req.status || 200,
        statusText: req.status === 200 ? 'OK' : req.status === 404 ? 'Not Found' : 'Internal Server Error',
        httpVersion: 'HTTP/1.1',
        cookies: [],
        headers: responseHeaders,
        content: {
          size: req.responseBody ? JSON.stringify(req.responseBody).length : 0,
          mimeType,
          text: req.responseBody ? JSON.stringify(req.responseBody) : '',
        },
        redirectURL: '',
        headersSize: -1,
        bodySize: -1,
      },
      cache: {},
      timings: {
        blocked: 0,
        dns: -1,
        connect: -1,
        send: 5,
        wait: Math.max(1, (req.durationMs || 50) - 10),
        receive: 5,
        ssl: -1,
      },
      serverIPAddress: '127.0.0.1',
      comment: `Deep Age WebMCP Agent Inspector - Origin: ${req.origin}`,
    };
  });

  const har = {
    log: {
      version: '1.2',
      creator: {
        name: 'Deep Age — WebMCP Diagnostics Engine',
        version: '1.0.0',
        comment: 'OpenAI WebMCP Devpost Hackathon 2026',
      },
      pages: [
        {
          startedDateTime: startTime,
          id: run.id,
          title: `Deep Age Audit: ${run.url}`,
          pageTimings: {
            onContentLoad: run.summary.durationMs ? run.summary.durationMs * 0.4 : 500,
            onLoad: run.summary.durationMs || 1200,
          },
        },
      ],
      entries,
    },
  };

  return JSON.stringify(har, null, 2);
}
