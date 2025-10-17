import { LLMConfig, LLMResponse } from '../interfaces';
import { BaseLLMProvider } from './baseProvider';

// Mock GitHub Copilot
class GitHubProvider extends BaseLLMProvider {
  constructor(apiKey: string) {
    super('GitHub', 'copilot', apiKey, 'https://api.github.com/copilot');
  }

  async generate(prompt: string, options: LLMConfig = {}): Promise<LLMResponse> {
    const response = await this.makeRequest(`${this.baseUrl}/completions`, { prompt: this.sanitizePrompt(prompt), model: options.model || this.model }, {
      'Authorization': `Bearer ${options.key || this.apiKey}`,
    });
    return {
      content: response.data.choices[0].text || '',
      tokensUsed: 0,
      finishReason: 'stop',
      usage: this.extractUsage(response.data),
    };
  }
}

export { GitHubProvider };
