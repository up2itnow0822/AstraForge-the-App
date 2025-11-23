"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestGenerator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const LanceDBClient_js_1 = require("../core/storage/LanceDBClient.js");
class TestGenerator {
    constructor() {
        this.lanceDB = new LanceDBClient_js_1.LanceDBClient('./test_coverage.db');
    }
    async scanForNewModules(srcDir = 'src/') {
        const modules = [];
        async function scanDirectory(dir) {
            const entries = await fs.promises.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    await scanDirectory(fullPath);
                }
                else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
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
                    }
                    else {
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
    async extractMethods(filePath) {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const methodPattern = /(?:public|private|async)?\s+(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*{/g;
        const matches = content.matchAll(methodPattern);
        const methods = Array.from(matches, m => m[1]).filter(m => !['if', 'for', 'while', 'catch', 'try', 'switch', 'constructor'].includes(m));
        return [...new Set(methods)];
    }
    async getCoverageForModule(module) {
        // Query LanceDB for coverage data
        const coverageData = await this.lanceDB.query(`
      SELECT coverage FROM test_coverage WHERE module = '${module}'
    `);
        return coverageData.length > 0 ? coverageData[0].coverage : 0;
    }
    async generateTestsForModule(modulePath, methods) {
        const testCases = [];
        const className = path.basename(modulePath).replace(/\.ts$/, '');
        // Main describe block
        testCases.push(`describe('${className}', () => {`);
        testCases.push('  let instance: any;, ');, testCases.push('  beforeEach(() => {'));
        testCases.push(`    instance = new ${className}();`);
        testCases.push('    jest.clearAllMocks();');
        testCases.push('  });, '););
        for (const method of methods) {
            if (method === 'constructor')
                continue;
            // Input validation test
            testCases.push(`  describe('${method}', () => {`);
            testCases.push(`    it('should validate input parameters', async () => {`);
            testCases.push(`      await expect(instance.${method}(null)).rejects.toThrow();`);
            testCases.push(`      await expect(instance.${method}(undefined)).rejects.toThrow();`);
            testCases.push('    });, ');
            // Success case test
            , 
            // Success case test
            testCases.push(`    it('should return valid result for valid input', async () => {`));
            testCases.push(`      const result = await instance.${method}(/* valid input */);`);
            testCases.push(`      expect(result).toBeDefined();`);
            testCases.push('    });, ');
            // Error handling test
            , 
            // Error handling test
            testCases.push(`    it('should handle errors gracefully', async () => {`));
            testCases.push(`      await expect(instance.${method}(/* invalid input */)).rejects.toThrow();`);
            testCases.push('    });, '););
            // Agent-specific test if applicable
            if (method.includes('Agent') || className.includes('Agent')) {
                testCases.push(`    it('should return valid score in AgentResult', async () => {`);
                testCases.push(`      const result = await instance.${method}(validTask);`);
                testCases.push(`      expect(result.score).toBeDefined();`);
                testCases.push(`      expect(typeof result.score).toBe('number');`);
                testCases.push(`      expect(result.score).toBeGreaterThanOrEqual(0);`);
                testCases.push(`      expect(result.score).toBeLessThanOrEqual(100);`);
                testCases.push('    });, '););
            }
            testCases.push('  });, '););
        }
        testCases.push('});');
        return testCases;
    }
    async generateTestFile(module) {
        const imports = [
            "import { describe, it, expect, jest, beforeEach } from '@jest/globals';",
            `import { ${path.basename(module.module).replace(/\.ts$/, '')} } from '../src/${module.module}';`,
            '',
            'jest.mock(', openai, ');',
            'jest.mock(',  - ai / sdk, ');',
            'jest.mock('.. / core / storage / LanceDBClient_js_1.LanceDBClient, ');',
            ''
        ];
        const testCases = await this.generateTestsForModule(module.module, module.methods);
        return imports.join('\n') + '\n' + testCases.join('\n');
    }
    async generateMissingTests() {
        const newModules = await this.scanForNewModules();
        const generatedFiles = [];
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
    async run() {
        console.log('Scanning for modules that need test coverage...');
        const generatedFiles = await this.generateMissingTests();
        console.log(`\nGenerated ${generatedFiles.length} test files:`);
        generatedFiles.forEach(file => console.log(`  - ${file}`));
        if (generatedFiles.length > 0) {
            console.log('\nRunning tests to verify generated files compile...');
            // Run TypeScript check on generated files
            const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
            for (const file of generatedFiles) {
                try {
                    execSync(`npx tsc --noEmit ${file}`, { stdio: 'pipe' });
                    console.log(`✅ ${file} compiles successfully`);
                }
                catch (error) {
                    console.log(`❌ ${file} has compilation errors`);
                }
            }
        }
    }
}
exports.TestGenerator = TestGenerator;
// Run if called directly
if (import.meta.url === `file://\${process.argv[1]}`) {
    const generator = new TestGenerator();
    generator.run().catch(console.error);
}
exports.default = TestGenerator;
