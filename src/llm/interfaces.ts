export interface GenerateResponse {
  text: string;
  confidence: number;
}

export interface ConsensusResult extends GenerateResponse {
  sources: string[];
  aggregateVote: number;
  fallbackUsed?: boolean;
}

export interface LLMProvider {
  name: string;
  model: string;
  apiKey: string;
  generate(prompt: string): Promise<GenerateResponse>;
  embed?(text: string): Promise<number[]>;
}
EOF && cat > src/llm/providers/GitHubProvider.ts << 'EOF'
import { Octokit } from '@octokit/rest';
import { LLMProvider, GenerateResponse } from '../interfaces';

export class GitHubProvider implements LLMProvider {
  name = 'GitHub';
  model = 'vcs-context';
  apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (!apiKey) throw new Error('GitHub token required');
  }

  async generate(prompt: string): Promise<GenerateResponse> {
    try {
      const octokit = new Octokit({ auth: this.apiKey });
      // Assume default repo from vscode or fallback
      const { data } = await octokit.search.code({
        q: prompt,
        per_page: 5,
      });
      const context = data.items.slice(0, 3).map(item => item.text_matches?.[0]?.fragment || '').join('\n');
      const text = context ? `VCS Context for \"${prompt}\":\n${context}` : 'No VCS context found.';
      return { text, confidence: 1.0 };
    } catch (error) {
      console.error('GitHub generate error:', error);
      return { text: 'GitHub context unavailable.', confidence: 0.5 };
    }
  }

  async embed(text: string): Promise<number[]> {
    // Mock embedding for compatibility, same dim as text-embedding-3-small
    return Array(1536).fill(0.001);
  }

  static createForFive(apiKey: string): GitHubProvider {
    return new GitHubProvider(apiKey);
  }
}
