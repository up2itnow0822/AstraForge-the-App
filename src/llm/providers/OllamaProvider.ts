import { BaseLLMProvider, BaseProviderConfig, LLMResponse } from './baseProvider';

interface OllamaConfig extends BaseProviderConfig {
  endpoint?: string;
}

export class OllamaProvider extends BaseLLMProvider {
  private endpoint: string;

  constructor(config: OllamaConfig) {
    super(config);
    this.endpoint = config.endpoint || 'http://127.0.0.1:11434';
    this.name = 'ollama';
  }

  async generate(prompt: string, options?: any): Promise<LLMResponse> {
    try {
      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model || 'llama3',
          prompt: prompt,
          stream: false,
          options: {
            temperature: options?.temperature || 0.7
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama Error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.response,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        }
      };
    } catch (error: any) {
       if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
         throw new Error('Local AI Offline: Could not connect to Ollama. Ensure it is running at ' + this.endpoint);
       }
       throw error;
    }
  }

  async *generateStream(prompt: string, options?: any): AsyncGenerator<string, void, unknown> {
    try {
      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model || 'llama3',
          prompt: prompt,
          stream: true,
          options: {
             temperature: options?.temperature || 0.7
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama Error: ${response.statusText}`);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        // Ollama sends JSON objects per line in the stream
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.response) {
              yield json.response;
            }
            if (json.done) return;
          } catch (e) {
            console.warn('Error parsing JSON chunk from Ollama', e);
          }
        }
      }
    } catch (error: any) {
        // Error handling mirrored from generate
       if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
         throw new Error('Local AI Offline: Could not connect to Ollama.');
       }
       throw error;
    }
  }

  async embed(text: string): Promise<number[]> {
     // Basic embeddings support
     try {
      const response = await fetch(`${this.endpoint}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model || 'llama3',
          prompt: text
        })
      });
      
      if(!response.ok) return [];
      const data = await response.json();
      return data.embedding || [];
     } catch (e) {
       return [];
     }
  }
}
