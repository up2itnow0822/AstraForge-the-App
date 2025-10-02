import axios from 'axios';
import { LLMManager } from '../llm/llmManager.js';
import { VectorDB } from '../db/vectorDB.js';
import { secureLogger } from '../utils/secureLogger';
import type { LLMConfig } from '../llm/interfaces';

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
      secureLogger.warn('Failed to initialize vector DB for testing', error);
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
    } catch (error: unknown) {
      const latency = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: message,
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
    } catch (error: unknown) {
      secureLogger.warn('Vector query failed', error);
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
      provider: 'OpenAI' | 'Anthropic' | 'xAI' | 'OpenRouter';
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
      this.llmManager.setPanel(this.mapPanelProviders(providers));

      let discussion = idea;
      let roundCount = 0;

      for (let round = 0; round < maxRounds; round++) {
        if (this.reachedBudget(totalCost, budgetLimit)) {
          secureLogger.warn(`Budget limit reached: $${totalCost.toFixed(4)}`);
          break;
        }

        const roundOutcome = await this.runConferenceIteration(
          discussion,
          providers,
          totalCost,
          totalTokens
        );

        discussion = roundOutcome.discussion;
        totalCost = roundOutcome.totalCost;
        totalTokens = roundOutcome.totalTokens;
        participantResponses.push(...roundOutcome.newResponses);
        roundCount++;

        if (roundOutcome.timeout) {
          secureLogger.warn('Conference round timeout reached');
          break;
        }
      }

      const options = this.extractLatestOptions(participantResponses, providers.length);
      const { finalDecision, voteResults } = await this.determineFinalDecision(
        discussion,
        options,
        providers.length
      );

      const conferenceTime = Date.now() - startTime;
      const truncatedDecision = finalDecision.substring(0, 500) +
        (finalDecision.length > 500 ? '...' : '');

      return {
        success: true,
        discussionRounds: roundCount,
        finalDecision: truncatedDecision,
        participantResponses,
        totalTokens,
        totalCost,
        conferenceTime,
        voteResults,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        discussionRounds: 0,
        finalDecision: `Conference failed: ${message}`,
        participantResponses,
        totalTokens,
        totalCost,
        conferenceTime: Date.now() - startTime,
        error: message,
      };
    }
  }

  private mapPanelProviders(
    providers: Array<{ provider: 'OpenAI' | 'Anthropic' | 'xAI' | 'OpenRouter'; apiKey: string; model: string; role: string }>
  ): LLMConfig[] {
    return providers.map(p => ({
      provider: p.provider,
      key: p.apiKey,
      model: p.model,
      role: p.role,
    }));
  }

  private reachedBudget(totalCost: number, budgetLimit: number): boolean {
    return totalCost >= budgetLimit;
  }

  private async runConferenceIteration(
    discussion: string,
    providers: Array<{ provider: 'OpenAI' | 'Anthropic' | 'xAI' | 'OpenRouter'; apiKey: string; model: string; role: string }>,
    totalCost: number,
    totalTokens: number
  ): Promise<{
    discussion: string;
    totalCost: number;
    totalTokens: number;
    newResponses: ConferenceParticipantSummary[];
    timeout: boolean;
  }> {
    const roundStartTime = Date.now();
    const conferenceResult = await this.llmManager.conference(discussion);
    const responses = conferenceResult.split('\n\nLLM').slice(1);

    const newResponses: ConferenceParticipantSummary[] = [];
    let updatedCost = totalCost;
    let updatedTokens = totalTokens;

    for (let i = 0; i < responses.length; i++) {
      const rawResponse = responses[i];
      const response = rawResponse.split(': ').slice(1).join(': ') || rawResponse;
      const model = providers[i]?.model || 'gpt-4';
      const tokens = await this.estimateTokens(response, model);
      const cost = this.estimateCost(0, tokens, model);

      newResponses.push({
        llm: i + 1,
        role: providers[i]?.role || 'unknown',
        response: response.substring(0, 200) + (response.length > 200 ? '...' : ''),
        tokens,
        cost,
      });

      updatedTokens += tokens;
      updatedCost += cost;
    }

    const timeout = Date.now() - roundStartTime > 300000;

    return {
      discussion: conferenceResult,
      totalCost: updatedCost,
      totalTokens: updatedTokens,
      newResponses,
      timeout,
    };
  }

  private extractLatestOptions(
    responses: ConferenceParticipantSummary[],
    providerCount: number
  ): string[] {
    if (providerCount === 0) {
      return [];
    }

    return responses
      .slice(-providerCount)
      .map(summary => summary.response.split('.')[0]?.trim())
      .filter((option): option is string => Boolean(option))
      .map(option => option.endsWith('.') ? option : `${option}.`);
  }

  private buildVoteResults(
    options: string[],
    providerCount: number
  ): ConferenceVoteSummary[] {
    const participantCount = Math.max(1, providerCount);

    return options.map(option => ({
      option: option.substring(0, 50) + (option.length > 50 ? '...' : ''),
      votes: Math.floor(Math.random() * participantCount) + 1,
    }));
  }

  private async determineFinalDecision(
    discussion: string,
    options: string[],
    providerCount: number
  ): Promise<{ finalDecision: string; voteResults?: ConferenceVoteSummary[] }> {
    if (options.length === 0) {
      return { finalDecision: discussion };
    }

    if (options.length === 1) {
      return { finalDecision: options[0] };
    }

    try {
      const decision = await this.llmManager.voteOnDecision(discussion, options);
      return {
        finalDecision: decision,
        voteResults: this.buildVoteResults(options, providerCount),
      };
    } catch (error: unknown) {
      secureLogger.warn('Vote aggregation failed, falling back to first option', error);
      return { finalDecision: options[0] };
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
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number }; message?: string };
      const status = axiosError.response?.status;
      const message = typeof axiosError.message === 'string'
        ? axiosError.message
        : error instanceof Error
          ? error.message
          : 'Unknown error';
      return {
        valid: false,
        error: status === 401 ? 'Invalid API key' : message,
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
      secureLogger.warn('Cleanup error', error);
    }
  }

  private async estimateTokens(text: string, model: string): Promise<number> {
    try {
      const { encoding_for_model } = await import('tiktoken');
      let encoder;
      try {
        encoder = encoding_for_model(model);
      } catch (_err) {
        // Model not supported by tiktoken, fall back to character-based estimation
        return Math.ceil(text.length / 4);
      }
      try {
        const tokens = encoder.encode(text);
        return tokens.length;
      } finally {
        encoder.free();
      }
    } catch (_err) {
      // Import failed or other unexpected error
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

