import * as https from 'node:https';
import * as fs from 'fs';
import { WebSocketServer } from 'ws';
import { Octokit } from '@octokit/rest';
import { CollaborativeSessionManager } from '../collaboration/CollaborativeSessionManager';
import { VectorDB } from '../db/vectorDB';
import OpenAICompatibleProvider from '../llm/providers/OpenAICompatibleProvider';
import { EnvLoader } from '../utils/envLoader';

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  room?: string;
}

const loadDependencies = async () => {
  await EnvLoader.loadSecrets();
  const openaiKey = process.env.OPENAI_API_KEY!;
  const provider = OpenAICompatibleProvider.createForOne(openaiKey);
  const vectorDB = new VectorDB(provider);
  await vectorDB.init();
  const manager = new CollaborativeSessionManager(vectorDB);
  return { manager, vectorDB };
};

(async () => {
  const { manager } = await loadDependencies();

  const serverOptions = {
    key: fs.readFileSync('./server/selfsigned.key'),
    cert: fs.readFileSync('./server/selfsigned.crt'),
  };

  const server = https.createServer(serverOptions);
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: ExtendedWebSocket) => {
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'auth':
            try {
              const octokit = new Octokit({ auth: data.token });
              const { data: user } = await octokit.rest.users.getAuthenticated();
              ws.userId = user.login;
              ws.send(JSON.stringify({ type: 'auth_success', userId: ws.userId }));
            } catch (error) {
              ws.send(JSON.stringify({ type: 'auth_fail', error: 'Invalid token' }));
              ws.close();
            }
            break;

          case 'join':
            if (!ws.userId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
              break;
            }
            await manager.join(data.room, ws.userId);
            ws.room = data.room;
            ws.send(JSON.stringify({ type: 'joined', room: data.room }));

            // Notify other users in room
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN &&
                  client.room === data.room &&
                  client.userId !== ws.userId) {
                client.send(JSON.stringify({
                  type: 'user_joined',
                  userId: ws.userId,
                  room: data.room,
                  timestamp: Date.now(),
                }));
              }
            });
            break;

          case 'edit':
            if (!ws.userId || ws.room !== data.room) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not in room' }));
              break;
            }
            const sessionEvent = await manager.edit(data.room, ws.userId, data.event);

            // Broadcast to other users in room (exclude sender)
            wss.clients.forEach((client: ExtendedWebSocket) => {
              if (client.readyState === WebSocket.OPEN &&
                  client.room === data.room &&
                  client.userId !== ws.userId) {
                client.send(JSON.stringify({
                  type: 'edit',
                  event: sessionEvent,
                  userId: ws.userId,
                }));
              }
            });

            ws.send(JSON.stringify({ type: 'edit_broadcasted', event: sessionEvent }));
            break;

          default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown type' }));
        }
      } catch (error) {
        console.error('WS message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Internal error' }));
      }
    });

    ws.on('close', () => {
      if (ws.userId && ws.room) {
        manager.leave(ws.room, ws.userId);
        // Notify other users
        wss.clients.forEach((client: ExtendedWebSocket) => {
          if (client.readyState === WebSocket.OPEN &&
              client.room === ws.room &&
              client.userId !== ws.userId) {
            client.send(JSON.stringify({
              type: 'user_left',
              userId: ws.userId,
              room: ws.room,
              timestamp: Date.now(),
            }));
          }
        });
      }
    });
  });

  server.listen(8080, () => {
    console.log('Secure WS server listening on https://localhost:8080');
  });
})();
