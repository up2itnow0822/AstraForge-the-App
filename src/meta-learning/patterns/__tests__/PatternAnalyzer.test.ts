import { PatternAnalyzer } from '../PatternAnalyzer';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('PatternAnalyzer', () => {
    let analyzer: PatternAnalyzer;

    beforeEach(() => {
        analyzer = new PatternAnalyzer();
    });

    it('should analyze patterns', async () => {
        const patterns = await analyzer.analyze({});
        expect(patterns.length).toBeGreaterThan(0);
        expect(patterns[0].type).toBe('code-repetition');
    });
});
