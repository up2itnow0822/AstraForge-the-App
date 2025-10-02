import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { managePullRequests, PullRequestRecord } from '../../src/git/pullRequestManager';

describe('PullRequestManager', () => {
  const fixturePath = path.resolve(__dirname, '__fixtures__/pullRequestsOpen.json');
  let tempFile: string;

  beforeEach(async () => {
    const contents = await fs.readFile(fixturePath, 'utf8');
    tempFile = path.join(os.tmpdir(), `pull-requests-${Date.now()}.json`);
    await fs.writeFile(tempFile, contents, 'utf8');
  });

  afterEach(async () => {
    await fs.unlink(tempFile).catch(() => undefined);
  });

  it('closes deprecated PRs and merges current version fixes', async () => {
    const processed = await managePullRequests('3.0.0', tempFile);

    expect(processed).toHaveLength(3);

    const deprecated = processed.find(pr => pr.id === 42) as PullRequestRecord;
    expect(deprecated.status).toBe('closed');
    expect(deprecated.resolution).toBe('deprecated');
    expect(deprecated.branchDeleted).toBe(true);
    expect(deprecated.history?.some(entry => entry.type === 'closed')).toBe(true);

    const ignition = processed.find(pr => pr.id === 57) as PullRequestRecord;
    expect(ignition.status).toBe('merged');
    expect(ignition.checks.tests).toBe(true);
    expect(ignition.fixesApplied).toContainEqual(expect.stringContaining('media/ignition.js'));
    expect(ignition.branchDeleted).toBe(true);

    const apiTester = processed.find(pr => pr.id === 61) as PullRequestRecord;
    expect(apiTester.status).toBe('merged');
    expect(apiTester.checks.security).toBe(true);
    expect(apiTester.fixesApplied).toContainEqual(expect.stringContaining('apiTesterCore'));
  });
});
