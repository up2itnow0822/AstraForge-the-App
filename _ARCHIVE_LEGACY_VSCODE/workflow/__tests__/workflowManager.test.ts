import { WorkflowManager, Workflow } from '../workflowManager';

describe('WorkflowManager', () => {
  let manager: WorkflowManager;

  beforeEach(() => {
    manager = new WorkflowManager();
  });

  it('should start and complete a registered workflow', async () => {
    const workflow: Workflow = {
      id: 'test-workflow',
      steps: [{ id: 'step1', description: 'Test Step' }]
    };

    manager.registerWorkflow(workflow);

    const startSpy = jest.fn();
    const completeSpy = jest.fn();
    manager.on('workflowStarted', startSpy);
    manager.on('workflowCompleted', completeSpy);

    await manager.executeWorkflow('test-workflow');

    expect(startSpy).toHaveBeenCalledWith('test-workflow');
    expect(completeSpy).toHaveBeenCalledWith('test-workflow');
  });

  it('should throw error if workflow not found', async () => {
    await expect(manager.executeWorkflow('non-existent')).rejects.toThrow(
      'Workflow with id non-existent not found'
    );
  });

  it('should emit event when runWorkflow is called', async () => {
    const startSpy = jest.fn();
    manager.on('workflowStarted', startSpy);
    await manager.runWorkflow('some-spec');
    expect(startSpy).toHaveBeenCalledWith('some-spec');
  });
});
