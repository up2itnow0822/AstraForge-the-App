import OpenAI from 'openai';
import { Agent, AgentTask, AgentResult, Vote } from '../Agent';

export class LLMAgent implements Agent {
  private openai: OpenAI;

  constructor(
    public id: string,
    public name: string,
    public role: string,
    private systemPrompt: string,
    private apiKey: string,
    private model: string = 'gpt-4o-mini'
  ) {
    this.openai = new OpenAI({ apiKey: this.apiKey });
  }

  async executeTask(task: AgentTask): Promise<AgentResult> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: `Execute this task: ${task.type}. Description: ${task.description}. Input: ${JSON.stringify(task.input)}` }
        ]
      });

      return {
        status: 'completed',
        agentId: this.id,
        output: response.choices[0].message.content || 'No output'
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
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: `You are ${this.name}, a ${this.role}. ${this.systemPrompt}. Keep responses concise and professional.` },
          { role: 'user', content: message }
        ]
      });
      return response.choices[0].message.content || '...';
    } catch (error) {
      return `[Error generating response: ${error}]`;
    }
  }

  async castVote(proposal: string): Promise<Vote> {
    try {
      const prompt = `
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

      const response = await this.openai.chat.completions.create({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: this.systemPrompt + " You answer in JSON." },
          { role: 'user', content: prompt }
        ]
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error("Empty voting response");

      const parsed = JSON.parse(content);
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
