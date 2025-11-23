import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ProjectIgnition } from '../projectIgnition';
import * as vscode from 'vscode';

// Mock Logger
const mockLoggerInstance = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
};

// Mock path must be correct relative to the test file: ../../utils/logger
jest.mock('../../utils/logger', () => ({
    Logger: jest.fn(() => mockLoggerInstance)
}));

jest.mock('vscode', () => ({
    window: { showInformationMessage: jest.fn() }
}), { virtual: true });

describe('ProjectIgnition', () => {
    let igniter: ProjectIgnition;

    beforeEach(() => {
        jest.clearAllMocks();
        igniter = new ProjectIgnition();
    });

    it('should instantiate correctly', () => {
        expect(igniter).toBeDefined();
    });

    it('should ignite project with config', async () => {
        const config = { template: 'basic' };
        const result = await igniter.ignite(config);
        
        expect(result).toBe(true);
        expect(mockLoggerInstance.info).toHaveBeenCalledWith(expect.stringContaining('Igniting project'));
    });

    it('should generate scaffold', async () => {
        const type = 'react-ts';
        await igniter.generateScaffold(type);
        
        expect(mockLoggerInstance.info).toHaveBeenCalledWith(expect.stringContaining('Generating scaffold for react-ts'));
    });
});
