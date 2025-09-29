import * as vscode from 'vscode';
import {
  ApiTesterCore,
  _BatchTestResult,
  _TestResult,
  _VectorTestResult,
  ConferenceTestResult,
} from './apiTesterCore';
import { envLoader } from '../utils/envLoader';

interface ProvidersListMessage {
  providers: string[];
  envConfig: {
    hasApiKey: boolean;
    models: string[];
    defaultProvider: string;
  };
}

export class ApiTesterProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'astraforge.apiTester';

  private readonly _tester: ApiTesterCore;
  private readonly _secretStorage?: vscode.SecretStorage;
  private _view?: vscode.Webview;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    context?: vscode.ExtensionContext
  ) {
    this._tester = new ApiTesterCore();
    this._secretStorage = context?.secrets;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView.webview;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async data => {
      try {
        switch (data.type) {
          case 'initialize':
            await this._tester.initialize();
            this._sendMessage('initialized', { success: true });
            break;

          case 'testLLM':
            await this._handleLLMTest(data);
            break;

          case 'testBatch':
            await this._handleBatchTest(data);
            break;

          case 'testVector':
            await this._handleVectorTest(data);
            break;

          case 'testWorkflow':
            await this._handleWorkflowTest(data);
            break;

          case 'testConference':
            await this._handleConferenceTest(data);
            break;

          case 'validateKey':
            await this._handleValidateKey(data);
            break;

          case 'storeKey':
            await this._handleStoreKey(data);
            break;

          case 'retrieveKey':
            await this._handleRetrieveKey(data);
            break;

          case 'getProviders': {
            const providers = this._tester.getSupportedProviders();
            const envConfig: ProvidersListMessage['envConfig'] = {
              hasApiKey: !!envLoader.getOpenRouterApiKey(),
              models: envLoader.getOpenRouterModels(),
              defaultProvider: 'OpenRouter',
            };

            this._sendMessage('providersList', { providers, envConfig });
            break;
          }

          case 'getModels': {
            const models = this._tester.getSupportedModels(data.provider);
            this._sendMessage('modelsList', { models, provider: data.provider });
            break;
          }

          default:
            console.warn('Unknown message type:', data.type);
        }
      } catch (error: any) {
        this._sendMessage('error', {
          message: error.message,
          type: data.type,
        });
      }
    });
  }

  private async _handleLLMTest(data: any) {
    const result = await this._tester.testLLM(
      data.provider,
      data.apiKey,
      data.model,
      data.prompt
    );

    this._sendMessage('llmTestResult', {
      result,
      requestId: data.requestId,
    });
  }

  private async _handleBatchTest(data: any) {
    const result = await this._tester.testBatchLLM(
      data.provider,
      data.apiKey,
      data.model,
      data.prompts
    );

    this._sendMessage('batchTestResult', {
      result,
      requestId: data.requestId,
    });
  }

  private async _handleVectorTest(data: any) {
    const result = await this._tester.testVectorQuery(data.query, data.topK || 5);

    this._sendMessage('vectorTestResult', {
      result,
      requestId: data.requestId,
    });
  }

  private async _handleWorkflowTest(data: any) {
    const results = await this._tester.testWorkflowSimulation(
      data.idea,
      data.provider,
      data.apiKey,
      data.model
    );

    this._sendMessage('workflowTestResult', {
      results,
      requestId: data.requestId,
    });
  }

  private async _handleConferenceTest(data: any) {
    const models = envLoader.getOpenRouterModels();
    const defaultModels = [
      'anthropic/claude-3-opus',
      'openai/gpt-4-turbo',
      'xai/grok-beta',
    ];

    const roles: Array<'concept' | 'development' | 'coding'> = [
      'concept',
      'development',
      'coding',
    ];

    const selectedModels = models.length >= 3 ? models.slice(0, 3) : defaultModels;

    const providers = selectedModels.map((model, index) => ({
      provider: data.provider,
      apiKey: data.apiKey,
      model,
      role: roles[index] ?? 'development',
    }));

    const result = await this._tester.testConference(
      data.idea,
      providers,
      data.rounds,
      data.budget
    );

    this._sendMessage('conferenceTestResult', {
      result,
      requestId: data.requestId,
    });
  }

  private async _handleValidateKey(data: any) {
    if (data.realValidation) {
      const validation = await this._tester.validateApiKeyWithCall(
        data.provider,
        data.key
      );

      this._sendMessage('keyValidated', {
        isValid: validation.valid,
        provider: data.provider,
        error: validation.error,
      });
      return;
    }

    const isValid = this._tester.validateApiKey(data.provider, data.key);
    this._sendMessage('keyValidated', { isValid, provider: data.provider });
  }

  private async _handleStoreKey(data: any) {
    if (!this._secretStorage || !data.key) {
      return;
    }

    await this._secretStorage.store(
      `astraforge.${data.provider.toLowerCase()}.key`,
      data.key
    );

    this._sendMessage('keyStored', {
      provider: data.provider,
      success: true,
    });
  }

  private async _handleRetrieveKey(data: any) {
    if (!this._secretStorage) {
      return;
    }

    const key = await this._secretStorage.get(
      `astraforge.${data.provider.toLowerCase()}.key`
    );

    this._sendMessage('keyRetrieved', {
      provider: data.provider,
      key: key || '',
    });
  }

  private _sendMessage(
    type: string,
    data:
      | _TestResult
      | _BatchTestResult
      | _VectorTestResult
      | ProvidersListMessage
      | ConferenceTestResult
      | Record<string, unknown>
      | any
  ) {
    if (this._view) {
      this._view.postMessage({ type, data });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'apiTester.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'styles.css')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AstraForge API Tester</title>
  <link href="${styleUri}" rel="stylesheet">
  <style>
    .api-tester {
      padding: 16px;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
    }
    .form-group {
      margin-bottom: 12px;
    }
    .form-group label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
    }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--vscode-input-border);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 4px;
    }
    .form-group textarea {
      min-height: 80px;
      resize: vertical;
    }
    .button-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 16px 0;
    }
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .results {
      margin-top: 16px;
      padding: 12px;
      background: var(--vscode-textBlockQuote-background);
      border-radius: 4px;
      max-height: 320px;
      overflow-y: auto;
    }
    .result-item {
      margin-bottom: 12px;
      padding: 8px;
      background: var(--vscode-editor-background);
      border-radius: 4px;
    }
    .status-success {
      color: var(--vscode-testing-iconPassed);
    }
    .status-error {
      color: var(--vscode-testing-iconFailed);
    }
    .loading {
      opacity: 0.6;
      pointer-events: none;
    }
    .env-status {
      font-size: 12px;
      margin-top: 4px;
      color: var(--vscode-descriptionForeground);
    }
  </style>
