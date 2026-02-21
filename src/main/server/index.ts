import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import * as pty from 'node-pty';
import { LocalOrchestrationEngine } from '../../core/orchestration/LocalOrchestrationEngine';
import { AgentConfig, AGENT_ROSTER } from '../../core/config/AgentConfig';
import { SecretManager } from '../../core/config/SecretManager';
import { LLMAgent } from '../../core/agents/LLMAgent';
import { MockAgent } from '../../core/MockAgent';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Security Config
// In development, allow Vite dev server. In production, use same-origin or configured origin.
const isDev = process.env.NODE_ENV !== 'production';
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || (isDev ? ['http://localhost:5173', 'http://127.0.0.1:5173'] : false);
const SERVER_TOKEN = SecretManager.getSecret('ASTRA_SERVER_TOKEN');

// SECURITY: Fail securely in production if no authentication token is configured
if (!isDev && !SERVER_TOKEN) {
  console.error('[Server] FATAL: ASTRA_SERVER_TOKEN is not configured!');
  console.error('[Server] In production mode, authentication is REQUIRED.');
  console.error('[Server] Please set ASTRA_SERVER_TOKEN environment variable or provision the secrets file.');
  console.error('[Server] Refusing to start without authentication configured.');
  process.exit(1);
}

if (isDev && !SERVER_TOKEN) {
  console.warn('[Server] WARNING: No ASTRA_SERVER_TOKEN configured. Authentication is DISABLED in development mode.');
  console.warn('[Server] This is acceptable for local development but NEVER for production.');
}

console.log(`[Server] CORS allowed origins:`, ALLOWED_ORIGIN);
console.log(`[Server] Authentication: ${SERVER_TOKEN ? 'ENABLED' : 'DISABLED (dev mode only)'}`);

// Socket Server with Security
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;
const USE_REAL_LLM = true; // Feature flag matches main.ts

console.log(`[Server] Starting AstraForge Server...`);
console.log(`[Server] NODE_ENV=${process.env.NODE_ENV}`);
console.log(`[Server] PORT=${PORT}`);

// Initialize Engine
AgentConfig.initializeTokens();
const engine = new LocalOrchestrationEngine(10);

// Initialize Agents
// Determine AI Provider Configuration
console.log(`[Server] Loading API keys from config...`);
const ollamaEndpoint = AgentConfig.getApiKey('ollama_endpoint');
const ollamaModel = AgentConfig.getApiKey('ollama_model');

const openAiKey = AgentConfig.getApiKey('openai');
const openRouterKey = AgentConfig.getApiKey('openrouter');
const anthropicKey = AgentConfig.getApiKey('anthropic');
const grokKey = AgentConfig.getApiKey('grok');
const lmStudioBase = AgentConfig.getApiKey('lmstudio'); 

console.log(`[Server] API Keys loaded:`);
console.log(`  - OpenAI: ${openAiKey ? 'SET' : 'NOT SET'}`);
console.log(`  - Anthropic: ${anthropicKey ? 'SET' : 'NOT SET'}`);
console.log(`  - OpenRouter: ${openRouterKey ? 'SET' : 'NOT SET'}`);
console.log(`  - Grok: ${grokKey ? 'SET' : 'NOT SET'}`);
console.log(`  - Ollama Endpoint: ${ollamaEndpoint || 'NOT SET'}`);
console.log(`  - Ollama Model: ${ollamaModel || 'NOT SET'}`);
console.log(`  - LM Studio: ${lmStudioBase || 'NOT SET'}`); 

// const useOllama = !!ollamaEndpoint;
// console.log(`Server AI Configuration: ${useOllama ? 'Local (Ollama)' : 'Cloud'} (Defaults)`);

