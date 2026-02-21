import { io, Socket } from 'socket.io-client';

// Define types locally to ensure availability even if global.d.ts is not picked up by the specific linter context
interface AstraAPI {
  onAgentUpdate: (callback: (data: unknown) => void) => void;
  removeAgentUpdateListener: () => void;
  startDebate: (objective: string) => Promise<unknown>;
  saveApiKey: (provider: string, key: string) => Promise<boolean>;
  getApiKey: (provider: string) => Promise<string>;
  saveAgentConfig: (agentId: string, config: unknown) => Promise<boolean>;
  getAgentConfig: (agentId: string) => Promise<unknown>;
  // Debate flow
  approveProposal: () => Promise<void>;
  requestRefinement: (feedback: string) => Promise<void>;
  applyFileChanges: (changes: unknown[], basePath?: string) => Promise<{ success: boolean; results: { path: string; success: boolean; error?: string }[] }>;
  onFileChanges: (callback: (data: unknown) => void) => (() => void) | void;
  removeFileChangesListener: () => void;
}

// Declare window for environments where DOM types might be missing in linter config
declare const window: {
  astraAPI: AstraAPI;
  location: { port: string; protocol: string; hostname: string; href: string };
  localStorage: {
    getItem: (key: string) => string | null;
  };
} | undefined;

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface FileChange {
  path: string;
  action: 'create' | 'update' | 'delete';
  content: string;
  originalContent?: string;
}

export interface DebateResult {
  success: boolean;
  proposal: string;
  fileChanges: FileChange[];
  votes: unknown[];
}

export interface ApplyResult {
  success: boolean;
  results: { path: string; success: boolean; error?: string }[];
}

export interface AgentProposal {
  agentId: string;
  agentName: string;
  proposal: string;
  domain: string;
}

export interface SynthesisResult {
  hybridProposal: string;
  contributingAgents: string[];
  confidence: number;
}

export interface UserApprovalRequest {
  proposals: AgentProposal[];
  synthesis: SynthesisResult;
  debateSummary: string;
}

interface BridgeAPI {
  onAgentUpdate: (callback: (data: unknown) => void) => void;
  removeAgentUpdateListener: () => void;
  startDebate: (objective: string) => Promise<void>;
  saveApiKey: (provider: string, key: string) => Promise<void>;
  getApiKey: (provider: string) => Promise<string>;
  saveAgentConfig: (agentId: string, config: { provider: string; model: string; apiKey: string }) => Promise<void>;
  getAgentConfig: (agentId: string) => Promise<{ provider: string; model: string; apiKey: string } | undefined>;
  testConnection: (provider: string, model: string, apiKey?: string, endpoint?: string) => Promise<{ success: boolean; message: string }>;
  onConnectionStatusChange: (callback: (status: ConnectionStatus) => void) => void;
  getConnectionStatus: () => ConnectionStatus;
  waitForConnection: (timeoutMs?: number) => Promise<boolean>;
  onFileChanges: (callback: (data: DebateResult) => void) => (() => void) | void;
  removeFileChangesListener: (callback?: (data: DebateResult) => void) => void;
  clearFileChangesCache: () => void;
  applyFileChanges: (changes: FileChange[], basePath?: string) => Promise<ApplyResult>;
  approveProposal: () => void;
  requestRefinement: (feedback: string) => void;
  /** Returns the underlying Socket.io instance (null in Electron/IPC mode). Used by terminal components. */
  getSocket: () => import('socket.io-client').Socket | null;
}

let socket: Socket | null = null;
let connectionStatus: ConnectionStatus = 'connecting';
let connectionStatusCallbacks: ((status: ConnectionStatus) => void)[] = [];

// Cache for file changes - allows ComposerPanel to retrieve data even if it mounts after the event
let cachedFileChanges: DebateResult | null = null;
let fileChangesCallbacks: ((data: DebateResult) => void)[] = [];

// Check if Electron Preload API exists safely
const isElectron = typeof window !== 'undefined' && !!window.astraAPI;

const notifyConnectionStatus = (status: ConnectionStatus) => {
  connectionStatus = status;
  connectionStatusCallbacks.forEach(cb => cb(status));
};

