import { StrategyOptimizer } from '../StrategyOptimizer';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('StrategyOptimizer', () => {
    let optimizer: StrategyOptimizer;

    beforeEach(() => {
        optimizer = new StrategyOptimizer();
    });

    it('should optimize strategy', async () => {
        const strategy = { id: 's1', name: 'Test', parameters: { lr: 0.1 } };
        const optimized = await optimizer.optimizeStrategy(strategy, {});
        expect(optimized.parameters.optimized).toBe(true);
    });
});
