import { CircuitBreakerStatus } from '@deep-age/shared';

export class AgentCircuitBreaker {
  private maxDepth: number;
  private maxBudgetUsd: number;
  private callHistory: Array<{ toolName: string; inputHash: string }> = [];
  private totalCostUsd: number = 0;

  constructor(maxDepth: number = 10, maxBudgetUsd: number = 0.5) {
    this.maxDepth = maxDepth;
    this.maxBudgetUsd = maxBudgetUsd;
  }

  public recordStep(toolName: string, params: Record<string, unknown>, stepCostUsd: number = 0.002): CircuitBreakerStatus {
    const inputHash = JSON.stringify(params);
    this.callHistory.push({ toolName, inputHash });
    this.totalCostUsd += stepCostUsd;

    // Check Max Depth
    if (this.callHistory.length > this.maxDepth) {
      return {
        isTripped: true,
        currentDepth: this.callHistory.length,
        maxDepth: this.maxDepth,
        cycleDetected: false,
        estimatedCostUsd: this.totalCostUsd,
        maxBudgetUsd: this.maxBudgetUsd,
        reason: `Exceeded maximum allowable execution depth of ${this.maxDepth} steps.`
      };
    }

    // Check Cycle / Infinite Loop (same tool & params called 3 times in a row)
    const len = this.callHistory.length;
    if (len >= 3) {
      const last3 = this.callHistory.slice(len - 3);
      const isLoop = last3.every(
        (c) => c.toolName === toolName && c.inputHash === inputHash
      );
      if (isLoop) {
        return {
          isTripped: true,
          currentDepth: len,
          maxDepth: this.maxDepth,
          cycleDetected: true,
          estimatedCostUsd: this.totalCostUsd,
          maxBudgetUsd: this.maxBudgetUsd,
          reason: `Detected infinite execution loop: ${toolName} called 3 consecutive times with identical parameters.`
        };
      }
    }

    // Check Budget
    if (this.totalCostUsd > this.maxBudgetUsd) {
      return {
        isTripped: true,
        currentDepth: len,
        maxDepth: this.maxDepth,
        cycleDetected: false,
        estimatedCostUsd: this.totalCostUsd,
        maxBudgetUsd: this.maxBudgetUsd,
        reason: `Exceeded allocated session budget of $${this.maxBudgetUsd.toFixed(2)}.`
      };
    }

    return {
      isTripped: false,
      currentDepth: this.callHistory.length,
      maxDepth: this.maxDepth,
      cycleDetected: false,
      estimatedCostUsd: this.totalCostUsd,
      maxBudgetUsd: this.maxBudgetUsd
    };
  }

  public reset(): void {
    this.callHistory = [];
    this.totalCostUsd = 0;
  }
}
