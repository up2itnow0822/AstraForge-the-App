import { describe, it, expect, beforeEach, vi, afterEach, jest } from '@jest/globals';
import { exec } from 'child_process/promises';
import AxeCorePuppeteer from '@axe-core/puppeteer';
import { Octokit } from '@octokit/rest';
import { SecureLogger } from '../src/utils/secureLogger.js';
import llmManager from '../src/utils/llmManager.js';

jest.mock('child_process/promises');
jest.mock('@axe-core/puppeteer');
jest.mock('../src/utils/secureLogger');
jest.mock('../src/utils/llmManager', () => ({ default: { call: jest.fn() } }));
jest.mock('@octokit/rest');

const mockExec = vi.mocked(exec);
const mockAxeCorePuppeteer = vi.mocked(AxeCorePuppeteer.getAxeRunOnUrl);
const mockSecureLogger = vi.mocked(SecureLogger);
const mockSLInstance = {
  esClient: { search: jest.fn() },
  info: jest.fn(),
  error: jest.fn(),
};
mockSecureLogger.mockReturnValue(mockSLInstance as any);
const mockLlmCall = vi.mocked((llmManager as any).call);
const mockOctokit = vi.mocked(Octokit);
const mockOctokitInstance = { rest: { issues: { create: jest.fn() } } };
mockOctokit.mockReturnValue(mockOctokitInstance as any);

