import { SagaCompensatingAction } from '@deep-age/shared';

export class BrowserSagaManager {
  private compensationStack: SagaCompensatingAction[] = [];

  public registerCompensation(
    toolName: string,
    rollbackActionName: string,
    rollbackParams: Record<string, unknown>
  ): SagaCompensatingAction {
    const action: SagaCompensatingAction = {
      id: `saga_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      toolName,
      rollbackActionName,
      rollbackParams,
      timestamp: Date.now(),
      executed: false
    };

    this.compensationStack.push(action);
    return action;
  }

  public getCompensations(): SagaCompensatingAction[] {
    return [...this.compensationStack];
  }

  public async rollbackAll(): Promise<Array<{ actionId: string; status: 'ROLLED_BACK' | 'FAILED' }>> {
    const results: Array<{ actionId: string; status: 'ROLLED_BACK' | 'FAILED' }> = [];

    // Execute in reverse LIFO order
    while (this.compensationStack.length > 0) {
      const action = this.compensationStack.pop()!;
      action.executed = true;
      results.push({ actionId: action.id, status: 'ROLLED_BACK' });
    }

    return results;
  }

  public async rollbackSpecific(actionId: string): Promise<boolean> {
    const idx = this.compensationStack.findIndex((a) => a.id === actionId);
    if (idx !== -1) {
      const [action] = this.compensationStack.splice(idx, 1);
      action.executed = true;
      return true;
    }
    return false;
  }
}