AGENT_ROSTER.forEach(def => {
  if (USE_REAL_LLM) {
    // Check for Agent Specific Config
    const agentConfig = AgentConfig.getAgentConfig(def.id);
    console.log(`[Server] Agent ${def.id} config from env:`, agentConfig);
    
    let provider = 'Ollama';
    let model = ollamaModel || 'llama3';
    let apiKey = '';
    let endpoint = ollamaEndpoint || 'http://127.0.0.1:11434'; // Default Ollama endpoint

    if (agentConfig) {
        provider = agentConfig.provider;
        model = agentConfig.model;
        if (agentConfig.apiKey) apiKey = agentConfig.apiKey;
        // For Ollama, use default endpoint if not specified
        if (provider.toLowerCase() === 'ollama' && !endpoint) {
            endpoint = 'http://127.0.0.1:11434';
        }
    } else {
        // Fallbacks if no specific config
        if (openRouterKey) {
            provider = 'OpenRouter';
            apiKey = openRouterKey;
            model = 'openai/gpt-3.5-turbo';
        } else if (openAiKey) {
            provider = 'OpenAI';
            apiKey = openAiKey;
            model = 'gpt-4o-mini';
        } else if (anthropicKey) {
            provider = 'Anthropic';
            apiKey = anthropicKey;
            model = 'claude-3-opus-20240229';
        } else if (grokKey) {
            provider = 'Grok';
            apiKey = grokKey;
            model = 'grok-beta';
        } else if (lmStudioBase) {
            provider = 'LM-Studio';
            endpoint = lmStudioBase;
            model = 'local-model';
        }
    }

    // Resolve API Key if not explicitly set in agent config but provider matches global
    if (!apiKey) {
        if (provider.toLowerCase() === 'openrouter') apiKey = openRouterKey || '';
        if (provider.toLowerCase() === 'openai') apiKey = openAiKey || '';
        if (provider.toLowerCase() === 'anthropic') apiKey = anthropicKey || '';
        if (provider.toLowerCase() === 'grok') apiKey = grokKey || '';
        // Ollama doesn't need an API key
    }
    
    // Ensure Ollama has an endpoint
    if (provider.toLowerCase() === 'ollama' && !endpoint) {
        endpoint = 'http://127.0.0.1:11434';
    }
    
    console.log(`[Server] Initializing Agent ${def.id} (${def.name}): provider=${provider}, model=${model}, endpoint=${endpoint || 'N/A'}, apiKey=${apiKey ? 'SET' : 'NOT NEEDED/SET'}`);
    
    // Resolve Endpoint for LM Studio if not set
    if (provider.toLowerCase() === 'lm-studio' || provider.toLowerCase() === 'lmstudio') {
        if (!endpoint) endpoint = lmStudioBase || '';
    }

    engine.registerAgent(new LLMAgent(
      def.id,
      def.name,
      def.role,
      def.systemPrompt,
      {
          provider,
          model,
          apiKey,
          endpoint
      }
    ));
  } else {
    engine.registerAgent(new MockAgent(def.id, def.name, def.role));
  }
});

// Middleware Stack
// 1. Helmet for Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      workerSrc: ["'self'", "blob:"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));

// 2. Rate Limiting (DoS Protection)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 3. CORS (Http Layer)
if (ALLOWED_ORIGIN) {
  app.use(cors({ origin: ALLOWED_ORIGIN }));
}

app.use(express.json());

// Serve Static Assets (built React app)
const staticPath = path.join(__dirname, '../../../renderer');
app.use(express.static(staticPath));

// Socket Authentication Middleware
// In production: REQUIRE valid token (server won't start without one - see check above)
// In development: Skip token auth since browser doesn't have access to .env
io.use((socket, next) => {
  // Development mode: allow all connections (warned at startup)
  if (isDev) {
    return next();
  }
  
  // Production mode: SERVER_TOKEN is guaranteed to exist (server fails to start without it)
    const token = socket.handshake.auth.token;
    if (token !== SERVER_TOKEN) {
    console.warn(`[Server] Rejected unauthorized socket connection from ${socket.handshake.address}`);
      const err = new Error("Unauthorized");
      // @ts-expect-error Adding extra data to error for client-side handling
      err.data = { content: "Please retry with a valid token" };
      return next(err);
    }
  
  next();
});

