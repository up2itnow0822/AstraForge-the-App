export interface BaseProviderConfig {
  apiKey: string;
  model?: string;
  name?: string;
}

export interface LLMResponse {
  content?: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export abstract class BaseLLMProvider {
  public name: string;
  public model: string;
  public apiKey: string;
  public config: BaseProviderConfig;

  constructor(config: BaseProviderConfig) {
    this.name = config.name || 'base';
    this.model = config.model || 'unknown';
    this.apiKey = config.apiKey || '';
    this.config = config;
  }

  abstract generate(prompt: string, options?: any): Promise<LLMResponse>;
  abstract embed(text: string): Promise<number[]>;
}
