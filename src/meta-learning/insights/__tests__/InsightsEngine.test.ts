import { InsightsEngine } from '../InsightsEngine';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('InsightsEngine', () => {
    let engine: InsightsEngine;

    beforeEach(() => {
        engine = new InsightsEngine();
    });

    it('should generate insights', async () => {
        const insights = await engine.generateInsights({});
        expect(insights.length).toBeGreaterThan(0);
        expect(insights[0].priority).toBeDefined();
    });
});
