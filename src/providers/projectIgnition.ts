import { WorkflowManager } from '../workflow/workflowManager';

// Use named import WorkflowManager
/**
 * Ignites project workflow with LLM/Quantum chain.
 * @param {string} spec - Workflow spec prompt.
 * @returns {Promise<string>} Chained decision output.
 * @example const chainResult = await projectIgnition.generateChain('Build agent nexus'); // LLM + quantum optimize.
 * @see llmManager for LLM calls.
 * @security Env secrets loaded; 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 for ethics review.
 */
