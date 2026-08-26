import { Context } from 'hono';

export class HealthController {
  public static getHealth(c: Context) {
    return c.json({
      status: 'ok',
      service: 'deep-age-backend',
      version: '0.1.0',
      timestamp: Date.now(),
    });
  }
}
