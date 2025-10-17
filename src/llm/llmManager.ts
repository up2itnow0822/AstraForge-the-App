import * as crypto from 'node:crypto';
import * as math from 'mathjs';
import { setTimeout } from 'timers/promises';
import { EnvLoader } from '../utils/envLoader';
import { LLMCache } from './cache';
import { OpenAICompatibleProvider, AnthropicProvider, GitHubProvider } from './providers';
import { LLMProvider, GenerateResponse, ConsensusResult } from './interfaces';

class LLMManager {
  private providers: LLMProvider[] = [];
  private cache: LLMCache;
  private circuitOpen = false;
  private failedCount = 0;

  constructor(cache?: LLMCache) {
    this.cache = cache || new LLMCache();
  }

  async init(): Promise<void> {
    await EnvLoader.loadSecrets();

    const openaiKey = process.env.OPENAI_API_KEY!;
    const anthroKey = process.env.ANTHROPIC_API_KEY!;
    const xaiKey = process.env.XAI_API_KEY!;
    const routerKey = process.env.OPENROUTER_API_KEY!;
    const githubToken = process.env.GITHUB_TOKEN!;

    if (!openaiKey || !anthroKey || !xaiKey || !routerKey || !githubToken) {
      throw new Error('Missing required API keys from environment');
    }

    this.providers = [
      OpenAICompatibleProvider.createForOne(openaiKey),
      AnthropicProvider.createForTwo(anthroKey),
      OpenAICompatibleProvider.createForThree(xaiKey),
      OpenAICompatibleProvider.createForFour(routerKey),
      GitHubProvider.createForFive(githubToken),
    ];
  }

  async consensusGenerate(prompt: string): Promise<ConsensusResult> {
    if (this.circuitOpen) {
      throw new Error('Circuit breaker is open. Please wait.');
    }

    const key = crypto.createHash('md5').update(prompt).digest('hex');
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const genEntries = this.providers.map((p) => p.generate(prompt).then(res => ({ provider: p.name, res })).catch(err => ({ provider: p.name, error: err })));
    const results = await Promise.allSettled(genEntries);
    const successful = (results.filter((r): r is PromiseFulfilledResult<{ provider: string; res: GenerateResponse }> => r.status === 'fulfilled').map(r => r.value)).filter(v => !('error' in v));

    let agg: ConsensusResult;
    let fallbackUsed = false;

    if (successful.length >= 3) {
      const texts = successful.map(v => v.res.text);
      // Embed all texts using first provider (OpenAI capable for embeddings)
      const embedPromises = texts.map(t => this.providers[0].embed!(t));
      const embs = await Promise.all(embedPromises);

      const sims: number[] = [];
      for (let i = 0; i < embs.length; i++) {
        for (let j = i + 1; j < embs.length; j++) {
          if (embs[i].length > 0 && embs[j].length > 0) {
            const dot = math.dot(embs[i], embs[j]);
            const normI = math.norm(embs[i], '2');
            const normJ = math.norm(embs[j], '2');
            const sim = dot / (normI * normJ);
            sims.push(sim);
          }
        }
      }
      const avgSim = sims.length > 0 ? sims.reduce((a, b) => a + b, 0) / sims.length : 0;

      if (avgSim > 0.7) {
        // Select response with highest confidence
        const maxIdx = successful.reduce((maxI, cur, i) => cur.res.confidence > successful[maxI].res.confidence ? i : maxI, 0);
        agg = {
          text: successful[maxIdx].res.text,
          confidence: avgSim,
          sources: successful.map(v => v.provider),
          aggregateVote: avgSim,
        };
      } else {
        fallbackUsed = true;
        agg = await this.fallbackGenerate(prompt);
      }
    } else {
      fallbackUsed = true;
      agg = await this.fallbackGenerate(prompt);
    }

    // Update circuit based on failures
    const failures = results.filter(r => r.status === 'rejected').length + (successful.filter(v => 'error' in v).length);
    this.failedCount += failures;
    if (this.failedCount > 3) {
      this.circuitOpen = true;
      setTimeout(() => {
        this.circuitOpen = false;
        this.failedCount = 0;
      }, 5000);
    }

    agg.fallbackUsed = fallbackUsed;
    this.cache.set(key, agg);
    return agg;
  }

  private async fallbackGenerate(prompt: string): Promise<ConsensusResult> {
    for (const provider of this.providers.slice(0, 4)) {  // Skip GitHub for fallback
      try {
        const res = await provider.generate(prompt);
        if (res.text.length > 0) {
          return {
            text: res.text,
            confidence: 0.75,
            sources: [provider.name],
            aggregateVote: 0.75,
            fallbackUsed: true,
          };
        }
      } catch (error) {
        console.error(`Fallback error from ${provider.name}:`, error);  // Masked in logger
      }
    }
    throw new Error('All fallback providers failed');
  }
}

export default new LLMManager();
