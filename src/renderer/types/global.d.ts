export interface AstraAPI {
  // Debate lifecycle
  startDebate: (objective: string) => Promise<unknown>;
  approveProposal: () => Promise<void>;
  requestRefinement: (feedback: string) => Promise<void>;
  applyFileChanges: (changes: unknown[], basePath?: string) => Promise<{ success: boolean; results: { path: string; success: boolean; error?: string }[] }>;

  // Agent event stream
  onAgentUpdate: (callback: (data: unknown) => void) => void;
  removeAgentUpdateListener: () => void;

  // File changes stream (generated code)
  onFileChanges: (callback: (data: unknown) => void) => (() => void) | void;
  removeFileChangesListener: () => void;

  // Config / key management
  saveApiKey: (provider: string, key: string) => Promise<boolean>;
  getApiKey: (provider: string) => Promise<string>;
  saveAgentConfig: (agentId: string, config: unknown) => Promise<boolean>;
  getAgentConfig: (agentId: string) => Promise<unknown>;
}

declare global {
  interface Window {
    astraAPI: AstraAPI;
  }
}
