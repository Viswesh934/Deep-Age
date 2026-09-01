import { TestDriveRun } from './types/index.js';

class RunStore {
  private runs: Map<string, TestDriveRun> = new Map();

  async set(id: string, run: TestDriveRun): Promise<void> {
    this.runs.set(id, run);
  }

  async get(id: string): Promise<TestDriveRun | undefined> {
    return this.runs.get(id);
  }

  async list(): Promise<TestDriveRun[]> {
    return Array.from(this.runs.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  async delete(id: string): Promise<boolean> {
    return this.runs.delete(id);
  }
}

export const runStore = new RunStore();
