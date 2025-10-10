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

      if (result.validationFailures.length > 0) {
        console.error('\nSpecification validation failures:');
        for (const failure of result.validationFailures) {
          console.error(` - ${failure}`);
        }
      }

      process.exitCode = 1;
      return;
    }

    console.log('\nAgentNexus build prompt completed successfully.');

    if (result.details) {
      console.log('Summary:');
      console.log(
        ` - Technical spec covers ${result.details.technicalSpec.components} components, ${result.details.technicalSpec.integrations} integrations, and ${result.details.technicalSpec.contracts} data contracts.`
      );
      console.log(
        ` - Build plan documents ${result.details.buildPlan.tasks} tasks across ${result.details.buildPlan.phases} phases.`
      );
    }
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
