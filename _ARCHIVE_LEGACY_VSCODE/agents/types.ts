export interface Agent {
  id: string;
  name: string;
  capabilities: string[];
  status: string;
  execute: (task: any) => Promise<any>;
}

export interface AgentConfig {
  id: string;
  name: string;
  type: string;
}
