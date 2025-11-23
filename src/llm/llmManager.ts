import { BaseLLMProvider } from './providers/baseProvider';
import { OpenAICompatibleProvider } from './providers/OpenAICompatibleProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { GitHubProvider } from './providers/GitHubProvider';

export interface LLMManagerConfig {
  providers: (OpenAICompatibleProvider | AnthropicProvider | GitHubProvider)[];
  cacheEnabled?: boolean;
  consensusThreshold?: number;
}

export interface ConsensusResult {
  text: string;
  confidence: number;
}

export class LLMManager {
  private providers: Map<string, BaseLLMProvider> = new Map();
  private cacheEnabled: boolean = false;
  private consensusThreshold: number = 0.7;

  constructor(config: LLMManagerConfig) {
    if (config.providers) {
      config.providers.forEach(provider => {
        this.providers.set(provider.name, provider);
      });
    }
    this.cacheEnabled = config.cacheEnabled || false;
    this.consensusThreshold = config.consensusThreshold || 0.7;
  }

  addProvider(provider: BaseLLMProvider): void {
    this.providers.set(provider.name, provider);
  }

  removeProvider(name: string): void {
    this.providers.delete(name);
  }

  getProviderCount(): number {
    return this.providers.size;
  }

  async generateConsensus(prompt: string): Promise<ConsensusResult> {
    const providerArray = Array.from(this.providers.values());
    if (providerArray.length === 0) {
      return { text: 'No providers available', confidence: 0 };
    }

    // Simple consensus using first provider
    const provider = providerArray[0];
    const response = await provider.generate(prompt);

    return {
      text: response.content || 'No response',
      confidence: 0.8
    };
  }
}
