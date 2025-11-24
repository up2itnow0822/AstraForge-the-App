import fs from 'fs';
import path from 'path';

interface ValidationContext {
  errors: string[];
  checked: Map<string, string[]>;
  addError(message: string): void;
  setChecked(type: string, path: string): void;
}

interface AgentNexusBuildResult {
  success: boolean;
  output: string;
  errors: string[];
}

class ValidationContextImpl implements ValidationContext {
  errors: string[] = [];
  checked: Map<string, string[]> = new Map();

  /**
   *
   * @param message
   */
  addError(message: string): void {
    this.errors.push(message);
  }

  /**
   *
   * @param type
   * @param path
   */
  setChecked(type: string, path: string): void {
    if (!this.checked.has(type)) {
      this.checked.set(type, []);
    }
    this.checked.get(type)!.push(path);
  }
}

/**
 *
 * @param filePath
 */
function readFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    return 'ERROR_READING_FILE';
  }
}

/**
 *
 * @param content
 */
function filterOutChecklistLines(content: string): string {
  const lines = content.split('\n');
  const filteredLines = lines.filter(line => !/^\s*-\s*\[[x\s]\]/.test(line));
  return filteredLines.join('\n');
}

/**
 *
 * @param ctx
 * @param specPath
 */
function validateSpecFile(ctx: ValidationContextImpl, specPath: string): void {
  if (!fs.existsSync(specPath)) {
    ctx.addError(`specification files missing: ${specPath}`);
    return;
  }

  ctx.setChecked('spec', specPath);
  const content = readFileContent(specPath);

  if (content.startsWith('ERROR_READING_FILE')) {
    ctx.addError(`specification files missing or unreadable: ${specPath}`);
    return;
  }

  const filteredContent = filterOutChecklistLines(content);

  const placeholderPatterns = [
    /\[TODO\]/gi,
    /\[PLACEHOLDER\]/gi,
    /\[TBD\]/gi,
    /\[FIXME\]/gi,
    /\[NEEDS CLARIFICATION\]/gi,
    /TODO:/gi,
    /PLACEHOLDER:/gi,
  ];

  let foundPlaceholder = false;
  for (const pattern of placeholderPatterns) {
    if (pattern.test(filteredContent)) {
      foundPlaceholder = true;
      break;
    }
  }
}

/**
 *
 * @param ctx
 * @param planPath
 */
function validateBuildPlan(ctx: ValidationContextImpl, planPath: string): void {
  if (!fs.existsSync(planPath)) {
    ctx.addError(`build plan files missing: ${planPath}`);
    return;
  }

  ctx.setChecked('plan', planPath);
  const content = readFileContent(planPath);

  if (content.startsWith('ERROR_READING_FILE')) {
    ctx.addError(`build plan files missing or unreadable: ${planPath}`);
    return;
  }

  const filteredContent = filterOutChecklistLines(content);

  const placeholderPatterns = [
    /\[TODO\]/gi,
    /\[PLACEHOLDER\]/gi,
    /\[TBD\]/gi,
    /\[FIXME\]/gi,
    /\[NEEDS CLARIFICATION\]/gi,
    /TODO:/gi,
    /PLACEHOLDER:/gi,
  ];

  let foundPlaceholder = false;
  for (const pattern of placeholderPatterns) {
    if (pattern.test(filteredContent)) {
      foundPlaceholder = true;
      break;
    }
  }
}

/**
 *
 * @param workspaceRoot
 */
export async function agentNexusBuildRunner(workspaceRoot?: string): Promise<AgentNexusBuildResult> {
  const rootDir = workspaceRoot || path.join(process.cwd(), 'specs');

  if (!fs.existsSync(rootDir)) {
    return {
      success: false,
      output: 'Specs directory not found',
      errors: [`Directory does not exist: ${rootDir}`]
    };
  }

  const ctx = new ValidationContextImpl();
  const projectDirs = fs.readdirSync(rootDir)
    .filter(dir => /^\d/.test(dir) && fs.statSync(path.join(rootDir, dir)).isDirectory());

  if (projectDirs.length === 0) {
    ctx.addError('No project directories found in specs folder');
  }

  for (const projectDir of projectDirs) {
    const projectPath = path.join(rootDir, projectDir);
    const specPath = path.join(projectPath, 'spec.md');
    const planPath = path.join(projectPath, 'plan.md');

    validateSpecFile(ctx, specPath);
    validateBuildPlan(ctx, planPath);
  }

  if (ctx.errors.length > 0) {
    return {
      success: false,
      output: 'Validation failed',
      errors: ctx.errors
    };
  }

  return {
    success: true,
    output: `Validated ${projectDirs.length} projects successfully`,
    errors: []
  };
}
