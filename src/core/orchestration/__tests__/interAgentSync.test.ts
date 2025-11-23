import { InterAgentSync, AgentInfo } from '../interAgentSync';

describe('InterAgentSync', () => {
    let sync: InterAgentSync;

    beforeEach(() => {
        sync = new InterAgentSync();
    });

    it('should register agent', async () => {
        const agent: AgentInfo = { id: 'a1', name: 'A1' };
        const result = await sync.registerAgent(agent);
        expect(result.success).toBe(true);
        expect(sync.getAgent('a1')).toEqual(agent);
    });

    it('should fail duplicate registration', async () => {
        const agent: AgentInfo = { id: 'a1', name: 'A1' };
        await sync.registerAgent(agent);
        const result = await sync.registerAgent(agent);
        expect(result.success).toBe(false);
        expect(result.error).toContain('already registered');
    });

    it('should send message between registered agents', async () => {
        await sync.registerAgent({ id: 'a1', name: 'A1' });
        await sync.registerAgent({ id: 'a2', name: 'A2' });

        const msg = { from: 'a1', to: 'a2', data: 'hello' };
        const result = await sync.sendMessage(msg);
        expect(result.success).toBe(true);
        const logs = sync.getMessageLog();
        expect(logs).toHaveLength(1);
        expect(logs[0].from).toBe('a1');
        expect(logs[0].to).toBe('a2');
        expect(logs[0].timestamp).toBeDefined();
    });

    it('should fail messaging unknown agents', async () => {
         await sync.registerAgent({ id: 'a1', name: 'A1' });
         const msg = { from: 'a1', to: 'unknown', data: 'hi' };
         const result = await sync.sendMessage(msg);
         expect(result.success).toBe(false);
         expect(result.error).toContain('Recipient not registered');
    });

    it('should fail messaging from unknown agent', async () => {
        await sync.registerAgent({ id: 'a2', name: 'A2' });
        const msg = { from: 'unknown', to: 'a2', data: 'hi' };
        const result = await sync.sendMessage(msg);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Sender not registered');
   });

    it('should return all agents', async () => {
        await sync.registerAgent({ id: 'a1', name: 'A1' });
        await sync.registerAgent({ id: 'a2', name: 'A2' });
        expect(sync.getAgents()).toHaveLength(2);
    });
});
