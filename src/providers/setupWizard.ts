import * as vscode from 'vscode';

export class SetupWizardProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'astraforge.setupWizard';

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview();
  }

  private _getHtmlForWebview(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AstraForge Setup</title>
      </head>
      <body>
        <h1>AstraForge Setup Wizard</h1>
        <div id="app">
          <button>Complete Setup</button>
        </div>
      </body>
      </html>
    `;
  }
}
