import { Agent, AgentTask, AgentResult } from '../../core/Agent';
import { LanceDBClient } from '../../core/storage/LanceDBClient';
import { LLMProvider } from '../../llm/interfaces';

export class TestAgent extends Agent {
    constructor(config: { id: string; llmProvider: LLMProvider; lanceDB: LanceDBClient }) {
        super({ ...config, name: 'TestAgent' });
    }

    async executeTask(task: AgentTask): Promise<AgentResult> {
        try {
            // Minimal implementation for testing
            return {
                agentId: this.id,
                status: 'completed',
                output: { result: 'Task processed by TestAgent', input: task.input }
            };
        } catch (error) {
            return {
                agentId: this.id,
                status: 'failed',
                output: {},
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
