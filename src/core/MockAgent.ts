import { Agent, AgentTask, AgentResult, Vote } from './Agent';

export class MockAgent implements Agent {
  constructor(
    public id: string,
    public name: string,
    public role: string
  ) {}

  async executeTask(task: AgentTask): Promise<AgentResult> {
    return {
      status: 'completed',
      agentId: this.id,
      output: `Executed ${task.type}`
    };
  }

  async processMessage(message: string): Promise<string> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    if (this.role === 'Critic') {
      return `I have concerns about dependency management in this proposal.`;
    }
    if (this.role === 'Planner') {
      return `From a roadmap perspective, this aligns with Phase 3 goals.`;
    }
    return `I propose we implement a modular architecture for ${message.split(':').pop()?.trim()}.`;
  }

  async castVote(proposal: string): Promise<Vote> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Randomish voting for simulation fun
    const verdict = Math.random() > 0.3 ? 'approve' : 'reject';
    return {
      agentId: this.id,
      proposalId: 'prop-1',
      verdict,
      reasoning: verdict === 'approve' ? 'Looks solid.' : 'Too risky.',
      weight: 1
    };
  }
}
