import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { LLMManager } from '../src/llm/llmManager';

jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

describe('LLMManager - Refactored', () => {
  let llmManager: LLMManager;

  beforeEach(() => {
    jest.clearAllMocks();
    llmManager = new LLMManager();
  });

  describe('generate', () => {
    it('should generate response for valid prompt', async () => {
      const result = await llmManager.generate('test prompt');
      expect(result).toBeDefined();
      expect(result.content).toBe('Test');
      expect(result.confidence).toBe(0.9);
    });

    it('should handle various prompt types', async () => {
      const testPrompts = [
        'simple prompt',
        'complex prompt with special chars &<>',
        '',
        'prompt with unicode: 你好世界'
      ];

      for (const prompt of testPrompts) {
        const result = await llmManager.generate(prompt);
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('confidence');
        expect(typeof result.content).toBe('string');
        expect(typeof result.confidence).toBe('number');
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should return consistent response structure', async () => {
      const result = await llmManager.generate('test');
      expect(result).toMatchObject({
        content: expect.any(String),
        confidence: expect.any(Number)
      });
    });
  });
});
