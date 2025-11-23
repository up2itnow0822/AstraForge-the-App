import { describe, it, expect, beforeEach } from '@jest/globals';
import { GitHubProvider } from '../GitHubProvider';

describe('GitHubProvider', () => {
    let provider: GitHubProvider;

    beforeEach(() => {
        provider = new GitHubProvider({
            model: 'test-model',
            apiKey: 'test-key'
        });
    });

    it('should generate text', async () => {
        const res = await provider.generate('hello');
        expect(res.content).toBe('GitHub response');
        expect(res.usage).toBeDefined();
    });

    it('should embed text', async () => {
        const vec = await provider.embed('hello');
        expect(vec).toEqual([0.1, 0.2, 0.3]);
    });
});