// Engine Event Listener
engine.on('log', (message: string) => {
  io.emit('agent_update', { type: 'log', message });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
engine.on('agent-thinking', (update: any) => {
  io.emit('agent_update', { type: 'status', ...update });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
engine.on('state-change', (data: any) => {
  io.emit('agent_update', { type: 'phase', ...data });
});

// Forward file changes from debate to clients
// eslint-disable-next-line @typescript-eslint/no-explicit-any
engine.on('file_changes', (data: any) => {
  console.log('[Server] Emitting file_changes:', data.fileChanges?.length || 0, 'files');
  io.emit('file_changes', data);
});

// Forward user approval requests to renderer(s)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
engine.on('user_approval_required', (data: any) => {
  console.log('[Server] Emitting user_approval_required to clients');
  io.emit('agent_update', { type: 'user_approval_required', ...data });
});

// Helper to mask API keys
function maskKey(key: string | undefined): string {
  if (!key) return '';
  if (key.length <= 8) return '********';
  return key.slice(0, 3) + '...' + key.slice(-4);
}

// Terminal Session Management
interface TerminalSession {
  id: string;
  ptyProcess: pty.IPty;
  socketId: string;
}

const terminalSessions = new Map<string, TerminalSession>();

// Socket Connection
io.on('connection', (socket) => {
  // console.log('Client connected:', socket.id);

  socket.on('start_debate', async (objective: string) => {
    // console.log('Starting debate for:', objective);
    await engine.submitTask({
      id: Date.now().toString(),
      type: 'debate_init',
      priority: 1,
      description: objective,
      input: { objective }
    });
  });

  socket.on('save_api_key', (data: { provider: string, key: string }) => {
    // console.log('Saving API Key for:', data.provider);
    AgentConfig.setApiKey(data.provider, data.key);
    // Re-initialize tokens to pick up changes if necessary
    AgentConfig.initializeTokens();
  });
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket.on('save_agent_config', (data: { agentId: string, config: any }) => {
      // console.log(`Saving config for agent ${data.agentId}`);
      AgentConfig.setAgentConfig(data.agentId, data.config);
  });

  socket.on('get_api_key', (provider: string, callback: (key: string) => void) => {
      const key = AgentConfig.getApiKey(provider);
      // Mask keys except for URLs or non-sensitive endpoints
      const shouldMask = !['ollama_endpoint', 'ollama_model', 'lmstudio'].includes(provider.toLowerCase());
      callback(shouldMask ? maskKey(key) : key || '');
  });

  socket.on('get_agent_config', (agentId: string, callback: (config: any) => void) => {
      const config = AgentConfig.getAgentConfig(agentId);
      if (config && config.apiKey) {
          // Always mask agent specific overrides if they exist
          config.apiKey = maskKey(config.apiKey);
      }
      callback(config || null);
  });

  socket.on('test_connection', async (data: { provider: string, model: string, apiKey?: string, endpoint?: string }, callback: (result: { success: boolean, message: string }) => void) => {
    console.log(`[test_connection] Request received: provider=${data.provider}, model=${data.model}, endpoint=${data.endpoint || 'default'}`);
    try {
      // Use the provided key or fall back to the stored global key
      let finalKey = data.apiKey;
      if (!finalKey || finalKey.includes('...')) {
          // If masked or empty, try to get from config
          console.log(`[test_connection] API key is masked or empty, fetching from config for provider: ${data.provider}`);
          const stored = AgentConfig.getApiKey(data.provider);
          if (stored) {
              finalKey = stored;
              console.log(`[test_connection] Found stored key for ${data.provider}, length=${stored.length}`);
          } else {
              console.log(`[test_connection] No stored key found for ${data.provider}`);
          }
      }
      
      console.log(`[test_connection] Final key status: ${finalKey ? 'SET (length=' + finalKey.length + ')' : 'NOT SET'}`);
      console.log(`[test_connection] Creating temp agent with provider=${data.provider}, model=${data.model}`);
      
      // Create a temporary agent to test connectivity
      const tempAgent = new LLMAgent(
        'test-agent', 
        'Tester', 
        'Tester', 
        'You are a connection tester. Reply with "Connection Successful".', 
        {
            provider: data.provider,
            model: data.model,
            apiKey: finalKey,
            endpoint: data.endpoint
        }
      );
      
      console.log(`[test_connection] Calling processMessage...`);
      const result = await tempAgent.processMessage("Ping");
      console.log(`[test_connection] Result: ${result.substring(0, 100)}`);
      
      if (result.includes("Error")) {
          callback({ success: false, message: result });
      } else {
          callback({ success: true, message: "Connection Verified: " + result.substring(0, 50) });
      }
    } catch (e: any) {
        console.error(`[test_connection] EXCEPTION:`, e);
        callback({ success: false, message: `Error: ${e.message || 'Unknown error'}. Stack: ${e.stack?.substring(0, 200) || 'N/A'}` });
    }
  });

  socket.on('disconnect', () => {
    // console.log('Client disconnected:', socket.id);
  });

  // User approval handlers
  socket.on('approve_proposal', () => {
    console.log('[Server] User approved proposal');
    engine.approveProposal();
  });

  socket.on('request_refinement', (data: { feedback: string }) => {
    console.log('[Server] User requested refinement:', data.feedback);
    engine.requestRefinement(data.feedback);
  });

  // Apply file changes to disk
  socket.on('apply_file_changes', async (data: { changes: { path: string, action: string, content?: string }[], basePath?: string }, callback: (result: { success: boolean, results: { path: string, success: boolean, error?: string }[] }) => void) => {
    console.log(`[apply_file_changes] Received ${data.changes.length} changes`);
    
    const results: { path: string, success: boolean, error?: string }[] = [];
    const basePath = data.basePath || process.cwd();
    
    for (const change of data.changes) {
      try {
        const fullPath = path.join(basePath, change.path);
        const dir = path.dirname(fullPath);
        
        if (change.action === 'delete') {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
          results.push({ path: change.path, success: true });
        } else {
          // Create or Update
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(fullPath, change.content ?? '', 'utf8');
          results.push({ path: change.path, success: true });
        }
        
        console.log(`[apply_file_changes] ${change.action} ${change.path} - SUCCESS`);
      } catch (err: any) {
        console.error(`[apply_file_changes] ${change.action} ${change.path} - ERROR:`, err.message);
        results.push({ path: change.path, success: false, error: err.message });
      }
    }
    
    const allSuccess = results.every(r => r.success);
    callback({ success: allSuccess, results });
  });

  // Terminal Handlers
  socket.on('terminal:create', (data: { terminalId: string }) => {
    try {
      const { terminalId } = data;

      // Check if terminal already exists
      if (terminalSessions.has(terminalId)) {
        console.log(`[Terminal] Terminal ${terminalId} already exists`);
        return;
      }

      // Determine shell based on platform
      const shell = process.platform === 'win32' ? 'powershell.exe' : (process.env.SHELL || '/bin/bash');

      // Create PTY process
      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.cwd(),
        env: { ...process.env, TERM: 'xterm-256color' }
      });

      // Store terminal session
      const session: TerminalSession = {
        id: terminalId,
        ptyProcess,
        socketId: socket.id
      };

      terminalSessions.set(terminalId, session);

      // Handle PTY output
      ptyProcess.onData((data) => {
        socket.emit('terminal:output', { terminalId, output: data });
      });

      // Handle PTY exit
      ptyProcess.onExit(() => {
        console.log(`[Terminal] PTY process for ${terminalId} exited`);
        terminalSessions.delete(terminalId);
      });

      console.log(`[Terminal] Created terminal ${terminalId} with shell: ${shell}`);

      // Send welcome message
      socket.emit('terminal:output', { terminalId, output: `\r\nWelcome to AstraForge Terminal\r\n${shell.split('/').pop()} $ ` });

    } catch (error: any) {
      console.error(`[Terminal] Failed to create terminal ${data.terminalId}:`, error);
      socket.emit('terminal:error', { terminalId: data.terminalId, error: error.message });
    }
  });

  socket.on('terminal:input', (data: { terminalId: string; data: string }) => {
    try {
      const session = terminalSessions.get(data.terminalId);
      if (session && session.socketId === socket.id) {
        session.ptyProcess.write(data.data);
      }
    } catch (error: any) {
      console.error(`[Terminal] Failed to write to terminal ${data.terminalId}:`, error);
    }
  });

  socket.on('terminal:resize', (data: { terminalId: string; cols: number; rows: number }) => {
    try {
      const session = terminalSessions.get(data.terminalId);
      if (session && session.socketId === socket.id) {
        session.ptyProcess.resize(data.cols, data.rows);
      }
    } catch (error: any) {
      console.error(`[Terminal] Failed to resize terminal ${data.terminalId}:`, error);
    }
  });

  socket.on('terminal:close', (data: { terminalId: string }) => {
    try {
      const session = terminalSessions.get(data.terminalId);
      if (session && session.socketId === socket.id) {
        session.ptyProcess.kill();
        terminalSessions.delete(data.terminalId);
        console.log(`[Terminal] Closed terminal ${data.terminalId}`);
      }
    } catch (error: any) {
      console.error(`[Terminal] Failed to close terminal ${data.terminalId}:`, error);
    }
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    // Clean up terminal sessions for this socket
    for (const [terminalId, session] of terminalSessions.entries()) {
      if (session.socketId === socket.id) {
        try {
          session.ptyProcess.kill();
        } catch (error) {
          console.error(`[Terminal] Error killing PTY for ${terminalId}:`, error);
        }
        terminalSessions.delete(terminalId);
      }
    }
  });
});

// Catch-all handler for React Router
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

httpServer.listen(PORT, () => {
  console.log(`[Server] AstraForge server running on http://localhost:${PORT}`);
});
