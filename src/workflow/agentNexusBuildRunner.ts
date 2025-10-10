import { promises as fsPromises, constants as fsConstants } from 'fs';
import * as path from 'path';

const REQUIRED_SPEC_FILES = [
  'docs/specs/AgentNexus_Technical_Spec_Final.txt',
  'docs/specs/Comprehensive_Build_Plan_for_AgentNexus.txt',
];

interface HeadingRequirement {
  label: string;
  pattern: RegExp;
}

const TECH_SPEC_REQUIRED_HEADINGS: HeadingRequirement[] = [
  { label: '## System Overview', pattern: /^##\s*System\s+Overview\b/im },
  { label: '## Core Subsystems', pattern: /^##\s*Core\s+Subsystems\b/im },
  { label: '## Data Contracts', pattern: /^##\s*Data\s+Contracts\b/im },
  { label: '## External Integrations', pattern: /^##\s*External\s+Integrations\b/im },
  {
    label: '## Security & Compliance',
    pattern: /^##\s*Security\s*&\s*Compliance\b/im,
  },
  {
    label: '## Telemetry & Observability',
    pattern: /^##\s*Telemetry\s*&\s*Observability\b/im,
  },
  { label: '## Deployment Topology', pattern: /^##\s*Deployment\s+Topology\b/im },
];

const BUILD_PLAN_REQUIRED_HEADINGS: HeadingRequirement[] = [
  { label: '## Execution Strategy', pattern: /^##\s*Execution\s+Strategy\b/im },
  { label: '## Risk Management', pattern: /^##\s*Risk\s+Management\b/im },
  { label: '## Validation Strategy', pattern: /^##\s*Validation\s+Strategy\b/im },
];

const PHASE_HEADING_PATTERN = /^\s*###\s*Phase\s+\d+\b.*$/gim;
const TASK_LINE_PATTERN = /^\s*[-*+]\s*\[(?:\s|[xX])\]\s+/gim;
const TECH_COMPONENT_PATTERN = /^\s*[-*]\s+Component:/gim;
const TECH_INTEGRATION_PATTERN = /^\s*[-*]\s+Integration:/gim;
const TECH_CONTRACT_PATTERN = /^\s*[-*]\s+Contract:/gim;
const PLACEHOLDER_CHECKS = [
  { label: 'TBD', pattern: /\bTBD\b/i },
  { label: 'TODO', pattern: /\bTODO\b/i },
  { label: 'TBA', pattern: /\bTBA\b/i },
  { label: 'placeholder', pattern: /\bplaceholder\b/i },
  { label: 'lorem ipsum', pattern: /\blorem\s+ipsum\b/i },
  { label: 'fill in', pattern: /\bfill\s+in\b/i },
  { label: 'pending review', pattern: /\bpending\s+review\b/i },
  { label: 'FIXME', pattern: /\bFIXME\b/i },
  { label: '???', pattern: /\?{3,}/ },
];

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

type AgentNexusBuildSuccessDetails = NonNullable<AgentNexusBuildResult['details']>;

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

function findMissingHeadings(content: string, requirements: HeadingRequirement[]): string[] {
  return requirements
    .filter(requirement => !requirement.pattern.test(content))
    .map(requirement => requirement.label);
}

function evaluateTechnicalSpecification(content: string): TechnicalSpecEvaluation {
  const missingHeadings = findMissingHeadings(content, TECH_SPEC_REQUIRED_HEADINGS);
  const components = (content.match(TECH_COMPONENT_PATTERN) ?? []).length;
  const integrations = (content.match(TECH_INTEGRATION_PATTERN) ?? []).length;
  const contracts = (content.match(TECH_CONTRACT_PATTERN) ?? []).length;

  return { missingHeadings, components, integrations, contracts } satisfies TechnicalSpecEvaluation;
}

function evaluateBuildPlan(content: string): BuildPlanEvaluation {
  const missingHeadings = findMissingHeadings(content, BUILD_PLAN_REQUIRED_HEADINGS);
  const phases = (content.match(PHASE_HEADING_PATTERN) ?? []).length;
  const tasks = (content.match(TASK_LINE_PATTERN) ?? []).length;

  return { missingHeadings, phases, tasks } satisfies BuildPlanEvaluation;
}

function detectPlaceholderTokens(content: string): string[] {
  const matches = new Set<string>();

  for (const { label, pattern } of PLACEHOLDER_CHECKS) {
    if (pattern.test(content)) {
      matches.add(label);
    }
  }

  return Array.from(matches).sort((a, b) => a.localeCompare(b));
}

function compileValidationFailures(
  technical: TechnicalSpecEvaluation,
  buildPlan: BuildPlanEvaluation,
  technicalContent: string,
  buildPlanContent: string
): string[] {
  const failures: string[] = [];

  if (technical.missingHeadings.length > 0) {
    failures.push(`technical specification missing sections: ${technical.missingHeadings.join(', ')}`);
  }

  if (buildPlan.missingHeadings.length > 0) {
    failures.push(`build plan missing sections: ${buildPlan.missingHeadings.join(', ')}`);
  }

  if (buildPlan.phases < 3) {
    failures.push('build plan must define at least three execution phases');
  }

  if (buildPlan.tasks < 10) {
    failures.push('build plan must outline a minimum of ten actionable tasks');
  }

  if (technical.components < 4) {
    failures.push('technical specification must describe at least four core components');
  }

  if (technical.integrations < 3) {
    failures.push('technical specification must document at least three integrations');
  }

  if (technical.contracts < 3) {
    failures.push('technical specification must define at least three data contracts');
  }

  const technicalPlaceholders = detectPlaceholderTokens(technicalContent);
  if (technicalPlaceholders.length > 0) {
    failures.push(`technical specification contains placeholder text: ${technicalPlaceholders.join(', ')}`);
  }

  const buildPlanPlaceholders = detectPlaceholderTokens(buildPlanContent);
  if (buildPlanPlaceholders.length > 0) {
    failures.push(`build plan contains placeholder text: ${buildPlanPlaceholders.join(', ')}`);
  }

  return failures;
}

function formatSuccessMessage(details: AgentNexusBuildSuccessDetails): string {
  const { components, integrations, contracts } = details.technicalSpec;
  const { tasks, phases } = details.buildPlan;

  const segments = [
    'AgentNexus build prompt prerequisites satisfied:',
    `${components} components,`,
    `${integrations} integrations,`,
    `${contracts} data contracts,`,
    `and ${tasks} actionable tasks across ${phases} phases are documented.`,
    'Ready for automated execution.',
  ];

  return segments.join(' ');
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
  const validationFailures = compileValidationFailures(
    technicalEvaluation,
    buildPlanEvaluation,
    technicalSpecContent,
    buildPlanContent
  );

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
    message: formatSuccessMessage(details),
    workspaceRoot: resolvedRoot,
    validationFailures,
    details,
  } satisfies AgentNexusBuildResult;
}
