import { exec } from 'child_process/promises';
import puppeteer from 'puppeteer';
import AxeCorePuppeteer from '@axe-core/puppeteer';
import { Octokit } from '@octokit/rest';
import { SecureLogger } from '../src/utils/secureLogger.js'; // Adjust if singleton

// Assume llmManager is default export from ../src/utils/llmManager.js
import llmManager from '../src/utils/llmManager.js';

const secureLogger = new SecureLogger(); // Or secureLogger if global instance

async function main() {
  const date = new Date().toISOString().split('T')[0];
  let vulns = 0;
  try {
    const { stdout } = await exec('npx snyk test --file=pnpm-lock.yaml --json-output-file=-');
    const snykData = JSON.parse(stdout);
    vulns = snykData.vulnerabilities?.length || 0;
    if (vulns > 0) {
      secureLogger.error({ vulns });
    } else {
      secureLogger.info('Snyk pass 0 vulns');
    }
  } catch (e) {
    secureLogger.error(`Snyk error: ${e.message}`);
    vulns = -1; // Flag error
  }

  let axeViolations = [];
  try {
    const axe = await AxeCorePuppeteer.getAxeRunOnUrl('http://localhost:3000/d/astrafoge-kpis');
    const results = await axe.analyze();
    axeViolations = results.violations;
    const numViolations = axeViolations.length;
    if (numViolations > 0) {
      secureLogger.error({ axe: numViolations, desc: axeViolations });
    } else {
      secureLogger.info('Axe pass 0 violations');
    }
  } catch (e) {
    secureLogger.error(`Axe error: ${e.message}`);
    axeViolations = [{ id: 'error' }]; // Flag
  }

  let ethicsReport = 'no issues found';
  try {
    const esQuery = {
      index: 'astrafoge-logs',
      body: {
        query: {
          range: {
            timestamp: { gte: 'now-90d' }
          }
        },
        size: 1000
      }
    };
    const elkQuery = await secureLogger.esClient.search(esQuery);
    const data = JSON.stringify(elkQuery.body.hits.hits.map(h => h._source)).slice(0, 4000);
    const prompt = `Audit last quarter logs for SOC2 compliance (bias, privacy, fairness, ethics, security): ${data}. List issues or respond 'no issues found'.`;
    ethicsReport = await llmManager.call('google/gemini-2.5-flash', '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', { prompt });
    if (!ethicsReport.includes('no issues found')) {
      secureLogger.error({ soc2: ethicsReport });
    } else {
      secureLogger.info('SOC2 pass');
    }
  } catch (e) {
    secureLogger.error(`SOC2 error: ${e.message}`);
    ethicsReport = 'Error in SOC2 audit';
  }

  const numAxe = axeViolations.length;
  const md = `# Quarterly Audit ${date}

## Snyk: ${vulns}
## Axe: ${numAxe}
## SOC2: ${ethicsReport.slice(0, 200)}
${vulns === 0 && numAxe === 0 && ethicsReport.includes('no issues found') ? 'All pass' : 'Action needed'}`;

  const octokit = new Octokit({ auth: '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' });
  try {
    await octokit.rest.issues.create({
      owner: 'up2itnow',
      repo: 'AstraForge',
      title: `[QUARTERLY] Audit ${date}`,
      body: md,
      labels: ['audit', 'security']
    });
    secureLogger.info('GitHub issue created for quarterly audit');
  } catch (e) {
    secureLogger.error(`GitHub issue creation error: ${e.message}`);
  }
}

main().catch(console.error);
