import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AgentRouter } from '../AgentRouter';

// Mock Agent interface for testing
const mockAgent: any = {
  id: 'agent-1',
  capabilities: ['chat'],
  process: (jest.fn() as any).mockResolvedValue({ success: true })
};

describe('AgentRouter', () => {
  let router: AgentRouter;

  beforeEach(() => {
    router = new AgentRouter();
    (mockAgent.process as any).mockClear();
  });

  it('should start with no agents and empty queue', () => {
    expect(router.getAgentCount()).toBe(0);
    expect(router.getQueueSize()).toBe(0);
  });

  it('should register an agent', () => {
    router.registerAgent(mockAgent);
    expect(router.getAgentCount()).toBe(1);
  });

  it('should unregister an agent', () => {
    router.registerAgent(mockAgent);
    router.unregisterAgent(mockAgent.id);
    expect(router.getAgentCount()).toBe(0);
  });

  it('should submit a task successfully', async () => {
    const task = { type: 'chat', content: 'hello' };
    const result = await router.submitTask(task);
    expect(result).toEqual({ success: true });
  });

  it('should route a task specific agent', async () => {
    const task = { type: 'chat', content: 'direct' };
    const result = await router.routeTask('agent-1', task);
    expect(result).toEqual({ success: true });
  });
});
