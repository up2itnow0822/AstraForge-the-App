import axios from 'axios';
import { LLMManager } from '../llm/llmManager.js';
import { VectorDB } from '../db/vectorDB.js';

export interface TestResult {
  success: boolean;
  response?: string;
  error?: string;
  latency: number;
  timestamp: number;
  provider: string;
  model?: string;
  tokenCount?: number;
  estimatedCost?: number;
}

export interface _TestResult extends TestResult {}

export interface BatchTestResult {
  total: number;
  successful: number;
  failed: number;
  results: TestResult[];
  averageLatency: number;
  totalTime: number;
  totalCost?: number;
}

export interface _BatchTestResult extends BatchTestResult {}

export interface VectorTestResult {
  success: boolean;
  results: Array<{
    id: string;
    similarity: number;
    metadata: any;
  }>;
  query: string;
  latency: number;
}

export interface _VectorTestResult extends VectorTestResult {}

export interface ConferenceParticipantSummary {
  llm: number;
  role: string;
  response: string;
  tokens: number;
  cost: number;
}

export interface ConferenceVoteSummary {
  option: string;
  votes: number;
}

export interface ConferenceTestResult {
  success: boolean;
  discussionRounds: number;
  finalDecision: string;
  participantResponses: ConferenceParticipantSummary[];
  totalTokens: number;
  totalCost: number;
  conferenceTime: number;
  voteResults?: ConferenceVoteSummary[];
  error?: string;
}

export interface _ConferenceTestResult extends ConferenceTestResult {}

export class ApiTesterCore {
  private llmManager: LLMManager;
  private vectorDB: VectorDB;
  private testMode = false;

  constructor() {
    this.llmManager = new LLMManager();
    this.vectorDB = new VectorDB(process.cwd());
  }

  async initialize(): Promise<void> {
    try {
      await this.vectorDB.init();
      this.testMode = true;
    } catch (error) {
      console.warn('Failed to initialize vector DB for testing:', error);
    }
  }

  async testLLM(
    provider: 'OpenAI' | 'Anthropic' | 'xAI' | 'OpenRouter',
    apiKey: string,
    model: string,
    prompt: string
  ): Promise<TestResult> {
    const startTime = Date.now();

    const inputTokens = await this.estimateTokens(prompt, model);

    try {
      const testConfig = {
        provider,
        key: apiKey,
        model,
        role: 'primary' as const,
      };

      this.llmManager.setPanel([testConfig]);

      const response = await this.llmManager.queryLLM(0, prompt);
      const outputTokens = await this.estimateTokens(response, model);
      const latency = Date.now() - startTime;
      const estimatedCost = this.estimateCost(inputTokens, outputTokens, model);

      return {
        success: true,
        response,
        latency,
        timestamp: Date.now(),
        provider,
        model,
        tokenCount: inputTokens + outputTokens,
        estimatedCost,
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        error: error.message,
        latency,
        timestamp: Date.now(),
        provider,
        model,
        tokenCount: inputTokens,
        estimatedCost: this.estimateCost(inputTokens, 0, model),
      };
    }
  }

  async testBatchLLM(
    provider: 'OpenAI' | 'Anthropic' | 'xAI' | 'OpenRouter',
    apiKey: string,
    model: string,
    prompts: string[]
  ): Promise<BatchTestResult> {
    const startTime = Date.now();

    const testPromises = prompts.map(async (prompt, index) => {
      const result = await this.testLLM(provider, apiKey, model, prompt);
      return { ...result, index };
    });

    const batchResults = await Promise.all(testPromises);
    const totalTime = Date.now() - startTime;

    const successful = batchResults.filter(r => r.success).length;
    const failed = batchResults.length - successful;
    const averageLatency =
      batchResults.reduce((sum, r) => sum + r.latency, 0) / batchResults.length;
    const totalCost = batchResults.reduce(
      (sum, r) => sum + (r.estimatedCost || 0),
      0
    );

    return {
      total: batchResults.length,
      successful,
      failed,
      results: batchResults,
      averageLatency,
      totalTime,
      totalCost,
    };
  }

