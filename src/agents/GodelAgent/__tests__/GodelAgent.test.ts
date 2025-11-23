import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GodelAgent } from '../GodelAgent';
import { LanceDBClient } from '../../../core/storage/LanceDBClient';
import { LLMProvider } from '../../../llm/interfaces';

jest.mock('../../../core/storage/LanceDBClient');

describe('GodelAgent', () => {
  let agent: GodelAgent;
  let mockLanceDB: jest.Mocked<LanceDBClient>;
  let mockLLMProvider: jest.Mocked<LLMProvider>;

  beforeEach(() => {
    mockLanceDB = new LanceDBClient('test_table') as any;
    mockLLMProvider = { 
        generate: jest.fn(),
        generateStream: jest.fn(),
        embed: jest.fn()
       } as any;

    agent = new GodelAgent({
      id: 'godel-agent-1',
      llmProvider: mockLLMProvider,
      lanceDB: mockLanceDB
    });
  });

  it('should initialize correctly', () => {
    expect(agent.id).toBe('godel-agent-1');
    expect(agent.name).toBe('GodelAgent');
  });

  it('should execute task successfully', async () => {
    const task = { id: '1', type: 'meta-reasoning', input: { query: 'self-improve' } };
    const result = await agent.executeTask(task as any);
    
    expect(result.status).toBe('completed');
    expect(result.output).toEqual(
      expect.objectContaining({ result: 'Task processed by GodelAgent' })
    );
  });
});
