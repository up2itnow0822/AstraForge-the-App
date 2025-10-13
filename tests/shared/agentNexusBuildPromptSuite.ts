import * as os from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';
import { runAgentNexusBuildPrompt } from '../../src/workflow/agentNexusBuildRunner';

interface AgentNexusBuildPromptSuiteOptions {
  suiteName?: string;
  workspaceRoot?: string;
}

export function defineAgentNexusBuildPromptRegressionSuite({
  suiteName = 'AgentNexus build prompt runner',
  workspaceRoot = path.resolve(__dirname, '../..'),
}: AgentNexusBuildPromptSuiteOptions = {}): void {
  describe(suiteName, () => {
    it('reports missing technical specifications as a blocking issue', async () => {
      const tempWorkspace = await fs.mkdtemp(path.join(os.tmpdir(), 'agentnexus-missing-'));

      const result = await runAgentNexusBuildPrompt(tempWorkspace);

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
      const tempWorkspace = await fs.mkdtemp(path.join(os.tmpdir(), 'agentnexus-invalid-'));
      const specsDir = path.join(tempWorkspace, 'docs/specs');
      await fs.mkdir(specsDir, { recursive: true });

      await fs.writeFile(
        path.join(specsDir, 'AgentNexus_Technical_Spec_Final.txt'),
        '# Incomplete Technical Spec\n\n## System Overview\nOnly overview present. TBD.'
      );
      await fs.writeFile(
        path.join(specsDir, 'Comprehensive_Build_Plan_for_AgentNexus.txt'),
        '# Incomplete Plan\n\n## Execution Strategy\nMinimal tasks. TODO item.'
      );

      const result = await runAgentNexusBuildPrompt(tempWorkspace);

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
          expect.stringContaining('technical specification contains placeholder text'),
          expect.stringContaining('build plan contains placeholder text'),
        ])
      );
    });

    it('returns success with a detailed summary when specifications pass all checks', async () => {
      const result = await runAgentNexusBuildPrompt(workspaceRoot);

      expect(result.success).toBe(true);
      expect(result.validationFailures).toHaveLength(0);
      expect(result.details?.technicalSpec.components).toBeGreaterThanOrEqual(4);
      expect(result.details?.buildPlan.phases).toBeGreaterThanOrEqual(3);
      expect(result.details?.buildPlan.phaseSummaries.every(summary => summary.tasks >= 3)).toBe(true);
      expect(result.message).toMatch(/prerequisites satisfied/i);
      expect(result.message).not.toMatch(/\s{2,}/);
      expect(result.message).not.toContain('\n');
    });

    it('interprets specification bullet formatting variations gracefully', async () => {
      const tempWorkspace = await fs.mkdtemp(path.join(os.tmpdir(), 'agentnexus-flex-'));
      const specsDir = path.join(tempWorkspace, 'docs/specs');
      await fs.mkdir(specsDir, { recursive: true });

      const technicalSpecWithIndentation = [
        '# Flexible Technical Spec',
        '## System Overview',
        'Overview text.',
        '## Core Subsystems',
        '  -   Component: Mission Control Orchestrator',
        '\t- Component: Cognitive Workspace Runtime',
        '*   Component: Spec Kit Interpreter',
        '    -  Component: Evidence Vault',
        '## Data Contracts',
        '   -    Contract: MissionPrompt',
        '* Contract: ArtifactEvidence',
        '\t-    Contract: ValidationReport',
        '## External Integrations',
        '  - Integration: OpenAI Assistants API',
        '*    Integration: Hugging Face Inference',
        '\t- Integration: GitHub Enterprise',
        '## Security & Compliance',
        'Details.',
        '## Telemetry & Observability',
        'Details.',
        '## Deployment Topology',
        'Details.',
      ].join('\n');

      const buildPlanWithIndentation = [
        '# Flexible Build Plan',
        '## Execution Strategy',
        'Strategy text.',
        '   ### Phase 1: Foundational Setup',
        '      -   [x] Task: Establish repositories',
        '      *   [ ] Task: Configure workspaces',
        '   -   [ ] Task: Scaffold mission control API',
        '      -   [ ] Task: Provision telemetry stack',
        '###   Phase 2: Runtime Enablement',
        '   -   [x] Task: Implement agent runtime',
        '*   [ ] Task: Integrate reasoning providers',
        '      -   [ ] Task: Expand evidence ingestion',
        '\t###\tPhase 3: Launch Readiness',
        '   -   [x] Task: Harden security posture',
        '*   [ ] Task: Execute mission rehearsal',
        '      -   [ ] Task: Finalize launch review',
        '## Risk Management',
        'Risk considerations.',
        '## Validation Strategy',
        'Validation approach.',
      ].join('\n');

      await fs.writeFile(
        path.join(specsDir, 'AgentNexus_Technical_Spec_Final.txt'),
        technicalSpecWithIndentation
      );
      await fs.writeFile(
        path.join(specsDir, 'Comprehensive_Build_Plan_for_AgentNexus.txt'),
        buildPlanWithIndentation
      );

      const result = await runAgentNexusBuildPrompt(tempWorkspace);

      expect(result.success).toBe(true);
      expect(result.validationFailures).toHaveLength(0);
      expect(result.details).toBeDefined();
      expect(result.details?.technicalSpec.components).toBe(4);
      expect(result.details?.technicalSpec.integrations).toBe(3);
      expect(result.details?.technicalSpec.contracts).toBe(3);
      expect(result.details?.buildPlan.phases).toBe(3);
      expect(result.details?.buildPlan.tasks).toBe(10);
      expect(result.message).toMatch(/data contracts/);
      expect(result.message).not.toContain('\n');
    });

    it('accepts heading variations in casing and delimiters while enforcing structural counts', async () => {
      const tempWorkspace = await fs.mkdtemp(path.join(os.tmpdir(), 'agentnexus-headings-'));
      const specsDir = path.join(tempWorkspace, 'docs/specs');
      await fs.mkdir(specsDir, { recursive: true });

      const technicalSpecWithHeadingVariations = [
        '# Heading Variation Technical Spec',
        '##   system overview',
        'Mission context fully described.',
        '## CORE SUBSYSTEMS',
        '- Component: Mission Control Orchestrator',
        '- Component: Cognitive Workspace Runtime',
        '- Component: Spec Kit Interpreter',
        '- Component: Evidence Vault',
        '## data contracts',
        '- Contract: MissionPrompt',
        '- Contract: ArtifactEvidence',
        '- Contract: ValidationReport',
        '## external integrations',
        '- Integration: OpenAI Assistants API',
        '- Integration: Hugging Face Inference',
        '- Integration: GitHub Enterprise',
        '## security & compliance',
        'Security posture documented.',
        '## telemetry & observability',
        'Observability plan established.',
        '## DEPLOYMENT TOPOLOGY',
        'Deployment model finalized.',
      ].join('\n');

      const buildPlanWithDelimiterVariations = [
        '# Heading Variation Build Plan',
        '## execution strategy',
        'Execution steps enumerated.',
        '### Phase 1 - Foundations',
        '+ [X] Task: Prepare repository structure',
        '- [ ] Task: Configure CI pipelines',
        '* [ ] Task: Establish documentation baseline',
        '- [ ] Task: Validate development workstations',
        '### Phase 2 Launch Enablement',
        '+ [ ] Task: Implement agent runtime core',
        '- [ ] Task: Integrate reasoning providers',
        '* [ ] Task: Harden telemetry ingestion',
        '### Phase 3: Sustainment',
        '+ [ ] Task: Conduct mission rehearsal',
        '- [ ] Task: Finalize security validations',
        '* [ ] Task: Complete operational handoff',
        '## risk management',
        'Risks catalogued and mitigated.',
        '## VALIDATION STRATEGY',
        'Validation protocol in effect.',
      ].join('\n');

      await Promise.all([
        fs.writeFile(
          path.join(specsDir, 'AgentNexus_Technical_Spec_Final.txt'),
          technicalSpecWithHeadingVariations
        ),
        fs.writeFile(
          path.join(specsDir, 'Comprehensive_Build_Plan_for_AgentNexus.txt'),
          buildPlanWithDelimiterVariations
        ),
      ]);

      const result = await runAgentNexusBuildPrompt(tempWorkspace);

      expect(result.success).toBe(true);
      expect(result.validationFailures).toHaveLength(0);
      expect(result.details?.technicalSpec.components).toBe(4);
      expect(result.details?.technicalSpec.integrations).toBe(3);
      expect(result.details?.technicalSpec.contracts).toBe(3);
      expect(result.details?.buildPlan.phases).toBe(3);
      expect(result.details?.buildPlan.tasks).toBeGreaterThanOrEqual(10);
      expect(result.message).toMatch(/Ready for automated execution/);
    });

    it('rejects specifications containing placeholder tokens even when structural checks pass', async () => {
      const tempWorkspace = await fs.mkdtemp(path.join(os.tmpdir(), 'agentnexus-placeholder-'));
      const specsDir = path.join(tempWorkspace, 'docs/specs');
      await fs.mkdir(specsDir, { recursive: true });

      const technicalSpecWithPlaceholder = [
        '# Valid-Looking Technical Spec',
        '## System Overview',
        'This mission overview includes a TODO for refinement.',
        '## Core Subsystems',
        '- Component: Mission Control Orchestrator',
        '- Component: Cognitive Workspace Runtime',
        '- Component: Spec Kit Interpreter',
        '- Component: Evidence Vault',
        '## Data Contracts',
        '- Contract: MissionPrompt',
        '- Contract: ArtifactEvidence',
        '- Contract: ValidationReport',
        '## External Integrations',
        '- Integration: OpenAI Assistants API',
        '- Integration: Hugging Face Inference',
        '- Integration: GitHub Enterprise',
        '## Security & Compliance',
        'Controls are pending review with governance.',
        '## Telemetry & Observability',
        'Instrumentation strategy established.',
        '## Deployment Topology',
        'Multi-region deployment defined.',
      ].join('\n');

      const buildPlanWithPlaceholder = [
        '# Valid-Looking Build Plan',
        '## Execution Strategy',
        'Execution strategy TODO includes automation upgrades.',
        '### Phase 1: Foundations',
        '- [ ] Task: Prepare repository structure',
        '- [ ] Task: Configure CI pipeline',
        '- [ ] Task: Establish documentation baseline',
        '- [ ] Task: Harden dependency policies',
        '### Phase 2: Runtime Enablement',
        '- [ ] Task: Implement agent runtime core',
        '- [ ] Task: Integrate reasoning providers',
        '- [ ] Task: Wire telemetry pipelines',
        '### Phase 3: Launch Readiness',
        '- [ ] Task: Run end-to-end mission rehearsal',
        '- [ ] Task: Finalize security validations',
        '- [ ] Task: Complete operations handoff',
        '## Risk Management',
        'Risk mitigations are pending review by governance.',
        '## Validation Strategy',
        'Validation protocol retains TODO checkpoints for expanded coverage.',
      ].join('\n');

      await Promise.all([
        fs.writeFile(path.join(specsDir, 'AgentNexus_Technical_Spec_Final.txt'), technicalSpecWithPlaceholder),
        fs.writeFile(path.join(specsDir, 'Comprehensive_Build_Plan_for_AgentNexus.txt'), buildPlanWithPlaceholder),
      ]);

      const result = await runAgentNexusBuildPrompt(tempWorkspace);

      expect(result.success).toBe(false);
      expect(result.validationFailures).toEqual(
        expect.arrayContaining([
          expect.stringContaining('technical specification contains placeholder text'),
          expect.stringContaining('build plan contains placeholder text'),
        ])
      );
      expect(result.validationFailures).not.toEqual(
        expect.arrayContaining([
          expect.stringContaining('missing sections'),
          expect.stringContaining('must define at least'),
        ])
      );

      const technicalPlaceholderMessage = result.validationFailures.find(failure =>
        failure.startsWith('technical specification contains placeholder text')
      );
      const buildPlanPlaceholderMessage = result.validationFailures.find(failure =>
        failure.startsWith('build plan contains placeholder text')
      );

      expect(technicalPlaceholderMessage).toBeDefined();
      expect(technicalPlaceholderMessage).toContain('TODO');
      expect(technicalPlaceholderMessage).toContain('pending review');
      expect(buildPlanPlaceholderMessage).toBeDefined();
      expect(buildPlanPlaceholderMessage).toContain('TODO');
      expect(buildPlanPlaceholderMessage).toContain('pending review');
    });

    it('flags sections that only include headings without descriptive content', async () => {
      const tempWorkspace = await fs.mkdtemp(path.join(os.tmpdir(), 'agentnexus-empty-section-'));
      const specsDir = path.join(tempWorkspace, 'docs/specs');
      await fs.mkdir(specsDir, { recursive: true });

      const technicalSpecWithEmptySection = [
        '# Technical Spec with Missing Narrative',
        '## System Overview',
        'Mission overview fully detailed.',
        '## Core Subsystems',
        '- Component: Mission Control Orchestrator',
        '- Component: Cognitive Workspace Runtime',
        '- Component: Spec Kit Interpreter',
        '- Component: Evidence Vault',
        '## Data Contracts',
        '- Contract: MissionPrompt',
        '- Contract: ArtifactEvidence',
        '- Contract: ValidationReport',
        '## External Integrations',
        '- Integration: OpenAI Assistants API',
        '- Integration: Hugging Face Inference',
        '- Integration: GitHub Enterprise',
        '## Security & Compliance',
        '',
        '## Telemetry & Observability',
        'Observability instrumentation described.',
        '## Deployment Topology',
        'Deployment model articulated.',
      ].join('\n');

      const buildPlanWithEmptySection = [
        '# Build Plan with Missing Narrative',
        '## Execution Strategy',
        '',
        '### Phase 1: Foundations',
        '- [ ] Task: Prepare repository structure',
        '- [ ] Task: Configure CI pipelines',
        '- [ ] Task: Establish documentation baseline',
        '### Phase 2: Runtime Enablement',
        '- [ ] Task: Implement agent runtime core',
        '- [ ] Task: Integrate reasoning providers',
        '- [ ] Task: Harden telemetry ingestion',
        '### Phase 3: Launch Readiness',
        '- [ ] Task: Run mission rehearsal',
        '- [ ] Task: Finalize security validations',
        '- [ ] Task: Complete operations handoff',
        '- [ ] Task: Publish readiness summary',
        '## Risk Management',
        'Risk mitigations defined.',
        '## Validation Strategy',
        'Validation approach established.',
      ].join('\n');

      await Promise.all([
        fs.writeFile(path.join(specsDir, 'AgentNexus_Technical_Spec_Final.txt'), technicalSpecWithEmptySection),
        fs.writeFile(path.join(specsDir, 'Comprehensive_Build_Plan_for_AgentNexus.txt'), buildPlanWithEmptySection),
      ]);

      const result = await runAgentNexusBuildPrompt(tempWorkspace);

      expect(result.success).toBe(false);
      expect(result.validationFailures).toEqual(
        expect.arrayContaining([
          'technical specification section "## Security & Compliance" must include descriptive content',
          'build plan section "## Execution Strategy" must include descriptive content',
        ])
      );
    });

    it('requires each build phase to enumerate at least three actionable tasks', async () => {
      const tempWorkspace = await fs.mkdtemp(path.join(os.tmpdir(), 'agentnexus-phase-tasks-'));
      const specsDir = path.join(tempWorkspace, 'docs/specs');
      await fs.mkdir(specsDir, { recursive: true });

      const technicalSpec = [
        '# Balanced Technical Spec',
        '## System Overview',
        'Mission overview fully detailed.',
        '## Core Subsystems',
        '- Component: Mission Control Orchestrator',
        '- Component: Cognitive Workspace Runtime',
        '- Component: Spec Kit Interpreter',
        '- Component: Evidence Vault',
        '## Data Contracts',
        '- Contract: MissionPrompt',
        '- Contract: ArtifactEvidence',
        '- Contract: ValidationReport',
        '## External Integrations',
        '- Integration: OpenAI Assistants API',
        '- Integration: Hugging Face Inference',
        '- Integration: GitHub Enterprise',
        '## Security & Compliance',
        'Security posture covered.',
        '## Telemetry & Observability',
        'Observability instrumentation described.',
        '## Deployment Topology',
        'Deployment model articulated.',
      ].join('\n');

      const buildPlan = [
        '# Build Plan with Sparse Phase',
        '## Execution Strategy',
        'Execution steps enumerated.',
        '### Phase 1: Foundations',
        '- [ ] Task: Prepare repository structure',
        '- [ ] Task: Configure CI pipelines',
        '- [ ] Task: Establish documentation baseline',
        '- [ ] Task: Automate lint and format checks',
        '- [ ] Task: Bootstrap documentation portal',
        '### Phase 2: Runtime Enablement',
        '- [ ] Task: Implement agent runtime core',
        '- [ ] Task: Integrate reasoning providers',
        '- [ ] Task: Harden telemetry ingestion',
        '- [ ] Task: Expand evidence ingestion',
        '- [ ] Task: Enable mission rehearsal telemetry',
        '### Phase 3: Launch Readiness',
        '- [ ] Task: Finalize security validations',
        '- [ ] Task: Complete operations handoff',
        '## Risk Management',
        'Risk mitigations defined.',
        '## Validation Strategy',
        'Validation approach established.',
      ].join('\n');

      await Promise.all([
        fs.writeFile(path.join(specsDir, 'AgentNexus_Technical_Spec_Final.txt'), technicalSpec),
        fs.writeFile(path.join(specsDir, 'Comprehensive_Build_Plan_for_AgentNexus.txt'), buildPlan),
      ]);

      const result = await runAgentNexusBuildPrompt(tempWorkspace);

      expect(result.success).toBe(false);
      expect(result.validationFailures).toEqual(
        expect.arrayContaining([
          'build plan phase "### Phase 3: Launch Readiness" must enumerate at least three tasks',
        ])
      );
      expect(result.validationFailures).not.toEqual(expect.arrayContaining(['build plan must outline a minimum of ten actionable tasks']));
    });
  });
}
