import { io, Socket } from 'socket.io-client';

interface BridgeAPI {
  onAgentUpdate: (callback: (data: any) => void) => void;
  removeAgentUpdateListener: () => void;
  startDebate: (objective: string) => Promise<void>;
  saveApiKey: (provider: string, key: string) => Promise<void>;
  getApiKey: (provider: string) => Promise<string>;
}

let socket: Socket | null = null;

// Check if Electron Preload API exists
// @ts-ignore
const isElectron = !!window.astraAPI;

export const bridge: BridgeAPI = {
  onAgentUpdate: (callback) => {
    if (isElectron) {
      // @ts-ignore
      window.astraAPI.onAgentUpdate(callback);
    } else {
      // Initialize Socket if Web Mode
      if (!socket) socket = io();
      socket.on('agent_update', callback);
    }
  },
  
  removeAgentUpdateListener: () => {
    if (isElectron) {
      // @ts-ignore
      window.astraAPI.removeAgentUpdateListener();
    } else {
      if (socket) socket.off('agent_update');
    }
  },
  
  startDebate: async (objective: string) => {
    if (isElectron) {
      // @ts-ignore
      await window.astraAPI.startDebate(objective);
    } else {
      if (!socket) socket = io();
      socket.emit('start_debate', objective);
    }
  },

  saveApiKey: async (provider: string, key: string) => {
    if (isElectron) {
        // @ts-ignore
        await window.astraAPI.saveApiKey(provider, key);
    } else {
        if (!socket) socket = io();
        socket.emit('save_api_key', { provider, key });
    }
  },

  getApiKey: async (provider: string): Promise<string> => {
    if (isElectron) {
        // @ts-ignore
        return await window.astraAPI.getApiKey(provider);
    } else {
        // Socket.io request/response pattern is tricky without ack callbacks
        // simplifying for now: Assume Web Mode relies on env vars or manual entry
        return ''; 
    }
  }
};
