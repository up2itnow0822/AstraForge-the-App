import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SetupWizardProvider } from '../setupWizard';

const mockWebview = {
    options: {},
    html: '',
    onDidReceiveMessage: jest.fn(),
    asWebviewUri: jest.fn()
};

const mockWebviewView = {
    webview: mockWebview,
    onDidChangeVisibility: jest.fn(),
    onDidDispose: jest.fn(),
    visible: true
};

const mockUri = { 
    fsPath: '/test/path',
    with: jest.fn(),
    toString: jest.fn()
};

jest.mock('vscode', () => ({
    WebviewViewProvider: class {},
    Uri: { file: jest.fn(f => mockUri) }
}), { virtual: true });

describe('SetupWizardProvider', () => {
    let provider: SetupWizardProvider;

    beforeEach(() => {
        provider = new SetupWizardProvider(mockUri as any);
        mockWebview.options = {};
        mockWebview.html = '';
    });

    it('should be defined', () => {
        expect(provider).toBeDefined();
    });

    it('should resolve webview view correctly', () => {
        const context = {} as any;
        const token = {} as any;

        provider.resolveWebviewView(mockWebviewView as any, context, token);

        expect(mockWebview.options).toHaveProperty('enableScripts', true);
        expect(mockWebview.options).toHaveProperty('localResourceRoots');
        expect(mockWebview.html).toContain('AstraForge Setup Wizard');
        expect(mockWebview.html).toContain('<!DOCTYPE html>');
    });
});
