interface Agent {
  id: string;
  capabilities: string[];
  process(task: any): Promise<any>;
}

export class AgentRouter {
  private agents: Map<string, Agent> = new Map();
  private taskQueue: any[] = [];

  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
  }

  submitTask(task: any): Promise<any> {
    return Promise.resolve({ success: true });
  }

  routeTask(agentId: string, task: any): Promise<any> {
    return Promise.resolve({ success: true });
  }

  getAgentCount(): number { return this.agents.size; }
  getQueueSize(): number { return this.taskQueue.length; }
}
