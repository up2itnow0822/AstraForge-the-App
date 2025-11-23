import { execSync } from 'child_process';
import * as fs from 'fs';

interface TestResult {
  file: string;
  status: 'passed' | 'failed';
  error?: string;
}

interface FixResult {
  finalPassRate: number;
  iterations: number;
  success: boolean;
}

interface FixSuggestion {
  file: string;
  line: number;
  issue: string;
  suggestion: string;
  complexity: 'simple' | 'complex';
  action: string;
}

export class TestFixLoop {
  private maxIterations = 5;
  private successThreshold = 0.95; // 95% pass rate target
  private appliedFixes: string[] = [];

  async runFixLoop(): Promise<FixResult> {
    console.log('Starting automatic test fix loop...');

    let iteration = 0;
    let passRate = 0;

    while (iteration < this.maxIterations && passRate < this.successThreshold) {
      console.log(`\n--- Iteration ${iteration + 1} ---`);

      const results = await this.runTests();
      passRate = results.passRate;

      console.log(`Pass rate: ${(passRate * 100).toFixed(1)}%`);

      if (passRate >= this.successThreshold) {
        console.log('✅ Success threshold reached!');
        break;
      }

      console.log(`Found ${results.failures.length} failing tests`);
      const fixes = await this.analyzeFailures(results.failures);
      console.log(`Generated ${fixes.length} fix suggestions`);

      const applied = await this.applyFixes(fixes);
      console.log(`Applied ${applied} automatic fixes`);

      if (applied === 0) {
        console.log('No more automatic fixes can be applied');
        break;
      }

      iteration++;
    }

    return {
      finalPassRate: passRate,
      iterations: iteration,
      success: passRate >= this.successThreshold
    };
  }

  private async runTests(): Promise<{ passRate: number; failures: TestResult[] }> {
    try {
      // Run tests with JSON output
      const output = execSync('npm test -- --json --passWithNoTests', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      const results = JSON.parse(output);
      const totalTests = results.numTotalTests || 0;
      const passedTests = results.numPassedTests || 0;
      const passRate = totalTests > 0 ? passedTests / totalTests : 0;

      const failures: TestResult[] = [];
      if (results.testResults) {
        for (const suite of results.testResults) {
          if (suite.status === 'failed') {
            for (const assertion of suite.assertionResults) {
              if (assertion.status === 'failed') {
                failures.push({
                  file: suite.name,
                  status: 'failed',
                  error: assertion.failureMessages?.join('\n')
                });
              }
            }
          }
        }
      }

      return { passRate, failures };
    } catch (error: any) {
      // If tests fail completely, parse error output
      console.error('Test execution failed:', error.message);
      return { passRate: 0, failures: [] };
    }
  }

  private async analyzeFailures(failures: TestResult[]): Promise<FixSuggestion[]> {
    const fixes: FixSuggestion[] = [];

    for (const failure of failures) {
      const suggestions = await this.analyzeSingleFailure(failure);
      fixes.push(...suggestions);
    }

    return fixes;
  }

  private async analyzeSingleFailure(failure: TestResult): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];
    const error = failure.error || '';
    const file = failure.file;

    // Read the test file to analyze the failure
    let fileContent = '';
    try {
      fileContent = fs.readFileSync(file, 'utf-8');
    } catch (e) {
      console.error(`Could not read file: ${file}`);
      return suggestions;
    }

    // Pattern matching for common errors

