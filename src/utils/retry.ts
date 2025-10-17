import { setTimeout } from 'timers/promises';

export async function withRetry<T>(fn: () => Promise<T>, retries = 3, initialBackoffMs = 250): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i === retries) throw lastError;
      const backoff = initialBackoffMs * Math.pow(2, i);
      await setTimeout(backoff);
    }
  }
  throw lastError!;
}
EOF && cat > src/llm/providers/OpenAICompatibleProvider.ts << 'EOF'
import OpenAI from 'openai';
import { LLMProvider, GenerateResponse } from '../interfaces';
import { withRetry } from '../../utils/retry';
import * as math from 'mathjs';

interface Config {
  name: string;
  apiKey: string;
  baseURL?: string;
  model: string;
}

export class OpenAICompatibleProvider implements LLMProvider {
  name: string;
  model: string;
  apiKey: string;
  private client: OpenAI;
  private config: Config;

  constructor(config: Config) {
    this.name = config.name;
    this.model = config.model;
    this.apiKey = config.apiKey;
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  async generate(prompt: string): Promise<GenerateResponse> {
    return withRetry(async () => {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.7,
      });

      const text = completion.choices[0]?.message?.content || '';
      const confidence = completion.choices[0]?.finish_reason === 'stop' ? 0.8 : 0.5;

      return { text, confidence };
    });
  }

  async embed(text: string): Promise<number[]> {
    return withRetry(async () => {
      const embeddingResponse = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return embeddingResponse.data[0].embedding || [];
    });
  }

  static createForOne(apiKey: string): OpenAICompatibleProvider {
    return new OpenAICompatibleProvider({
      name: 'OpenAI',
      apiKey,
      model: 'gpt-4o-mini',
    });
  }

  static createForThree(apiKey: string): OpenAICompatibleProvider {
    return new OpenAICompatibleProvider({
      name: 'xAI',
      apiKey,
      baseURL: 'https://api.x.ai/v1',
      model: 'grok-beta',
    });
  }

  static createForFour(apiKey: string): OpenAICompatibleProvider {
    return new OpenAICompatibleProvider({
      name: 'OpenRouter',
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      model: 'openai/gpt-4o-mini',
    });
  }
}
EOF && cat > src/llm/providers/AnthropicProvider.ts << 'EOF'
import { Anthropic } from '@anthropic-ai/sdk';
import { LLMProvider, GenerateResponse } from '../interfaces';
import { withRetry } from '../../utils/retry';

export class AnthropicProvider implements LLMProvider {
  name = 'Anthropic';
  model = 'claude-3-5-sonnet-20240620';
  apiKey: string;
  private client: Anthropic;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (!apiKey) throw new Error('Anthropic API key required');
    this.client = new Anthropic({ apiKey });
  }

  async generate(prompt: string): Promise<GenerateResponse> {
    return withRetry(async () => {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = message.content[0]?.text || '';
      const confidence = message.stop_reason === 'end_turn' ? 0.85 : 0.6;

      return { text, confidence };
    });
  }

  async embed(text: string): Promise<number[]> {
    // Mock embedding for compatibility (same dim as text-embedding-3-small)
    return Promise.resolve(Array(1536).fill(0.001));
  }

  static createForTwo(apiKey: string): AnthropicProvider {
    return new AnthropicProvider(apiKey);
  }
}
EOF && cat > src/llm/providers/GitHubProvider.ts << 'EOF'
import { Octokit } from '@octokit/rest';
import { LLMProvider, GenerateResponse } from '../interfaces';
import { withRetry } from '../../utils/retry';

export class GitHubProvider implements LLMProvider {
  name = 'GitHub';
  model = 'vcs-context';
  apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (!apiKey) throw new Error('GitHub token required');
  }

  async generate(prompt: string): Promise<GenerateResponse> {
    return withRetry(async () => {
      const octokit = new Octokit({ auth: this.apiKey });
      const { data } = await octokit.search.code({
        q: prompt,
        per_page: 5,
      });
      const context = data.items.slice(0, 3).map(item => item.text_matches?.[0]?.fragment || '').join('\n');
      const text = context ? `VCS Context for \"${prompt}\":\n${context}` : 'No VCS context found.';
      return { text, confidence: 1.0 };
    }, 2, 1000); // Less retries for API rate limits
  }

  async embed(text: string): Promise<number[]> {
    return Promise.resolve(Array(1536).fill(0.001));
  }

  static createForFive(apiKey: string): GitHubProvider {
    return new GitHubProvider(apiKey);
  }
}
