import { describe, it, expect } from '@jest/globals';
import { AnthropicProvider } from '../AnthropicProvider';

describe('AnthropicProvider', () => {
  it('should generate text correctly', async () => {
    const provider = new AnthropicProvider({ apiKey: 'test', model: 'claude-2' });
    const response = await provider.generate('hello');
    expect(response).toEqual({
        content: 'Anthropic response',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
    });
  });

  it('should embed text correctly', async () => {
    const provider = new AnthropicProvider({ apiKey: 'test', model: 'claude-2' });
    const embedding = await provider.embed('hello');
    expect(embedding).toEqual([0.1, 0.2, 0.3]);
  });
});