</head>
<body>
  <div class="api-tester">
    <h2>AstraForge API Tester</h2>

    <div class="form-group">
      <label for="provider">API Provider</label>
      <select id="provider">
        <option value="OpenAI">OpenAI</option>
        <option value="Anthropic">Anthropic</option>
        <option value="xAI">xAI</option>
        <option value="OpenRouter">OpenRouter</option>
      </select>
      <div id="envStatus" class="env-status"></div>
    </div>

    <div class="form-group">
      <label for="apiKey">API Key</label>
      <input type="password" id="apiKey" placeholder="Enter your API key">
      <div class="button-group">
        <button class="btn btn-secondary" onclick="validateKey(false)">Quick Validate</button>
        <button class="btn btn-secondary" onclick="validateKey(true)">Real Validate</button>
        <button class="btn btn-secondary" onclick="storeKey()">Store Key</button>
        <button class="btn btn-secondary" onclick="loadKey()">Load Key</button>
      </div>
    </div>

    <div class="form-group">
      <label for="model">Model</label>
      <select id="model"></select>
    </div>

    <div class="form-group">
      <label for="prompt">Prompt or Project Idea</label>
      <textarea id="prompt" placeholder="Enter your test prompt or project idea..."></textarea>
    </div>

    <div class="form-group">
      <label for="budget">Budget Limit ($)</label>
      <input type="number" id="budget" value="10" step="0.01" min="0.01">
    </div>

    <div class="form-group">
      <label for="rounds">Conference Rounds</label>
      <input type="number" id="rounds" value="2" min="1" max="5">
    </div>

    <div class="button-group">
      <button class="btn btn-primary" onclick="testLLM()">Test LLM</button>
      <button class="btn btn-secondary" onclick="testVector()">Test Vector</button>
      <button class="btn btn-secondary" onclick="testWorkflow()">Test Workflow</button>
      <button class="btn btn-primary" onclick="testConference()">Test Conference</button>
      <button class="btn btn-secondary" onclick="clearResults()">Clear</button>
    </div>

    <div id="results" class="results" style="display: none;">
      <h3>Results</h3>
      <div id="resultsContent"></div>
    </div>
  </div>

  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}

