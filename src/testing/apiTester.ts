import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { Provider } from './types';
import { ApiTesterCore } from './apiTesterCore';
import { withRetry } from '../utils/retry';

export class ApiTester {
  private core: ApiTesterCore;
  private providers: Provider[];
  private circuitOpen = false;
  private failCount = 0;
  private tempDir: string;

  constructor(providers: Provider[]) {
    this.providers = providers.map(p => ({...p, apiKey: '***MASKED***'}));
    this.core = new ApiTesterCore(this.providers);
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apiTester-'));
  }

  async generateTests(feature: string): Promise<string> {
    const codePath = path.join(__dirname, '..', 'features', `${feature}.ts`);
    if (!fs.existsSync(codePath)) throw new Error(`Code file not found: ${codePath}`);
    const code = fs.readFileSync(codePath, 'utf8');
    const prompt = await this.core.generatePrompts(code, feature);
    return this.core.genUnitTests(feature) + this.core.genIntTests(feature) + this.core.genPropertyTests(feature) + this.core.genChaosTests();
  }

  async fixCodeWithLLM(implCode: string, errors: string[]): Promise<{success: boolean; fixedCode: string; errors: string[]}> {
    try {
      const errorsStr = errors.join('\n') || 'no errors';
      const fixPrompt = `Fix code for errors, target >85% cov:\nCode: ${implCode}\nErrors: ${errorsStr}`;
      const fixed = await withRetry(() => this.callLLM(fixPrompt, this.providers[0]), 3);
      return {success: true, fixedCode: fixed, errors: []};
    } catch (error) {
      const errMsg = (error as Error).message;
      return {success: false, fixedCode: implCode, errors: [errMsg]};
    }
  }

  async runTestCycle(feature: string, maxTries = 5): Promise<{success: boolean; coverage: number; errors: string[]}> {
    if (this.circuitOpen) return {success: false, coverage: 0, errors: ['Circuit open']};
    let success = false;
    let coverage = 0;
    const errors: string[] = [];
    const testsCode = await this.generateTests(feature);
    let implCode = fs.readFileSync(path.join(__dirname, '..', 'features', `${feature}.ts`), 'utf8');
    for (let tryNum = 1; tryNum <= maxTries; tryNum++) {
      const result = await this.core.runTests(testsCode, implCode);
      if (result.success && result.coverage >= 85) {
        success = true;
        coverage = result.coverage;
        break;
      }
      errors.push(...result.errors);
      this.failCount++;
      if (this.failCount >= 3) {
        this.circuitOpen = true;
        setTimeout(() => {this.circuitOpen = false; this.failCount = 0;}, 5000);
        break;
      }
      await new Promise(r => setTimeout(r, Math.pow(2, tryNum) * 1000));
      const fixResult = await this.fixCodeWithLLM(implCode, result.errors);
      if (fixResult.success) implCode = fixResult.fixedCode;
      else errors.push(...fixResult.errors);
    }
    this.cleanup();
    return {success, coverage, errors};
  }

  private async callLLM(prompt: string, provider: Provider): Promise<string> {
    console.log('LLM call masked');
    return 'fixed impl code';
  }

  private cleanup() {
    if (fs.existsSync(this.tempDir)) fs.rmSync(this.tempDir, {recursive: true});
  }
}
