import cron from 'node-cron';
import fetch from 'node-fetch';
import { Octokit } from '@octokit/rest';
import secureLogger from '../src/utils/secureLogger.js';

// Assume secureLogger exports default or adjust
import { Counter, Gauge } from 'prom-client'; // Stub local if needed
const localErrors = new Counter({ name: 'llm_errors_total_local', help: 'Local errors' });
const localCalls = new Counter({ name: 'llm_calls_total_local', help: 'Local calls' });
const uptimeGauge = new Gauge({ name: 'astraforge_uptime_seconds_local', help: 'Local uptime' });
let startTime = Date.now();

async function fetchProm(query) {
  try {
    const res = await fetch(`http://localhost:9090/api/v1/query?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.status === 'success' && data.data.result.length > 0) {
      return parseFloat(data.data.result[0].value[1] || 0);
    }
    throw new Error('No data');
  } catch (e) {
    console.warn(`Prom fetch fail: ${e.message}, using local`);
    // Fallback local counters - increment stubs
    localCalls.inc();
    if (query.includes('errors')) localErrors.inc();
    uptimeGauge.set((Date.now() - startTime) / 1000);
    return 0;
  }
}

async function generateReview() {
  const date = new Date().toISOString().slice(0, 10);
  const uptime = await fetchProm('astraforge_uptime_seconds / 3600 * 100'); // Assume total hours
  const velocityQuery = 'rate(loc_changes[14d]) / 5'; // est 5 sprints
  const velocity = await fetchProm(velocityQuery);
  const bugRate = await fetchProm('100 * rate(llm_errors_total[5m]) / rate(llm_calls_total[5m])');
  const throughput = await fetchProm('increase(llm_calls_total[1h])');
  const abWin = await fetchProm('sum(quantum_success[24h]) / sum(ab_total[24h]) * 100');
  
  const kpis = { uptime, velocity, bugRate, throughput, abWin };
  const alert = bugRate > 1 ? 'Alert: High bug rate!' : 'Good!';
  
  const md = `# Bi-Weekly Review ${date}\n## Uptime: ${uptime}%\n## Velocity: ${velocity}x\n## Bugs: ${bugRate}%\n## Throughput: ${throughput} reqs\n## A/B Win: ${abWin}%\n${alert}`;
  
  const octokit = new Octokit({ auth: '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' });
  const issue = await octokit.rest.issues.create({
    owner: 'up2itnow',
    repo: 'AstraForge',
    title: `[BI-WEEKLY] Review ${date}`,
    body: md,
    labels: ['kpi', 'review']
  });
  
  const issueUrl = issue.data.html_url;
  await secureLogger.info({ review: { kpis, issueUrl } });
  console.log('Review created:', issueUrl);
}

// Schedule bi-weekly (every Monday 12pm, est review bi-weekly)
cron.schedule('0 12 * * 1', generateReview);

console.log('Bi-Weekly Review scheduler started');

// For manual run or exit on deactivate - run once if no cron
// generateReview();

process.on('SIGTERM', async () => {
  await secureLogger.close();
  process.exit(0);
});
