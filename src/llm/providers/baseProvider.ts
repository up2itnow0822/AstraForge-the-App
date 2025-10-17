import { LLMProvider, LLMConfig, LLMResponse } from '../interfaces';
import axios from 'axios';
import { withRetry } from '../../utils/retry';

export abstract class BaseLLMProvider implements LLMProvider {
  name: string;
  model: string;
  apiKey: string;
  baseUrl: string;

  constructor(name: string, model: string, apiKey: string, baseUrl: string) {
    this.name = name;
    this.model = model;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  sanitizePrompt(prompt: string): string {
    return prompt.replace(/[<>"'']/g, '');
  }

  async makeRequest(url: string, data: any, headers: any): Promise<any> {
    return await withRetry(() => axios.post(url, data, { headers, timeout: 30000 }));
  }

  extractUsage(data: any): any {
    return data.usage || {};
  }

  abstract generate(prompt: string, options?: LLMConfig): Promise<LLMResponse>;
}
