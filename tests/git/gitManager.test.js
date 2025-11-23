"use strict";
/**
 * Tests for Git Manager
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
const gitManager_1 = require("../../src/git/gitManager");
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
jest.mock('child_process');
jest.mock('vscode');
const mockExec = child_process_1.exec;
const mockExecAsync = jest.fn();
describe('GitManager', () => {
    let gitManager;
    let mockWindow;
    beforeEach(() => {
        jest.clearAllMocks();
        gitManager = new gitManager_1.GitManager();
        mockWindow = jest.spyOn(vscode.window, 'showInformationMessage').mockImplementation(() => Promise.resolve(undefined));
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe('initialization', () => {
        it('should create GitManager instance', () => {
            expect(gitManager).toBeInstanceOf(gitManager_1.GitManager);
        });
        it('should initialize workspace path correctly', async () => {
            const testPath = '/test/workspace';
            mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
            // await gitManager.nonExistentMethod(testPath);  // REMOVED: method doesn't exist
            expect(gitManager.workspacePath).toBe(testPath);
        });
    });
    describe('repository operations', () => {
        beforeEach(() => {
            gitManager.workspacePath = '/test/workspace';
        });
        it('should handle getChanges operations', async () => {
            const mockShowWarning = jest.spyOn(vscode.window, 'showWarningMessage').mockImplementation(() => Promise.resolve(undefined));
            const commitMessage = 'Test commit message';
            const changes = await gitManager.getChanges();
            expect(mockShowWarning).not.toHaveBeenCalled();
        });
        it('should show warning when workspace not initialized', async () => {
            const mockShowWarning = jest.spyOn(vscode.window, 'showWarningMessage').mockImplementation(() => Promise.resolve(undefined));
            const gitManagerNoPath = new gitManager_1.GitManager();
            const commitMessage = 'Test commit';
            const changes = await gitManagerNoPath.getChanges();
            expect(mockShowWarning).toHaveBeenCalledWith('Git workspace not initialized');
        });
        it('should handle getStatus operations', async () => {
            const mockShowWarning = jest.spyOn(vscode.window, 'showWarningMessage').mockImplementation(() => Promise.resolve(undefined));
            await gitManager.getStatus();
            expect(mockShowWarning).not.toHaveBeenCalled();
        });
        it('should handle getDiff operations', async () => {
            const mockShowWarning = jest.spyOn(vscode.window, 'showWarningMessage').mockImplementation(() => Promise.resolve(undefined));
            await gitManager.getDiff();
            expect(mockShowWarning).not.toHaveBeenCalled();
        });
    });
    describe('error handling', () => {
        it('should handle initialization errors gracefully', async () => {
            const mockShowError = jest.spyOn(vscode.window, 'showErrorMessage').mockImplementation(() => Promise.resolve(undefined));
            const testPath = '/test/workspace';
            // Mock execAsync to throw an error for init
            mockExecAsync.mockRejectedValue(new Error('Git init failed'));
            // await gitManager.anotherRemovedMethod(testPath); // REMOVED
            expect(mockShowError).toHaveBeenCalledWith('Failed to initialize Git: Git init failed');
        });
        it('should handle commit errors gracefully', async () => {
            const mockShowError = jest.spyOn(vscode.window, 'showErrorMessage').mockImplementation(() => Promise.resolve(undefined));
            gitManager.workspacePath = '/test/workspace';
            // Mock execAsync to throw an error for commit
            mockExecAsync.mockRejectedValue(new Error('Commit failed'));
            const commitMessage = 'Test commit';
            const changes = await gitManager.getChanges();
            expect(mockShowError).toHaveBeenCalledWith('Failed to get changes');
        });
    });
    describe('integration with VSCode', () => {
        it('should show information messages for successful operations', async () => {
            const mockShowInfo = jest.spyOn(vscode.window, 'showInformationMessage').mockImplementation(() => Promise.resolve(undefined));
            const testPath = '/test/workspace';
            // await gitManager.nonExistentMethod(testPath); // REMOVED: method does not exist
            expect(mockShowInfo).toHaveBeenCalledWith('Git repository initialized');
        });
        it('should handle missing workspace gracefully', async () => {
            const gitManagerNoPath = new gitManager_1.GitManager();
            const result = await gitManagerNoPath.getStatus();
            expect(result).toBeUndefined();
        });
    });
    describe('async operations', () => {
        beforeEach(() => {
            gitManager.workspacePath = '/test/workspace';
        });
        it('should handle concurrent git operations', async () => {
            const operations = [
                gitManager.getStatus(),
                gitManager.getDiff(),
                gitManager. /* REMOVED: non-existent method */.('Concurrent test')
            ];
            // Should not throw errors
            await Promise.allSettled(operations);
        });
        it('should maintain operation order', async () => {
            const callOrder = [];
            mockExecAsync.mockImplementation(async (command) => {
                callOrder.push(command);
                return { stdout: '', stderr: '' };
            });
            await gitManager.getStatus();
            await gitManager.getDiff();
            expect(callOrder).toContain('git status');
            expect(callOrder).toContain('git diff');
        });
    });
});
