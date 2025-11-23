import { BaseLLMProvider, BaseProviderConfig } from './baseProvider';
import { LLMResponse } from './baseProvider';

export interface OpenAICompatibleProviderConfig extends BaseProviderConfig {}

export class OpenAICompatibleProvider extends BaseLLMProvider {
  constructor(config: OpenAICompatibleProviderConfig) {
    super(config);
  }

  async generate(prompt: string): Promise<LLMResponse> {
    return { content: 'OpenAI response', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } };
  }

  async embed(text: string): Promise<number[]> {
    return [0.1, 0.2, 0.3];
  }
}
