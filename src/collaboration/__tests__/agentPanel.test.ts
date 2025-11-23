import { AgentPanel, PanelAgent } from '../agentPanel';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('AgentPanel', () => {
    let agentPanel: AgentPanel;

    beforeEach(() => {
        agentPanel = new AgentPanel();
    });

    it('should register an agent', async () => {
        const agent: PanelAgent = { id: 'a1', role: 'developer', status: 'idle' };
        const emitSpy = jest.spyOn(agentPanel, 'emit');

        await agentPanel.registerAgent(agent);

        expect(agentPanel.getAgent('a1')).toEqual(agent);
        expect(emitSpy).toHaveBeenCalledWith('agentRegistered', agent);
    });

    it('should update agent status', async () => {
        const agent: PanelAgent = { id: 'a1', role: 'developer', status: 'idle' };
        await agentPanel.registerAgent(agent);

        const emitSpy = jest.spyOn(agentPanel, 'emit');
        await agentPanel.updateStatus('a1', 'busy');

        expect(agentPanel.getAgent('a1')?.status).toBe('busy');
        expect(emitSpy).toHaveBeenCalledWith('agentStatusChanged', { agentId: 'a1', status: 'busy' });
    });
});