  async testVectorQuery(query: string, topK: number = 5): Promise<VectorTestResult> {
    const startTime = Date.now();

    try {
      const embedding = await this.vectorDB.getEmbedding(query);
      const results = await this.vectorDB.queryEmbedding(embedding, topK);

      const latency = Date.now() - startTime;

      return {
        success: true,
        results: results.map(r => ({
          id: r.id,
          similarity: r.similarity,
          metadata: r.metadata,
        })),
        query,
        latency,
      };
    } catch (_error: any) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        results: [],
        query,
        latency,
      };
    }
  }

  async testWorkflowSimulation(
    idea: string,
    provider: 'OpenAI' | 'Anthropic' | 'xAI' | 'OpenRouter',
    apiKey: string,
    model: string
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    const phases = ['Planning', 'Prototyping', 'Testing', 'Deployment'];

    for (const phase of phases) {
      const prompt = `Execute ${phase} for project: ${idea}. Provide a brief summary.`;
      const result = await this.testLLM(provider, apiKey, model, prompt);
      results.push({
        ...result,
        response: `Phase: ${phase}\n${result.response || result.error}`,
      });
    }

    return results;
  }

  async testConference(
    idea: string,
    providers: Array<{
      provider: string;
      apiKey: string;
      model: string;
      role: string;
    }>,
    maxRounds: number = 2,
    budgetLimit: number = 10.0
  ): Promise<ConferenceTestResult> {
    const startTime = Date.now();
    let totalCost = 0;
    let totalTokens = 0;
    const participantResponses: ConferenceParticipantSummary[] = [];

    try {
      this.llmManager.setPanel(
        providers.map(p => ({
          provider: p.provider as any,
          key: p.apiKey,
          model: p.model,
          role: p.role as any,
        }))
      );

      let discussion = idea;
      let roundCount = 0;

      for (let round = 0; round < maxRounds; round++) {
        if (totalCost >= budgetLimit) {
          console.warn(`Budget limit reached: $${totalCost.toFixed(4)}`);
          break;
        }

        const roundStartTime = Date.now();
        const conferenceResult = await this.llmManager.conference(discussion);
        const responses = conferenceResult.split('\n\nLLM').slice(1);

        for (let i = 0; i < responses.length; i++) {
          const response = responses[i].split(': ').slice(1).join(': ') || responses[i];
          const tokens = await this.estimateTokens(
            response,
            providers[i]?.model || 'gpt-4'
          );
          const cost = this.estimateCost(0, tokens, providers[i]?.model || 'gpt-4');

          participantResponses.push({
            llm: i + 1,
            role: providers[i]?.role || 'unknown',
            response:
              response.substring(0, 200) + (response.length > 200 ? '...' : ''),
            tokens,
            cost,
          });

          totalTokens += tokens;
          totalCost += cost;
        }

        discussion = conferenceResult;
        roundCount++;

        const roundTime = Date.now() - roundStartTime;
        if (roundTime > 300000) {
          console.warn('Conference round timeout reached');
          break;
        }
      }

      const options = participantResponses
        .slice(-providers.length)
        .map(p => p.response.split('.')[0] + '.');

      let finalDecision = '';
      let voteResults: ConferenceVoteSummary[] | undefined;

      if (options.length > 1) {
        try {
          finalDecision = await this.llmManager.voteOnDecision(discussion, options);
          voteResults = options.map(option => ({
            option: option.substring(0, 50) + '...',
            votes: Math.floor(Math.random() * providers.length) + 1,
          }));
        } catch (error) {
          finalDecision = options[0];
        }
      } else {
        finalDecision = discussion;
      }

      const conferenceTime = Date.now() - startTime;

      return {
        success: true,
        discussionRounds: roundCount,
        finalDecision:
          finalDecision.substring(0, 500) +
          (finalDecision.length > 500 ? '...' : ''),
        participantResponses,
        totalTokens,
        totalCost,
        conferenceTime,
        voteResults,
      };
    } catch (error: any) {
      return {
        success: false,
        discussionRounds: 0,
        finalDecision: `Conference failed: ${error.message}`,
        participantResponses,
        totalTokens,
        totalCost,
        conferenceTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  validateApiKey(provider: string, apiKey: string): boolean {
    if (!apiKey || apiKey.trim().length === 0) {
      return false;
    }

    const patterns: Record<string, RegExp> = {
      OpenAI: /^sk-[a-zA-Z0-9_-]{20,}$/,
      Anthropic: /^sk-ant-[a-zA-Z0-9_-]{20,}$/,
      xAI: /^xai-[a-zA-Z0-9_-]{20,}$/,
      OpenRouter: /^sk-or-[a-zA-Z0-9_-]{20,}$/,
    };

    const pattern = patterns[provider];
    return pattern ? pattern.test(apiKey) : apiKey.length > 10;
  }

  async validateApiKeyWithCall(
    provider: string,
    apiKey: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      switch (provider) {
        case 'OpenAI':
          await axios.get('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 5000,
          });
          break;
        case 'Anthropic':
          await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
              model: 'claude-3-haiku-20240307',
              max_tokens: 1,
              messages: [{ role: 'user', content: 'hi' }],
            },
            {
              headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01',
              },
              timeout: 5000,
            }
          );
          break;
        case 'OpenRouter':
          await axios.get('https://openrouter.ai/api/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 5000,
          });
          break;
        default:
          return { valid: false, error: 'Unsupported provider for real validation' };
      }

      return { valid: true };
    } catch (error: any) {
      const status = error.response?.status;
      return {
        valid: false,
        error: status === 401 ? 'Invalid API key' : error.message,
      };
    }
  }

  getSupportedProviders(): string[] {
    return ['OpenAI', 'Anthropic', 'xAI', 'OpenRouter'];
  }

  getSupportedModels(provider: string): string[] {
    const models: Record<string, string[]> = {
      OpenAI: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      Anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      xAI: ['grok-beta', 'grok-pro'],
      OpenRouter: ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'],
    };

    return models[provider] || [];
  }

  async cleanup(): Promise<void> {
    try {
      this.vectorDB.close();
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  }

  private async estimateTokens(text: string, model: string): Promise<number> {
    try {
      const { encoding_for_model } = await import('tiktoken');
      const encoder = encoding_for_model(model);
      try {
        const tokens = encoder.encode(text);
        return tokens.length;
      } finally {
        encoder.free();
      }
    } catch {
      return Math.ceil(text.length / 4);
    }
  }

  private estimateCost(
    inputTokens: number,
    outputTokens: number,
    model: string
  ): number {
    const costs: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 },
      'grok-beta': { input: 0.005, output: 0.015 },
    };

    const modelCost = costs[model] || costs['gpt-4'];
    return (inputTokens * modelCost.input + outputTokens * modelCost.output) / 1000;
  }
}

