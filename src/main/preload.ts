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
});
