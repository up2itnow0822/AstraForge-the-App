#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import { ApiTesterCore } from './apiTesterCore.js';

const program = new Command();
const tester = new ApiTesterCore();

program
  .name('astraforge')
  .description('AstraForge API Testing Interface')
  .version('0.0.1');

program
  .command('test')
  .description('Test LLM API functionality')
  .requiredOption('--api <provider>', 'API provider (OpenAI, Anthropic, xAI, OpenRouter)')
  .requiredOption('--key <key>', 'API key')
  .option('--model <model>', 'Model to use', 'gpt-4')
  .option('--prompt <prompt>', 'Test prompt')
  .option('--file <file>', 'File containing prompts (one per line)')
  .option('--output <file>', 'Output file for results')
  .option('--workflow <idea>', 'Test workflow simulation')
  .option('--rounds <number>', 'Conference rounds', '2')
  .option('--budget <number>', 'Conference budget limit', '10')
  .option('--conference', 'Run conference simulation using configured models')
  .action(async options => {
    try {
      await tester.initialize();

      if (options.conference) {
        await runConference(options);
      } else if (options.workflow) {
        await runWorkflow(options);
      } else if (options.file) {
        await runBatch(options);
      } else if (options.prompt) {
        await runSingle(options);
      } else {
        console.error('Error: Must provide --prompt, --file, --workflow, or --conference');
        process.exitCode = 1;
      }
    } catch (error) {
      console.error('Error:', error);
      process.exitCode = 1;
    } finally {
      await tester.cleanup();
    }
  });

program
  .command('vector')
  .description('Test vector database queries')
  .requiredOption('--query <query>', 'Query text')
  .option('--topk <number>', 'Number of results to return', '5')
  .option('--output <file>', 'Output file for results')
  .action(async options => {
    try {
      await tester.initialize();
      await runVector(options);
    } catch (error) {
      console.error('Error:', error);
      process.exitCode = 1;
    } finally {
      await tester.cleanup();
    }
  });

program
  .command('list')
  .description('List supported providers and models')
  .option('--providers', 'List supported providers')
  .option('--models <provider>', 'List models for a provider')
  .action(options => {
    if (options.providers) {
      const providers = tester.getSupportedProviders();
      console.log('Supported Providers:');
      providers.forEach(provider => console.log(`  - ${provider}`));
    } else if (options.models) {
      const models = tester.getSupportedModels(options.models);
      console.log(`Models for ${options.models}:`);
      models.forEach(model => console.log(`  - ${model}`));
    } else {
      console.log('Use --providers to list providers or --models <provider> to list models');
    }
  });

async function runSingle(options: any) {
  console.log(`Testing ${options.api} with model ${options.model}...`);
  if (!tester.validateApiKey(options.api, options.key)) {
    throw new Error('Invalid API key format');
  }

  const result = await tester.testLLM(options.api, options.key, options.model, options.prompt);
  const output = {
    type: 'single_test',
    timestamp: new Date().toISOString(),
    result,
  };

  writeOutput(output, options.output);
}

async function runBatch(options: any) {
  console.log(`Testing ${options.api} with prompts from ${options.file}...`);
  if (!tester.validateApiKey(options.api, options.key)) {
    throw new Error('Invalid API key format');
  }

  if (!fs.existsSync(options.file)) {
    throw new Error(`File ${options.file} not found`);
  }

  const prompts = fs
    .readFileSync(options.file, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (prompts.length === 0) {
    throw new Error('No valid prompts found in file');
  }

  const result = await tester.testBatchLLM(options.api, options.key, options.model, prompts);
  const output = {
    type: 'batch_test',
    timestamp: new Date().toISOString(),
    file: options.file,
    result,
  };

  writeOutput(output, options.output);
}

async function runWorkflow(options: any) {
  console.log(`Testing workflow simulation for: ${options.workflow}`);
  if (!tester.validateApiKey(options.api, options.key)) {
    throw new Error('Invalid API key format');
  }

  const results = await tester.testWorkflowSimulation(
    options.workflow,
    options.api,
    options.key,
    options.model
  );

  const output = {
    type: 'workflow_simulation',
    timestamp: new Date().toISOString(),
    idea: options.workflow,
    results,
  };

  writeOutput(output, options.output);
}

async function runConference(options: any) {
  console.log(`Testing conference simulation for: ${options.workflow || options.prompt || 'project idea'}`);

  if (!tester.validateApiKey(options.api, options.key)) {
    throw new Error('Invalid API key format');
  }

  const idea = options.workflow || options.prompt;
  if (!idea) {
    throw new Error('Conference simulation requires --workflow or --prompt');
  }

  const models = tester
    .getSupportedModels(options.api)
    .slice(0, 3);

  if (models.length < 3) {
    models.push('anthropic/claude-3-opus', 'openai/gpt-4-turbo', 'xai/grok-beta');
  }

  const roles = ['concept', 'development', 'coding'];
  const providers = models.slice(0, 3).map((model: string, index: number) => ({
    provider: options.api,
    apiKey: options.key,
    model,
    role: roles[index] ?? 'secondary',
  }));

  const result = await tester.testConference(
    idea,
    providers,
    Number(options.rounds || 2),
    Number(options.budget || 10)
  );

  const output = {
    type: 'conference_simulation',
    timestamp: new Date().toISOString(),
    idea,
    result,
  };

  writeOutput(output, options.output);
}

async function runVector(options: any) {
  console.log(`Testing vector query: "${options.query}"`);
  const result = await tester.testVectorQuery(options.query, parseInt(options.topk, 10));
  const output = {
    type: 'vector_test',
    timestamp: new Date().toISOString(),
    result,
  };

  writeOutput(output, options.output);
}

function writeOutput(data: any, outputPath?: string) {
  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Results saved to ${outputPath}`);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

program.exitOverride();

try {
  program.parse();
} catch (error: any) {
  if (error.code === 'commander.helpDisplayed') {
    process.exit(0);
  }
  console.error('Error:', error.message);
  process.exit(1);
}

