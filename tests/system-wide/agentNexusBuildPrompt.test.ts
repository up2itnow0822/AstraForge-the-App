import * as os from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';
import { runAgentNexusBuildPrompt } from '../../src/workflow/agentNexusBuildRunner';

describe('AgentNexus build prompt runner', () => {
  it('reports missing technical specifications as a blocking issue', async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'agentnexus-missing-'));

    const result = await runAgentNexusBuildPrompt(workspaceRoot);

    expect(result.success).toBe(false);
    expect(result.missingSpecs).toEqual(
      expect.arrayContaining([
        'docs/specs/AgentNexus_Technical_Spec_Final.txt',
        'docs/specs/Comprehensive_Build_Plan_for_AgentNexus.txt',
      ])
    );
    expect(result.validationFailures).toEqual(expect.arrayContaining(['specification files missing']));
    expect(result.message).toMatch(/missing/i);
  });

  it('fails validation when specifications do not meet quality gates', async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'agentnexus-invalid-'));
    const specsDir = path.join(workspaceRoot, 'docs/specs');
    await fs.mkdir(specsDir, { recursive: true });

    await fs.writeFile(
      path.join(specsDir, 'AgentNexus_Technical_Spec_Final.txt'),
      '# Incomplete Technical Spec\n\n## System Overview\nOnly overview present.'
    );
    await fs.writeFile(
      path.join(specsDir, 'Comprehensive_Build_Plan_for_AgentNexus.txt'),
      '# Incomplete Plan\n\n## Execution Strategy\nMinimal tasks.'
    );

    const result = await runAgentNexusBuildPrompt(workspaceRoot);

    expect(result.success).toBe(false);
    expect(result.validationFailures).toEqual(
      expect.arrayContaining([
        expect.stringContaining('technical specification missing sections'),
        expect.stringContaining('build plan missing sections'),
        'build plan must define at least three execution phases',
        'build plan must outline a minimum of ten actionable tasks',
        'technical specification must describe at least four core components',
        'technical specification must document at least three integrations',
        'technical specification must define at least three data contracts',
      ])
    );
  });

  it('returns success with a detailed summary when specifications pass all checks', async () => {
    const workspaceRoot = path.resolve(__dirname, '../..');

    const result = await runAgentNexusBuildPrompt(workspaceRoot);

    expect(result.success).toBe(true);
    expect(result.validationFailures).toHaveLength(0);
    expect(result.details?.technicalSpec.components).toBeGreaterThanOrEqual(4);
    expect(result.details?.buildPlan.phases).toBeGreaterThanOrEqual(3);
    expect(result.message).toMatch(/prerequisites satisfied/i);
  });
});
