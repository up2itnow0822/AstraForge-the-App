export interface LLMProvider {
  name: string;
  model: string;
  apiKey: string;
  generate(prompt: string, options?: LLMConfig): Promise<LLMResponse>;
}

export interface LLMConfig {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  model?: string;
  key?: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed: number;
  finishReason: string;
  usage?: any;
}

export interface ConsensusResult {
  text: string;
  confidence: number;
  timestamp?: number;
  sources: string[];
  usage?: any;
}

export interface GenerateResponse {
  text: string;
  metadata: any;
}
