"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const llmManager_1 = require("../src/llm/llmManager");
globals_1.jest.mock('openai');
globals_1.jest.mock('@anthropic-ai/sdk');
(0, globals_1.describe)('LLMManager - Refactored', () => {
    let llmManager;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        llmManager = new llmManager_1.LLMManager();
    });
    (0, globals_1.describe)('generate', () => {
        (0, globals_1.it)('should generate response for valid prompt', async () => {
            const result = await llmManager.generate('test prompt');
            (0, globals_1.expect)(result).toBeDefined();
            (0, globals_1.expect)(result.content).toBe('Test');
            (0, globals_1.expect)(result.confidence).toBe(0.9);
        });
        (0, globals_1.it)('should handle various prompt types', async () => {
            const testPrompts = [
                'simple prompt',
                'complex prompt with special chars &<>',
                '',
                'prompt with unicode: 你好世界'
            ];
            for (const prompt of testPrompts) {
                const result = await llmManager.generate(prompt);
                (0, globals_1.expect)(result).toHaveProperty('content');
                (0, globals_1.expect)(result).toHaveProperty('confidence');
                (0, globals_1.expect)(typeof result.content).toBe('string');
                (0, globals_1.expect)(typeof result.confidence).toBe('number');
                (0, globals_1.expect)(result.confidence).toBeGreaterThanOrEqual(0);
                (0, globals_1.expect)(result.confidence).toBeLessThanOrEqual(1);
            }
        });
        (0, globals_1.it)('should return consistent response structure', async () => {
            const result = await llmManager.generate('test');
            (0, globals_1.expect)(result).toMatchObject({
                content: globals_1.expect.any(String),
                confidence: globals_1.expect.any(Number)
            });
        });
    });
});
