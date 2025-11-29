export interface AstraAPI {
  startDebate: (objective: string) => Promise<any>;
  onAgentUpdate: (callback: (data: any) => void) => void;
  removeAgentUpdateListener: () => void;
  saveApiKey: (provider: string, key: string) => Promise<boolean>;
  getApiKey: (provider: string) => Promise<string>;
  saveAgentConfig: (agentId: string, config: any) => Promise<boolean>;
  getAgentConfig: (agentId: string) => Promise<any>;
}

declare global {
  interface Window {
    astraAPI: AstraAPI;
  }
}
