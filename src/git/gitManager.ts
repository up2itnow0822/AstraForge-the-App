import { simpleGit, SimpleGit } from 'simple-git';

const DEFAULT_REMOTE = 'origin';

/**
 * Rejects remotes and branch names that git would treat as options or
 * refspecs (e.g. `-x`, `--receive-pack=evil`, `+main`, `src:dst`).
 * Trims leading whitespace before the checks. Must run before any
 * simple-git push, pull, fetch, or checkout call.
 *
 * @param value Candidate remote, branch, or ref name
 * @returns The leading-trimmed value
 */
function assertSafeGitRef(value: string): string {
  if (typeof value !== 'string') {
    throw new Error('Invalid git ref: expected a non-empty string');
  }
  const ref = value.trimStart();
  if (ref.length === 0) {
    throw new Error('Invalid git ref: expected a non-empty string');
  }
  if (ref.startsWith('-')) {
    throw new Error(
      `Invalid git ref: ${JSON.stringify(value)} must not start with '-'`
    );
  }
  if (ref.startsWith('+')) {
    throw new Error(
      `Invalid git ref: ${JSON.stringify(value)} must not start with '+'`
    );
  }
  if (ref.includes(':')) {
    throw new Error(
      `Invalid git ref: ${JSON.stringify(value)} must not contain ':'`
    );
  }
  return ref;
}

export class GitManager {
  private git: SimpleGit;

  /**
   *
   * @param repoPath
   */
  constructor(repoPath: string) {
    this.git = simpleGit(repoPath);
  }

  /**
   *
   * @param message
   */
  async commitChanges(message: string): Promise<{commit: string}> {
    await this.git.add('.');
    const result = await this.git.commit(message);
    return { commit: result.commit || 'unknown' };
  }

  /**
   *
   */
  async getRepositoryStatus(): Promise<{files: any[]}> {
    const status = await this.git.status();
    return { files: status.files || [] };
  }

  /**
   *
   */
  async listBranches(): Promise<string[]> {
    const branches = await this.git.branch();
    return branches.all || [];
  }

  /**
   *
   * @param branch
   */
  async pushToRemote(branch: string): Promise<boolean> {
    const remote = assertSafeGitRef(DEFAULT_REMOTE);
    const safeBranch = assertSafeGitRef(branch);
    try {
      await this.git.push(remote, safeBranch);
      return true;
    } catch {
      return false;
    }
  }

  /**
   *
   * @param branch
   */
  async pullFromRemote(branch: string): Promise<boolean> {
    const remote = assertSafeGitRef(DEFAULT_REMOTE);
    const safeBranch = assertSafeGitRef(branch);
    try {
      await this.git.pull(remote, safeBranch);
      return true;
    } catch {
      return false;
    }
  }
}
