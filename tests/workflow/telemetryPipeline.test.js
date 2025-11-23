"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telemetryPipeline_1 = require("../../src/workflow/telemetryPipeline");
describe('TelemetryPipeline', () => {
    it('flushes automatically when the buffer limit is reached and tracks aggregates', () => {
        const pipeline = new telemetryPipeline_1.TelemetryPipeline({ maxBufferSize: 2, flushIntervalMs: 60000 });
        const flushSpy = jest.spyOn(pipeline, 'flush');
        pipeline.record({
            category: 'workflow',
            type: 'analysis',
            severity: 'info',
            message: 'Initial event'
        });
        expect(flushSpy).not.toHaveBeenCalled();
        const second = pipeline.record({
            category: 'workflow',
            type: 'analysis',
            severity: 'error',
            message: 'Escalated event'
        });
        expect(flushSpy).toHaveBeenCalledTimes(1);
        const summary = pipeline.summary();
        const aggregate = summary.categories['workflow:analysis'];
        expect(summary.totalEvents).toBe(2);
        expect(aggregate.count).toBe(2);
        expect(aggregate.lastEvent).toBe(second.timestamp);
        expect(aggregate.highestSeverity).toBe('error');
        flushSpy.mockRestore();
        expect(pipeline.flush()).toHaveLength(0);
    });
    it('flushes after the interval elapses and continues notifying healthy subscribers', () => {
        let currentTime = 0;
        const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => currentTime);
        const pipeline = new telemetryPipeline_1.TelemetryPipeline({ maxBufferSize: 10, flushIntervalMs: 1000 });
        const flushSpy = jest.spyOn(pipeline, 'flush');
        const received = [];
        pipeline.onEvent(() => {
            throw new Error('subscriber failure');
        });
        pipeline.onEvent(event => {
            received.push(`${event.type}:${event.severity}`);
        });
        pipeline.record({
            category: 'workflow',
            type: 'interval',
            severity: 'info',
            message: 'First tick'
        });
        expect(flushSpy).not.toHaveBeenCalled();
        expect(received).toEqual(['interval:info']);
        currentTime = 2000;
        pipeline.record({
            category: 'workflow',
            type: 'interval',
            severity: 'warning',
            message: 'Second tick'
        });
        expect(flushSpy).toHaveBeenCalledTimes(1);
        expect(received).toEqual(['interval:info', 'interval:warning']);
        flushSpy.mockRestore();
        nowSpy.mockRestore();
    });
});
