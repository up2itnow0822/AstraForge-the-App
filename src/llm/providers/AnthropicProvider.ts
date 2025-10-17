import { Anthropic } from '@anthropic-ai/sdk';

interface GenerateResponse {
  text: string;
  confidence: number;
}

export class AnthropicProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(prompt: string): Promise<GenerateResponse> {
    try {
      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = message.content[0]?.text || '';
      const confidence = message.stop_reason === 'end_turn' ? 0.85 : 0.6;

      return { text, confidence };
    } catch (error) {
      console.error('Anthropic generate error:', error);
      throw error;
    }
  }

  static createForTwo(): AnthropicProvider {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }
    return new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
  }
}
