import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { LocalOrchestrationEngine } from '../core/orchestration/LocalOrchestrationEngine';
import { LLMAgent } from '../core/agents/LLMAgent';
import { MockAgent } from '../core/MockAgent';
import { AGENT_ROSTER, AgentConfig } from '../core/config/AgentConfig';

let engine: LocalOrchestrationEngine;
let mainWindow: BrowserWindow | null = null;

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

  // Try to load keys from Config first, then Env/Secrets
  // Note: For packaging, secrets are baked in if we rely on placeholders, 
  // but Settings UI allows runtime override.
  const openAiKey = AgentConfig.getApiKey('openai') || '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';
  const model = 'x-ai/grok-4';

  // Initialize Agents from Roster
  AGENT_ROSTER.forEach(def => {
    if (USE_REAL_LLM) {
      engine.registerAgent(new LLMAgent(
        def.id,
        def.name,
        def.role,
        def.systemPrompt,
        openAiKey,
        model,
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

  ipcMain.handle('config:get-key', async (event, provider) => {
    return AgentConfig.getApiKey(provider);
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
