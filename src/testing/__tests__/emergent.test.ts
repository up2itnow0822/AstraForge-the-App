import { describe, it, expect } from '@jest/globals';
import { EmergentBehaviorDetector } from '../emergent';

describe('EmergentBehaviorDetector', () => {
    let detector: EmergentBehaviorDetector;

    beforeEach(() => {
        detector = new EmergentBehaviorDetector();
    });

    it('should detect complex patterns', () => {
        const patterns = [
            { complexity: 3 },
            { complexity: 8 },
            { complexity: 1 }
        ];
        const result = detector.detect(patterns);
        expect(result).toHaveLength(1);
        expect(result[0].complexity).toBe(8);
    });

    it('should analyze interactions', () => {
        const interactions = [
            { type: 'A' },
            { type: 'B' },
            { type: 'A' }
        ];
        const analysis = detector.analyze(interactions);
        expect(analysis.total).toBe(3);
        expect(analysis.types.A).toBe(2);
        expect(analysis.types.B).toBe(1);
    });
});
