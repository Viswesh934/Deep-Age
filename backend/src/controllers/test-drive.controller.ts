import { Context } from 'hono';
import { CreateTestDriveRequest, IngestEventsRequest, TestDriveRun } from '@deep-age/shared';
import { storeService } from '../services/store.service.js';
import { analyzerService } from '../services/analyzer.service.js';
import { executeRealTestDrive } from '../engine/agent-runner.js';
import { config } from '../config/env.js';

export class TestDriveController {
  public static async listRuns(c: Context) {
    const runs = await storeService.list();
    return c.json({ runs });
  }

  public static async createRun(c: Context) {
    const body = (await c.req.json()) as CreateTestDriveRequest;
    const id = `td-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newRun: TestDriveRun = {
      id,
      url: body.url || config.demoUrl,
      task: body.task || 'Find a laptop under ₹80,000 with 16GB RAM and add it to the cart',
      mode: body.mode || 'debug',
      status: 'pending',
      createdAt: Date.now(),
      summary: {
        taskStatus: 'incomplete',
        frictionCount: 0,
        runtimeErrorCount: 0,
        webmcpToolCount: 0,
        networkRequestCount: 0,
      },
      plainExplanation: {
        exploreSummary: 'Test drive initiated. Awaiting execution...',
        whatHappened: 'Awaiting execution.',
        whyItHappened: '',
      },
      tools: [],
      toolCalls: [],
      network: [],
      domInteractions: [],
      errors: [],
      frictions: [],
      securitySignals: [],
      timeline: [],
      virtualToolCode: body.virtualToolCode,
      isVirtualRun: body.isVirtualRun || Boolean(body.virtualToolCode),
    };

    await storeService.set(id, newRun);
    return c.json({ run: newRun }, 201);
  }

  public static async getRun(c: Context) {
    const id = c.req.param('id');
    if (!id) return c.json({ error: 'Missing run id' }, 400);

    const run = await storeService.get(id);
    if (!run) {
      return c.json({ error: 'Test drive not found' }, 404);
    }
    return c.json({ run });
  }

  public static async executeRun(c: Context) {
    const id = c.req.param('id');
    if (!id) return c.json({ error: 'Missing run id' }, 400);

    const run = await storeService.get(id);
    if (!run) {
      return c.json({ error: 'Test drive not found' }, 404);
    }

    run.status = 'running';
    await storeService.set(id, run);

    const executedRun = await executeRealTestDrive(run);
    await storeService.set(id, executedRun);

    return c.json({ message: 'Real test drive executed successfully', run: executedRun });
  }

  public static async ingestEvents(c: Context) {
    const id = c.req.param('id');
    if (!id) return c.json({ error: 'Missing run id' }, 400);

    const run = await storeService.get(id);
    if (!run) {
      return c.json({ error: 'Test drive not found' }, 404);
    }

    const payload = (await c.req.json()) as IngestEventsRequest;

    if (payload.tools) run.tools.push(...payload.tools);
    if (payload.toolCalls) run.toolCalls.push(...payload.toolCalls);
    if (payload.network) run.network.push(...payload.network);
    if (payload.domInteractions) run.domInteractions.push(...payload.domInteractions);
    if (payload.errors) run.errors.push(...payload.errors);
    if (payload.extractedData) run.extractedData = { ...run.extractedData, ...payload.extractedData };

    run.status = 'running';
    await storeService.set(id, run);

    return c.json({ message: 'Events ingested successfully', run });
  }

  public static async completeRun(c: Context) {
    const id = c.req.param('id');
    if (!id) return c.json({ error: 'Missing run id' }, 400);

    const run = await storeService.get(id);
    if (!run) {
      return c.json({ error: 'Test drive not found' }, 404);
    }

    const analysis = analyzerService.analyze(run);
    run.summary = analysis.summary;
    run.frictions = analysis.frictions;
    run.securitySignals = analysis.securitySignals;
    run.plainExplanation = analysis.plainExplanation;
    run.status = analysis.summary.taskStatus === 'completed' ? 'completed' : 'failed';
    run.completedAt = Date.now();

    await storeService.set(id, run);
    return c.json({ message: 'Test drive analyzed', run });
  }
}
