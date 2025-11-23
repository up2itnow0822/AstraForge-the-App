import { MetaLearningSystem } from '../MetaLearningSystem';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('MetaLearningSystem', () => {
    let system: MetaLearningSystem;

    beforeEach(() => {
        system = new MetaLearningSystem();
    });

    it('should record outcome', async () => {
        const emitSpy = jest.spyOn(system, 'emit');
        await system.recordOutcome('strat1', true);
        expect(emitSpy).toHaveBeenCalledWith('outcomeRecorded', { strategyId: 'strat1', success: true });
    });

    it('should optimize', async () => {
        const emitSpy = jest.spyOn(system, 'emit');
        await system.optimize('strat1');
        expect(emitSpy).toHaveBeenCalledWith('strategyOptimized', 'strat1');
    });
});
