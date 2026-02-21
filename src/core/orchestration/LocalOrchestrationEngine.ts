import { EventEmitter } from 'events';
import { Agent, AgentTask, AgentResult } from '../Agent';
import { DebateManager, DebateState } from '../debate/DebateManager';

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

export class LocalOrchestrationEngine extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private taskQueue: AgentTask[] = [];
  private results: ExecutionResult[] = [];
  private debateManager: DebateManager | null = null;

  constructor(private maxConcurrency: number = 5) {
    super();
  }

  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
  }

  async submitTask(task: AgentTask): Promise<void> {
    this.taskQueue.push(task);
    this.emit('log', `Task submitted: ${task.type} (ID: ${task.id})`);
    await this.processQueue();
  }

  private async processQueue(): Promise<void> {
    const active = this.taskQueue.splice(0, this.maxConcurrency);

    const promises = active.map(async task => {
      if (task.type === 'debate_init') {
         return this.runDebateTask(task);
      }
      // ... normal execution logic fallback ...
      const res = await this.runStandardTask(task); this.results.push({ taskId: task.id, agentId: res.agentId, status: "completed", result: res });
    });

    await Promise.allSettled(promises);
  }

  private async runDebateTask(task: AgentTask): Promise<void> {
    this.emit('log', 'Initializing Debate Protocol...');
    const agentList = Array.from(this.agents.values());
    this.debateManager = new DebateManager(agentList);

    // Proxy debate events to engine events
    this.debateManager.on('log', (msg) => this.emit('log', msg));
    this.debateManager.on('agent-speaking', (data) => this.emit('agent-thinking', data));
    this.debateManager.on('state-change', (data) => this.emit('state-change', data));
    this.debateManager.on('file_changes', (data) => this.emit('file_changes', data));
    // Forward user approval requests so IPC/Socket layers can relay to renderer
    this.debateManager.on('user_approval_required', (data) => this.emit('user_approval_required', data));

    const success = await this.debateManager.startDebate(task.description);
    
    this.results.push({
      taskId: task.id,
      agentId: 'system',
      status: success ? 'completed' : 'failed',
      result: { 
        status: success ? 'completed' : 'failed', 
        agentId: 'debate-mgr', 
        output: success ? 'Consensus Plan' : 'No Consensus'
      }
    });
  }

  private async runStandardTask(task: AgentTask): Promise<AgentResult> {
     this.emit('log', `Processing standard task ${task.id}...`);
     // ... (Simplified for this phase to just complete)
     // Real implementation would select agent etc.
     await new Promise(r => setTimeout(r, 500));
     const res: AgentResult = { 
       status: 'completed', 
       agentId: 'worker', 
       output: 'Standard task done' 
     };
     this.emit('log', `Standard task ${task.id} done.`);
     return res;
  }

  getResults(): ExecutionResult[] {
    return [...this.results];
  }

  getQueueSize(): number {
    return this.taskQueue.length;
  }

  approveProposal(): void {
    if (this.debateManager) {
      this.debateManager.approveProposal();
    }
  }

  requestRefinement(feedback: string): void {
    if (this.debateManager) {
      this.debateManager.requestRefinement(feedback);
    }
  }
}
