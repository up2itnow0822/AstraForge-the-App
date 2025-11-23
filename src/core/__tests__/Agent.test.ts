import { Agent, AgentConfig, AgentTask, AgentResult } from '../Agent';

class ConcreteAgent extends Agent {
    async executeTask(task: AgentTask): Promise<AgentResult> {
         const result: AgentResult = { agentId: this.id, status: 'completed', output: task.input };
         await this.storeResult(result);
         return result;
    }
}

describe('Agent', () => {
    it('should initialize properties', () => {
        const config: AgentConfig = {
            id: 'a1',
            name: 'A1',
            llmProvider: {} as any,
            lanceDB: { insert: jest.fn() } as any
        };
        const agent = new ConcreteAgent(config);
        expect(agent.id).toBe('a1');
        expect(agent.name).toBe('A1');
    });

    it('should store result using storeResult', async () => {
        const insertMock = jest.fn().mockResolvedValue(undefined);
        const config: AgentConfig = {
            id: 'a1',
            name: 'A1',
            llmProvider: {} as any,
            lanceDB: { insert: insertMock } as any
        };
        const agent = new ConcreteAgent(config);
        
        const task: AgentTask = { id: 't1', type: 'test', input: 'data' };
        await agent.executeTask(task);
        
        expect(insertMock).toHaveBeenCalled();
        expect(insertMock.mock.calls[0][0][0].agentId).toBe('a1');
    });
});
