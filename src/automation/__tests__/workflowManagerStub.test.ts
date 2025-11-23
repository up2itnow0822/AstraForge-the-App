import { describe, it, expect } from '@jest/globals';
import { WorkflowManager } from '../workflowManager';

describe('WorkflowManager', () => {
    it('should register and retrieve workflows', () => {
        const wm = new WorkflowManager();
        const workflow = { id: 'wf-1' };
        wm.registerWorkflow('wf-1', workflow);
        expect(wm.getWorkflow('wf-1')).toBe(workflow);
    });

    it('should execute workflow', async () => {
        const wm = new WorkflowManager();
        wm.registerWorkflow('wf-1', {});
        await expect(wm.executeWorkflow('wf-1')).resolves.not.toThrow();
    });

    it('should throw on missing workflow', async () => {
        const wm = new WorkflowManager();
        await expect(wm.executeWorkflow('missing')).rejects.toThrow('Workflow not found: missing');
    });
});
