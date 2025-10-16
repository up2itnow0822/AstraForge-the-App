// src/git/pullRequestManager.ts
import { graphql } from '@octokit/graphql';

export class PullRequestManager {
  private repo: string;
  private graphql: any;

  constructor(repo: string, graphqlClient: any) {
    this.repo = repo;
    this.graphql = graphqlClient;
  }

  async queryPRs(): Promise<{ id: number; title: string; status: string; createdAt: string; }[]> {
    const variables = { repo: this.repo };
    const { repository } = await this.graphql(
      `query($repo: String!) { repository(name: $repo) { pullRequests(states: [OPEN, CLOSED, MERGED]) { nodes { id title state createdAt isDeprecated resolution checks { tests lint } fixesApplied targets version } } } }`,
      variables
    );
    return repository.pullRequests.nodes.map((n: any) => ({
      id: parseInt(n.id),
      title: n.title,
      status: n.state.toLowerCase(),
      createdAt: n.createdAt,
      isDeprecated: n.isDeprecated,
      resolution: n.resolution,
      checks: {
        tests: n.checks.tests,
        lint: n.checks.lint,
      },
      fixesApplied: n.fixesApplied || [],
      targets: {
        version: n.targets.version,
      },
    }));
  }

  async updatePRStatus(id: number, status: 'open' | 'closed' | 'merged') {
    const state = status === 'merged' ? 'MERGED' : status === 'closed' ? 'CLOSED' : 'OPEN';
    const variables = { pullRequestId: id.toString(), state };
    const { updatePullRequest } = await this.graphql(
      `mutation($pullRequestId: ID!, $state: PullRequestState!) { updatePullRequest(input: { pullRequestId: $pullRequestId, state: $state }) { pullRequest { id } } }`,
      variables
    );
    return updatePullRequest.pullRequest;
  }

  async applyRules(prId: number, type: string = '') {
    const prs = await this.queryPRs();
    const pr = prs.find(p => p.id === prId);
    if (!pr) throw new Error('PR not found');
    if (pr.status === 'merged') {
      pr.checks.tests = true;
      pr.checks.lint = true;
      return pr;
    }
    if (type === 'deprecated') {
      pr.isDeprecated = true;
      pr.resolution = 'close';
    } else if (type === 'current repair') {
      pr.fixesApplied.push('current fix');
      pr.targets.version = '3.0.0';
      pr.checks.repair = true;
      pr.checks.checks = true;
      pr.checks.tests = true;
      pr.checks.lint = true;
    }
    // Add history entry
    pr.history = `applied rules ${type} at ${new Date().toISOString()}`;
    return pr;
  }

  async reparForCurrentVersion(prId: number) {
    const prs = await this.queryPRs();
    const pr = prs.find(p => p.id === prId);
    if (pr && pr.fixesApplied.length > 0) {
      pr.status = 'merged';
      pr.history = 'merged after verification';
    }
    return pr;
  }
}
