import { TestDriveRun, UserMode } from '@deep-age/shared';
import { env } from '@/config/env';

export class ApiService {
  private static get baseUrl(): string {
    return env.backendUrl;
  }

  public static async createTestDrive(
    url: string,
    task: string,
    mode: UserMode,
    virtualToolCode?: string,
    isVirtualRun?: boolean
  ): Promise<TestDriveRun> {
    const res = await fetch(`${this.baseUrl}/api/test-drives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, task, mode, virtualToolCode, isVirtualRun }),
    });
    if (!res.ok) throw new Error(`Failed to create test drive: ${res.statusText}`);
    const data = (await res.json()) as { run: TestDriveRun };
    return data.run;
  }

  public static async executeTestDrive(id: string): Promise<TestDriveRun> {
    const res = await fetch(`${this.baseUrl}/api/test-drives/${id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Failed to execute test drive: ${res.statusText}`);
    const data = (await res.json()) as { run: TestDriveRun };
    return data.run;
  }

  public static async toggleDemoCapability(enabled: boolean): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/demo/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
    } catch (err) {
      console.warn('Could not contact demo store toggle proxy:', err);
    }
  }
}
