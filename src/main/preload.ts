import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('astraAPI', {
  // Debate lifecycle
  startDebate: (objective: string) => ipcRenderer.invoke('debate:start', objective),
  approveProposal: () => ipcRenderer.invoke('debate:approve'),
  requestRefinement: (feedback: string) => ipcRenderer.invoke('debate:refine', feedback),
  applyFileChanges: (changes: unknown[], basePath?: string) =>
    ipcRenderer.invoke('debate:apply-changes', changes, basePath),

  // Agent event stream
  onAgentUpdate: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on('agent:update', handler);
  },
  removeAgentUpdateListener: () => {
    ipcRenderer.removeAllListeners('agent:update');
  },

  // File changes stream (generated code)
  onFileChanges: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on('agent:file_changes', handler);
    // Return unsubscribe
    return () => ipcRenderer.removeListener('agent:file_changes', handler);
  },
  removeFileChangesListener: () => {
    ipcRenderer.removeAllListeners('agent:file_changes');
  },

  // Config / key management
  saveApiKey: (provider: string, key: string) => ipcRenderer.invoke('config:save-key', provider, key),
  getApiKey: (provider: string) => ipcRenderer.invoke('config:get-key', provider),
  saveAgentConfig: (agentId: string, config: unknown) =>
    ipcRenderer.invoke('config:save-agent-config', agentId, config),
  getAgentConfig: (agentId: string) => ipcRenderer.invoke('config:get-agent-config', agentId),

  // ── Terminal / PTY API ───────────────────────────────────────────────────
  // Exposed as window.astraAPI.terminal.* in the renderer
  terminal: {
    /** Spawn a new PTY session */
    create: (terminalId: string) =>
      ipcRenderer.send('terminal:create', { terminalId }),

    /** Send keystrokes to the PTY */
    write: (terminalId: string, data: string) =>
      ipcRenderer.send('terminal:write', { terminalId, data }),

    /** Notify the PTY of a viewport resize */
    resize: (terminalId: string, cols: number, rows: number) =>
      ipcRenderer.send('terminal:resize', { terminalId, cols, rows }),

    /** Kill the PTY session */
    close: (terminalId: string) =>
      ipcRenderer.send('terminal:close', { terminalId }),

    /** Subscribe to PTY output; returns an unsubscribe function */
    onData: (callback: (payload: { terminalId: string; data: string }) => void) => {
      const handler = (
        _event: Electron.IpcRendererEvent,
        payload: { terminalId: string; data: string }
      ) => callback(payload);
      ipcRenderer.on('terminal:data', handler);
      return () => ipcRenderer.removeListener('terminal:data', handler);
    },

    /** Subscribe to PTY exit events; returns an unsubscribe function */
    onExit: (callback: (payload: { terminalId: string; exitCode: number }) => void) => {
      const handler = (
        _event: Electron.IpcRendererEvent,
        payload: { terminalId: string; exitCode: number }
      ) => callback(payload);
      ipcRenderer.on('terminal:exit', handler);
      return () => ipcRenderer.removeListener('terminal:exit', handler);
    },
  },
  // ── End Terminal API ─────────────────────────────────────────────────────
});
