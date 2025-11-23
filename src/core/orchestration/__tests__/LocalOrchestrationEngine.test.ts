import { LocalOrchestrationEngine, ExecutionResult } from '../LocalOrchestrationEngine';
import { AgentTask, Agent, AgentConfig, AgentResult } from '../../Agent';

// Mock Agent implementation
class MockAgent extends Agent {
    constructor(config: AgentConfig) {
        super(config);
    }
    executeTask = jest.fn().mockResolvedValue({ 
        agentId: this.id, 
        status: 'completed', 
        output: { result: 'done' } 
    } as AgentResult);
    storeResult = jest.fn().mockResolvedValue(undefined);
}

describe('LocalOrchestrationEngine', () => {
    let engine: LocalOrchestrationEngine;
    let agent: MockAgent;

    beforeEach(() => {
        engine = new LocalOrchestrationEngine(2);
        agent = new MockAgent({
            id: 'agent-1',
            name: 'Test Agent',
            llmProvider: {} as any,
            lanceDB: {} as any
        });
    });

    it('should register and unregister agents', async () => {
        const task: AgentTask = { id: 't1', type: 'test', input: {} };
        
        // Register agent
        engine.registerAgent(agent);
        
        // Unregister agent
        engine.unregisterAgent('agent-1');
        
        // Submit task - failure should be recorded in results, not thrown
        await engine.submitTask(task);
        
        const results = engine.getResults();
        const taskResult = results.find(r => r.taskId === 't1');
        expect(taskResult).toBeDefined();
        expect(taskResult?.status).toBe('failed');
        expect(taskResult?.result.error).toMatch(/No agent available/);
    });

    it('should execute task with registered agent', async () => {
        engine.registerAgent(agent);
        const task: AgentTask = { id: 't1', type: 'test', input: {} };
        await engine.submitTask(task);
        
        const results = engine.getResults();
        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('completed');
        expect(results[0].agentId).toBe('agent-1');
    });

    it('should handle agent failure', async () => {
        engine.registerAgent(agent);
        agent.executeTask.mockRejectedValueOnce(new Error('Agent failed'));
        
        const task: AgentTask = { id: 't2', type: 'test', input: {} };
        // submitTask resolves even on task failure, but records it
        await engine.submitTask(task);
        
        const results = engine.getResults();
        const failure = results.find(r => r.taskId === 't2');
        expect(failure).toBeDefined();
        expect(failure?.status).toBe('failed');
        expect(failure?.result.error).toBe('Agent failed');
    });

    it('should process queue concurrently', async () => {
        engine.registerAgent(agent);
        // Setup agent to delay
        agent.executeTask.mockImplementation(async (t) => {
             await new Promise(resolve => setTimeout(resolve, 50));
             return { agentId: 'agent-1', status: 'completed', output: t.id } as AgentResult;
        });

        const tasks = [
            { id: 't1', type: 'test', input: {} },
            { id: 't2', type: 'test', input: {} }
        ];

        const p1 = engine.submitTask(tasks[0]);
        const p2 = engine.submitTask(tasks[1]);
        
        await Promise.all([p1, p2]);
        expect(engine.getResults()).toHaveLength(2);
    });
    
    it('should get queue size', () => {
         expect(engine.getQueueSize()).toBe(0);
    });
});
