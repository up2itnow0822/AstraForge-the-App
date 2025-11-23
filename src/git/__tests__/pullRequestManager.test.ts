import { PullRequestManager } from '../pullRequestManager';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('PullRequestManager', () => {
    let manager: PullRequestManager;

    beforeEach(() => {
        manager = new PullRequestManager();
    });

    it('should create PR', async () => {
        const pr = await manager.createPullRequest('Title', 'Body', 'feat', 'main');
        expect(pr.title).toBe('Title');
        expect(pr.state).toBe('open');
    });

    it('should get PR', async () => {
        const pr = await manager.getPullRequest(123);
        expect(pr).not.toBeNull();
        expect(pr?.id).toBe(123);
    });
});
