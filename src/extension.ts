// src/extension.ts
import * as vscode from 'vscode';
import { GitManager } from './git/gitManager';
import { envLoader } from './utils/envLoader';

export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('AstraForge extension activated');

  // Load secrets
  const loadSecrets = async () => {
    await envLoader.loadSecrets();
  };
  loadSecrets();

  const pat = envLoader.getApiKey('github') || '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';
  const openaiK = envLoader.getApiKey('openai') || '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';
  const dbPath = envLoader.getVectorDbPath();

  const provider = vscode.languages.registerCompletionItemProvider('typescript', {
    provideCompletionItems(document, position) {
      // a simple completion item that inserts its text as snippet
      const simpleCompletion = new vscode.CompletionItem('Hello World!');
      // a completion item that inserts `console.log('Hello World!');`
      const snippetCompletion = new vscode.CompletionItem('Hello World Snippet');
      snippetCompletion.insertText = new vscode.SnippetString('console.log('Hello World!');');
      snippetCompletion.documentation = new vscode.MarkdownString('Press Enter or Tab to insert this snippet.');

      // return all completion items as array
      return [
        simpleCompletion,
        snippetCompletion
      ];
    }
  });

  const syncReposCommand = vscode.commands.registerCommand('astraforge.syncRepos', async () => {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      const workspace = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const gm = new GitManager(pat, openaiK, dbPath);
      const context = await gm.syncRepos(workspace);
      vscode.window.showInformationMessage(`Synced repo with infinite context: ${context.length} vectors`);
    } else {
      vscode.window.showWarningMessage('No workspace for Git sync');
    }
  });

  context.subscriptions.push(syncReposCommand, provider);
}

export function deactivate() {}
