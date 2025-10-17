import OpenAI from 'openai';
import { EnvLoader } from '../../utils/envLoader';

interface Config {
  apiKey: string;
  baseURL?: string;
  model: string;
}

export interface GenerateResponse {
  text: string;
  confidence: number;
}

export class OpenAICompatibleProvider {
  private client: OpenAI;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  async generate(prompt: string): Promise<GenerateResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.7,
      });

      const text = completion.choices[0]?.message?.content || '';
      const confidence = completion.choices[0]?.finish_reason === 'stop' ? 0.8 : 0.5;

      return { text, confidence };
    } catch (error) {
      console.error('OpenAICompatible generate error:', error);
      throw error;
    }
  }

  static createForOne(): OpenAICompatibleProvider {
    return new OpenAICompatibleProvider({
      apiKey: EnvLoader.getSecret('ASTRAFORGE_API_KEY_ONE'),
      model: 'gpt-4o-mini',
    });
  }

  static createForThree(): OpenAICompatibleProvider {
    return new OpenAICompatibleProvider({
      apiKey: EnvLoader.getSecret('ASTRAFORGE_API_KEY_THREE'),
      baseURL: 'https://api.x.ai/v1',
      model: 'grok-beta',
    });
  }

  static createForFour(): OpenAICompatibleProvider {
    return new OpenAICompatibleProvider({
      apiKey: EnvLoader.getSecret('ASTRAFORGE_API_KEY_FOUR'),
      baseURL: 'https://openrouter.ai/api/v1',
      model: 'openai/gpt-4o-mini',
    });
  }
}
