export interface AgentTask {
  id: string;
  type: string;
  description: string;
  priority: number;
  input: any;
}

export interface AgentResult {
  status: 'completed' | 'failed';
  error?: string;
  agentId: string;
  output: any;
}

export interface Vote {
  agentId: string;
  proposalId: string;
  verdict: 'approve' | 'reject' | 'abstain';
  reasoning: string;
  weight: number;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  executeTask(task: AgentTask): Promise<AgentResult>;
  processMessage(message: string): Promise<string>; // For debate dialogue
  castVote(proposal: string): Promise<Vote>;        // For consensus
}
