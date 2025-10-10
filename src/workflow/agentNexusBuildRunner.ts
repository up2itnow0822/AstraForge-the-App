import { promises as fsPromises, constants as fsConstants } from 'fs';
import * as path from 'path';

const REQUIRED_SPEC_FILES = [
  'docs/specs/AgentNexus_Technical_Spec_Final.txt',
  'docs/specs/Comprehensive_Build_Plan_for_AgentNexus.txt',
];

const TECH_SPEC_REQUIRED_HEADINGS = [
  '## System Overview',
  '## Core Subsystems',
  '## Data Contracts',
  '## External Integrations',
  '## Security & Compliance',
  '## Telemetry & Observability',
  '## Deployment Topology',
];

const BUILD_PLAN_REQUIRED_HEADINGS = [
  '## Execution Strategy',
  '## Risk Management',
  '## Validation Strategy',
];

const PHASE_HEADING_PATTERN = /^### Phase \d+:/im;
const TASK_LINE_PATTERN = /^- \[(?: |x)\] /im;
const TECH_COMPONENT_PATTERN = /^- Component:/im;
const TECH_INTEGRATION_PATTERN = /^- Integration:/im;
const TECH_CONTRACT_PATTERN = /^- Contract:/im;

interface TechnicalSpecEvaluation {
  missingHeadings: string[];
  components: number;
  integrations: number;
  contracts: number;
}

interface BuildPlanEvaluation {
  missingHeadings: string[];
  phases: number;
  tasks: number;
}

interface SpecificationCheck {
  path: string;
  exists: boolean;
}

export interface AgentNexusBuildResult {
  success: boolean;
  missingSpecs: string[];
  stepsAttempted: string[];
  message: string;
  workspaceRoot: string;
  validationFailures: string[];
  details?: {
    technicalSpec: {
      components: number;
      integrations: number;
      contracts: number;
    };
    buildPlan: {
      phases: number;
      tasks: number;
    };
  };
}

