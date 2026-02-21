export interface TerminalAPI {
  /** Spawn a new PTY session */
  create: (terminalId: string) => void;
  /** Send keystrokes to the PTY */
  write: (terminalId: string, data: string) => void;
  /** Notify the PTY of a viewport resize */
  resize: (terminalId: string, cols: number, rows: number) => void;
  /** Kill the PTY session */
  close: (terminalId: string) => void;
  /** Subscribe to PTY output; returns an unsubscribe function */
  onData: (callback: (payload: { terminalId: string; data: string }) => void) => () => void;
  /** Subscribe to PTY exit events; returns an unsubscribe function */
  onExit: (callback: (payload: { terminalId: string; exitCode: number }) => void) => () => void;
}

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

  // Terminal / PTY (Electron mode only)
  terminal?: TerminalAPI;
}

declare global {
  interface Window {
    astraAPI: AstraAPI;
  }
}
