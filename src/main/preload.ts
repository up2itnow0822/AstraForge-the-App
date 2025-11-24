import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('astraAPI', {
  startDebate: (objective: string) => ipcRenderer.invoke('debate:start', objective),
  onAgentUpdate: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('agent:update', handler);
    // Return a cleanup function if needed, but contextBridge limitations might require manual removal method
  },
  removeAgentUpdateListener: () => {
    ipcRenderer.removeAllListeners('agent:update');
  },
  saveApiKey: (provider: string, key: string) => ipcRenderer.invoke('config:save-key', provider, key),
  getApiKey: (provider: string) => ipcRenderer.invoke('config:get-key', provider)
});
