export interface AgentInfo {
  id: string;
  name: string;
  capabilities?: string[];
}

export interface AgentMessage {
  from: string;
  to: string;
  data: any;
  timestamp?: number;
}

export class InterAgentSync {
  private agents: Map<string, AgentInfo> = new Map();
  private messageLog: AgentMessage[] = [];

  async registerAgent(agentInfo: AgentInfo): Promise<{ success: boolean; error?: string }> {
    if (this.agents.has(agentInfo.id)) {
      return { success: false, error: 'Agent already registered' };
    }
    this.agents.set(agentInfo.id, agentInfo);
    return { success: true };
  }

  async sendMessage(message: AgentMessage): Promise<{ success: boolean; error?: string }> {
    const timestamp = Date.now();
    
    if (!this.agents.has(message.from)) {
      return { success: false, error: 'Sender not registered' };
    }
    
    if (!this.agents.has(message.to)) {
      return { success: false, error: 'Recipient not registered' };
    }
    
    const logEntry: AgentMessage = {
      ...message,
      timestamp
    };
    
    this.messageLog.push(logEntry);
    
    return { success: true };
  }

  getAgent(agentId: string): AgentInfo | undefined {
    return this.agents.get(agentId);
  }

  getAgents(): AgentInfo[] {
    return Array.from(this.agents.values());
  }

  getMessageLog(): AgentMessage[] {
    return [...this.messageLog];
  }
}
