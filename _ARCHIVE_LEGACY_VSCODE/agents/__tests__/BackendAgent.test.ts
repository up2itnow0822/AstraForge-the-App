import { BackendAgent } from '../BackendAgent/BackendAgent';
import { LLMProvider } from '../../llm/interfaces';
import { LanceDBClient } from '../../core/storage/LanceDBClient';

// Mock dependencies
const mockLLMProvider = {} as LLMProvider;
const mockLanceDB = {} as LanceDBClient;

describe('BackendAgent', () => {
  let agent: BackendAgent;

  beforeEach(() => {
    agent = new BackendAgent({ 
      id: 'test-backend-agent', 
      llmProvider: mockLLMProvider, 
      lanceDB: mockLanceDB 
    });
  });

  it('should handle errors during task execution', async () => {
    // Force generateBackendCode to throw by mocking the private method
    jest.spyOn(agent as any, 'generateBackendCode').mockRejectedValue(new Error('Generation failed'));

    const result = await agent.executeTask({
      id: 'task-1',
      type: 'backend-generation',
      input: { foo: 'bar' }
    });

    expect(result.status).toBe('failed');
    expect(result.error).toBe('Generation failed');
    expect(result.agentId).toBe('test-backend-agent');
  });

  it('should handle unknown errors during task execution', async () => {
    // Force generateBackendCode to throw a non-Error object
    jest.spyOn(agent as any, 'generateBackendCode').mockRejectedValue('String error');

    const result = await agent.executeTask({
      id: 'task-1',
      type: 'backend-generation',
      input: { foo: 'bar' }
    });

    expect(result.status).toBe('failed');
    expect(result.error).toBe('Unknown error');
  });
});
