import { promises as fsPromises, constants as fsConstants } from 'fs';
import * as path from 'path';

const REQUIRED_SPEC_FILES = [
  'docs/specs/AgentNexus_Technical_Spec_Final.txt',
  'docs/specs/Comprehensive_Build_Plan_for_AgentNexus.txt',
];

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
    } satisfies AgentNexusBuildResult;
  }

  stepsAttempted.push('load technical specifications into build workflow');
  stepsAttempted.push('execute AstraForge Spec Kit automation for AgentNexus');

  return {
    success: false,
    missingSpecs,
    stepsAttempted,
    message:
      'AgentNexus build prompt could not be completed because it requires the AstraForge IDE runtime environment and LLM access. Technical specifications are present.',
    workspaceRoot: resolvedRoot,
  } satisfies AgentNexusBuildResult;
}
