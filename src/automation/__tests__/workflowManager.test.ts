import { WorkflowManager } from '../workflowManager';

describe('WorkflowManager', () => {
    let manager: WorkflowManager;

    beforeEach(() => {
        manager = new WorkflowManager();
    });

    it('should register and retrieve a workflow', () => {
        const workflow = { id: 'wf1', steps: [] };
        manager.registerWorkflow('wf1', workflow);
        expect(manager.getWorkflow('wf1')).toBe(workflow);
    });

    it('should execute a registered workflow', async () => {
        const workflow = { id: 'wf1', execute: jest.fn() };
        manager.registerWorkflow('wf1', workflow);
        await expect(manager.executeWorkflow('wf1')).resolves.toBeUndefined();
    });

    it('should throw error when executing non-existent workflow', async () => {
        await expect(manager.executeWorkflow('non-existent')).rejects.toThrow('Workflow not found');
    });
});
