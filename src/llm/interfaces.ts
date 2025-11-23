export interface LLMProvider {
  generate(prompt: string, options?: any): Promise<GenerationResult>;
  embed(texts: string[], options?: any): Promise<EmbeddingResult>;
  getName(): string;
  isAvailable(): boolean;
  config: LLMConfig;
}

export interface LLMConfig {
  name: string;
  apiKey: string;
  model?: string;
  endpoint?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerationResult {
  text: string;
  tokens?: number;
  confidence?: number;
  provider?: string;
  cost?: number;
}

export interface EmbeddingResult {
  embeddings: number[][];
  tokens?: number;
  provider?: string;
}

export interface ConsensusResult {
  consensusReached: boolean;
  consensusLevel: number;
  finalResponse: string;
  confidence: number;
  providerResponses?: Array<{ provider: string; response: string; confidence: number }>;
  alternativeSuggestions?: string[];
}

export interface EmbeddingConsensus {
  consensusReached: boolean;
  consensusEmbedding: number[];
  participants: string[];
  variance: number;
}
