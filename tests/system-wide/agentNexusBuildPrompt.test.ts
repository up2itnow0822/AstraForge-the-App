import * as path from 'path';
import { runAgentNexusBuildPrompt } from '../../src/workflow/agentNexusBuildRunner';

describe('AgentNexus build prompt runner', () => {
  it('reports missing technical specifications as a blocking issue', async () => {
    const workspaceRoot = path.resolve(__dirname, '../..');

    const result = await runAgentNexusBuildPrompt(workspaceRoot);

    expect(result.success).toBe(false);
    expect(result.missingSpecs).toEqual(
      expect.arrayContaining([
        'docs/specs/AgentNexus_Technical_Spec_Final.txt',
        'docs/specs/Comprehensive_Build_Plan_for_AgentNexus.txt',
      ])
    );
    expect(result.stepsAttempted).toContain('validate required technical specification documents');
    expect(result.message).toMatch(/missing/i);
  });
});
