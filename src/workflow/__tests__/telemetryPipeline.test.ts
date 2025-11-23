import { TelemetryPipeline } from '../telemetryPipeline';

// Mock dependencies
jest.mock('../../utils/logger', () => ({
    Logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    }
}));

describe('TelemetryPipeline', () => {
    let telemetry: TelemetryPipeline;

    beforeEach(() => {
        telemetry = new TelemetryPipeline();
    });

    test('should be instantiable', () => {
        expect(telemetry).toBeDefined();
    });
});
