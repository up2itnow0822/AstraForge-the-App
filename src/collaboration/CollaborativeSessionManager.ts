import { VectorDB, Document } from '../db/vectorDB';
import * as crypto from 'node:crypto';

export interface EditEvent {
  pos: number;
  text: string;
  diff?: string;
}

export interface SessionEvent {
  type: 'join' | 'leave' | 'edit';
  room: string;
  userId: string;
  event?: EditEvent;
  timestamp: number;
}

export class CollaborativeSessionManager {
  private rooms: Map<string, Set<string>> = new Map();
  private vectorDB: VectorDB;

  constructor(vectorDB: VectorDB) {
    this.vectorDB = vectorDB;
  }

  async join(room: string, userId: string): Promise<void> {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(userId);

    const event: SessionEvent = {
      type: 'join',
      room,
      userId,
      timestamp: Date.now(),
    };

    const doc: Document = {
      id: `event_${crypto.randomUUID()}_${room}_${userId}`,
      text: JSON.stringify(event),
      metadata: { room, userId, type: 'join' },
    };

    await this.vectorDB.upsert([doc]);
  }

  async leave(room: string, userId: string): Promise<void> {
    const roomUsers = this.rooms.get(room);
    if (roomUsers?.has(userId)) {
      roomUsers.delete(userId);
      if (roomUsers.size === 0) {
        this.rooms.delete(room);
      }

      const event: SessionEvent = {
        type: 'leave',
        room,
        userId,
        timestamp: Date.now(),
      };

      const doc: Document = {
        id: `event_${crypto.randomUUID()}_leave_${room}_${userId}`,
        text: JSON.stringify(event),
        metadata: { room, userId, type: 'leave' },
      };

      await this.vectorDB.upsert([doc]);
    }
  }

  async edit(room: string, userId: string, event: EditEvent): Promise<SessionEvent> {
    const roomUsers = this.rooms.get(room);
    if (!roomUsers || !roomUsers.has(userId)) {
      throw new Error('User not in room');
    }

    const sessionEvent: SessionEvent = {
      type: 'edit',
      room,
      userId,
      event,
      timestamp: Date.now(),
    };

    const doc: Document = {
      id: `event_${crypto.randomUUID()}_edit_${room}_${userId}`,
      text: JSON.stringify(sessionEvent),
      metadata: { room, userId, type: 'edit' },
    };

    await this.vectorDB.upsert([doc]);

    return sessionEvent;
  }

  getRoomUsers(room: string): Set<string> {
    return this.rooms.get(room) || new Set();
  }

  isUserInRoom(room: string, userId: string): boolean {
    return this.rooms.has(room) && this.rooms.get(room)!.has(userId);
  }

  async getSessionEvents(room: string, limit = 100): Promise<any[]> {
    // Query vectorDB for events in room, filter type join/leave/edit
    // Impl using vectorDB.search with query '' limit, filter metadata.room === room
    const results = await this.vectorDB.search('', limit);
    return results
      .filter(r => JSON.parse(r.metadata).room === room)
      .map(r => JSON.parse(r.text))
      .sort((a, b) => a.timestamp - b.timestamp);
  }
}
