import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import * as pty from 'node-pty';
import { LocalOrchestrationEngine } from '../core/orchestration/LocalOrchestrationEngine';
import { LLMAgent } from '../core/agents/LLMAgent';
import { MockAgent } from '../core/MockAgent';
import { AGENT_ROSTER, AgentConfig } from '../core/config/AgentConfig';

let engine: LocalOrchestrationEngine;
let mainWindow: BrowserWindow | null = null;

// PTY session registry — keyed by terminalId
const ptyProcesses = new Map<string, pty.IPty>();

// Feature toggle for simulation mode
const USE_REAL_LLM = true;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(() => {
  // Initialize Config (ENV loading)
  AgentConfig.initializeTokens();

  // Increase engine capacity
  engine = new LocalOrchestrationEngine(10);

  // Determine AI Provider
  // Priority: Agent Specific > Ollama Config > Secret Keys > Mock
  const ollamaEndpoint = AgentConfig.getApiKey('ollama_endpoint');
  const ollamaModel = AgentConfig.getApiKey('ollama_model');
  
  const openAiKey = AgentConfig.getApiKey('openai');
  const openRouterKey = AgentConfig.getApiKey('openrouter');
  const anthropicKey = AgentConfig.getApiKey('anthropic');
  const grokKey = AgentConfig.getApiKey('grok');
  const lmStudioBase = AgentConfig.getApiKey('lmstudio'); // Assuming URL or Key if we want to support auth there

  const useOllama = !!ollamaEndpoint;
  console.log(`AI Configuration: ${useOllama ? 'Local (Ollama)' : 'Cloud'} (Defaults)`);

  // Initialize Agents from Roster
  AGENT_ROSTER.forEach(def => {
    if (USE_REAL_LLM) {
      // Check for Agent Specific Config
      const agentConfig = AgentConfig.getAgentConfig(def.id);
      
      let provider = 'Ollama';
      let model = ollamaModel || 'llama3';
      let apiKey = '';
      let endpoint = ollamaEndpoint;

      if (agentConfig) {
          provider = agentConfig.provider;
          model = agentConfig.model;
          if (agentConfig.apiKey) apiKey = agentConfig.apiKey;
      } else {
          // Fallbacks if no specific config
          if (openRouterKey) {
              provider = 'OpenRouter';
              apiKey = openRouterKey;
              model = 'openai/gpt-3.5-turbo'; // Default fallback
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
          if (provider.toLowerCase() === 'openai') apiKey = openAiKey || '';
          if (provider.toLowerCase() === 'anthropic') apiKey = anthropicKey || '';
          if (provider.toLowerCase() === 'openrouter') apiKey = openRouterKey || '';
          if (provider.toLowerCase() === 'grok') apiKey = grokKey || '';
      }
      
      // Resolve Endpoint for LM Studio if not set
      if (provider.toLowerCase() === 'lm-studio' || provider.toLowerCase() === 'lmstudio') {
          if (!endpoint) endpoint = lmStudioBase;
      }

      console.log(`Initializing Agent ${def.id} (${def.name}) with ${provider} : ${model}`);

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

  // Setup Engine Event Forwarding
  // Mapped to 'agent:update' to match Preload
  engine.on('log', (message: string) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('agent:update', { type: 'log', message });
    }
  });

  engine.on('agent-thinking', (data: any) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('agent:update', { type: 'status', ...data });
    }
  });

  engine.on('state-change', (data: any) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('agent:update', { type: 'phase', ...data });
    }
  });

  // Forward file changes (generated code) to renderer
  engine.on('file_changes', (data: any) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('agent:file_changes', data);
    }
  });

  // Forward user approval requests to renderer
  engine.on('user_approval_required', (data: any) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('agent:update', { type: 'user_approval_required', ...data });
    }
  });

  createWindow();

  // IPC Handlers
  ipcMain.handle('debate:start', async (event, objective) => {
    console.log('Starting debate for:', objective);
    const task = {
      id: Date.now().toString(),
      type: 'debate_init',
      description: objective,
      priority: 1,
      input: { objective }
    };
    engine.submitTask(task).catch(err => console.error(err));
    return { status: 'accepted', task };
  });

  ipcMain.handle('config:save-key', async (event, provider, key) => {
    console.log(`Saving key for ${provider}`);
    AgentConfig.setApiKey(provider, key);
    return true;
  });

  ipcMain.handle('config:save-agent-config', async (event, agentId, config) => {
    console.log(`Saving config for agent ${agentId}`);
    AgentConfig.setAgentConfig(agentId, config);
    return true;
  });

  ipcMain.handle('config:get-agent-config', async (event, agentId) => {
    return AgentConfig.getAgentConfig(agentId);
  });

  ipcMain.handle('config:get-key', async (event, provider) => {
    return AgentConfig.getApiKey(provider);
  });

  // Debate flow: approve or refine
  ipcMain.handle('debate:approve', async () => {
    engine.approveProposal();
    return { status: 'approved' };
  });

  ipcMain.handle('debate:refine', async (event, feedback: string) => {
    engine.requestRefinement(feedback);
    return { status: 'refinement-requested' };
  });

  // ── Terminal / PTY IPC ──────────────────────────────────────────────────────
  // Spawn a new PTY session for the given terminalId
  ipcMain.on('terminal:create', (_event, { terminalId }: { terminalId: string }) => {
    if (ptyProcesses.has(terminalId)) return; // already exists

    const shell =
      process.platform === 'win32'
        ? 'powershell.exe'
        : process.env.SHELL || '/bin/bash';

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.cwd(),
      env: process.env as Record<string, string>,
    });

    ptyProcesses.set(terminalId, ptyProcess);

    ptyProcess.onData((data: string) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal:data', { terminalId, data });
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      ptyProcesses.delete(terminalId);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal:exit', { terminalId, exitCode });
      }
    });
  });

  // Write user keystrokes to PTY
  ipcMain.on('terminal:write', (_event, { terminalId, data }: { terminalId: string; data: string }) => {
    const proc = ptyProcesses.get(terminalId);
    if (proc) proc.write(data);
  });

  // Resize PTY to match xterm.js viewport
  ipcMain.on('terminal:resize', (_event, { terminalId, cols, rows }: { terminalId: string; cols: number; rows: number }) => {
    const proc = ptyProcesses.get(terminalId);
    if (proc) proc.resize(cols, rows);
  });

  // Kill PTY on terminal close
  ipcMain.on('terminal:close', (_event, { terminalId }: { terminalId: string }) => {
    const proc = ptyProcesses.get(terminalId);
    if (proc) {
      proc.kill();
      ptyProcesses.delete(terminalId);
    }
  });
  // ── End Terminal IPC ────────────────────────────────────────────────────────

  // Apply generated file changes to disk
  ipcMain.handle('debate:apply-changes', async (event, changes: any[], basePath?: string) => {
    const fs = await import('fs');
    const path = await import('path');
    const resolvedBase = basePath || process.cwd();
    const results: { path: string; success: boolean; error?: string }[] = [];

    for (const change of changes) {
      try {
        const fullPath = path.join(resolvedBase, change.path);
        const dir = path.dirname(fullPath);

        if (change.action === 'delete') {
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        } else {
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(fullPath, change.content, 'utf8');
        }
        results.push({ path: change.path, success: true });
      } catch (err: any) {
        results.push({ path: change.path, success: false, error: err.message });
      }
    }

    return { success: results.every(r => r.success), results };
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
