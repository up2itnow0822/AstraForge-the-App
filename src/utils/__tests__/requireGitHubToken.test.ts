import { readFileSync } from 'fs';
import { join } from 'path';

const { requireGitHubToken } = require('../../../scripts/requireGitHubToken.cjs') as {
  requireGitHubToken: (env?: NodeJS.ProcessEnv) => string;
};

const PLACEHOLDER = 'test-github-token-placeholder';

const SCRIPT_PATHS = [
  join(__dirname, '../../../scripts/biWeeklyReview.js'),
  join(__dirname, '../../../scripts/quarterlyAudit.js'),
];

describe('requireGitHubToken', () => {
  const original = process.env.GITHUB_TOKEN;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = original;
    }
  });

  it('throws when GITHUB_TOKEN is unset', () => {
    const env = { ...process.env };
    delete env.GITHUB_TOKEN;
    expect(() => requireGitHubToken(env)).toThrow('GITHUB_TOKEN is required');
  });

  it('throws when GITHUB_TOKEN is empty', () => {
    expect(() => requireGitHubToken({ GITHUB_TOKEN: '' })).toThrow('GITHUB_TOKEN is required');
  });

  it('throws when GITHUB_TOKEN is whitespace only', () => {
    expect(() => requireGitHubToken({ GITHUB_TOKEN: '   ' })).toThrow('GITHUB_TOKEN is required');
  });

  it('returns the fake placeholder when GITHUB_TOKEN is set', () => {
    expect(requireGitHubToken({ GITHUB_TOKEN: PLACEHOLDER })).toBe(PLACEHOLDER);
  });

  it('reads process.env when no env override is passed', () => {
    process.env.GITHUB_TOKEN = PLACEHOLDER;
    expect(requireGitHubToken()).toBe(PLACEHOLDER);
  });
});

describe('.env.example documents GITHUB_TOKEN with no value', () => {
  it('contains an empty GITHUB_TOKEN= entry', () => {
    const source = readFileSync(join(__dirname, '../../../.env.example'), 'utf8');
    expect(source).toMatch(/^GITHUB_TOKEN=$/m);
    expect(source).not.toMatch(/^GITHUB_TOKEN=.+/m);
  });
});

describe('requireGitHubToken.cjs fail-closed copy', () => {
  it('names the required error and never embeds a token literal', () => {
    const source = readFileSync(join(__dirname, '../../../scripts/requireGitHubToken.cjs'), 'utf8');
    expect(source).toContain("throw new Error('GITHUB_TOKEN is required')");
    expect(source).toContain('process.env.GITHUB_TOKEN');
    expect(source).not.toMatch(/github_pat_/);
    expect(source).not.toMatch(/ghp_/);
  });
});

describe('review and audit scripts read GITHUB_TOKEN from the environment', () => {
  it.each(SCRIPT_PATHS)('wires %s to requireGitHubToken and process.env.GITHUB_TOKEN', (scriptPath) => {
    const source = readFileSync(scriptPath, 'utf8');
    expect(source).toContain('requireGitHubTokenOrExit');
    expect(source).toContain('process.env.GITHUB_TOKEN');
    expect(source).toContain('auth: process.env.GITHUB_TOKEN');
    expect(source).not.toMatch(/github_pat_/);
    expect(source).not.toMatch(/ghp_/);
    expect(source).not.toMatch(/auth:\s*['"]/);
  });
});
