import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { JudgeAgent } from '../JudgeAgent';
import { LanceDBClient } from '../../../core/storage/LanceDBClient';
import { LLMProvider } from '../../../llm/interfaces';

jest.mock('../../../core/storage/LanceDBClient');

describe('JudgeAgent', () => {
  let agent: JudgeAgent;
  let mockLanceDB: jest.Mocked<LanceDBClient>;
  let mockLLMProvider: jest.Mocked<LLMProvider>;

  beforeEach(() => {
    mockLanceDB = new LanceDBClient('test_table') as any;
    mockLLMProvider = { 
        generate: jest.fn(),
        generateStream: jest.fn(),
        embed: jest.fn()
       } as any;

    agent = new JudgeAgent({
      id: 'judge-agent-1',
      llmProvider: mockLLMProvider,
      lanceDB: mockLanceDB
    });
  });

  it('should initialize correctly', () => {
    expect(agent.id).toBe('judge-agent-1');
    expect(agent.name).toBe('JudgeAgent');
  });

  it('should execute task successfully', async () => {
    const task = { id: '1', type: 'evaluation', input: { code: '...' } };
    const result = await agent.executeTask(task as any);
    
    expect(result.status).toBe('completed');
    expect(result.output).toEqual(
      expect.objectContaining({ result: 'Task processed by JudgeAgent' })
    );
  });
});
