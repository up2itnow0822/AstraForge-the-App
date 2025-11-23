import { Agent, AgentTask, AgentResult } from '../Agent';

export interface TaskPriority {
  high: AgentTask[];
  medium: AgentTask[];
  low: AgentTask[];
}

export interface ExecutionResult {
  taskId: string;
  agentId: string;
  status: 'completed' | 'failed' | 'partial';
  result: AgentResult;
}

export class LocalOrchestrationEngine {
  private agents: Map<string, Agent> = new Map();
  private taskQueue: AgentTask[] = [];
  private results: ExecutionResult[] = [];

  constructor(private maxConcurrency: number = 5) {}

  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
  }

  async submitTask(task: AgentTask): Promise<void> {
    this.taskQueue.push(task);
    await this.processQueue();
  }

  private async processQueue(): Promise<void> {
    const active = this.taskQueue.splice(0, this.maxConcurrency);

    const promises = active.map(async task => {
      try {
        const agent = this.selectAgent(task);
        if (!agent) {
          const errorMsg = `No agent available for task: ${task.type}`;
          this.results.push({
            taskId: task.id,
            agentId: 'system',
            status: 'failed',
            result: { status: 'failed', error: errorMsg, agentId: 'system', taskId: task.id } as any
          });
          throw new Error(errorMsg);
        }

        const result = await agent.executeTask(task);

        this.results.push({
          taskId: task.id,
          agentId: agent.id,
          status: result.status === 'completed' ? 'completed' : 'failed',
          result
        });

        return result;
      } catch (error: any) {
        // Ensure generic failures are also recorded if not caught above
        if (!this.results.find(r => r.taskId === task.id)) {
          this.results.push({
            taskId: task.id,
            agentId: 'system',
            status: 'failed',
            result: { status: 'failed', error: error.message || 'Unknown error', agentId: 'system', taskId: task.id } as any
          });
        }
        throw error;
      }
    });

    await Promise.allSettled(promises);
  }

  private selectAgent(task: AgentTask): Agent | null {
    for (const agent of Array.from(this.agents.values())) {
      // Simple selection logic - can be enhanced
      if (this.canHandle(agent, task)) {
        return agent;
      }
    }
    return null;
  }

  private canHandle(agent: Agent, task: AgentTask): boolean {
    // Agent capability matching logic
    return true; // Simplified
  }

  getResults(): ExecutionResult[] {
    return [...this.results];
  }

  getQueueSize(): number {
    return this.taskQueue.length;
  }
}
