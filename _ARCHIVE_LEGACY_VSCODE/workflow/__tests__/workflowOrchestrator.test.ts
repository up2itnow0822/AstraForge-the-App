import { WorkflowOrchestrator } from '../workflowOrchestrator';
import { describe, it, expect } from '@jest/globals';

describe('WorkflowOrchestrator', () => {
  it('should be instantiable', () => {
    const orchestrator = new WorkflowOrchestrator();
    expect(orchestrator).toBeInstanceOf(WorkflowOrchestrator);
  });

  it('should inherit from EventEmitter', () => {
    const orchestrator = new WorkflowOrchestrator();
    expect(typeof orchestrator.on).toBe('function');
  });
});