const getSocket = (): Socket => {
  if (!socket) {
    // In Electron preload, localStorage may not be available, so check presence first
    let token: string | null = null;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        token = window.localStorage.getItem('astra_server_token');
      }
    } catch {
      token = null;
    }
    
    // Determine server URL - in development, connect directly to port 3000
    // In production (same origin), use relative path
    const isDev = window?.location?.port === '5173';
    const serverUrl = isDev ? 'http://localhost:3000' : undefined;
    
    console.log('[Bridge] Connecting to:', serverUrl || 'same origin');
    
    socket = io(serverUrl as string, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    
    socket.on("connect", () => {
      console.log('[Bridge] Socket connected');
      notifyConnectionStatus('connected');
    });
    
    socket.on("disconnect", (reason) => {
      console.log('[Bridge] Socket disconnected:', reason);
      notifyConnectionStatus('disconnected');
    });
    
    socket.on("connect_error", (err) => {
      console.error('[Bridge] Socket connection error:', err.message);
      notifyConnectionStatus('error');
    });
    
    socket.on("reconnect_attempt", (attempt) => {
      console.log('[Bridge] Reconnection attempt:', attempt);
      notifyConnectionStatus('connecting');
    });
    
    // Set up global file_changes listener to cache results
    socket.on('file_changes', (data: DebateResult) => {
      console.log('[Bridge] Received file_changes, caching and notifying', fileChangesCallbacks.length, 'listeners');
      cachedFileChanges = data;
      fileChangesCallbacks.forEach(cb => cb(data));
    });
  }
  return socket;
};

