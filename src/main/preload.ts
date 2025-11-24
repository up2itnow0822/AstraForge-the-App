import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('astraAPI', {
  startDebate: (objective: string) => ipcRenderer.invoke('start-debate', objective),
  onAgentUpdate: (callback: (data: any) => void) => 
    ipcRenderer.on('agent-update', (_event, value) => callback(value)),
  removeAgentUpdateListener: () => ipcRenderer.removeAllListeners('agent-update')
});
