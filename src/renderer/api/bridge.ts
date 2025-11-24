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

const getSocket = (): Socket => {
  if (!socket) {
    // Initialize with auth token from localStorage if available
    const token = localStorage.getItem('astra_server_token');
    socket = io({
      auth: { token: token }
    });
    
    // Basic error handling for auth failures
    socket.on("connect_error", (err) => {
        console.error("Socket Connection Error:", err.message);
        // Optional: Could trigger a UI event here via a custom event emitter
    });
  }
  return socket;
};

export const bridge: BridgeAPI = {
  onAgentUpdate: (callback) => {
    if (isElectron) {
      // @ts-ignore
      window.astraAPI.onAgentUpdate(callback);
    } else {
      const s = getSocket();
      s.on('agent_update', callback);
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
      const s = getSocket();
      s.emit('start_debate', objective);
    }
  },

  saveApiKey: async (provider: string, key: string) => {
    if (isElectron) {
      // @ts-ignore
      await window.astraAPI.saveApiKey(provider, key);
    } else {
      const s = getSocket();
      s.emit('save_api_key', { provider, key });
    }
  },

  getApiKey: async (provider: string): Promise<string> => {
    if (isElectron) {
      // @ts-ignore
      return await window.astraAPI.getApiKey(provider);
    } else {
      return '';
    }
  }
};
