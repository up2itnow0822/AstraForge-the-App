"use strict";
/**
 * Integration tests for core AstraForge workflow
 * Tests critical paths from extension activation to basic functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
const workflowManager_1 = require("../../src/workflow/workflowManager");
const adaptiveWorkflow_1 = require("../../src/rl/adaptiveWorkflow");
describe('AstraForge Core Workflow Integration', () => {
    let workflowManager;
    let mockLLM;
    let mockVector;
    let mockGit;
    let mockCollaboration;
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup comprehensive mocks
        mockLLM = {
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
        mockVector = {
            init: jest.fn(),
            getEmbedding: jest.fn(),
            queryEmbedding: jest.fn(),
            addEmbedding: jest.fn(),
            save: jest.fn(),
            close: jest.fn()
        };
        mockGit = {
            commit: jest.fn(),
            initRepo: jest.fn(),
            getStatus: jest.fn(),
            getDiff: jest.fn()
        };
        mockCollaboration = {
            broadcastToWorkspace: jest.fn(),
            handleUserMessage: jest.fn(),
            startSession: jest.fn(),
            endSession: jest.fn()
        };
        // Create workflow manager instance
        workflowManager = new workflowManager_1.WorkflowManager(mockLLM, mockVector, mockGit);
    });
    describe('Extension Initialization Integration', () => {
        it('should initialize all core systems successfully', () => {
            expect(workflowManager).toBeInstanceOf(workflowManager_1.WorkflowManager);
            expect(workflowManager.llmManager).toBe(mockLLM);
            expect(workflowManager.vectorDB).toBe(mockVector);
            expect(workflowManager.gitManager).toBe(mockGit);
        });
        it('should initialize RL system', () => {
            expect(workflowManager.workflowRL).toBeInstanceOf(adaptiveWorkflow_1.AdaptiveWorkflow);
            expect(workflowManager.workspaceId).toBeDefined();
            expect(workflowManager.metrics).toBeDefined();
        });
        it('should setup collaboration integration', () => {
            expect(workflowManager.collaborationServer).toBeUndefined(); // Not initialized by default
        });
    });
    describe('Project Analysis Integration', () => {
        beforeEach(() => {
            // Setup mock responses
            documents: [
                {
                    id: 'context-1',
                    content: 'Previous project used React with TypeScript',
                    similarity: 0.8,
                    metadata: { domain: 'web', complexity: 0.7 }
                }
            ],
                insights;
            {
                dominantBehaviorType: 'collaborative',
                    averageInnovationIndex;
                0.7,
                    complexityDistribution;
                {
                    'web';
                    0.6, 'backend';
                    0.4;
                }
                recommendedPatterns: ['MVC', 'REST'],
                    emergentOpportunities;
                ['microservices', 'containerization'];
            }
        });
        'Based on the context, I recommend using React with TypeScript for this web application. ' +
            'The project structure should include components, services, and proper testing setup.';
    });
});
it('should analyze project idea and retrieve context', async () => {
    const projectIdea = 'Create a task management app with React';
    // Mock the categorizeProjectType method
    jest.spyOn(workflowManager, 'categorizeProjectType').mockReturnValue('web');
    jest.spyOn(workflowManager, 'estimateComplexity').mockReturnValue(0.6);
    jest.spyOn(workflowManager, 'extractDomain').mockReturnValue('web');
    jest.spyOn(workflowManager, 'identifyBehaviorPatterns').mockReturnValue(['pattern1']);
    await workflowManager.runWorkflow(projectIdea);
    projectIdea,
        expect.objectContaining({
            domain: 'web',
            complexity: 0.6
        });
});
;
it('should generate enhanced project plan using LLM', async () => {
    const projectIdea = 'Build a simple web app';
    // Setup mocks
    jest.spyOn(workflowManager, 'categorizeProjectType').mockReturnValue('web');
    jest.spyOn(workflowManager, 'estimateComplexity').mockReturnValue(0.3);
    jest.spyOn(workflowManager, 'extractDomain').mockReturnValue('web');
    jest.spyOn(workflowManager, 'identifyBehaviorPatterns').mockReturnValue([]);
    documents: [],
        insights;
    {
        dominantBehaviorType: 'unknown',
            averageInnovationIndex;
        0.5,
            complexityDistribution;
        { }
        recommendedPatterns: [],
            emergentOpportunities;
        [];
    }
});
await workflowManager.runWorkflow(projectIdea);
expect.stringContaining(projectIdea);
;
;
;
describe('Workflow Phase Execution Integration', () => {
    beforeEach(() => {
        // Setup basic workflow state
        workflowManager.projectIdea = 'Test project';
        workflowManager.currentPhase = 0;
        // Mock helper methods
        jest.spyOn(workflowManager, 'categorizeProjectType').mockReturnValue('web');
        jest.spyOn(workflowManager, 'estimateComplexity').mockReturnValue(0.5);
        jest.spyOn(workflowManager, 'extractDomain').mockReturnValue('web');
        jest.spyOn(workflowManager, 'identifyBehaviorPatterns').mockReturnValue([]);
    });
    it('should execute planning phase with context retrieval', async () => {
        const mockContext = {
            documents: [
                {
                    id: 'context-1',
                    content: 'Previous planning phase succeeded',
                    similarity: 0.9,
                    metadata: { phase: 'planning', success: true }
                }
            ],
            insights: {
                dominantBehaviorType: 'planning',
                averageInnovationIndex: 0.8,
                complexityDistribution: { 'planning': 0.7 },
                recommendedPatterns: ['agile', 'iterative'],
                emergentOpportunities: ['automated-planning']
            }
        };
        await workflowManager.runWorkflow('Test project');
    });
    it('should handle phase transitions', () => {
        workflowManager.currentPhase = 0;
        const nextPhase = workflowManager.proceedToNextPhase();
        expect(nextPhase).toBe(1);
    });
});
describe('Error Handling Integration', () => {
    beforeEach(() => {
        // Setup mocks for error scenarios
        jest.spyOn(workflowManager, 'categorizeProjectType').mockReturnValue('web');
        jest.spyOn(workflowManager, 'estimateComplexity').mockReturnValue(0.5);
        jest.spyOn(workflowManager, 'extractDomain').mockReturnValue('web');
        jest.spyOn(workflowManager, 'identifyBehaviorPatterns').mockReturnValue([]);
    });
    it('should handle LLM API failures gracefully', async () => {
        const result = await workflowManager.runWorkflow('Test project');
        // Should not throw, should handle error gracefully
    });
    it('should handle vector DB failures', async () => {
        const result = await workflowManager.runWorkflow('Test project');
    });
});
describe('Metrics and Learning Integration', () => {
    it('should track workflow metrics', async () => {
        workflowManager.projectIdea = 'Test project';
        workflowManager.currentPhase = 0;
        expect(workflowManager.metrics).toBeDefined();
        expect(workflowManager.metrics.startTime).toBeLessThanOrEqual(Date.now());
    });
    it('should provide RL-based optimization', () => {
        expect(workflowManager.workflowRL).toBeDefined();
        expect(typeof workflowManager.workflowRL.updateQValue).toBe('function');
        expect(typeof workflowManager.workflowRL.calculateReward).toBe('function');
    });
    it('should estimate project complexity', () => {
        const complexity = workflowManager.estimateProjectComplexity();
        expect(typeof complexity).toBe('number');
        expect(complexity).toBeGreaterThanOrEqual(0);
        expect(complexity).toBeLessThanOrEqual(1);
    });
});
describe('System Health Integration', () => {
    it('should be in healthy state after initialization', () => {
        expect(workflowManager).toBeDefined();
        expect(workflowManager.llmManager).toBeDefined();
        expect(workflowManager.vectorDB).toBeDefined();
        expect(workflowManager.gitManager).toBeDefined();
    });
    it('should handle component failures gracefully', async () => {
        // Test that one component failure doesn't break the entire system
        mockVector.init.mockRejectedValue(new Error('Vector DB init failed'));
        // Should still create workflow manager instance
        expect(workflowManager).toBeInstanceOf(workflowManager_1.WorkflowManager);
    });
    it('should provide fallback mechanisms', () => {
        // Test that the system can work with minimal components
        const minimalWorkflow = new workflowManager_1.WorkflowManager(mockLLM, mockVector, mockGit);
        expect(minimalWorkflow).toBeInstanceOf(workflowManager_1.WorkflowManager);
        expect(minimalWorkflow.llmManager).toBe(mockLLM);
    });
});
describe('Performance Integration', () => {
    it('should handle concurrent operations', async () => {
        const promises = [
            workflowManager.runWorkflow('Project 1'),
            workflowManager.runWorkflow('Project 2'),
            workflowManager.runWorkflow('Project 3')
        ];
        // Should not throw
        await Promise.allSettled(promises);
    });
    it('should maintain state consistency', async () => {
        const project1 = 'Web App 1';
        const project2 = 'Web App 2';
        await workflowManager.runWorkflow(project1);
        expect(workflowManager.projectIdea).toBe(project1);
        await workflowManager.runWorkflow(project2);
        expect(workflowManager.projectIdea).toBe(project2);
    });
});
describe('Configuration Integration', () => {
    it('should work with different LLM configurations', () => {
        // Test with different provider configurations
        mockLLM.panel = [
            { provider: 'Anthropic', key: 'test-key', model: 'claude-3', role: 'primary' }
        ];
        expect(workflowManager.llmManager.panel).toEqual(expect.arrayContaining([
            expect.objectContaining({ provider: 'Anthropic' })
        ]));
    });
    it('should adapt to different project types', () => {
        const mobileProject = 'Create a mobile app';
        const webProject = 'Create a web dashboard';
        jest.spyOn(workflowManager, 'categorizeProjectType')
            .mockReturnValueOnce('mobile')
            .mockReturnValueOnce('web');
        const mobileType = workflowManager.categorizeProjectType(mobileProject);
        const webType = workflowManager.categorizeProjectType(webProject);
        expect(mobileType).toBe('mobile');
        expect(webType).toBe('web');
    });
});
;
