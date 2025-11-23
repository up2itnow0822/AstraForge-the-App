// LLM Configuration
export interface LLMConfig {
apiKey: string;
model?: string;
temperature?: number;
maxTokens?: number;
name?: string;
[key: string]: any;
}

// Usage Tracking
export interface Usage {
promptTokens: number;
completionTokens: number;
totalTokens: number;
}

// LLM Response
export interface LLMResponse {
content?: string;
text?: string;
confidence?: number;
finishReason?: string;
usage?: Usage;
tokensUsed?: number;
sources?: string[];
timestamp?: number;
}

// LLM Provider
export interface LLMProvider {
name: string;
model: string;
apiKey: string;

generate(prompt: string, options?: any): Promise<LLMResponse>;
call(prompt: string, options?: any): Promise<LLMResponse>;
embed(text: string): Promise<number[]>;
}

// Consensus Result
export interface ConsensusResult {
text: string;
confidence: number;
sources: string[];
timestamp?: number;
}

// LLM Manager Config
export interface LLMManagerConfig {
providers: LLMProvider[];
cacheEnabled?: boolean;
consensusThreshold?: number;
}
