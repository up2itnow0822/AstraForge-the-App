import * as fs from 'fs';
import * as path from 'path';
import { LanceDBClient } from '../core/storage/LanceDBClient.js';

export interface TestModule {
  module: string;
  methods: string[];
  coverage: number;
}

export class TestGenerator {
  private lanceDB: LanceDBClient;

  constructor() {
    this.lanceDB = new LanceDBClient('./test_coverage.db');
  }

  async scanForNewModules(srcDir: string = 'src/'): Promise<TestModule[]> {
    const modules: TestModule[] = [];

    async function scanDirectory(dir: string) {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
          const relativePath = path.relative('src/', fullPath).replace(/\.ts$/, '');
          const testPath = path.join('tests/', relativePath + '.test.ts');

          // Check if test file exists
          if (!fs.existsSync(testPath)) {
            const methods = await this.extractMethods(fullPath);
            modules.push({
              module: relativePath,
              methods: methods,
              coverage: 0
            });
          } else {
            // Check coverage
            const coverage = await this.getCoverageForModule(relativePath);
            if (coverage < 85) {
              const methods = await this.extractMethods(fullPath);
              modules.push({
                module: relativePath,
                methods: methods,
                coverage
              });
            }
          }
        }
      }
    }

    await scanDirectory(srcDir);
    return modules;
  }

  private async extractMethods(filePath: string): Promise<string[]> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const methodPattern = /(?:public|private|async)?\s+(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*{/g;
    const matches = content.matchAll(methodPattern);
    const methods = Array.from(matches, m => m[1]).filter(m => 
      !['if', 'for', 'while', 'catch', 'try', 'switch', 'constructor'].includes(m)
    );
    return [...new Set(methods)];
  }

  private async getCoverageForModule(module: string): Promise<number> {
    // Query LanceDB for coverage data
    const coverageData = await this.lanceDB.query(`
      SELECT coverage FROM test_coverage WHERE module = '${module}'
    `);
    return coverageData.length > 0 ? coverageData[0].coverage : 0;
  }

  async generateTestsForModule(modulePath: string, methods: string[]): Promise<string[]> {
    const testCases: string[] = [];
    const className = path.basename(modulePath).replace(/\.ts$/, '');

    // Main describe block
    testCases.push(`describe('${className}', () => {`);
    testCases.push('  let instance: any;
');
    testCases.push('  beforeEach(() => {');
    testCases.push(`    instance = new ${className}();`);
    testCases.push('    jest.clearAllMocks();');
    testCases.push('  });
');

    for (const method of methods) {
      if (method === 'constructor') continue;

      // Input validation test
      testCases.push(`  describe('${method}', () => {`);
      testCases.push(`    it('should validate input parameters', async () => {`);
      testCases.push(`      await expect(instance.${method}(null)).rejects.toThrow();`);
      testCases.push(`      await expect(instance.${method}(undefined)).rejects.toThrow();`);
      testCases.push('    });
');

      // Success case test
      testCases.push(`    it('should return valid result for valid input', async () => {`);
      testCases.push(`      const result = await instance.${method}(/* valid input */);`);
      testCases.push(`      expect(result).toBeDefined();`);
      testCases.push('    });
');

      // Error handling test
      testCases.push(`    it('should handle errors gracefully', async () => {`);
      testCases.push(`      await expect(instance.${method}(/* invalid input */)).rejects.toThrow();`);
      testCases.push('    });
');

      // Agent-specific test if applicable
      if (method.includes('Agent') || className.includes('Agent')) {
        testCases.push(`    it('should return valid score in AgentResult', async () => {`);
        testCases.push(`      const result = await instance.${method}(validTask);`);
        testCases.push(`      expect(result.score).toBeDefined();`);
        testCases.push(`      expect(typeof result.score).toBe('number');`);
        testCases.push(`      expect(result.score).toBeGreaterThanOrEqual(0);`);
        testCases.push(`      expect(result.score).toBeLessThanOrEqual(100);`);
        testCases.push('    });
');
      }

      testCases.push('  });
');
    }

    testCases.push('});');
    return testCases;
  }

  async generateTestFile(module: TestModule): Promise<string> {
    const imports = [
      "import { describe, it, expect, jest, beforeEach } from '@jest/globals';",
      `import { ${path.basename(module.module).replace(/\.ts$/, '')} } from '../src/${module.module}';`,
      '',
      'jest.mock('openai');',
      'jest.mock('@anthropic-ai/sdk');',
      'jest.mock('../core/storage/LanceDBClient');',
      ''
    ];

    const testCases = await this.generateTestsForModule(module.module, module.methods);
    return imports.join('\n') + '\n' + testCases.join('\n');
  }

  async generateMissingTests(): Promise<string[]> {
    const newModules = await this.scanForNewModules();
    const generatedFiles: string[] = [];

    for (const module of newModules) {
      const testContent = await this.generateTestFile(module);
      const testPath = path.join('tests/', module.module + '.test.ts');

      // Ensure directory exists
      await fs.promises.mkdir(path.dirname(testPath), { recursive: true });

      await fs.promises.writeFile(testPath, testContent);
      generatedFiles.push(testPath);
      console.log(`Generated test file: ${testPath}`);
    }

    return generatedFiles;
  }

  async run(): Promise<void> {
    console.log('Scanning for modules that need test coverage...');
    const generatedFiles = await this.generateMissingTests();

    console.log(`\nGenerated ${generatedFiles.length} test files:`);
    generatedFiles.forEach(file => console.log(`  - ${file}`));

    if (generatedFiles.length > 0) {
      console.log('\nRunning tests to verify generated files compile...');
      // Run TypeScript check on generated files
      const { execSync } = await import('child_process');
      for (const file of generatedFiles) {
        try {
          execSync(`npx tsc --noEmit ${file}`, { stdio: 'pipe' });
          console.log(`✅ ${file} compiles successfully`);
        } catch (error) {
          console.log(`❌ ${file} has compilation errors`);
        }
      }
    }
  }
}

// Run if called directly
if (import.meta.url === `file://\${process.argv[1]}`) {
const generator = new TestGenerator();
generator.run().catch(console.error);
}

export default TestGenerator;
