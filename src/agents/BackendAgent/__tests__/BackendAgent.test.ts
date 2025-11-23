import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { BackendAgent } from '../BackendAgent';
import { LanceDBClient } from '../../../core/storage/LanceDBClient';
import { LLMProvider } from '../../../llm/interfaces';

jest.mock('../../../core/storage/LanceDBClient');

describe('BackendAgent', () => {
  let agent: BackendAgent;
  let mockLanceDB: jest.Mocked<LanceDBClient>;
  let mockLLMProvider: jest.Mocked<LLMProvider>;

  beforeEach(() => {
    mockLanceDB = new LanceDBClient('test_table') as any;
    mockLLMProvider = { 
        generate: jest.fn(),
        generateStream: jest.fn(),
        embed: jest.fn()
       } as any;

    agent = new BackendAgent({
      id: 'backend-agent-1',
      llmProvider: mockLLMProvider,
      lanceDB: mockLanceDB
    });
  });

  it('should initialize correctly', () => {
    expect(agent.id).toBe('backend-agent-1');
    expect(agent.name).toBe('BackendAgent');
  });

  it('should execute task successfully', async () => {
    // BackendAgent source showed: const backend = await this.generateBackendCode(task.input);
    // It didn't show explicit validation in the code snippet provided earlier, 
    // but we should provide reasonable input.
    const task = {
      id: '1',
      type: 'backend',
      input: { requirements: 'Build an API' }
    };

    const result = await agent.executeTask(task as any);
    expect(result.status).toBe('completed');
    expect(result.output).toHaveProperty('endpoints');
    expect(result.output.code).toBeDefined();
    expect(result.output.techStack).toContain('typescript');
  });
});
