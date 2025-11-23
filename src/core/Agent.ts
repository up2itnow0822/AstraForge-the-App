import { LanceDBClient } from './storage/LanceDBClient';
import { LLMProvider } from '../llm/interfaces';

export interface AgentConfig {
  id: string;
  name: string;
  llmProvider: LLMProvider;
  lanceDB: LanceDBClient;
}

export interface AgentTask {
  id: string;
  type: string;
  input: any;
  metadata?: Record<string, any>;
}

export interface AgentResult {
  agentId: string;
  status: 'completed' | 'failed' | 'pending';
  output: any;
  error?: string;
}

export abstract class Agent {
  public readonly id: string;
  public readonly name: string;
  protected llmProvider: LLMProvider;
  protected lanceDB: LanceDBClient;

  constructor(config: AgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.llmProvider = config.llmProvider;
    this.lanceDB = config.lanceDB;
  }

  abstract executeTask(task: AgentTask): Promise<AgentResult>;

  protected async storeResult(result: AgentResult): Promise<void> {
    // Store in LanceDB
    await this.lanceDB.insert([result]);
  }
}
