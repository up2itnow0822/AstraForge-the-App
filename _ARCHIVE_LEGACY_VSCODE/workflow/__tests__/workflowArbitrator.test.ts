import { WorkflowArbitrator } from '../workflowArbitrator';

// Mock dependencies
jest.mock('../telemetryPipeline', () => {
    return {
        TelemetryPipeline: jest.fn().mockImplementation(() => ({}))
    };
});

jest.mock('./types', () => ({}), { virtual: true });

describe('WorkflowArbitrator', () => {
    let arbitrator: WorkflowArbitrator;

    beforeEach(() => {
        arbitrator = new WorkflowArbitrator();
    });

    test('should be instantiable', () => {
        expect(arbitrator).toBeDefined();
    });
});
