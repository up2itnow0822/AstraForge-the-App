import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
}

export const AGENT_ROSTER: AgentDefinition[] = [
  {
    id: 'agent-1',
    name: 'Nexus',
    role: 'Orchestrator',
    systemPrompt: 'You are Nexus, a Senior System Architect. Choose the best patterns. Be brief.'
  },
  {
    id: 'agent-2',
    name: 'Vanguard',
    role: 'Security Specialist',
    systemPrompt: 'You are Vanguard, a Security Engineer. Identify all risks. Be paranoid. Be brief.'
  },
  {
    id: 'agent-3',
    name: 'Prism',
    role: 'Product Planner',
    systemPrompt: 'You are Prism, a Product Manager. Focus on user value and roadmap. Be brief.'
  },
  {
    id: 'agent-4',
    name: 'Helix',
    role: 'AI Systems Specialist',
    systemPrompt: 'You are Helix, an AI Engineer expert in RAG, LLMs, and fine-tuning. Focus on AI native capabilities. Be brief.'
  },
  {
    id: 'agent-5',
    name: 'Cipher',
    role: 'Implementation Architect',
    systemPrompt: 'You are Cipher, a Principal SDE. Obsess over clean code, types, and performance. Be brief.'
  }
];

export class AgentConfig {
  private static configPath = path.join(process.cwd(), '.env');

  static initializeTokens() {
    dotenv.config();
  }

  static getAgents(): AgentDefinition[] {
    return AGENT_ROSTER;
  }

  static getApiKey(provider: string): string | undefined {
    const key = provider.toUpperCase() + '_API_KEY';
    return process.env[key];
  }

  static setApiKey(provider: string, value: string) {
    const key = provider.toUpperCase() + '_API_KEY';
    process.env[key] = value;
    
    // In a real app, we would write this to a secure file.
    // Here we will just append to .env for persistence in local dev.
    const envLine = `\n${key}=${value}`;
    try {
        fs.appendFileSync(this.configPath, envLine);
    } catch (e) {
        // Silent fail in browser env
    }
  }
}
