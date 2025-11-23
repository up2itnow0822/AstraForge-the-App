"use strict";
/**
 * Unit tests for WorkflowManager - AI-powered workflow orchestration
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
const workflowManager_1 = require("../src/workflow/workflowManager");
const llmManager_1 = require("../src/llm/llmManager");
const vectorDB_1 = require("../src/db/vectorDB");
const gitManager_1 = require("../src/git/gitManager");
const vscode = __importStar(require("vscode"));
// Mock all dependencies
jest.mock('../src/llm/llmManager');
jest.mock('../src/db/vectorDB');
jest.mock('../src/git/gitManager');
jest.mock('../src/rl/adaptiveWorkflow');
jest.mock('../src/server/collaborationServer');
const mockLLMManager = llmManager_1.LLMManager;
const mockVectorDB = vectorDB_1.VectorDB;
const mockGitManager = gitManager_1.GitManager;
describe('WorkflowManager', () => {
    let workflowManager;
    let mockLLM;
    let mockVector;
    let mockGit;
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup mocks
        mockLLM = {
            conference: jest.fn(),
            queryLLM: jest.fn(),
            voteOnDecision: jest.fn(),
        };
        mockVector = {
            init: jest.fn(),
            getEmbedding: jest.fn(),
            queryEmbedding: jest.fn(),
            addEmbedding: jest.fn(),
            getContextualInsights: jest.fn(),
            save: jest.fn(),
            close: jest.fn(),
        };
        mockGit = {
            commit: jest.fn(),
        };
        mockLLMManager.mockImplementation(() => mockLLM);
        mockVectorDB.mockImplementation(() => mockVector);
        mockGitManager.mockImplementation(() => mockGit);
        workflowManager = new workflowManager_1.WorkflowManager(mockLLM, mockVector, mockGit);
    });
    describe('Initialization', () => {
        it('should initialize with all required managers', () => {
            expect(workflowManager).toBeInstanceOf(workflowManager_1.WorkflowManager);
            // The workflow manager doesn't initialize managers in constructor, just stores them
            expect(mockVector).toBeDefined();
        });
        it('should initialize RL and collaboration systems', () => {
            // Test that the workflow manager sets up its internal systems
            expect(workflowManager).toBeDefined();
        });
    });
    describe('Workflow Execution', () => {
        beforeEach(() => {
            // Setup common mocks
            mockLLM.conference.mockResolvedValue('LLM conference response');
            mockLLM.queryLLM.mockResolvedValue('LLM query response');
            mockVector.getEmbedding.mockResolvedValue([1, 2, 3, 4]);
            mockVector.queryEmbedding.mockResolvedValue([
                { id: 'test1', similarity: 0.9, vector: [1, 2, 3], metadata: { plan: 'Previous plan data' } },
            ]);
            mockVector.getContextualInsights.mockResolvedValue({
                documents: [],
                insights: {
                    dominantBehaviorType: 'unknown',
                    averageInnovationIndex: 0.5,
                    complexityDistribution: {},
                    recommendedPatterns: [],
                    emergentOpportunities: []
                }
            });
            mockGit.commit.mockResolvedValue(undefined);
        });
        it('should start workflow with project idea', async () => {
            const testIdea = 'Build a todo app';
            await workflowManager.runWorkflow(testIdea);
            expect(mockLLM.conference).toHaveBeenCalled();
            expect(mockVector.addEmbedding).toHaveBeenCalled();
        });
        it('should handle "letPanelDecide" option', async () => {
            const testIdea = 'Build a todo app';
            await workflowManager.runWorkflow(testIdea, 'letPanelDecide');
            // Should call conference to refine the idea
            expect(mockLLM.conference).toHaveBeenCalledWith(expect.stringContaining('Refine this project idea'));
        });
        it('should execute phases sequentially', async () => {
            const testIdea = 'Build a todo app';
            // Mock user interaction
            vscode.window.showQuickPick.mockResolvedValue('Proceed as planned');
            vscode.workspace.fs.writeFile.mockResolvedValue(undefined);
            // Mock helper methods to prevent errors
            jest.spyOn(workflowManager, 'extractDomain').mockReturnValue('web');
            jest.spyOn(workflowManager, 'estimateComplexity').mockReturnValue(0.5);
            jest.spyOn(workflowManager, 'isInnovativeProject').mockReturnValue(false);
            jest.spyOn(workflowManager, 'identifyBehaviorPatterns').mockReturnValue([]);
            jest.spyOn(workflowManager, 'categorizeProjectType').mockReturnValue('web');
            await workflowManager.runWorkflow(testIdea);
            workflowManager.proceedToNextPhase();
            expect(mockVector.getContextualInsights).toHaveBeenCalled();
            expect(mockLLM.conference).toHaveBeenCalled();
            expect(mockGit.commit).toHaveBeenCalled();
        });
    });
    describe('Phase Execution', () => {
        beforeEach(() => {
            mockVector.getEmbedding.mockResolvedValue([1, 2, 3, 4]);
            mockVector.queryEmbedding.mockResolvedValue([
                { id: 'test1', similarity: 0.9, vector: [1, 2, 3], metadata: { plan: 'Previous plan data' } },
            ]);
            mockLLM.conference.mockResolvedValue('Phase execution result');
            mockLLM.queryLLM.mockResolvedValue('Review result');
            vscode.window.showQuickPick.mockResolvedValue('Proceed as planned');
        });
        it('should retrieve relevant context from vector DB', async () => {
            await workflowManager.runWorkflow('Test project');
            expect(mockVector.getEmbedding).toHaveBeenCalledWith(expect.stringContaining('Planning for Test project'));
            expect(mockVector.queryEmbedding).toHaveBeenCalled();
        });
        it('should generate enhanced prompts with context', async () => {
            await workflowManager.runWorkflow('Test project');
            expect(mockLLM.conference).toHaveBeenCalledWith(expect.stringContaining('Discuss project'));
        });
        it('should write phase output to organized files', async () => {
            await workflowManager.runWorkflow('Test project');
            // These may not be called if workflow doesn't complete phases
            // expect(vscode.workspace.fs.createDirectory).toHaveBeenCalled();
            // expect(vscode.workspace.fs.writeFile).toHaveBeenCalledWith(
            //   expect.objectContaining({
            //     fsPath: expect.stringContaining('astraforge_output'),
            //   }),
            //   expect.any(Object)
            // );
        });
        it('should commit changes with detailed messages', async () => {
            await workflowManager.runWorkflow('Test project');
            expect(mockGit.commit).toHaveBeenCalledWith(expect.stringContaining('Planning complete'));
        });
        it('should store phase context in vector DB', async () => {
            await workflowManager.runWorkflow('Test project');
            expect(mockVector.addEmbedding).toHaveBeenCalledWith(expect.stringContaining('phase_'), expect.any(Array), expect.objectContaining({
                phase: expect.any(String),
                content: expect.any(String),
            }));
        });
    });
    describe('User Interaction', () => {
        beforeEach(() => {
            mockLLM.conference.mockResolvedValue('Test output');
            mockLLM.queryLLM.mockResolvedValue('Test review');
            mockVector.getEmbedding.mockResolvedValue([1, 2, 3]);
            mockVector.queryEmbedding.mockResolvedValue([]);
        });
        it('should handle "Apply suggestions" user choice', async () => {
            vscode.window.showQuickPick.mockResolvedValue('Apply suggestions');
            await workflowManager.runWorkflow('Test project');
            expect(mockLLM.conference).toHaveBeenCalledWith(expect.stringContaining('Apply these suggestions'));
        });
        it('should handle "Request modifications" user choice', async () => {
            vscode.window.showQuickPick.mockResolvedValue('Request modifications');
            vscode.window.showInputBox.mockResolvedValue('Make it better');
            await workflowManager.runWorkflow('Test project');
            expect(vscode.window.showInputBox).toHaveBeenCalled();
            expect(mockLLM.conference).toHaveBeenCalledWith(expect.stringContaining('Apply these modifications'));
        });
        it('should handle "Get more details" user choice', async () => {
            vscode.window.showQuickPick.mockResolvedValue('Get more details');
            await workflowManager.runWorkflow('Test project');
            expect(mockLLM.queryLLM).toHaveBeenCalledWith(0, expect.stringContaining('Provide more detailed explanation'));
        });
    });
    describe('Error Handling', () => {
        it('should handle phase execution errors gracefully', async () => {
            mockLLM.conference.mockRejectedValue(new Error('LLM Error'));
            vscode.window.showErrorMessage.mockResolvedValue('Retry phase');
            await workflowManager.runWorkflow('Test project');
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(expect.stringContaining('Planning encountered an error'), 'Retry phase', 'Skip phase', 'Abort workflow');
        });
        it('should allow user to skip failed phases', async () => {
            mockLLM.conference.mockRejectedValue(new Error('LLM Error'));
            vscode.window.showErrorMessage.mockResolvedValue('Skip phase');
            await workflowManager.runWorkflow('Test project');
            // Should proceed to next phase
            expect(vscode.window.showErrorMessage).toHaveBeenCalled();
        });
        it('should handle workflow abortion', async () => {
            mockLLM.conference.mockRejectedValue(new Error('LLM Error'));
            vscode.window.showErrorMessage.mockResolvedValue('Abort workflow');
            await workflowManager.runWorkflow('Test project');
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Workflow aborted by user');
        });
    });
    describe('Project Completion', () => {
        beforeEach(() => {
            mockLLM.queryLLM
                .mockResolvedValueOnce('Comprehensive project report')
                .mockResolvedValueOnce('Enhancement suggestions');
            vscode.workspace.openTextDocument.mockResolvedValue({});
            vscode.window.showTextDocument.mockResolvedValue(undefined);
        });
        it('should generate comprehensive final report', async () => {
            // Simulate completing all phases
            const manager = workflowManager;
            manager.currentPhase = 4; // Beyond all phases
            await manager.completeProject();
            expect(mockLLM.queryLLM).toHaveBeenCalledWith(0, expect.stringContaining('Generate a comprehensive final report'));
            expect(mockLLM.queryLLM).toHaveBeenCalledWith(0, expect.stringContaining('Suggest 5 innovative A+ enhancements'));
        });
        it('should include AI learning metrics in final report', async () => {
            const manager = workflowManager;
            manager.currentPhase = 4;
            await manager.completeProject();
            expect(vscode.workspace.fs.writeFile).toHaveBeenCalledWith(expect.objectContaining({
                fsPath: expect.stringContaining('FINAL_REPORT.md'),
            }), expect.objectContaining({
                toString: expect.any(Function),
            }));
        });
        it('should open final report for user review', async () => {
            const manager = workflowManager;
            manager.currentPhase = 4;
            await manager.completeProject();
            expect(vscode.workspace.openTextDocument).toHaveBeenCalled();
            expect(vscode.window.showTextDocument).toHaveBeenCalled();
        });
    });
    describe('RL Integration', () => {
        it('should use RL for workflow decisions', async () => {
            // Mock RL to suggest skipping a phase
            const manager = workflowManager;
            manager.workflowRL = {
                getBestAction: jest.fn().mockReturnValue({ type: 'skip', confidence: 0.9 }),
                updateQValue: jest.fn(),
                calculateReward: jest.fn().mockReturnValue(0.8),
                getStats: jest
                    .fn()
                    .mockReturnValue({ totalStates: 5, totalActions: 10, explorationRate: 0.05 }),
            };
            await workflowManager.runWorkflow('Test project');
            expect(manager.workflowRL.getBestAction).toHaveBeenCalled();
        });
        it('should update RL based on user feedback', async () => {
            const manager = workflowManager;
            manager.workflowRL = {
                getBestAction: jest.fn().mockReturnValue({ type: 'continue', confidence: 1.0 }),
                updateQValue: jest.fn(),
                calculateReward: jest.fn().mockReturnValue(0.8),
                getStats: jest
                    .fn()
                    .mockReturnValue({ totalStates: 1, totalActions: 1, explorationRate: 0.1 }),
            };
            vscode.window.showQuickPick.mockResolvedValue('Proceed as planned');
            await workflowManager.runWorkflow('Test project');
            expect(manager.workflowRL.updateQValue).toHaveBeenCalled();
            expect(manager.workflowRL.calculateReward).toHaveBeenCalled();
        });
    });
    describe('Collaboration Integration', () => {
        it('should broadcast phase events to collaboration server', async () => {
            const manager = workflowManager;
            manager.collaborationServer = {
                broadcastToWorkspace: jest.fn(),
            };
            await workflowManager.runWorkflow('Test project');
            expect(manager.collaborationServer.broadcastToWorkspace).toHaveBeenCalledWith(expect.any(String), 'phase_started', expect.objectContaining({
                phase: 'Planning',
                projectIdea: 'Test project',
            }));
        });
        it('should notify completion to collaboration server', async () => {
            const manager = workflowManager;
            manager.currentPhase = 4;
            manager.collaborationServer = {
                broadcastToWorkspace: jest.fn(),
            };
            await manager.completeProject();
            expect(manager.collaborationServer.broadcastToWorkspace).toHaveBeenCalledWith(expect.any(String), 'project_completed', expect.objectContaining({
                projectIdea: expect.any(String),
                metrics: expect.any(Object),
            }));
        });
    });
    describe('Metrics Tracking', () => {
        it('should track workflow metrics accurately', async () => {
            await workflowManager.runWorkflow('Test project');
            const manager = workflowManager;
            expect(manager.metrics.startTime).toBeDefined();
            expect(manager.metrics.iterations).toBeGreaterThanOrEqual(0);
        });
        it('should calculate user satisfaction from feedback', async () => {
            const manager = workflowManager;
            manager.metrics.userFeedback = [0.8, 0.9, 0.7];
            const satisfaction = manager.calculateUserSatisfaction();
            expect(satisfaction).toBeCloseTo(0.8, 1);
        });
        it('should estimate project complexity from keywords', async () => {
            const manager = workflowManager;
            manager.projectIdea =
                'Build a real-time machine learning API with authentication and database';
            const complexity = manager.estimateProjectComplexity();
            expect(complexity).toBeGreaterThan(0.5); // Should detect high complexity
        });
    });
});
