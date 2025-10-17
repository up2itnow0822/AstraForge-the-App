import { describe, it, expect, beforeEach, jest } from 'jest';
import LLMManager from '../llm/llmManager';

jest.mock('../llm/llmManager');

describe('SpecKitManager', () => {
  it('generates from prompt', async () => {
    const spec = await LLMManager.generateSingle('prompt');
    expect(spec).toBeDefined();
  });
});