async function fileExists(absolutePath: string): Promise<boolean> {
  try {
    await fsPromises.access(absolutePath, fsConstants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function verifySpecificationFiles(workspaceRoot: string): Promise<SpecificationCheck[]> {
  const checks = await Promise.all(
    REQUIRED_SPEC_FILES.map(async relativePath => {
      const absolutePath = path.join(workspaceRoot, relativePath);
      return {
        path: relativePath,
        exists: await fileExists(absolutePath),
      } satisfies SpecificationCheck;
    })
  );

  return checks;
}

function evaluateTechnicalSpecification(content: string): TechnicalSpecEvaluation {
  const missingHeadings = TECH_SPEC_REQUIRED_HEADINGS.filter(heading => !content.includes(heading));
  const components = (content.match(TECH_COMPONENT_PATTERN) ?? []).length;
  const integrations = (content.match(TECH_INTEGRATION_PATTERN) ?? []).length;
  const contracts = (content.match(TECH_CONTRACT_PATTERN) ?? []).length;

  return { missingHeadings, components, integrations, contracts } satisfies TechnicalSpecEvaluation;
}

function evaluateBuildPlan(content: string): BuildPlanEvaluation {
  const missingHeadings = BUILD_PLAN_REQUIRED_HEADINGS.filter(heading => !content.includes(heading));
  const phases = (content.match(PHASE_HEADING_PATTERN) ?? []).length;
  const tasks = (content.match(TASK_LINE_PATTERN) ?? []).length;

  return { missingHeadings, phases, tasks } satisfies BuildPlanEvaluation;
}

function compileValidationFailures(
  technical: TechnicalSpecEvaluation,
  buildPlan: BuildPlanEvaluation
): string[] {
  const failures: string[] = [];

  if (technical.missingHeadings.length > 0) {
    failures.push(`technical specification missing sections: ${technical.missingHeadings.join(', ')}`);
  }

  if (buildPlan.missingHeadings.length > 0) {
    failures.push(`build plan missing sections: ${buildPlan.missingHeadings.join(', ')}`);
  }

  if (buildPlan.phases < MIN_BUILD_PLAN_PHASES) {
    failures.push(`build plan must define at least ${MIN_BUILD_PLAN_PHASES} execution phases`);
  }

  if (buildPlan.tasks < MIN_BUILD_PLAN_TASKS) {
    failures.push(`build plan must outline a minimum of ${MIN_BUILD_PLAN_TASKS} actionable tasks`);
  }

  if (technical.components < MIN_TECH_SPEC_COMPONENTS) {
    failures.push(`technical specification must describe at least ${MIN_TECH_SPEC_COMPONENTS} core components`);
  }

  if (technical.integrations < MIN_TECH_SPEC_INTEGRATIONS) {
    failures.push(`technical specification must document at least ${MIN_TECH_SPEC_INTEGRATIONS} integrations`);
  }

  if (technical.contracts < MIN_TECH_SPEC_CONTRACTS) {
    failures.push(`technical specification must define at least ${MIN_TECH_SPEC_CONTRACTS} data contracts`);
  }

  return failures;
}

/**
 * Attempts to execute the AstraForge build prompt for the AgentNexus project.
 * Returns a structured result that captures which prerequisite checks ran and
 * whether the build can proceed. The build cannot start without the technical
 * specifications referenced in the project requirements.
 */
export async function runAgentNexusBuildPrompt(workspaceRoot: string = process.cwd()): Promise<AgentNexusBuildResult> {
  const resolvedRoot = path.resolve(workspaceRoot);
  const stepsAttempted: string[] = ['validate required technical specification documents'];

  const specChecks = await verifySpecificationFiles(resolvedRoot);
  const missingSpecs = specChecks.filter(check => !check.exists).map(check => check.path);

  if (missingSpecs.length > 0) {
    return {
      success: false,
      missingSpecs,
      stepsAttempted,
      message:
        'AgentNexus build prompt execution blocked: required technical specifications are missing from the repository.',
      workspaceRoot: resolvedRoot,
      validationFailures: ['specification files missing'],
    } satisfies AgentNexusBuildResult;
  }

  stepsAttempted.push('load technical specifications into build workflow');

  const technicalSpecPath = path.join(resolvedRoot, REQUIRED_SPEC_FILES[0]);
  const buildPlanPath = path.join(resolvedRoot, REQUIRED_SPEC_FILES[1]);

  const [technicalSpecContent, buildPlanContent] = await Promise.all([
    fsPromises.readFile(technicalSpecPath, 'utf8'),
    fsPromises.readFile(buildPlanPath, 'utf8'),
  ]);

  stepsAttempted.push('validate specification completeness and quality gates');

  const technicalEvaluation = evaluateTechnicalSpecification(technicalSpecContent);
  const buildPlanEvaluation = evaluateBuildPlan(buildPlanContent);
  const validationFailures = compileValidationFailures(technicalEvaluation, buildPlanEvaluation);

  if (validationFailures.length > 0) {
    return {
      success: false,
      missingSpecs,
      stepsAttempted,
      message:
        'AgentNexus build prompt cannot proceed because the specification content failed quality validation checks.',
      workspaceRoot: resolvedRoot,
      validationFailures,
    } satisfies AgentNexusBuildResult;
  }

  stepsAttempted.push('assemble AgentNexus automation hand-off package');

  const details = {
    technicalSpec: {
      components: technicalEvaluation.components,
      integrations: technicalEvaluation.integrations,
      contracts: technicalEvaluation.contracts,
    },
    buildPlan: {
      phases: buildPlanEvaluation.phases,
      tasks: buildPlanEvaluation.tasks,
    },
  } as const;

  return {
    success: true,
    missingSpecs,
    stepsAttempted,
    message: `AgentNexus build prompt prerequisites satisfied: ${details.technicalSpec.components} components, ${details.technicalSpec.integrations} integrations, and ${details.buildPlan.tasks} actionable tasks across ${details.buildPlan.phases} phases are documented. Ready for automated execution.`,
    workspaceRoot: resolvedRoot,
    validationFailures: [],
    details,
  } satisfies AgentNexusBuildResult;
}
