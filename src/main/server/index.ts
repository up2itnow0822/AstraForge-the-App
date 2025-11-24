import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { LocalOrchestrationEngine } from '../../core/orchestration/LocalOrchestrationEngine';
import { AgentConfig } from '../../core/config/AgentConfig';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Security Config
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || false; // Defaults to same-origin if not set
const SERVER_TOKEN = process.env.ASTRA_SERVER_TOKEN;

// Socket Server with Security
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Initialize Engine
AgentConfig.initializeTokens();
const engine = new LocalOrchestrationEngine();

// Middleware Stack
// 1. Helmet for Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Relaxed for React dev/inline scripts if necessary
      styleSrc: ["'self'", "'unsafe-inline'"], // Required for Tailwind/injected styles
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"] // Explicitly allow socket protocols
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
const staticPath = path.join(__dirname, '../../renderer');
app.use(express.static(staticPath));

// Socket Authentication Middleware
io.use((socket, next) => {
  if (SERVER_TOKEN) {
    const token = socket.handshake.auth.token;
    if (token !== SERVER_TOKEN) {
      const err = new Error("Unauthorized");
      // @ts-ignore
      err.data = { content: "Please retry with a valid token" };
      return next(err);
    }
  }
  next();
});

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
  console.log("Server running on http://localhost:" + PORT);
});
