import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { LocalOrchestrationEngine } from '../../core/orchestration/LocalOrchestrationEngine';
import { AgentConfig } from '../../core/config/AgentConfig';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Initialize Engine
AgentConfig.initializeTokens();
const engine = new LocalOrchestrationEngine();

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Assets (built React app)
const staticPath = path.join(__dirname, '../../renderer');
app.use(express.static(staticPath));

// Engine Event Listener
engine.on('log', (message: string) => {
  io.emit('agent_update', { type: 'log', message });
});

engine.on('status', (update: any) => {
  io.emit('agent_update', { type: 'status', ...update });
});

engine.on('voting_concluded', (verdict: any) => {
  io.emit('agent_update', { type: 'phase', phase: 'voting_concluded', verdict });
});

// Socket Connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('start_debate', async (objective: string) => {
    console.log('Starting debate for:', objective);
    await engine.submitTask({ 
        id: Date.now().toString(), 
        type: 'debate_init', 
        priority: 1,
        description: objective,
        input: { objective } 
    });
  });

  socket.on('save_api_key', (data: { provider: string, key: string }) => {
    console.log('Saving API Key for:', data.provider);
    AgentConfig.setApiKey(data.provider, data.key);
    // Re-initialize tokens to pick up changes if necessary
    AgentConfig.initializeTokens();
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Catch-all handler for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
