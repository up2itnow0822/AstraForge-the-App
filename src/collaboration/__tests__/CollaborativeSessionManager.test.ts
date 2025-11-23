import { CollaborativeSessionManager } from '../CollaborativeSessionManager';

describe('CollaborativeSessionManager', () => {
    let manager: CollaborativeSessionManager;

    beforeEach(() => {
        manager = new CollaborativeSessionManager();
    });

    it('should initialize as inactive', () => {
        expect(manager.isActive()).toBe(false);
    });

    it('should start a session', async () => {
        await manager.startSession('session-1', { userId: 'user1', priority: 'high' });
        expect(manager.isActive()).toBe(true);
        expect(manager.getParticipantCount()).toBe(1);
    });

    it('should stop a session', async () => {
        await manager.startSession('session-1', { userId: 'user1', priority: 'high' });
        await manager.stopSession();
        expect(manager.isActive()).toBe(false);
        expect(manager.getParticipantCount()).toBe(0);
    });

    it('should add and remove participants', async () => {
        await manager.addParticipant('p1', { role: 'observer' });
        expect(manager.getParticipantCount()).toBe(1);
        
        await manager.removeParticipant('p1');
        expect(manager.getParticipantCount()).toBe(0);
    });

    it('should broadcast message only when active', async () => {
        const resultInactive = await manager.broadcastMessage({ type: 'test', data: {}, priority: 'low' });
        expect(resultInactive.success).toBe(false);

        await manager.startSession('session-1', { userId: 'u1', priority: 'low' });
        const resultActive = await manager.broadcastMessage({ type: 'test', data: {}, priority: 'low' });
        expect(resultActive.success).toBe(true);
    });
});
