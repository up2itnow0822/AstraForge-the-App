/* eslint-disable no-console */
import { runAgentNexusBuildPrompt } from '../workflow/agentNexusBuildRunner.js';

async function main(): Promise<void> {
  try {
    const result = await runAgentNexusBuildPrompt(process.cwd());

    console.log('AgentNexus Build Prompt Result');
    console.log('--------------------------------');
    console.log(JSON.stringify(result, null, 2));

    if (!result.success) {
      console.error('\nAgentNexus build prompt did not complete successfully.');

      if (result.missingSpecs.length > 0) {
        console.error('Missing specification files:');
        for (const spec of result.missingSpecs) {
          console.error(` - ${spec}`);
        }
      }

      process.exitCode = 1;
      return;
    }

    console.log('\nAgentNexus build prompt completed successfully.');
  } catch (error) {
    console.error('Unexpected error while running the AgentNexus build prompt.');

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  }
}

void main();
