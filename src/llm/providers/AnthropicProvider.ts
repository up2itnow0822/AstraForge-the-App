import { BaseLLMProvider, BaseProviderConfig } from './baseProvider';
import { LLMResponse } from './baseProvider';

export interface AnthropicProviderConfig extends BaseProviderConfig {}

export class AnthropicProvider extends BaseLLMProvider {
  constructor(config: AnthropicProviderConfig) {
    super(config);
  }

  async generate(prompt: string): Promise<LLMResponse> {
    return { content: 'Anthropic response', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } };
  }

  async embed(text: string): Promise<number[]> {
    return [0.1, 0.2, 0.3];
  }
}
