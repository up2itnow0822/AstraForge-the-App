import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { SpecAgent } from '../SpecAgent';
import { LanceDBClient } from '../../../core/storage/LanceDBClient';
import { LLMProvider } from '../../../llm/interfaces';

// Mock dependencies
jest.mock('../../../core/storage/LanceDBClient');

describe('SpecAgent', () => {
  let agent: SpecAgent;
  let mockLanceDB: jest.Mocked<LanceDBClient>;
  let mockLLMProvider: jest.Mocked<LLMProvider>;

  beforeEach(() => {
    mockLanceDB = new LanceDBClient('test_table') as any;
    mockLLMProvider = { 
      generate: jest.fn(),
      generateStream: jest.fn(),
      embed: jest.fn()
     } as any;

    agent = new SpecAgent({
      id: 'spec-agent-1',
      llmProvider: mockLLMProvider,
      lanceDB: mockLanceDB
    });
  });

  it('should initialize correctly', () => {
    expect(agent.id).toBe('spec-agent-1');
    expect(agent.name).toBe('SpecAgent');
  });

  it('should execute task successfully', async () => {
    const task = { 
      id: '1', 
      type: 'specification', 
      data: {}, 
      input: {}  // Added input to satisfy interface if needed, SpecAgent uses task.input
    };
    
    // Mock internal methods if necessary or rely on default behavior
    // SpecAgent's executeTask calls analyzeSpecifications which parses input but actual impl seems to ignore input structure for now based on previous cat output
    // Wait, SpecAgent analyzeSpecifications takes "input: any" and returns hardcoded object.
    // However, if there was Zod validation on input inside executeTask we would need to match it.
    // The cat output showed: const specs = await this.analyzeSpecifications(task.input);
    // And analyzeSpecifications returns hardcoded values. No explicit Zod parse on task.input in executeTask shown in cat output for SpecAgent.
    // Wait, re-reading SpecAgent cat output:
    // executeTask(task) { const specs = await this.analyzeSpecifications(task.input); ... }
    // analyzeSpecifications(input) { return { ... } }
    // So any input should work.

    const result = await agent.executeTask(task as any);
    expect(result.status).toBe('completed');
    expect(result.agentId).toBe('spec-agent-1');
    expect(result.output).toHaveProperty('useCases');
    expect(result.output).toHaveProperty('acceptanceCriteria');
  });

  it('should handle errors gracefully', async () => {
    // Force an error by mocking analyzeSpecifications potentially, 
    // but since we are using real class, we can't easily mock private method without casting to any or using prototype manipulation.
    // Alternatively, pass invalid input if the agent validates it.
    // Since SpecAgent source doesn't seem to throw easily based on previous cat (no input validation visible in executeTask body, just call to private fn),
    // I will try to pass undefined input which might cause issues if accessed, or just accept that coverage might be hit by success case.
    // The requirements say "verify proper agent behavior and error propagation".
    // If I pass null as task, it might throw before executeTask.
    // Let's trying mocking the private method via prototype or similar if we really need to test catch block,
    // OR just verify success path strongly.
    
    // Actually, looking at SpecAgent source again:
    // private async analyzeSpecifications(input: any): Promise<any> { return ... }
    // It doesn't seem to throw.
    // However, if I want to test catch block, I can cast agent to any and mock the method.
    
    jest.spyOn(agent as any, 'analyzeSpecifications').mockRejectedValueOnce(new Error('Simulated error'));
    
    const task = { id: '1', type: 'spec', input: {} };
    const result = await agent.executeTask(task as any);
    
    expect(result.status).toBe('failed');
    expect(result.error).toBe('Simulated error');
  });
});
