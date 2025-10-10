import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { defineAgentNexusBuildPromptRegressionSuite } from '../shared/agentNexusBuildPromptSuite';

const runFullSuite = process.env.RUN_FULL_TEST_SUITE === 'true';
const describeForFullSuite = runFullSuite ? describe : describe.skip;

const repoRoot = path.resolve(__dirname, '../..');

defineAgentNexusBuildPromptRegressionSuite({
  suiteName: 'AgentNexus build prompt runner (system-wide)',
  workspaceRoot: repoRoot,
});

describeForFullSuite('AgentNexus build prompt CLI integration', () => {
  const execFileAsync = promisify(execFile);

  it('executes successfully against the repository workspace', async () => {
    const cliPath = path.join(repoRoot, 'extension/out/cli/runAgentNexusBuildPrompt.js');
    const { stdout } = await execFileAsync(process.execPath, [cliPath], {
      cwd: repoRoot,
    });

    expect(stdout).toContain('AgentNexus build prompt completed successfully.');
    expect(stdout).toContain('prerequisites satisfied');
  });
});
