import { simpleGit, SimpleGit } from 'simple-git';

/**
 * Rejects branch names that git would treat as options (e.g. `-x`,
 * `--receive-pack=evil`). Must run before any simple-git push call.
 *
 * @param branch Candidate branch or ref name
 */
function assertSafeGitBranch(branch: string): void {
  if (typeof branch !== 'string' || branch.length === 0) {
    throw new Error('Invalid branch name: expected a non-empty string');
  }
  if (branch.startsWith('-')) {
    throw new Error(
      `Invalid branch name: ${JSON.stringify(branch)} must not start with '-'`
    );
  }
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
    assertSafeGitBranch(branch);
    try {
      // '--' stops option parsing so the refspec cannot be read as a flag.
      await this.git.push(['origin', '--', branch]);
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
    try {
      await this.git.pull('origin', branch);
      return true;
    } catch {
      return false;
    }
  }
}
