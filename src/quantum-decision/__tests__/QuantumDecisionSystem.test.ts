import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { QuantumDecisionSystem } from '../QuantumDecisionSystem';
import { MetaLearningSystem } from '../../meta-learning/MetaLearningSystem';
import { EmergentBehaviorSystem } from '../../emergent-behavior/EmergentBehaviorSystem';

const mockMeta = {} as unknown as MetaLearningSystem;
const mockEmergent = {} as unknown as EmergentBehaviorSystem;

describe('QuantumDecisionSystem', () => {
    let system: QuantumDecisionSystem;

    beforeEach(() => {
        system = new QuantumDecisionSystem(mockMeta, mockEmergent);
    });

    it('should make a decision', async () => {
        const opts = ['A', 'B'];
        const res = await system.makeDecision(opts, {});
        expect(opts).toContain(res);
    });

    it('should collapse state', async () => {
        const probs = [0.3, 0.7];
        const res = await system.collapseState(probs);
        expect(res).toBeGreaterThanOrEqual(0);
    });
});
