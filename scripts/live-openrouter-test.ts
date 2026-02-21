/**
 * Live integration test — OpenRouter + AstraForge LLMAgent
 * Run: npx ts-node --project tsconfig.json scripts/live-openrouter-test.ts
 */
import { LLMAgent } from '../src/core/agents/LLMAgent';

const apiKey = process.env.OPENROUTER_API_KEY || '';
if (!apiKey) {
  console.error('ERROR: OPENROUTER_API_KEY not set');
  process.exit(1);
}

async function main() {
  console.log('=== AstraForge Live OpenRouter Integration Test ===');
  console.log(`API Key: ${apiKey.slice(0, 12)}...`);

  const model = 'openai/gpt-4o-mini';
  const agents = [
    new LLMAgent('agent-1', 'Nexus',   'Orchestrator',             'You are Nexus, an architect. Be concise.',    { provider: 'openrouter', model, apiKey }),
    new LLMAgent('agent-2', 'Vanguard','Security Specialist',      'You are Vanguard, security expert. Be concise.', { provider: 'openrouter', model, apiKey }),
    new LLMAgent('agent-3', 'Prism',   'Product Planner',          'You are Prism, product manager. Be concise.',  { provider: 'openrouter', model, apiKey }),
    new LLMAgent('agent-4', 'Helix',   'AI Systems Specialist',    'You are Helix, AI engineer. Be concise.',      { provider: 'openrouter', model, apiKey }),
    new LLMAgent('agent-5', 'Cipher',  'Implementation Architect', 'You are Cipher, senior engineer. Be concise.', { provider: 'openrouter', model, apiKey }),
  ];

  const topic = 'Add a rate-limiting middleware to an Express API';
  console.log(`\nTopic: "${topic}"`);
  console.log(`\nPhase 1: Parallel proposals from ${agents.length} agents...\n`);

  const proposalPromises = agents.map(async (agent) => {
    const domain = agent.role.toLowerCase().includes('security') ? 'security' :
                   agent.role.toLowerCase().includes('product')  ? 'product'  :
                   agent.role.toLowerCase().includes('ai')       ? 'ai'       :
                   agent.role.toLowerCase().includes('impl')     ? 'implementation' : 'architecture';
    const response = await agent.processMessage(`As ${agent.name} (${domain}), give a 2-sentence proposal for: ${topic}`);
    console.log(`[${agent.name}] ${response.substring(0, 200)}`);
    return { name: agent.name, domain, proposal: response };
  });

  const proposals = await Promise.all(proposalPromises);

  console.log('\nPhase 2: Synthesis by Nexus...');
  const nexus = agents[0];
  const synthesisPrompt = `Synthesize these proposals into one unified recommendation (3 sentences max):\n\n` +
    proposals.map(p => `${p.name}: ${p.proposal}`).join('\n\n');
  const synthesis = await nexus.processMessage(synthesisPrompt);
  console.log(`\n[SYNTHESIS] ${synthesis}`);

  console.log('\nPhase 3: Cipher generates implementation snippet...');
  const cipher = agents[4];
  const codePrompt = `Write a 15-line Express rate-limiting middleware TypeScript snippet based on: ${synthesis}. Output ONLY code, no explanation.`;
  const code = await cipher.processMessage(codePrompt);
  console.log(`\n[CODE]\n${code}`);

  console.log('\n=== INTEGRATION TEST PASSED ===');
  console.log('✅ All 5 agents responded successfully via OpenRouter');
  console.log('✅ Parallel proposals: OK');
  console.log('✅ Synthesis: OK');
  console.log('✅ Code generation: OK');
}

main().catch((e) => {
  console.error('INTEGRATION TEST FAILED:', e.message);
  process.exit(1);
});
