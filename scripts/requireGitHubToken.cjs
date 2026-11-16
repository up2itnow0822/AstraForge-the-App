'use strict';

/**
 * Read GITHUB_TOKEN from the environment and fail closed when it is missing.
 *
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string}
 */
function requireGitHubToken(env) {
  const token = env ? env.GITHUB_TOKEN : process.env.GITHUB_TOKEN;
  if (typeof token !== 'string' || token.trim() === '') {
    throw new Error('GITHUB_TOKEN is required');
  }
  return token;
}

/**
 * Same as requireGitHubToken, but prints the error and exits non-zero.
 * Used by CLI review/audit scripts so a missing token never reaches Octokit.
 *
 * @returns {string}
 */
function requireGitHubTokenOrExit() {
  try {
    return requireGitHubToken();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'GITHUB_TOKEN is required';
    console.error(message);
    process.exit(1);
  }
}

module.exports = { requireGitHubToken, requireGitHubTokenOrExit };
