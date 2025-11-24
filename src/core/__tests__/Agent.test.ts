import { Agent, AgentTask, AgentResult, Vote } from '../Agent';

class ConcreteAgent implements Agent {
  constructor(public id: string, public name: string, public role: string) {}

  async executeTask(task: AgentTask): Promise<AgentResult> {
    const result: AgentResult = { agentId: this.id, status: 'completed', output: task.input };
    return result;
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

describe('Agent', () => {
  it('should initialize correctly', () => {
    const agent = new ConcreteAgent('a1', 'A1', 'Worker');
    expect(agent.id).toBe('a1');
    expect(agent.name).toBe('A1');
  });

  it('should execute task', async () => {
    const agent = new ConcreteAgent('a1', 'A1', 'Worker');
    const task: AgentTask = {
        id: 't1',
        type: 'test',
        description: 'desc',
        priority: 1,
        input: 'data'
    };
    const result = await agent.executeTask(task);
    expect(result.status).toBe('completed');
    expect(result.output).toBe('data');
  });
});
