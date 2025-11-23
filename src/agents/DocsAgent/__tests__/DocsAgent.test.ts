import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { DocsAgent } from '../DocsAgent';
import { LanceDBClient } from '../../../core/storage/LanceDBClient';
import { LLMProvider } from '../../../llm/interfaces';

jest.mock('../../../core/storage/LanceDBClient');

describe('DocsAgent', () => {
  let agent: DocsAgent;
  let mockLanceDB: jest.Mocked<LanceDBClient>;
  let mockLLMProvider: jest.Mocked<LLMProvider>;

  beforeEach(() => {
    mockLanceDB = new LanceDBClient('test_table') as any;
    mockLLMProvider = { 
        generate: jest.fn(),
        generateStream: jest.fn(),
        embed: jest.fn()
       } as any;

    agent = new DocsAgent({
      id: 'docs-agent-1',
      llmProvider: mockLLMProvider,
      lanceDB: mockLanceDB
    });
  });

  it('should initialize correctly', () => {
    expect(agent.id).toBe('docs-agent-1');
    expect(agent.name).toBe('DocsAgent');
  });

  it('should execute task successfully', async () => {
    const task = { id: '1', type: 'documentation', input: { topic: 'API' } };
    const result = await agent.executeTask(task as any);
    
    expect(result.status).toBe('completed');
    expect(result.output).toEqual(
      expect.objectContaining({ result: 'Task processed by DocsAgent' })
    );
  });
});
