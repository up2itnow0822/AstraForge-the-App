export interface AstraAPI {
  startDebate: (objective: string) => Promise<any>;
  onAgentUpdate: (callback: (data: any) => void) => void;
  removeAgentUpdateListener: () => void;
}

declare global {
  interface Window {
    astraAPI: AstraAPI;
  }
}
