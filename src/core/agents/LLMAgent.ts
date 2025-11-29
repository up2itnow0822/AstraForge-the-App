import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Agent, AgentTask, AgentResult, Vote } from '../Agent';
import { OllamaProvider } from '../../llm/providers/OllamaProvider';
import { BaseLLMProvider } from '../../llm/providers/baseProvider';
import { localLLMQueue } from '../utils/RequestQueue';

export interface AgentConfigOptions {
    provider: string;
    model: string;
    apiKey?: string;
    endpoint?: string;
}

export class LLMAgent implements Agent {
  private provider: BaseLLMProvider | OpenAI | Anthropic;
  private isLocal: boolean = false;
  private isAnthropic: boolean = false;
  private config: AgentConfigOptions;

  constructor(
    public id: string,
    public name: string,
    public role: string,
    private systemPrompt: string,
    config: AgentConfigOptions
  ) {
    this.config = config;
    const { provider, model, apiKey, endpoint } = config;

    // Normalize provider string
    const providerKey = provider.toLowerCase();

    if (providerKey === 'ollama') {
        this.isLocal = true;
        this.provider = new OllamaProvider({
            apiKey: 'ollama',
            model: model,
            endpoint: endpoint || 'http://127.0.0.1:11434',
            name: 'ollama'
        });
    } else if (providerKey === 'lm-studio' || providerKey === 'lmstudio') {
        // LM Studio mimics OpenAI API
        this.provider = new OpenAI({
            baseURL: endpoint || 'http://localhost:1234/v1',
            apiKey: apiKey || 'lm-studio',
            dangerouslyAllowBrowser: true
        });
    } else if (providerKey === 'openrouter') {
        this.provider = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: apiKey,
            defaultHeaders: {
                "HTTP-Referer": "https://astraforge.app", 
                "X-Title": "AstraForge"
            }
        });
    } else if (providerKey === 'grok') {
        // xAI (Grok) is OpenAI compatible
        this.provider = new OpenAI({
            baseURL: 'https://api.x.ai/v1',
            apiKey: apiKey
        });
    } else if (providerKey === 'anthropic') {
        // Native Anthropic SDK support
        this.isAnthropic = true;
        this.provider = new Anthropic({
            apiKey: apiKey
        });
    } else {
        // Default to OpenAI
        this.provider = new OpenAI({ apiKey: apiKey });
    }
  }

  async executeTask(task: AgentTask): Promise<AgentResult> {
    try {
      let content = '';
      const promptContent = `Task: ${task.type}\nDescription: ${task.description}\nInput: ${JSON.stringify(task.input)}`;

      if (this.isLocal) {
         const prompt = `System: ${this.systemPrompt}\n${promptContent}`;
         const response = await localLLMQueue.enqueue(() => (this.provider as OllamaProvider).generate(prompt));
         content = response.content || 'No output';
      } else if (this.isAnthropic) {
         // Anthropic Claude API
         const response = await (this.provider as Anthropic).messages.create({
            model: this.config.model,
            max_tokens: 4096,
            system: this.systemPrompt,
            messages: [
              { role: 'user', content: promptContent }
            ]
         });
         const textBlock = response.content.find(block => block.type === 'text');
         content = textBlock && 'text' in textBlock ? textBlock.text : 'No output';
      } else {
         // OpenAI Compatible (OpenAI, OpenRouter, LM-Studio, Grok)
         const response = await (this.provider as OpenAI).chat.completions.create({
            model: this.config.model,
            messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: promptContent }
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
      const systemContent = `You are ${this.name}, a ${this.role}. ${this.systemPrompt}. Keep responses concise and professional.`;
      
      if (this.isLocal) {
          const prompt = `System: ${systemContent}\nUser: ${message}`;
          const response = await localLLMQueue.enqueue(() => (this.provider as OllamaProvider).generate(prompt));
          return response.content || '...';
      } else if (this.isAnthropic) {
          // Anthropic Claude API
          const response = await (this.provider as Anthropic).messages.create({
            model: this.config.model,
            max_tokens: 4096,
            system: systemContent,
            messages: [
              { role: 'user', content: message }
            ]
          });
          const textBlock = response.content.find(block => block.type === 'text');
          return textBlock && 'text' in textBlock ? textBlock.text : '...';
      } else {
          const response = await (this.provider as OpenAI).chat.completions.create({
            model: this.config.model,
            messages: [
            { role: 'system', content: systemContent },
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
          const prompt = `${systemInfo}\n\n${userPrompt}\n\nIMPORTANT: Output ONLY JSON.`;
          const response = await localLLMQueue.enqueue(() => (this.provider as OllamaProvider).generate(prompt, { temperature: 0.2 }));
          content = response.content || '';
      } else if (this.isAnthropic) {
          // Anthropic Claude API
          const response = await (this.provider as Anthropic).messages.create({
            model: this.config.model,
            max_tokens: 1024,
            system: systemInfo,
            messages: [
              { role: 'user', content: userPrompt + '\n\nIMPORTANT: Output ONLY valid JSON, no other text.' }
            ]
          });
          const textBlock = response.content.find(block => block.type === 'text');
          content = textBlock && 'text' in textBlock ? textBlock.text : '';
      } else {
          const response = await (this.provider as OpenAI).chat.completions.create({
            model: this.config.model,
            response_format: { type: 'json_object' },
            messages: [
            { role: 'system', content: systemInfo },
            { role: 'user', content: userPrompt }
            ]
          });
          content = response.choices[0].message.content || '';
      }

      if (!content) throw new Error("Empty voting response");
      
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
