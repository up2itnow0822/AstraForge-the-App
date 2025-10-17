import { describe, it, expect, beforeEach, jest } from 'jest';

// Mock octokit dynamic
import { PullRequestManager } from '../pullRequestManager';

jest.mock('../pullRequestManager');

describe('GitManager', () => {
  it('creates PR', async () => {
    const pr = await PullRequestManager.createPR('title', 'body', 'branch');
    expect(pr).toBeDefined();
  });
});
