import { VectorDB } from '../db/vectorDB';
import * as io from 'socket.io';

export class CollaborativeSessionManager {
  private vectorDB: VectorDB;
  private io: io.Server;

  constructor(vectorDB: VectorDB, io: io.Server) {
    this.vectorDB = vectorDB;
    this.io = io;
    this.setupEvents();
  }

  private setupEvents() {
    this.io.on('connection', (socket) => {
      socket.on('join-room', (room: string, user: string) => {
        socket.join(room);
        socket.to(room).emit('user-joined', user);
      });

      socket.on('code-change', (data: {room: string, code: string, user: string}) => {
        this.io.to(data.room).emit('code-update', {code: data.code, user: data.user});
        this.vectorDB.addDocument({
          id: `collab-${Date.now()}`,
          vector: [], // Mock
          text: data.code,
          metadata: JSON.stringify({room: data.room, user: data.user})
        });
      });

      socket.on('disconnect', () => {
        // Cleanup
      });
    });
  }

  async getRoomHistory(room: string): Promise<any[]> {
    const results = await this.vectorDB.hybridSearch(room, 100);
    return results
      .filter((r: any) => JSON.parse(r.metadata).room === room)
      .map((r: any) => JSON.parse(r.text))
      .sort((a: any, b: any) => (a.timestamp as number) - (b.timestamp as number));
  }

  close() {
    this.io.close();
  }
}
