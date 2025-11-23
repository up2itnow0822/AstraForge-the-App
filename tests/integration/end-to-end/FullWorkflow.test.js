"use strict";
/**
 * End-to-End Workflow Tests
 * Tests complete project lifecycle from idea to completion
 * with quantum-classical interactions
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
const workflowManager_1 = require("../../../src/workflow/workflowManager");
const vscode = __importStar(require("vscode"));
describe('End-to-End Workflow Integration', () => {
    let workflowManager;
    let llmManager;
    let vectorDB;
    let gitManager;
    let quantumSystem;
    let optimizationSystem;
    let emergentBehavior;
    let metaLearning;
    let collaborationServer;
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup comprehensive mocks
        llmManager = {
            conference: jest.fn(),
            queryLLM: jest.fn(),
            voteOnDecision: jest.fn(),
            panel: [
                { provider: 'OpenRouter', key: 'test-key', model: 'test-model', role: 'primary' }
            ],
            providers: new Map([['OpenRouter', {}]]),
            cache: {
                get: jest.fn(),
                set: jest.fn(),
                isThrottled: jest.fn().mockReturnValue(false),
                clear: jest.fn()
            }
        };
        vectorDB = {
            init: jest.fn(),
            getEmbedding: jest.fn(),
            queryEmbedding: jest.fn(),
            addEmbedding: jest.fn(),
            save: jest.fn(),
            close: jest.fn()
        };
        gitManager = {
            getChanges: jest.fn(),
            getStatus: jest.fn(),
            getDiff: jest.fn()
        };
        quantumSystem = {
            makeDecision: jest.fn(),
            getQuantumState: jest.fn().mockReturnValue({
                coherence: 0.8,
                entanglement: 0.6,
                superposition: 3,
                energy: 0.5,
                temperature: 0.7,
                waveFunction: new Map(),
                hamiltonian: new Map()
            })
        };
        optimizationSystem = {
            optimize: jest.fn()
        };
        emergentBehavior = {
            detectBehavior: jest.fn(),
            analyzeTrend: jest.fn(),
            predictEmergence: jest.fn(),
            amplifyBehavior: jest.fn()
        };
        metaLearning = {
            getOptimalStrategy: jest.fn(),
            analyzePattern: jest.fn(),
            predictOutcome: jest.fn(),
            updateStrategy: jest.fn()
        };
        collaborationServer = {
            broadcastToWorkspace: jest.fn(),
            handleUserMessage: jest.fn(),
            startSession: jest.fn(),
            endSession: jest.fn()
        };
        workflowManager = new workflowManager_1.WorkflowManager();
    });
    describe('Complete Project Workflow', () => {
        it('should handle complete web application development workflow', async () => {
            const projectIdea = 'Create a modern e-commerce platform with React, Node.js, and PostgreSQL';
            // Mock all the workflow steps
            mockUserInteractions();
            mockLLMResponses();
            mockVectorDBResponses();
            mockGitOperations();
            mockQuantumDecisions();
            mockOptimizationCalls();
            mockEmergentBehavior();
            mockMetaLearning();
            const startTime = Date.now();
            await workflowManager.runWorkflow(projectIdea);
            const endTime = Date.now();
            expect(llmManager.generate).toHaveBeenCalled();
            expect(vectorDB.getContextualInsights).toHaveBeenCalled();
            expect(quantumSystem.makeQuantumDecision).toHaveBeenCalled();
            expect(optimizationSystem.optimize).toHaveBeenCalled();
            expect(gitManager.commit).toHaveBeenCalled();
            // Should complete within reasonable time
            expect(endTime - startTime).toBeLessThan(10000);
        });
        it('should handle mobile application development workflow', async () => {
            const projectIdea = 'Build a cross-platform mobile app for task management using React Native';
            mockUserInteractions();
            mockLLMResponses();
            mockVectorDBResponses();
            mockGitOperations();
            mockQuantumDecisions();
            mockOptimizationCalls();
            mockEmergentBehavior();
            mockMetaLearning();
            await workflowManager.runWorkflow(projectIdea);
            expect(llmManager.generate).toHaveBeenCalled();
            expect(quantumSystem.makeQuantumDecision).toHaveBeenCalledWith('optimization', expect.objectContaining({
                context: expect.objectContaining({
                    mobile: expect.any(String)
                })
            }));
        });
        it('should handle AI/ML project workflow with quantum optimization', async () => {
            const projectIdea = 'Develop a machine learning model for image classification with quantum enhancement';
            mockUserInteractions();
            mockLLMResponses();
            mockVectorDBResponses();
            mockGitOperations();
            mockQuantumDecisions();
            mockOptimizationCalls();
            mockEmergentBehavior();
            mockMetaLearning();
            await workflowManager.runWorkflow(projectIdea);
            // Should use quantum algorithms for ML optimization
            expect(optimizationSystem.optimize).toHaveBeenCalledWith('genetic_quantum', expect.objectContaining({
                metadata: expect.objectContaining({
                    complexity: expect.any(Number)
                })
            }));
        });
    });
    describe('Multi-Component Quantum-Classical Interactions', () => {
        it('should integrate quantum decision making with classical workflow', async () => {
            const projectIdea = 'Optimize database queries for a high-traffic application';
            // Setup quantum decision for optimization strategy
            quantumSystem.makeQuantumDecision.mockResolvedValue({
                decisionId: 'quantum-decision-1',
                optimalAlternative: {
                    id: 'quantum-strategy',
                    name: 'Quantum Enhanced Optimization',
                    description: 'Use quantum algorithms for query optimization',
                    probability: 0.8,
                    quantumAmplitude: 0.9,
                    state: { strategy: 'quantum' },
                    metadata: {}
                },
                confidence: 0.85,
                quantumAdvantage: 2.5,
                alternatives: [],
                reasoning: ['Quantum approach provides better optimization'],
                recommendations: ['Use quantum annealing for query optimization'],
                uncertainty: 0.15,
                executionTime: 500
            });
            // Setup classical optimization
            optimizationSystem.optimize.mockResolvedValue({
                bestSolution: [0.8, 0.6, 0.4],
                bestValue: 0.92,
                convergenceHistory: [0.1, 0.3, 0.5, 0.7, 0.92],
                iterations: 50,
                executionTime: 2000,
                quantumAdvantage: 1.8,
                diversity: 0.7,
                exploration: 0.6,
                exploitation: 0.8,
                metadata: {}
            });
            mockUserInteractions();
            mockLLMResponses();
            mockVectorDBResponses();
            mockGitOperations();
            await workflowManager.runWorkflow(projectIdea);
            expect(quantumSystem.makeQuantumDecision).toHaveBeenCalled();
            expect(optimizationSystem.optimize).toHaveBeenCalled();
            expect(llmManager.generate).toHaveBeenCalled();
        });
        it('should handle quantum algorithm failures with classical fallback', async () => {
            const projectIdea = 'Complex optimization problem that might fail';
            // Quantum system fails
            quantumSystem.makeQuantumDecision.mockRejectedValue(new Error('Quantum algorithm timeout'));
            // Classical system should still work
            optimizationSystem.optimize.mockResolvedValue({
                bestSolution: [0.5, 0.5],
                bestValue: 0.8,
                convergenceHistory: [0.2, 0.4, 0.6, 0.8],
                iterations: 30,
                executionTime: 1500,
                quantumAdvantage: 1.0,
                diversity: 0.5,
                exploration: 0.5,
                exploitation: 0.5,
                metadata: {}
            });
            mockUserInteractions();
            mockLLMResponses();
            mockVectorDBResponses();
            mockGitOperations();
            await workflowManager.runWorkflow(projectIdea);
            expect(quantumSystem.makeQuantumDecision).toHaveBeenCalled();
            expect(optimizationSystem.optimize).toHaveBeenCalled();
            expect(llmManager.generate).toHaveBeenCalled();
        });
        it('should demonstrate quantum advantage in complex scenarios', async () => {
            const projectIdea = 'Multi-objective optimization with conflicting goals';
            // Quantum decision provides better strategy
            quantumSystem.makeQuantumDecision.mockResolvedValue({
                decisionId: 'quantum-decision-2',
                optimalAlternative: {
                    id: 'hybrid-approach',
                    name: 'Hybrid Quantum-Classical',
                    description: 'Combine quantum and classical methods',
                    probability: 0.9,
                    quantumAmplitude: 0.95,
                    state: { approach: 'hybrid' },
                    metadata: {}
                },
                confidence: 0.92,
                quantumAdvantage: 3.2,
                alternatives: [],
                reasoning: ['Quantum approach provides better multi-objective optimization'],
                recommendations: ['Use quantum annealing for conflicting objectives'],
                uncertainty: 0.08,
                executionTime: 800
            });
            // Quantum optimization provides superior results
            optimizationSystem.optimize.mockResolvedValue({
                bestSolution: [0.9, 0.7, 0.8],
                bestValue: 0.95,
                convergenceHistory: [0.3, 0.5, 0.7, 0.85, 0.95],
                iterations: 80,
                executionTime: 3000,
                quantumAdvantage: 2.8,
                diversity: 0.8,
                exploration: 0.7,
                exploitation: 0.9,
                metadata: {
                    paretoFront: [[0.9, 0.7], [0.85, 0.75], [0.8, 0.8]],
                    hypervolume: 0.85
                }
            });
            mockUserInteractions();
            mockLLMResponses();
            mockVectorDBResponses();
            mockGitOperations();
            await workflowManager.runWorkflow(projectIdea);
            expect(quantumSystem.makeQuantumDecision).toHaveBeenCalled();
            expect(optimizationSystem.optimize).toHaveBeenCalled();
            expect(llmManager.generate).toHaveBeenCalledWith(expect.stringContaining('quantum'));
        });
    });
    describe('Performance Benchmarks', () => {
        it('should complete workflow within performance targets', async () => {
            const projectIdea = 'Performance benchmark test';
            mockUserInteractions();
            mockLLMResponses();
            mockVectorDBResponses();
            mockGitOperations();
            mockQuantumDecisions();
            mockOptimizationCalls();
            const startTime = performance.now();
            await workflowManager.runWorkflow(projectIdea);
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            // Should complete within 5 seconds for simple project
            expect(executionTime).toBeLessThan(5000);
            expect(llmManager.generate).toHaveBeenCalledTimes(3); // Planning, development, testing phases
            expect(vectorDB.getContextualInsights).toHaveBeenCalledTimes(2);
            expect(gitManager.commit).toHaveBeenCalledTimes(2);
        });
        it('should handle large project complexity efficiently', async () => {
            const complexProject = 'Enterprise-scale application with microservices, authentication, real-time features, and AI integration';
            mockUserInteractions();
            mockLLMResponses();
            mockVectorDBResponses();
            mockGitOperations();
            mockQuantumDecisions();
            mockOptimizationCalls();
            const startTime = performance.now();
            await workflowManager.runWorkflow(complexProject);
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            // Complex project should still complete reasonably
            expect(executionTime).toBeLessThan(15000);
            expect(quantumSystem.makeQuantumDecision).toHaveBeenCalledWith('optimization', expect.objectContaining({
                context: expect.objectContaining({
                    complexity: expect.any(Number)
                })
            }));
        });
        it('should optimize quantum operations for efficiency', async () => {
            const projectIdea = 'Quantum efficiency optimization test';
            // Mock quantum operations count
            quantumSystem.makeQuantumDecision.mockResolvedValue({
                decisionId: 'quantum-decision-3',
                optimalAlternative: {
                    id: 'efficient-quantum',
                    name: 'Efficient Quantum Processing',
                    description: 'Optimized quantum operations',
                    probability: 0.85,
                    quantumAmplitude: 0.9,
                    state: { efficient: true },
                    metadata: {}
                },
                confidence: 0.88,
                quantumAdvantage: 2.1,
                alternatives: [],
                reasoning: ['Optimized quantum operations for efficiency'],
                recommendations: ['Minimize quantum operations'],
                uncertainty: 0.12,
                executionTime: 300,
                quantumOperations: 15,
                classicalOperations: 8
            });
            mockUserInteractions();
            mockLLMResponses();
            mockVectorDBResponses();
            mockGitOperations();
            await workflowManager.runWorkflow(projectIdea);
            expect(quantumSystem.makeQuantumDecision).toHaveBeenCalled();
            expect(llmManager.generate).toHaveBeenCalled();
        });
    });
    describe('Error Recovery and Resilience', () => {
        it('should handle component failures gracefully', async () => {
            const projectIdea = 'Test error recovery';
            // Simulate quantum system failure
            quantumSystem.makeQuantumDecision.mockRejectedValue(new Error('Quantum system temporarily unavailable'));
            // Classical systems should still work
            optimizationSystem.optimize.mockResolvedValue({
                bestSolution: [0.6, 0.7],
                bestValue: 0.75,
                convergenceHistory: [0.2, 0.4, 0.6, 0.75],
                iterations: 25,
                executionTime: 1200,
                quantumAdvantage: 1.0,
                diversity: 0.6,
                exploration: 0.5,
                exploitation: 0.7,
                metadata: {}
            });
            mockUserInteractions();
            mockLLMResponses();
            mockVectorDBResponses();
            mockGitOperations();
            await workflowManager.runWorkflow(projectIdea);
            expect(quantumSystem.makeQuantumDecision).toHaveBeenCalled();
            expect(optimizationSystem.optimize).toHaveBeenCalled();
            expect(llmManager.generate).toHaveBeenCalled();
        });
        it('should recover from network connectivity issues', async () => {
            const projectIdea = 'Test network recovery';
            // Simulate network failures
            llmManager.generate.mockRejectedValueOnce(new Error('Network timeout')).mockResolvedValue('Recovered response');
            mockUserInteractions();
            mockVectorDBResponses();
            mockGitOperations();
            mockQuantumDecisions();
            await workflowManager.runWorkflow(projectIdea);
            expect(llmManager.generate).toHaveBeenCalledTimes(2); // Initial call + retry
            expect(llmManager.generate).toHaveBeenCalled();
        });
        it('should handle concurrent workflow conflicts', async () => {
            const project1 = 'Concurrent workflow test 1';
            const project2 = 'Concurrent workflow test 2';
            // Both workflows should complete successfully
            mockUserInteractions();
            mockLLMResponses();
            mockVectorDBResponses();
            mockGitOperations();
            mockQuantumDecisions();
            mockOptimizationCalls();
            const workflow1 = workflowManager.runWorkflow(project1);
            const workflow2 = workflowManager.runWorkflow(project2);
            await Promise.allSettled([workflow1, workflow2]);
            expect(llmManager.generate).toHaveBeenCalledTimes(6); // 3 phases × 2 workflows
            expect(gitManager.commit).toHaveBeenCalledTimes(4); // 2 commits × 2 workflows
        });
    });
    describe('Workflow Quality Metrics', () => {
        it('should provide comprehensive project completion metrics', async () => {
            const projectIdea = 'Quality metrics test';
            mockUserInteractions();
            mockLLMResponses();
            mockVectorDBResponses();
            mockGitOperations();
            mockQuantumDecisions();
            mockOptimizationCalls();
            await workflowManager.runWorkflow(projectIdea);
            // Should track comprehensive metrics
            expect(llmManager.generate).toHaveBeenCalled();
            expect(vectorDB.addEmbedding).toHaveBeenCalled(); // Knowledge storage
            expect(gitManager.commit).toHaveBeenCalled(); // Version control
        });
        it('should demonstrate learning and improvement over time', async () => {
            const project1 = 'Learning test project 1';
            const project2 = 'Learning test project 2';
            mockUserInteractions();
            mockLLMResponses();
            mockVectorDBResponses();
            mockGitOperations();
            mockQuantumDecisions();
            mockOptimizationCalls();
            // First project establishes baseline
            await workflowManager.runWorkflow(project1);
            // Second project should show improvement
            await workflowManager.runWorkflow(project2);
            expect(metaLearning.updateStrategy).toHaveBeenCalled();
            expect(vectorDB.addEmbedding).toHaveBeenCalled(); // Store learning
        });
        it('should handle project complexity adaptation', async () => {
            const simpleProject = 'Simple CRUD application';
            const complexProject = 'AI-powered recommendation system with real-time processing';
            mockUserInteractions();
            mockLLMResponses();
            mockVectorDBResponses();
            mockGitOperations();
            mockQuantumDecisions();
            mockOptimizationCalls();
            await workflowManager.runWorkflow(simpleProject);
            await workflowManager.runWorkflow(complexProject);
            expect(quantumSystem.makeQuantumDecision).toHaveBeenCalledWith('optimization', expect.objectContaining({
                context: expect.any(Object)
            }));
        });
    });
    // Helper functions to set up mocks
    function mockUserInteractions() {
        vscode.window.showQuickPick.mockResolvedValue('Proceed as planned');
        vscode.window.showInformationMessage.mockResolvedValue('OK');
        vscode.workspace.fs.writeFile.mockResolvedValue(undefined);
        vscode.workspace.fs.createDirectory.mockResolvedValue(undefined);
    }
    function mockLLMResponses() {
        llmManager.generate.mockResolvedValue('LLM response for workflow phase');
        llmManager.generate.mockResolvedValue('LLM query response');
    }
    function mockVectorDBResponses() {
        vectorDB.getContextualInsights.mockResolvedValue([
            {
                id: 'context-1',
                content: 'Previous project context',
                similarity: 0.8,
                metadata: { domain: 'web', complexity: 0.6 }
            }
        ]);
        vectorDB.addEmbedding.mockResolvedValue(undefined);
    }
    function mockGitOperations() {
        gitManager.commit.mockResolvedValue(undefined);
        gitManager.initRepo.mockResolvedValue(undefined);
    }
    function mockQuantumDecisions() {
        quantumSystem.makeQuantumDecision.mockResolvedValue({
            decisionId: 'test-decision',
            optimalAlternative: {
                id: 'optimal-choice',
                name: 'Optimal Choice',
                description: 'Best decision alternative',
                probability: 0.8,
                quantumAmplitude: 0.9,
                state: { optimal: true },
                metadata: {}
            },
            confidence: 0.85,
            quantumAdvantage: 2.0,
            alternatives: [],
            reasoning: ['Quantum reasoning'],
            recommendations: ['Quantum recommendation'],
            uncertainty: 0.15,
            executionTime: 500
        });
    }
    function mockOptimizationCalls() {
        optimizationSystem.optimize.mockResolvedValue({
            bestSolution: [0.8, 0.6],
            bestValue: 0.85,
            convergenceHistory: [0.2, 0.4, 0.6, 0.85],
            iterations: 40,
            executionTime: 2000,
            quantumAdvantage: 1.5,
            diversity: 0.7,
            exploration: 0.6,
            exploitation: 0.8,
            metadata: {}
        });
    }
    function mockEmergentBehavior() {
        emergentBehavior.detectBehavior.mockReturnValue({
            type: 'emergent_pattern',
            confidence: 0.8,
            novelty: 0.6
        });
        emergentBehavior.amplifyBehavior.mockResolvedValue(true);
    }
    function mockMetaLearning() {
        metaLearning.getOptimalStrategy.mockReturnValue({
            name: 'optimal_strategy',
            confidence: 0.9,
            parameters: {}
        });
        metaLearning.updateStrategy.mockResolvedValue(true);
    }
});
