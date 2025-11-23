"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const llmManager_js_1 = require("../src/llm/llmManager.js");
globals_1.jest.mock('openai');
globals_1.jest.mock('@anthropic-ai/sdk');
(0, globals_1.describe)('LLMManager', () => {
    let llmManager;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        llmManager = new llmManager_js_1.LLMManager();
    });
    (0, globals_1.describe)('generate', () => {
        (0, globals_1.it)('should return LLMResponse with content and confidence', async () => {
            const result = await llmManager.generate('test prompt');
            (0, globals_1.expect)(result).toBeDefined();
            (0, globals_1.expect)(result.content).toBe('Test');
            (0, globals_1.expect)(result.confidence).toBe(0.9);
        });
        (0, globals_1.it)('should handle empty prompt', async () => {
            const result = await llmManager.generate('');
            (0, globals_1.expect)(result).toBeDefined();
            (0, globals_1.expect)(result.content).toBe('Test');
        });
        (0, globals_1.it)('should return consistent structure for any prompt', async () => {
            const prompts = ['simple', 'complex prompt with data', ''];
            for (const prompt of prompts) {
                const result = await llmManager.generate(prompt);
                (0, globals_1.expect)(result).toHaveProperty('content');
                (0, globals_1.expect)(result).toHaveProperty('confidence');
                (0, globals_1.expect)(typeof result.content).toBe('string');
                (0, globals_1.expect)(typeof result.confidence).toBe('number');
            }
        });
    });
});
