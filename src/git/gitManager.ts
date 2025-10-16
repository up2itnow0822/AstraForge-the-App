// src/git/gitManager.ts
import { graphql } from '@octokit/graphql';
import OpenAI from 'openai';
import lancedb from 'lancedb';
import * as child_process from 'child_process';
import { promisify } from 'util';
import { HttpRetry } from './httpRetry';

const execAsync = promisify(child_process.exec);

export class GitManager {
  private graphql: any;
  private pat: string;
  private openaiApi: string;
  private dbPath: string;

  constructor(pat: string, openaiApi: string, dbPath: string) {
    this.pat = pat;
    this.openaiApi = openaiApi;
    this.dbPath = dbPath;
    this.initGraphQLClient();
  }

  async initGraphQLClient(): Promise<void> {
    this.graphql = graphql.defaults({
      headers: {
        Authorization: `token ${this.pat}`,
      },
    });
  }

  async fetchRepoDeps(repo: string): Promise<{ name: string }[]> {
    const retry = new HttpRetry(3, 1000);
    try {
      const variables = { repo };
      const { repository } = await retry.execute(async () => {
        return await this.graphql(
          `query($repo: String!) { repository(name: $repo) { dependencyGraph { repositories { nodes { name } } } } }`,
          variables
        );
      });
      return repository?.dependencyGraph?.repositories?.nodes || [];
    } catch (err: any) {
      if (err.message?.includes('Not found')) throw new Error('repo not found');
      if (err.status === 401) throw new Error('Auth fail');
      throw err;
    }
  }

  async detectChanges(since: string, path: string): Promise<string> {
    const { stdout } = await execAsync(
      `git log --since=${since} --pretty=format:%H%n%B%n -- ${path}`,
      { cwd: path }
    );
    return stdout;
  }

  private chunkText(text: string, size: number = 4000): string[] {
    return text.match(new RegExp(`.{1,${size}}`, 'g')) || [];
  }

  async vectorizeAndStoreHistory(
    commits: { oid: string; message: string; diff: string; }[],
    repo: string,
    path: string
  ): Promise<void> {
    const openai = new OpenAI({ apiKey: this.openaiApi });
    const db = await lancedb.connect(this.dbPath);
    const table = await db.openTable('repoHistory');
    for (const c of commits) {
      const text = c.message + c.diff;
      const chunks = this.chunkText(text);
      for (const chunk of chunks) {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunk,
        });
        await table.addRows([
          {
            vector: response.data[0].embedding as number[],
            metadata: { repo, commit: c.oid },
          },
        ]);
      }
    }
  }

  private async getRepoName(path: string): Promise<string> {
    try {
      const config = require('fs').readFileSync(`${path}/.git/config`, 'utf8');
      const match = config.match(/url = .+github.com[:/](\w+)\.git/);
      return match ? match[1] : 'Hello-World';
    } catch {
      return 'Hello-World';
    }
  }

  async syncRepos(workspace: string): Promise<any[]> {
    try {
      await execAsync('git status', { cwd: workspace });
    } catch {
      await execAsync(`git clone https://github.com/octocat/Hello-World.git ${workspace}`, { cwd: workspace });
    }
    const repo = await this.getRepoName(workspace);
    const variables = { repo };
    const { viewer } = await this.graphql(
      `query($repo: String!) { viewer { repository(name: $repo) { ref(qualifiedName: "main") { target { ... on Commit { history(first: 5) { edges { node { oid message } } } } } } } } }`,
      variables
    );
    const commits = viewer.repository.ref.target.history.edges.map((e: any) => ({
      oid: e.node.oid,
      message: e.node.message,
      diff: 'TODO: fetch diff with git show oid --name-status',
    }));
    // TODO: fetch diff with git show oid --name-status
    await this.vectorizeAndStoreHistory(commits, repo, workspace);
    const openai = new OpenAI({ apiKey: this.openaiApi });
    const queryResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: 'project build plan',
    });

    const db = await lancedb.connect(this.dbPath);
    const table = await db.openTable('repoHistory');
    const results = await table.search(queryResponse.data[0].embedding).limit(10).toArray();
    return results;
  }
}