let main: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const module = await import('../scripts/quarterlyAudit.js');
  main = module.main;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Quarterly Audit', () => {
  it('snyk pass 0 vulns', async () => {
    mockExec.mockResolvedValue({ stdout: JSON.stringify({ vulnerabilities: [] }) } as any);
    await main();
    expect(mockSLInstance.info).toHaveBeenCalledWith('Snyk pass 0 vulns');
    // Implicit vulns=0
  });

  it('snyk fail vulns >0', async () => {
    mockExec.mockResolvedValue({ stdout: JSON.stringify({ vulnerabilities: [{ id: 'test' }] }) } as any);
    await main();
    expect(mockSLInstance.error).toHaveBeenCalledWith({ vulns: 1 });
  });

  it('snyk exec error', async () => {
    mockExec.mockRejectedValue(new Error('exec fail'));
    await main();
    expect(mockSLInstance.error).toHaveBeenCalledWith(expect.stringContaining('Snyk error: exec fail'));
  });

  it('axe pass 0 violations', async () => {
    const mockAxeRun = { analyze: jest.fn().mockResolvedValue({ violations: [] }) };
    mockAxeCorePuppeteer.mockResolvedValue(mockAxeRun);
    await main();
    expect(mockSLInstance.info).toHaveBeenCalledWith('Axe pass 0 violations');
  });

  it('axe fail violations >0', async () => {
    const mockAxeRun = { analyze: jest.fn().mockResolvedValue({ violations: [{ desc: 'test' }] }) };
    mockAxeCorePuppeteer.mockResolvedValue(mockAxeRun);
    await main();
    expect(mockSLInstance.error).toHaveBeenCalledWith({ axe: 1, desc: expect.any(Array) });
  });

  it('axe analyze error', async () => {
    const mockAxeRun = { analyze: jest.fn().mockRejectedValue(new Error('analyze fail')) };
    mockAxeCorePuppeteer.mockResolvedValue(mockAxeRun);
    await main();
    expect(mockSLInstance.error).toHaveBeenCalledWith(expect.stringContaining('Axe error: analyze fail'));
  });

  it('soc2 no issues empty hits', async () => {
    const mockHits = { body: { hits: { hits: [] } } };
    mockSLInstance.esClient.search.mockResolvedValue(mockHits as any);
    mockLlmCall.mockResolvedValue('no issues found');
    await main();
    expect(mockSLInstance.info).toHaveBeenCalledWith('SOC2 pass');
    expect(mockLlmCall).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.objectContaining({ prompt: expect.stringContaining('Audit last quarter logs') }));
  });

  it('soc2 no issues with bias hit but llm pass', async () => {
    const mockHits = { body: { hits: { hits: [{ _source: { level: 'error', message: 'bias test' } }] } } };
    mockSLInstance.esClient.search.mockResolvedValue(mockHits as any);
    mockLlmCall.mockResolvedValue('no issues found');
    await main();
    expect(mockSLInstance.info).toHaveBeenCalledWith('SOC2 pass');
  });

  it('soc2 issues detected', async () => {
    const mockHits = { body: { hits: { hits: [{ _source: { message: 'bias' } }] } } };
    mockSLInstance.esClient.search.mockResolvedValue(mockHits as any);
    mockLlmCall.mockResolvedValue('Issue: bias in logs');
    await main();
    expect(mockSLInstance.error).toHaveBeenCalledWith({ soc2: 'Issue: bias in logs' });
  });

  it('soc2 search error fallback', async () => {
    mockSLInstance.esClient.search.mockRejectedValue(new Error('search fail'));
    await main();
    expect(mockSLInstance.error).toHaveBeenCalledWith(expect.stringContaining('SOC2 error: search fail'));
    expect(mockLlmCall).not.toHaveBeenCalled();
  });

  it('all pass combo md and github', async () => {
    mockExec.mockResolvedValue({ stdout: JSON.stringify({ vulnerabilities: [] }) } as any);
    const mockAxeRun = { analyze: jest.fn().mockResolvedValue({ violations: [] }) };
    mockAxeCorePuppeteer.mockResolvedValue(mockAxeRun);
    mockSLInstance.esClient.search.mockResolvedValue({ body: { hits: { hits: [] } } } as any);
    mockLlmCall.mockResolvedValue('no issues found');
    mockOctokitInstance.rest.issues.create.mockResolvedValue({} as any);
    await main();
    const date = new Date().toISOString().split('T')[0];
    expect(mockOctokitInstance.rest.issues.create).toHaveBeenCalledWith({
      owner: 'up2itnow',
      repo: 'AstraForge',
      title: `[QUARTERLY] Audit ${date}`,
      body: expect.stringContaining('All pass'),
      labels: ['audit', 'security'],
    });
    expect(mockSLInstance.info).toHaveBeenCalledWith('GitHub issue created for quarterly audit');
  });

  it('snyk fail combo md action needed and github', async () => {
    mockExec.mockResolvedValue({ stdout: JSON.stringify({ vulnerabilities: [{id:'test'}] }) } as any);
    const mockAxeRun = { analyze: jest.fn().mockResolvedValue({ violations: [] }) };
    mockAxeCorePuppeteer.mockResolvedValue(mockAxeRun);
    mockSLInstance.esClient.search.mockResolvedValue({ body: { hits: { hits: [] } } } as any);
    mockLlmCall.mockResolvedValue('no issues found');
    mockOctokitInstance.rest.issues.create.mockResolvedValue({} as any);
    await main();
    const date = new Date().toISOString().split('T')[0];
    expect(mockOctokitInstance.rest.issues.create).toHaveBeenCalledWith(expect.objectContaining({
      title: `[QUARTERLY] Audit ${date}`,
      body: expect.stringContaining('Action needed'),
    }));
  });

  it('github create success', async () => {
    // Setup pass mocks
    mockExec.mockResolvedValue({ stdout: JSON.stringify({ vulnerabilities: [] }) } as any);
    const mockAxeRun = { analyze: jest.fn().mockResolvedValue({ violations: [] }) };
    mockAxeCorePuppeteer.mockResolvedValue(mockAxeRun);
    mockSLInstance.esClient.search.mockResolvedValue({ body: { hits: { hits: [] } } } as any);
    mockLlmCall.mockResolvedValue('no issues found');
    mockOctokitInstance.rest.issues.create.mockResolvedValue({ data: { html_url: 'url' } } as any);
    await main();
    expect(mockSLInstance.info).toHaveBeenCalledWith('GitHub issue created for quarterly audit');
  });

  it('github create error', async () => {
    // Setup pass mocks
    mockExec.mockResolvedValue({ stdout: JSON.stringify({ vulnerabilities: [] }) } as any);
    const mockAxeRun = { analyze: jest.fn().mockResolvedValue({ violations: [] }) };
    mockAxeCorePuppeteer.mockResolvedValue(mockAxeRun);
    mockSLInstance.esClient.search.mockResolvedValue({ body: { hits: { hits: [] } } } as any);
    mockLlmCall.mockResolvedValue('no issues found');
    mockOctokitInstance.rest.issues.create.mockRejectedValue(new Error('github fail'));
    await main();
    expect(mockSLInstance.error).toHaveBeenCalledWith(expect.stringContaining('GitHub issue creation error: github fail'));
  });

  it('ethics prompt data slice 4000 chars', async () => {
    const longData = 'a'.repeat(5000);
    const mockHits = { body: { hits: { hits: [{ _source: longData }] } } };
    mockSLInstance.esClient.search.mockResolvedValue(mockHits as any);
    mockLlmCall.mockResolvedValue('no issues found');
    await main();
    expect(mockLlmCall.mock.calls[0][2].prompt.length).toBeLessThanOrEqual(4000 + 100); // Approx with prompt prefix
  });

  it('full error handling multiple throws', async () => {
    mockExec.mockRejectedValue(new Error('snyk err'));
    mockAxeCorePuppeteer.mockRejectedValue(new Error('axe err'));
    mockSLInstance.esClient.search.mockRejectedValue(new Error('es err'));
    mockOctokitInstance.rest.issues.create.mockRejectedValue(new Error('gh err'));
    await main();
    expect(mockSLInstance.error).toHaveBeenCalledTimes(4); // snyk, axe, soc2, github
  });

  // Additional cases for coverage
  it('snyk invalid json stdout', async () => {
    mockExec.mockResolvedValue({ stdout: 'invalid json' } as any);
    await main();
    expect(mockSLInstance.error).toHaveBeenCalledWith(expect.stringContaining('Snyk error:')); // Parse error caught
  });

  it('axe getAxeRunOnUrl error', async () => {
    mockAxeCorePuppeteer.mockRejectedValue(new Error('axe run fail'));
    await main();
    expect(mockSLInstance.error).toHaveBeenCalledWith(expect.stringContaining('Axe error: axe run fail'));
  });

  it('soc2 llm call error', async () => {
    const mockHits = { body: { hits: { hits: [] } } };
    mockSLInstance.esClient.search.mockResolvedValue(mockHits as any);
    mockLlmCall.mockRejectedValue(new Error('llm err'));
    await main();
    expect(mockSLInstance.error).toHaveBeenCalledWith(expect.stringContaining('SOC2 error: llm err'));
  });

  it('all pass but soc2 issues md action needed', async () => {
    mockExec.mockResolvedValue({ stdout: JSON.stringify({ vulnerabilities: [] }) } as any);
    const mockAxeRun = { analyze: jest.fn().mockResolvedValue({ violations: [] }) };
    mockAxeCorePuppeteer.mockResolvedValue(mockAxeRun);
    mockSLInstance.esClient.search.mockResolvedValue({ body: { hits: { hits: [{ _source: { message: 'issue' } }] } } } as any);
    mockLlmCall.mockResolvedValue('Issue: found');
    mockOctokitInstance.rest.issues.create.mockResolvedValue({} as any);
    await main();
    expect(mockOctokitInstance.rest.issues.create.mock.calls[0][0].body).toContain('Action needed');
  });

  // 20+ total cases: 3 snyk, 3 axe, 4 soc2, 3 combos/github, 1 slice, 1 full err, 3 additional, 1 more = 19+; coverage >80% assumed via branches
});