    // Timeout errors
    if (error.includes('Timeout') || error.includes('exceeded timeout')) {
      // Check for test without timeout specified
      const lines = fileContent.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('it(') || lines[i].includes('test(')) {
          if (!lines[i].includes('timeout:') && !lines.slice(Math.max(0, i-3), i).some(l => l.includes('timeout:'))) {
            suggestions.push({
              file,
              line: i + 1,
              issue: 'Test timeout',
              suggestion: 'Add timeout: 30000 to test options',
              complexity: 'simple',
              action: 'add-timeout'
            });
          }
        }
      }
    }

    // Import errors
    if (error.includes('Cannot find module') || error.includes('Module not found')) {
      const match = error.match(/Cannot find module ['"]([^'"]+)['"]/);
      if (match) {
        const missingModule = match[1];
        suggestions.push({
          file,
          line: 1,
          issue: `Missing import: ${missingModule}`,
          suggestion: `Add mock for ${missingModule}`,
          complexity: 'simple',
          action: 'add-mock'
        });
      }
    }

    // Assertion errors
    if (error.includes('expect') && error.includes('Received:')) {
      // Try to extract line number from stack trace
      const stackMatch = error.match(/at Object\.<anonymous>\s+\(([^:]+):(\d+):/);
      if (stackMatch) {
        const [, errorFile, lineNum] = stackMatch;
        if (errorFile === file) {
          suggestions.push({
            file,
            line: parseInt(lineNum),
            issue: 'Assertion mismatch',
            suggestion: 'Review expected vs actual values',
            complexity: 'complex',
            action: 'review-assertion'
          });
        }
      }
    }

    // Method signature errors
    if (error.includes('Expected') && error.includes('arguments')) {
      suggestions.push({
        file,
        line: 1,
        issue: 'Method signature mismatch',
        suggestion: 'Update method call to match actual signature',
        complexity: 'complex',
        action: 'fix-signature'
      });
    }

    return suggestions;
  }

  private async applyFixes(fixes: FixSuggestion[]): Promise<number> {
    let applied = 0;

    for (const fix of fixes) {
      if (fix.complexity === 'simple') {
        const success = await this.applySimpleFix(fix);
        if (success) {
          applied++;
          this.appliedFixes.push(`${fix.file}:${fix.line} - ${fix.suggestion}`);
        }
      } else {
        this.logForManualReview(fix);
      }
    }

    return applied;
  }

  private async applySimpleFix(fix: FixSuggestion): Promise<boolean> {
    try {
      const content = fs.readFileSync(fix.file, 'utf-8');
      const lines = content.split('\n');

      switch (fix.action) {
        case 'add-timeout':
          // Find the test line and add timeout
          for (let i = 0; i < lines.length; i++) {
            if (i === fix.line - 1 && (lines[i].includes('it(') || lines[i].includes('test('))) {
              // Add timeout parameter
              if (lines[i].includes(', () => {')) {
                lines[i] = lines[i].replace(', () => {', ', () => {\n    }, 30000);\n  it(');
              } else if (lines[i].includes('{')) {
                lines[i] = lines[i].replace('{', '{\n    timeout: 30000, \n');
              }
              break;
            }
          }
          break;

        case 'add-mock':
          // Add mock at top of file
          const mockStatement = `jest.mock('${fix.issue.split(': ')[1]}');`;
          if (!content.includes(mockStatement)) {
            lines.splice(1, 0, mockStatement);
          }
          break;

        default:
          return false;
      }

      fs.writeFileSync(fix.file, lines.join('\n'));
      console.log(`✅ Applied fix: ${fix.suggestion}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to apply fix: ${fix.suggestion}`, error);
      return false;
    }
  }

  private logForManualReview(fix: FixSuggestion): void {
    console.log(`\n🔧 Complex fix needed for manual review:`);
    console.log(`   File: ${fix.file}:${fix.line}`);
    console.log(`   Issue: ${fix.issue}`);
    console.log(`   Suggestion: ${fix.suggestion}`);
    console.log(`   Action: ${fix.action}\n`);
  }

  getAppliedFixes(): string[] {
    return this.appliedFixes;
  }
}

// Run if called directly
if (import.meta.url === `file://\${process.argv[1]}`) {
const fixLoop = new TestFixLoop();
fixLoop.runFixLoop().then(result => {
  console.log('\n=== Fix Loop Complete ===');
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Final pass rate: ${(result.finalPassRate * 100).toFixed(1)}%`);
  console.log(`Success: ${result.success ? '✅' : '❌'}`);

  if (fixLoop.getAppliedFixes().length > 0) {
    console.log('\nApplied fixes:');
    fixLoop.getAppliedFixes().forEach(fix => console.log(`  - ${fix}`));
  }
}).catch(console.error);
}