export const bridge: BridgeAPI = {
  onAgentUpdate: (callback) => {
    if (isElectron && window?.astraAPI) {
      window.astraAPI.onAgentUpdate(callback);
    } else {
      const s = getSocket();
      s.on('agent_update', callback);
    }
  },

  removeAgentUpdateListener: () => {
    if (isElectron && window?.astraAPI) {
      window.astraAPI.removeAgentUpdateListener();
    } else {
      if (socket) socket.off('agent_update');
    }
  },

  startDebate: async (objective: string) => {
    // Clear cached file changes when starting a new debate
    cachedFileChanges = null;
    console.log('[Bridge] Starting new debate, cleared file_changes cache');
    
    if (isElectron && window?.astraAPI) {
      await window.astraAPI.startDebate(objective);
    } else {
      const s = getSocket();
      s.emit('start_debate', objective);
    }
  },

  saveApiKey: async (provider: string, key: string) => {
    if (isElectron && window?.astraAPI) {
      await window.astraAPI.saveApiKey(provider, key);
    } else {
      const s = getSocket();
      s.emit('save_api_key', { provider, key });
    }
  },

  getApiKey: async (provider: string): Promise<string> => {
    if (isElectron && window?.astraAPI) {
      return await window.astraAPI.getApiKey(provider);
    } else {
      const s = getSocket();
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for API key response'));
        }, 5000);
        
        s.emit('get_api_key', provider, (key: string) => {
          clearTimeout(timeout);
          resolve(key);
        });
      });
    }
  },

  saveAgentConfig: async (agentId: string, config: unknown) => {
    if (isElectron && window?.astraAPI) {
      await window.astraAPI.saveAgentConfig(agentId, config);
    } else {
      const s = getSocket();
      s.emit('save_agent_config', { agentId, config });
    }
  },

  getAgentConfig: async (
    agentId: string
  ): Promise<{ provider: string; model: string; apiKey: string } | undefined> => {
    if (isElectron && window?.astraAPI) {
      return await window.astraAPI.getAgentConfig(agentId) as { provider: string; model: string; apiKey: string } | undefined;
    } else {
      const s = getSocket();
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for agent config response'));
        }, 5000);
        
        s.emit('get_agent_config', agentId, (config: { provider: string; model: string; apiKey: string } | undefined) => {
          clearTimeout(timeout);
          resolve(config);
        });
      });
    }
  },

  testConnection: async (provider: string, model: string, apiKey?: string, endpoint?: string): Promise<{ success: boolean; message: string }> => {
    if (isElectron && window?.astraAPI) {
      // Connection testing requires a live server round-trip; in Electron use server mode
      return { success: false, message: "Connection testing requires the web server mode. Run `npm run dev` and open in browser to test connections." };
    } else {
      const s = getSocket();
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection test timed out after 30 seconds'));
        }, 30000);
        
        s.emit('test_connection', { provider, model, apiKey, endpoint }, (result: { success: boolean, message: string }) => {
          clearTimeout(timeout);
          resolve(result);
        });
      });
    }
  },
  
  onConnectionStatusChange: (callback: (status: ConnectionStatus) => void) => {
    connectionStatusCallbacks.push(callback);
    // Initialize socket if not already done
    if (!isElectron) {
      getSocket();
    }
    // Immediately call with current status
    callback(connectionStatus);
  },
  
  getConnectionStatus: (): ConnectionStatus => {
    if (isElectron) return 'connected'; // Electron IPC is always "connected"
    return connectionStatus;
  },
  
  waitForConnection: async (timeoutMs = 10000): Promise<boolean> => {
    if (isElectron) return true;
    
    const s = getSocket();
    if (s.connected) return true;
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, timeoutMs);
      
      const onConnect = () => {
        clearTimeout(timeout);
        s.off('connect', onConnect);
        resolve(true);
      };
      
      s.on('connect', onConnect);
    });
  },
  
  onFileChanges: (callback: (data: DebateResult) => void) => {
    if (isElectron && window?.astraAPI) {
      // Electron IPC path — delegate to preload
      const unsubscribeIPC = window.astraAPI.onFileChanges((data: unknown) => {
        callback(data as DebateResult);
      });
      return typeof unsubscribeIPC === 'function' ? unsubscribeIPC : undefined;
    } else {
      // Socket.io path
      // Ensure socket is initialized
      getSocket();
      
      // Add to callback list (avoid duplicates)
      if (!fileChangesCallbacks.includes(callback)) {
        fileChangesCallbacks.push(callback);
        console.log('[Bridge] Added file_changes listener, total:', fileChangesCallbacks.length);
      }
      
      // If we have cached data, immediately call the callback
      if (cachedFileChanges) {
        console.log('[Bridge] Delivering cached file_changes to new listener');
        callback(cachedFileChanges);
      }

      // Return an unsubscribe function for proper cleanup
      return () => {
        const index = fileChangesCallbacks.indexOf(callback);
        if (index > -1) {
          fileChangesCallbacks.splice(index, 1);
          console.log('[Bridge] Removed specific file_changes listener, remaining:', fileChangesCallbacks.length);
        }
      };
    }
  },
  
  removeFileChangesListener: (callback?: (data: DebateResult) => void) => {
    if (!isElectron) {
      if (callback) {
        // Remove specific callback
        const index = fileChangesCallbacks.indexOf(callback);
        if (index > -1) {
          fileChangesCallbacks.splice(index, 1);
          console.log('[Bridge] Removed specific file_changes listener, remaining:', fileChangesCallbacks.length);
        }
      } else {
        // Legacy behavior - remove all (but log a warning)
        console.warn('[Bridge] removeFileChangesListener called without callback - removing all listeners');
        fileChangesCallbacks = [];
      }
    }
  },
  
  // Method to clear cached file changes (call when starting a new debate)
  clearFileChangesCache: () => {
    cachedFileChanges = null;
    console.log('[Bridge] Cleared file_changes cache');
  },
  
  applyFileChanges: async (changes: FileChange[], basePath?: string): Promise<ApplyResult> => {
    if (isElectron && window?.astraAPI) {
      const result = await window.astraAPI.applyFileChanges(changes, basePath) as ApplyResult;
      return result;
    } else {
      const s = getSocket();
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Apply file changes timed out'));
        }, 60000); // 60 second timeout for file operations
        
        s.emit('apply_file_changes', { changes, basePath }, (result: ApplyResult) => {
          clearTimeout(timeout);
          resolve(result);
        });
      });
    }
  },

  approveProposal: () => {
    if (isElectron && window?.astraAPI) {
      window.astraAPI.approveProposal();
    } else {
      const s = getSocket();
      s.emit('approve_proposal');
    }
  },

  requestRefinement: (feedback: string) => {
    if (isElectron && window?.astraAPI) {
      window.astraAPI.requestRefinement(feedback);
    } else {
      const s = getSocket();
      s.emit('request_refinement', { feedback });
    }
  },

  /** Returns the underlying Socket.io instance. Only available in web/server mode (returns null in Electron). */
  getSocket: (): import('socket.io-client').Socket | null => {
    if (isElectron) return null;
    return getSocket();
  }
};
