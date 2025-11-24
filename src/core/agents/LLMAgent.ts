import OpenAI from 'openai';
import { Agent, AgentTask, AgentResult, Vote } from '../Agent';
import { OllamaProvider } from '../../llm/providers/OllamaProvider';
import { BaseLLMProvider } from '../../llm/providers/baseProvider';

export class LLMAgent implements Agent {
  private provider: BaseLLMProvider | OpenAI;
  private isLocal: boolean = false;

  constructor(
    public id: string,
    public name: string,
    public role: string,
    private systemPrompt: string,
    private apiKey: string,
    private model: string = 'gpt-4o-mini',
    private endpoint?: string
  ) {
    // Detection Logic: If endpoint is provided, assume Ollama/Local
    // Or if apiKey is explicitly 'ollama'
    if (this.endpoint || this.apiKey === 'ollama') {
        this.isLocal = true;
        this.provider = new OllamaProvider({
            apiKey: 'ollama',
            model: this.model,
            endpoint: this.endpoint || 'http://127.0.0.1:11434',
            name: 'ollama'
        });
    } else {
        this.provider = new OpenAI({ apiKey: this.apiKey });
    }
  }

  async executeTask(task: AgentTask): Promise<AgentResult> {
    try {
      let content = '';
      const prompt = `System: ${this.systemPrompt}\nTask: ${task.type}\nDescription: ${task.description}\nInput: ${JSON.stringify(task.input)}`;

      if (this.isLocal) {
         const response = await (this.provider as OllamaProvider).generate(prompt);
         content = response.content || 'No output';
      } else {
         const response = await (this.provider as OpenAI).chat.completions.create({
            model: this.model,
            messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: `Execute this task: ${task.type}. Description: ${task.description}. Input: ${JSON.stringify(task.input)}` }
            ]
         });
         content = response.choices[0].message.content || 'No output';
      }

      return {
        status: 'completed',
        agentId: this.id,
        output: content
      };
    } catch (error: any) {
      return {
        status: 'failed',
        agentId: this.id,
        error: error.message,
        output: null
      };
    }
  }

  async processMessage(message: string): Promise<string> {
    try {
      const prompt = `System: You are ${this.name}, a ${this.role}. ${this.systemPrompt}. Keep responses concise and professional.\nUser: ${message}`;

      if (this.isLocal) {
          const response = await (this.provider as OllamaProvider).generate(prompt);
          return response.content || '...';
      } else {
          const response = await (this.provider as OpenAI).chat.completions.create({
            model: this.model,
            messages: [
            { role: 'system', content: `You are ${this.name}, a ${this.role}. ${this.systemPrompt}. Keep responses concise and professional.` },
            { role: 'user', content: message }
            ]
          });
          return response.choices[0].message.content || '...';
      }
    } catch (error) {
      return `[Error generating response: ${error}]`;
    }
  }

  async castVote(proposal: string): Promise<Vote> {
    try {
      const systemInfo = `You are ${this.name}, a ${this.role}. ${this.systemPrompt}. You answer in JSON.`;
      const userPrompt = `
You are voting on a proposal.
Proposal: "${proposal}"

Evaluate based on your role: ${this.role}.
Response MUST be valid JSON in this format:
{
"verdict": "approve" | "reject" | "abstain",
"reasoning": "...short explanation...",
"weight": 1
}
`;

      let content = '';

      if (this.isLocal) {
          // Ollama often needs strong prompting for JSON if format enforcement isn't available
          const prompt = `${systemInfo}\n\n${userPrompt}\n\nIMPORTANT: Output ONLY JSON.`;
          const response = await (this.provider as OllamaProvider).generate(prompt, { temperature: 0.2 });
          content = response.content || '';
      } else {
          const response = await (this.provider as OpenAI).chat.completions.create({
            model: this.model,
            response_format: { type: 'json_object' },
            messages: [
            { role: 'system', content: systemInfo },
            { role: 'user', content: userPrompt }
            ]
          });
          content = response.choices[0].message.content || '';
      }

      if (!content) throw new Error("Empty voting response");
      
      // Basic aggressive JSON cleanup for local models
      const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      return {
        agentId: this.id,
        proposalId: 'prop-current',
        verdict: parsed.verdict || 'abstain',
        reasoning: parsed.reasoning || 'No reasoning provided',
        weight: parsed.weight || 1
      };
    } catch (error) {
      console.error("Voting failed:", error);
      return {
        agentId: this.id,
        proposalId: 'error',
        verdict: 'abstain',
        reasoning: 'Voting mechanism failed',
        weight: 0
      };
    }
  }
}
