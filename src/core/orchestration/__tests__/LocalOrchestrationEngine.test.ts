import { LocalOrchestrationEngine } from '../LocalOrchestrationEngine';
import { AgentTask, Agent, AgentResult, Vote } from '../../Agent';

class MockAgent implements Agent {
  constructor(public id: string, public name: string, public role: string) {}

  async executeTask(task: AgentTask): Promise<AgentResult> {
    return {
      status: 'completed',
      agentId: this.id,
      output: task.input
    };
  }

  async processMessage(message: string): Promise<string> {
     return 'ack';
  }

  async castVote(proposal: string): Promise<Vote> {
     return {
         agentId: this.id,
         proposalId: 'test',
         verdict: 'approve',
         reasoning: 'test',
         weight: 1
     };
  }
}

describe('LocalOrchestrationEngine', () => {
  let engine: LocalOrchestrationEngine;

  beforeEach(() => {
    engine = new LocalOrchestrationEngine();
  });

  it('should register agents', () => {
    const agent = new MockAgent('a1', 'A1', 'Worker');
    engine.registerAgent(agent);
  });

  it('should process tasks', async () => {
    const agent = new MockAgent('a1', 'A1', 'Worker');
    engine.registerAgent(agent);
    const task: AgentTask = {
        id: 't1',
        type: 'test',
        description: 'desc',
        priority: 1,
        input: 'test'
    };
    await engine.submitTask(task);
    const results = engine.getResults();
    expect(results.length).toBe(1);
    expect(results[0].status).toBe('completed');
  });
});
