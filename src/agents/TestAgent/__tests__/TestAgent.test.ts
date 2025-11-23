import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { TestAgent } from '../TestAgent';
import { LanceDBClient } from '../../../core/storage/LanceDBClient';
import { LLMProvider } from '../../../llm/interfaces';

jest.mock('../../../core/storage/LanceDBClient');

describe('TestAgent', () => {
  let agent: TestAgent;
  let mockLanceDB: jest.Mocked<LanceDBClient>;
  let mockLLMProvider: jest.Mocked<LLMProvider>;

  beforeEach(() => {
    mockLanceDB = new LanceDBClient('test_table') as any;
    mockLLMProvider = { 
        generate: jest.fn(),
        generateStream: jest.fn(),
        embed: jest.fn()
       } as any;

    agent = new TestAgent({
      id: 'test-agent-1',
      llmProvider: mockLLMProvider,
      lanceDB: mockLanceDB
    });
  });

  it('should initialize correctly', () => {
    expect(agent.id).toBe('test-agent-1');
    expect(agent.name).toBe('TestAgent');
  });

  it('should execute task successfully', async () => {
    const task = { id: '1', type: 'test', input: { data: 'test data' } };
    const result = await agent.executeTask(task as any);
    
    expect(result.status).toBe('completed');
    expect(result.output).toEqual(
      expect.objectContaining({ result: 'Task processed by TestAgent' })
    );
  });
});
