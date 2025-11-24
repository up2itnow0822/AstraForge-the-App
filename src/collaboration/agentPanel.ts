import { EventEmitter } from 'events';

export interface PanelAgent {
    id: string;
    role: string;
    status: 'idle' | 'busy' | 'offline';
}

export class AgentPanel extends EventEmitter {
    private agents: Map<string, PanelAgent> = new Map();

    /**
     *
     * @param agent
     */
    async registerAgent(agent: PanelAgent): Promise<void> {
        this.agents.set(agent.id, agent);
        this.emit('agentRegistered', agent);
    }

    /**
     *
     * @param agentId
     * @param status
     */
    async updateStatus(agentId: string, status: 'idle' | 'busy' | 'offline'): Promise<void> {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.status = status;
            this.emit('agentStatusChanged', { agentId, status });
        }
    }

    /**
     *
     * @param agentId
     */
    getAgent(agentId: string): PanelAgent | undefined {
        return this.agents.get(agentId);
    }

    /**
     *
     */
    getAllAgents(): PanelAgent[] {
        return Array.from(this.agents.values());
    }
}
