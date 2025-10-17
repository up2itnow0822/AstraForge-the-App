import { LLMConfig, LLMResponse } from '../interfaces';
import { BaseLLMProvider } from './baseProvider';
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider extends BaseLLMProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    super('Anthropic', 'claude-3-sonnet-20240229', apiKey, 'https://api.anthropic.com/v1');
    this.client = new Anthropic({ apiKey });
  }

  async generate(prompt: string, options: LLMConfig = {}): Promise<LLMResponse> {
    const msg = await this.client.messages.create({
      model: options.model || this.model,
      max_tokens: options.maxTokens || 1024,
      messages: [{ role: 'user', content: this.sanitizePrompt(prompt) }],
    });
    const contentBlock = msg.content[0];
    const text = contentBlock.type === 'text' ? contentBlock.text : '';
    return {
      content: text,
      tokensUsed: msg.usage?.output_tokens || 0,
      finishReason: msg.stop_reason || 'stop',
      usage: this.extractUsage(msg),
    };
  }

  static createForTwo(key: string) {
    return new AnthropicProvider(key);
  }
}
