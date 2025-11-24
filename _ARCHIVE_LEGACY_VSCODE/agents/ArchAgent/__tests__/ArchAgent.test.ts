import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ArchAgent } from '../ArchAgent';
import { LanceDBClient } from '../../../core/storage/LanceDBClient';
import { LLMProvider } from '../../../llm/interfaces';

jest.mock('../../../core/storage/LanceDBClient');

describe('ArchAgent', () => {
  let agent: ArchAgent;
  let mockLanceDB: jest.Mocked<LanceDBClient>;
  let mockLLMProvider: jest.Mocked<LLMProvider>;

  beforeEach(() => {
    mockLanceDB = new LanceDBClient('test_table') as any;
    mockLLMProvider = { 
        generate: jest.fn(),
        generateStream: jest.fn(),
        embed: jest.fn()
       } as any;

    agent = new ArchAgent({
      id: 'arch-agent-1',
      llmProvider: mockLLMProvider,
      lanceDB: mockLanceDB
    });
  });

  it('should initialize correctly', () => {
    expect(agent.id).toBe('arch-agent-1');
    expect(agent.name).toBe('ArchAgent');
  });

  it('should execute task successfully with valid input', async () => {
    // ArchAgent uses ArchitectureRequestSchema.parse(task.input)
    // Schema: requirements: record, constraints: optional record, context: optional record
    const task = {
      id: '1',
      type: 'architecture',
      input: {
        requirements: { scalability: 'high' },
        constraints: { budget: 'low' },
        context: { legacy: false }
      }
    };

    const result = await agent.executeTask(task as any);
    expect(result.status).toBe('completed');
    expect(result.output).toHaveProperty('architectureId');
    expect(result.output.pattern).toBe('microservices');
  });

  it('should fail execution with invalid input', async () => {
    const task = {
      id: '1',
      type: 'architecture',
      input: {
        // Missing 'requirements'
        context: {}
      }
    };

    const result = await agent.executeTask(task as any);
    expect(result.status).toBe('failed');
    // Zod error should be caught
  });
});
