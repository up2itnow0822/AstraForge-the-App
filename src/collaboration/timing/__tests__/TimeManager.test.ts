import { TimeManager } from '../TimeManager';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('TimeManager', () => {
    let timeManager: TimeManager;

    beforeEach(() => {
        timeManager = new TimeManager();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should set and clear timeout', () => {
        const callback = jest.fn();
        timeManager.setTimeout('s1', 1000, callback);

        expect(callback).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1000);
        expect(callback).toHaveBeenCalled();
    });

    it('should clear specific timeout', () => {
        const callback = jest.fn();
        timeManager.setTimeout('s1', 1000, callback);
        timeManager.clearTimeout('s1');

        jest.advanceTimersByTime(1000);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should clear all timeouts', () => {
        const cb1 = jest.fn();
        const cb2 = jest.fn();
        timeManager.setTimeout('s1', 1000, cb1);
        timeManager.setTimeout('s2', 1000, cb2);

        timeManager.clearAll();
        jest.advanceTimersByTime(1000);

        expect(cb1).not.toHaveBeenCalled();
        expect(cb2).not.toHaveBeenCalled();
    });
});
