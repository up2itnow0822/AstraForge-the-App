import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { SecurityAgent } from '../SecurityAgent';
import { LanceDBClient } from '../../../core/storage/LanceDBClient';
import { LLMProvider } from '../../../llm/interfaces';

jest.mock('../../../core/storage/LanceDBClient');

describe('SecurityAgent', () => {
  let agent: SecurityAgent;
  let mockLanceDB: jest.Mocked<LanceDBClient>;
  let mockLLMProvider: jest.Mocked<LLMProvider>;

  beforeEach(() => {
    mockLanceDB = new LanceDBClient('test_table') as any;
    mockLLMProvider = { 
        generate: jest.fn(),
        generateStream: jest.fn(),
        embed: jest.fn()
       } as any;

    agent = new SecurityAgent({
      id: 'sec-agent-1',
      llmProvider: mockLLMProvider,
      lanceDB: mockLanceDB
    });
  });

  it('should initialize correctly', () => {
    expect(agent.id).toBe('sec-agent-1');
    expect(agent.name).toBe('SecurityAgent');
  });

  it('should execute task successfully', async () => {
    const task = { id: '1', type: 'security', input: { audit: true } };
    const result = await agent.executeTask(task as any);
    
    expect(result.status).toBe('completed');
    expect(result.output).toEqual(
      expect.objectContaining({ result: 'Task processed by SecurityAgent' })
    );
  });
});
