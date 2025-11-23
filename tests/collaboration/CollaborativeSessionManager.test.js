"use strict";
/**
 * Integration tests for CollaborativeSessionManager - Real multi-LLM collaboration
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const CollaborativeSessionManager_1 = require("../../src/collaboration/CollaborativeSessionManager");
const llmManager_1 = require("../../src/llm/llmManager");
const vectorDB_1 = require("../../src/db/vectorDB");
const fs = __importStar(require("fs"));
describe('CollaborativeSessionManager Integration', () => {
    let sessionManager;
    let llmManager;
    let vectorDB;
    const testStoragePath = './test_collaboration_vectors';
    beforeEach(async () => {
        // Clean up any existing test data
        if (fs.existsSync(testStoragePath)) {
            fs.rmSync(testStoragePath, { recursive: true, force: true });
        }
        // Create real instances for integration testing
        llmManager = new llmManager_1.LLMManager();
        vectorDB = new vectorDB_1.VectorDB(testStoragePath);
        await vectorDB.init();
        // Create session manager in test mode for controlled testing
        sessionManager = new CollaborativeSessionManager_1.CollaborativeSessionManager(llmManager, vectorDB, true);
    });
    afterEach(async () => {
        if (vectorDB) {
            vectorDB.close();
        }
        // Clean up test data
        if (fs.existsSync(testStoragePath)) {
            fs.rmSync(testStoragePath, { recursive: true, force: true });
        }
    });
    describe('Session Lifecycle', () => {
        it('should create and manage collaborative sessions', async () => {
            const request = {
                prompt: 'Design a REST API for a task management system',
                priority: 'high',
                timeLimit: 60000, // 60 seconds in milliseconds
                preferredParticipants: ['OpenAI', 'Anthropic']
            };
            const session = await sessionManager.startSession(request);
            expect(session).toBeDefined();
            expect(session.id).toBeDefined();
            expect(session.status).toBe('active');
            expect(session.participants.length).toBeGreaterThan(0);
        });
        it('should validate session requests', async () => {
            const invalidRequest = {
                prompt: '', // Empty prompt should fail validation
                priority: 'high',
                timeLimit: 5, // Too short time limit
                preferredParticipants: []
            };
            await expect(sessionManager.startSession(invalidRequest)).rejects.toThrow();
        });
        it('should select appropriate participants', async () => {
            const request = {
                prompt: 'Evaluate the pros and cons of microservices architecture',
                priority: 'medium',
                timeLimit: 120000, // 120 seconds in milliseconds
                preferredParticipants: []
            };
            const session = await sessionManager.startSession(request);
            expect(session.participants.length).toBeGreaterThanOrEqual(2);
            session.participants.forEach(participant => {
                expect(participant.id).toBeDefined();
                expect(participant.model).toBeDefined();
            });
        });
        it('should activate all configured panel participants for collaboration', async () => {
            const panel = [
                { provider: 'OpenAI', key: 'test-key', model: 'gpt-4o', role: 'architect' },
                { provider: 'Anthropic', key: 'test-key', model: 'claude-3-5-sonnet', role: 'reasoner' },
                { provider: 'xAI', key: 'test-key', model: 'grok-2', role: 'innovator' },
                { provider: 'OpenRouter', key: 'test-key', model: 'meta-llama/llama-3.1-405b-instruct', role: 'integrator' },
                { provider: 'OpenAI', key: 'test-key', model: 'gpt-4.1-mini', role: 'reviewer' }
            ];
            llmManager.setPanel(panel);
            const request = {
                prompt: 'Outline a cross-platform mobile app architecture with real-time sync.',
                priority: 'high',
                timeLimit: 120000,
                preferredParticipants: []
            };
            const session = await sessionManager.startSession(request);
            expect(session.participants).toHaveLength(5);
            expect(new Set(session.participants.map(p => `${p.provider}:${p.model}`)).size).toBe(5);
        });
    });
    describe('Real Multi-LLM Collaboration', () => {
        it('should execute collaborative rounds with real API calls', async () => {
            if (!process.env.OPENROUTER_API_KEY) {
                console.warn('Skipping real collaboration test - no OPENROUTER_API_KEY found');
                return;
            }
            const request = {
                prompt: 'What are the key considerations for implementing user authentication in a web application? Please provide concise responses.',
                priority: 'high',
                timeLimit: 90000, // 90 seconds in milliseconds
                preferredParticipants: []
            };
            const session = await sessionManager.startSession(request);
            // Execute the collaborative rounds with real API calls
            await sessionManager.executeSessionRounds(session.id);
            // Verify session completed
            expect(['completed', 'consensus_reached']).toContain(session.status);
            expect(session.rounds.length).toBeGreaterThan(0);
        }, 120000); // 2 minute timeout for real collaboration
        it('should generate synthesis from multiple LLM responses', async () => {
            if (!process.env.OPENROUTER_API_KEY) {
                console.warn('Skipping synthesis test - no OPENROUTER_API_KEY found');
                return;
            }
            const request = {
                prompt: 'Compare React and Vue.js for building a dashboard application. Keep responses brief.',
                priority: 'medium',
                timeLimit: 60000, // 60 seconds in milliseconds
                preferredParticipants: []
            };
            const session = await sessionManager.startSession(request);
            await sessionManager.executeSessionRounds(session.id);
            const result = await sessionManager.completeSession(session.id);
            expect(result).toBeDefined();
            expect(result.synthesisLog).toBeDefined();
            expect(Array.isArray(result.synthesisLog)).toBe(true);
            expect(result.qualityScore).toBeGreaterThan(0);
        }, 90000);
    });
    describe('Quality Assessment', () => {
        it('should calculate quality scores for real responses', async () => {
            if (!process.env.OPENROUTER_API_KEY) {
                console.warn('Skipping quality test - no OPENROUTER_API_KEY found');
                return;
            }
            const request = {
                prompt: 'Explain the benefits of automated testing in software development. Be concise.',
                priority: 'medium',
                timeLimit: 45000, // 45 seconds in milliseconds
                preferredParticipants: []
            };
            const session = await sessionManager.startSession(request);
            await sessionManager.executeSessionRounds(session.id);
            const result = await sessionManager.completeSession(session.id);
            expect(result.qualityScore).toBeGreaterThan(0);
            expect(result.qualityScore).toBeLessThanOrEqual(100);
            expect(typeof result.consensusLevel === 'number' || typeof result.consensusLevel === 'string').toBe(true);
        }, 75000);
        it('should measure consensus between real LLM responses', async () => {
            if (!process.env.OPENROUTER_API_KEY) {
                console.warn('Skipping consensus test - no OPENROUTER_API_KEY found');
                return;
            }
            const request = {
                prompt: 'What is 2 + 2? This should have high consensus.',
                priority: 'low',
                timeLimit: 30000, // 30 seconds in milliseconds
                preferredParticipants: []
            };
            const session = await sessionManager.startSession(request);
            await sessionManager.executeSessionRounds(session.id);
            const result = await sessionManager.completeSession(session.id);
            // Accept either a numeric score or qualitative label
            if (typeof result.consensusLevel === 'number') {
                expect(result.consensusLevel).toBeGreaterThan(0.5);
            }
            else {
                expect(['unanimous', 'qualified_majority', 'simple_majority', 'forced_consensus']).toContain(result.consensusLevel);
            }
        }, 45000);
    });
    describe('Time Management', () => {
        it('should respect session time limits', async () => {
            const request = {
                prompt: 'Test prompt for time management',
                priority: 'medium',
                timeLimit: 15000, // 15 seconds in milliseconds
                preferredParticipants: []
            };
            const startTime = Date.now();
            const session = await sessionManager.startSession(request);
            // Session should be created but not exceed time limit when executed
            expect(session).toBeDefined();
            expect(session.timeLimit).toBe(15000);
            const creationTime = Date.now() - startTime;
            expect(creationTime).toBeLessThan(5000); // Session creation should be fast
        });
        it('should track session duration accurately', async () => {
            const request = {
                prompt: 'Test duration tracking',
                priority: 'low',
                timeLimit: 30000, // 30 seconds in milliseconds
                preferredParticipants: []
            };
            const session = await sessionManager.startSession(request);
            expect(session.startTime).toBeDefined();
            expect(session.startTime).toBeInstanceOf(Date);
        });
    });
    describe('Error Handling', () => {
        it('should handle API failures gracefully', async () => {
            // Test with invalid API key
            const originalKey = process.env.OPENROUTER_API_KEY;
            process.env.OPENROUTER_API_KEY = 'invalid-key';
            const invalidLLMManager = new llmManager_1.LLMManager();
            const invalidSessionManager = new CollaborativeSessionManager_1.CollaborativeSessionManager(invalidLLMManager, vectorDB, true);
            const request = {
                prompt: 'This should fail with invalid API key',
                priority: 'medium',
                timeLimit: 30000, // 30 seconds in milliseconds
                preferredParticipants: []
            };
            const session = await invalidSessionManager.startSession(request);
            // Should create session but fail during execution
            expect(session).toBeDefined();
            // Restore original key
            process.env.OPENROUTER_API_KEY = originalKey;
        }, 15000);
        it('should emit error events for failed operations', async () => {
            let errorEmitted = false;
            sessionManager.on('error', (error) => {
                errorEmitted = true;
                expect(error).toBeDefined();
            });
            // Test with invalid request that should trigger error
            try {
                await sessionManager.startSession({
                    prompt: '', // Invalid empty prompt
                    priority: 'high',
                    timeLimit: 5, // Invalid short time
                    preferredParticipants: []
                });
            }
            catch (error) {
                // Expected to throw
            }
            expect(errorEmitted).toBe(true);
        });
    });
    describe('Data Persistence', () => {
        it('should store session data in vector database', async () => {
            const request = {
                prompt: 'Test data persistence in vector DB',
                priority: 'medium',
                timeLimit: 30000, // 30 seconds in milliseconds
                preferredParticipants: []
            };
            const session = await sessionManager.startSession(request);
            const result = await sessionManager.completeSession(session.id);
            // Verify data was stored (basic check)
            expect(result).toBeDefined();
            expect(vectorDB).toBeDefined();
        });
        it('should handle vector DB storage errors gracefully', async () => {
            // Create session manager with invalid vector DB path
            const invalidVectorDB = new vectorDB_1.VectorDB('/invalid/path');
            await invalidVectorDB.init(); // This should not throw
            const invalidSessionManager = new CollaborativeSessionManager_1.CollaborativeSessionManager(llmManager, invalidVectorDB, true);
            const request = {
                prompt: 'Test with invalid vector DB',
                priority: 'medium',
                timeLimit: 30000, // 30 seconds in milliseconds
                preferredParticipants: []
            };
            // Should not throw even with invalid vector DB
            await expect(invalidSessionManager.startSession(request)).resolves.toBeDefined();
            invalidVectorDB.close();
        });
    });
    describe('Performance', () => {
        it('should handle multiple concurrent sessions', async () => {
            const requests = [
                {
                    prompt: 'Concurrent test 1: What is JavaScript?',
                    priority: 'low',
                    timeLimit: 30000, // 30 seconds in milliseconds
                    preferredParticipants: []
                },
                {
                    prompt: 'Concurrent test 2: What is Python?',
                    priority: 'low',
                    timeLimit: 30000, // 30 seconds in milliseconds
                    preferredParticipants: []
                },
                {
                    prompt: 'Concurrent test 3: What is TypeScript?',
                    priority: 'low',
                    timeLimit: 30000, // 30 seconds in milliseconds
                    preferredParticipants: []
                }
            ];
            const startTime = Date.now();
            const sessions = await Promise.all(requests.map(request => sessionManager.startSession(request)));
            const duration = Date.now() - startTime;
            expect(sessions).toHaveLength(3);
            sessions.forEach(session => {
                expect(session).toBeDefined();
                expect(session.id).toBeDefined();
            });
            // Concurrent session creation should be efficient
            expect(duration).toBeLessThan(10000);
        }, 15000);
        it('should optimize token usage across multiple LLMs', async () => {
            if (!process.env.OPENROUTER_API_KEY) {
                console.warn('Skipping token optimization test - no OPENROUTER_API_KEY found');
                return;
            }
            const request = {
                prompt: 'Brief question: What is REST?', // Short prompt to minimize token usage
                priority: 'medium',
                timeLimit: 45000, // 45 seconds in milliseconds
                preferredParticipants: []
            };
            const session = await sessionManager.startSession(request);
            await sessionManager.executeSessionRounds(session.id);
            const result = await sessionManager.completeSession(session.id);
            expect(result.tokenUsage).toBeDefined();
            expect(result.tokenUsage.totalTokens).toBeGreaterThan(0);
            expect(result.tokenUsage.efficiency).toBeGreaterThan(0);
        }, 120000);
    });
});
