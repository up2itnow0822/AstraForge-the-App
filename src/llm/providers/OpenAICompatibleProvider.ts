import { EnvLoader } from '../../utils/envLoader';
import { LLMConfig, LLMResponse } from '../interfaces';
import { BaseLLMProvider } from './baseProvider';

import OpenAI from 'openai';

export class OpenAICompatibleProvider extends BaseLLMProvider {
  private openai: OpenAI;

  constructor(apiKey: string, model = 'gpt-4o-mini') {
    super('OpenAI', model, apiKey, EnvLoader.get('OPENAI_BASE_URL') || 'https://api.openai.com/v1');
    this.openai = new OpenAI({ apiKey, baseURL: this.baseUrl });
  }

  async generate(prompt: string, options: LLMConfig = {}): Promise<LLMResponse> {
    const sanitizedPrompt = this.sanitizePrompt(prompt);
    const completion = await this.openai.chat.completions.create({
      model: options.model || this.model,
      messages: [{ role: 'user', content: sanitizedPrompt }],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1024,
    });
    const msg = completion.choices[0];
    return {
      content: msg.message.content || '',
      tokensUsed: completion.usage?.total_tokens || 0,
      finishReason: msg.finish_reason || 'stop',
      usage: this.extractUsage(completion),
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Mock embedding
    return [0.1, 0.2, 0.3]; // Replace with actual
  }
}
