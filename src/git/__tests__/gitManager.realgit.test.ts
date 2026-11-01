import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GitManager } from '../gitManager';

const execFileAsync = promisify(execFile);

async function git(cwd: string, ...args: string[]): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync('git', args, {
    cwd,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'GitManager Test',
      GIT_AUTHOR_EMAIL: 'gitmanager@test.local',
      GIT_COMMITTER_NAME: 'GitManager Test',
      GIT_COMMITTER_EMAIL: 'gitmanager@test.local',
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_TERMINAL_PROMPT: '0'
    }
  });
}

describe('GitManager real git push', () => {
  let root: string;
  let workDir: string;
  let bareDir: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'gitmanager-real-'));
    workDir = join(root, 'work');
    bareDir = join(root, 'remote.git');

    await git(root, 'init', '--bare', bareDir);
    await git(root, 'init', '-b', 'main', workDir);
    await git(workDir, 'config', 'user.name', 'GitManager Test');
    await git(workDir, 'config', 'user.email', 'gitmanager@test.local');
    await writeFile(join(workDir, 'README.md'), 'hello\n', 'utf8');
    await git(workDir, 'add', 'README.md');
    await git(workDir, 'commit', '-m', 'initial');
    await git(workDir, 'remote', 'add', 'origin', bareDir);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('pushes a normal branch to a temp bare remote', async () => {
    const manager = new GitManager(workDir);
    const ok = await manager.pushToRemote('main');
    expect(ok).toBe(true);

    const { stdout } = await git(root, '--git-dir', bareDir, 'rev-parse', '--verify', 'refs/heads/main');
    expect(stdout.trim()).toMatch(/^[0-9a-f]{40}$/);
  });

  it('rejects -x before git runs and leaves the remote empty', async () => {
    const manager = new GitManager(workDir);
    await expect(manager.pushToRemote('-x')).rejects.toThrow(/must not start with '-'/);

    const { stdout } = await git(root, '--git-dir', bareDir, 'for-each-ref', '--format=%(refname)', 'refs/heads');
    expect(stdout.trim()).toBe('');
  });

  it('rejects --receive-pack=evil before git runs and leaves the remote empty', async () => {
    const manager = new GitManager(workDir);
    await expect(manager.pushToRemote('--receive-pack=evil')).rejects.toThrow(
      /must not start with '-'/
    );

    const { stdout } = await git(root, '--git-dir', bareDir, 'for-each-ref', '--format=%(refname)', 'refs/heads');
    expect(stdout.trim()).toBe('');
  });
});
