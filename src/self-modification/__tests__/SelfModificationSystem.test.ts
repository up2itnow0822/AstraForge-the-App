import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SelfModificationSystem } from '../SelfModificationSystem';
import { MetaLearningSystem } from '../../meta-learning/MetaLearningSystem';
import { EmergentBehaviorSystem } from '../../emergent-behavior/EmergentBehaviorSystem';

const mockMeta = {} as unknown as MetaLearningSystem;
const mockEmergent = {} as unknown as EmergentBehaviorSystem;

describe('SelfModificationSystem', () => {
    let system: SelfModificationSystem;

    beforeEach(() => {
        system = new SelfModificationSystem(mockMeta, mockEmergent);
    });

    it('should analyze codebase', async () => {
        const res = await system.analyzeCodebase('/tmp');
        expect(res.complexity).toBe('high');
    });

    it('should propose changes for high complexity', async () => {
        const analysis = { complexity: 'high' };
        const proposals = await system.proposeChanges(analysis);
        expect(proposals.length).toBeGreaterThan(0);
        expect(proposals[0].type).toBe('refactor');
    });

    it('should not propose changes for low complexity', async () => {
        const analysis = { complexity: 'low' };
        const proposals = await system.proposeChanges(analysis);
        expect(proposals.length).toBe(0);
    });
    
    it('should apply changes', async () => {
        const result = await system.applyChanges([{ type: 'refactor' }]);
        expect(result).toBe(true);
    });
});
