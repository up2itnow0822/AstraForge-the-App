import { BaseLLMProvider, BaseProviderConfig } from './baseProvider';
import { LLMResponse } from './baseProvider';

export interface GitHubProviderConfig extends BaseProviderConfig {}

export class GitHubProvider extends BaseLLMProvider {
  constructor(config: GitHubProviderConfig) {
    super(config);
  }

  async generate(prompt: string): Promise<LLMResponse> {
    return { content: 'GitHub response', usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } };
  }

  async embed(text: string): Promise<number[]> {
    return [0.1, 0.2, 0.3];
  }
}
