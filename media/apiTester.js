const vscode = acquireVsCodeApi();

let currentRequestId = 0;
let providerConfig = { providers: [], envConfig: null };

const buttonsSelector = '.btn';

document.addEventListener('DOMContentLoaded', () => {
  vscode.postMessage({ type: 'initialize' });
  vscode.postMessage({ type: 'getProviders' });
});

window.addEventListener('message', event => {
  const message = event.data;
  const data = message.data;

  switch (message.type) {
    case 'initialized':
      console.log('API Tester initialized');
      break;
    case 'providersList':
      populateProviders(data.providers);
      providerConfig = { providers: data.providers, envConfig: data.envConfig };
      updateEnvStatus(data.envConfig);
      if (data.envConfig?.defaultProvider) {
        const providerSelect = document.getElementById('provider');
        providerSelect.value = data.envConfig.defaultProvider;
      }
      requestModels(document.getElementById('provider').value);
      break;
    case 'modelsList':
      populateModels(data.models);
      break;
    case 'llmTestResult':
      displayLLMResult(data);
      break;
    case 'batchTestResult':
      displayBatchResult(data);
      break;
    case 'vectorTestResult':
      displayVectorResult(data);
      break;
    case 'workflowTestResult':
      displayWorkflowResult(data);
      break;
    case 'conferenceTestResult':
      displayConferenceResult(data);
      break;
    case 'keyValidated':
      displayKeyValidation(data);
      break;
    case 'keyStored':
      showMessage(`🔐 API key stored securely for ${data.provider}`);
      break;
    case 'keyRetrieved':
      document.getElementById('apiKey').value = data.key || '';
      showMessage(`🔑 Loaded stored key for ${data.provider}`);
      break;
    case 'error':
      displayError(data);
      break;
    default:
      console.warn('Unknown message type:', message.type);
  }
});

document.addEventListener('change', event => {
  if (event.target?.id === 'provider') {
    requestModels(event.target.value);
    updateEnvStatus(providerConfig.envConfig);
  }
});

function requestModels(provider) {
  vscode.postMessage({ type: 'getModels', provider });
}

function populateProviders(providers = []) {
  const select = document.getElementById('provider');
  const current = select.value;
  select.innerHTML = '';

  providers.forEach(provider => {
    const option = document.createElement('option');
    option.value = provider;
    option.textContent = provider;
    select.appendChild(option);
  });

  if (providers.includes(current)) {
    select.value = current;
  }
}

function populateModels(models = []) {
  const select = document.getElementById('model');
  select.innerHTML = '';

  if (!models.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Select a model';
    select.appendChild(option);
    return;
  }

  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    select.appendChild(option);
  });
}

function updateEnvStatus(envConfig) {
  const status = document.getElementById('envStatus');
  if (!envConfig) {
    status.textContent = '';
    return;
  }

  if (envConfig.hasApiKey) {
    status.textContent = `🔗 Env detected (${envConfig.models.join(', ')})`;
  } else {
    status.textContent = '⚠️ No OpenRouter configuration detected in .env';
  }
}

function validateKey(realValidation) {
  const provider = document.getElementById('provider').value;
  const apiKey = document.getElementById('apiKey').value;

  if (!apiKey) {
    showError('Please provide an API key');
    return;
  }

  vscode.postMessage({
    type: 'validateKey',
    provider,
    key: apiKey,
    realValidation,
  });
}

function storeKey() {
  const provider = document.getElementById('provider').value;
  const apiKey = document.getElementById('apiKey').value;

  if (!apiKey) {
    showError('Cannot store an empty key');
    return;
  }

  vscode.postMessage({ type: 'storeKey', provider, key: apiKey });
}

function loadKey() {
  const provider = document.getElementById('provider').value;
  vscode.postMessage({ type: 'retrieveKey', provider });
}

function testLLM() {
  const provider = document.getElementById('provider').value;
  const apiKey = document.getElementById('apiKey').value;
  const model = document.getElementById('model').value;
  const prompt = document.getElementById('prompt').value;

  if (!apiKey || !prompt) {
    showError('Please provide both API key and prompt');
    return;
  }

  setLoading(true);
  vscode.postMessage({
    type: 'testLLM',
    provider,
    apiKey,
    model,
    prompt,
    requestId: ++currentRequestId,
  });
}

function testVector() {
  const query = document.getElementById('prompt').value;

  if (!query) {
    showError('Please provide a query for vector testing');
    return;
  }

  setLoading(true);
  vscode.postMessage({
    type: 'testVector',
    query,
    topK: 5,
    requestId: ++currentRequestId,
  });
}

function testWorkflow() {
  const provider = document.getElementById('provider').value;
  const apiKey = document.getElementById('apiKey').value;
  const model = document.getElementById('model').value;
  const idea = document.getElementById('prompt').value;

  if (!apiKey || !idea) {
    showError('Please provide both API key and project idea');
    return;
  }

  setLoading(true);
  vscode.postMessage({
    type: 'testWorkflow',
    provider,
    apiKey,
    model,
    idea,
    requestId: ++currentRequestId,
  });
}

function testConference() {
  const provider = document.getElementById('provider').value;
  const apiKey = document.getElementById('apiKey').value;
  const idea = document.getElementById('prompt').value;
  const rounds = Number(document.getElementById('rounds').value || 2);
  const budget = Number(document.getElementById('budget').value || 10);

  if (!apiKey || !idea) {
    showError('Please provide both API key and project idea');
    return;
  }

  setLoading(true);
  vscode.postMessage({
    type: 'testConference',
    provider,
    apiKey,
    idea,
    rounds,
    budget,
    requestId: ++currentRequestId,
  });
}

function clearResults() {
  document.getElementById('results').style.display = 'none';
  document.getElementById('resultsContent').innerHTML = '';
}

function displayLLMResult(message) {
  setLoading(false);
  const result = message.result;
  const html = `
    <div class="result-item">
      <div class="status-${result.success ? 'success' : 'error'}">
        <strong>${result.success ? '✅ Success' : '❌ Error'}</strong>
      </div>
      <div><strong>Provider:</strong> ${escapeHtml(result.provider)}</div>
      <div><strong>Model:</strong> ${escapeHtml(result.model || 'N/A')}</div>
      <div><strong>Latency:</strong> ${result.latency}ms</div>
      ${result.tokenCount ? `<div><strong>Tokens:</strong> ${result.tokenCount}</div>` : ''}
      ${typeof result.estimatedCost === 'number' ? `<div><strong>Estimated Cost:</strong> $${result.estimatedCost.toFixed(4)}</div>` : ''}
      ${result.response ? `<div><strong>Response:</strong><br><pre>${escapeHtml(result.response)}</pre></div>` : ''}
      ${result.error ? `<div><strong>Error:</strong><br><pre>${escapeHtml(result.error)}</pre></div>` : ''}
    </div>
  `;
  showResults(html);
}

function displayBatchResult(message) {
  setLoading(false);
  const result = message.result;
  let html = `
    <div class="result-item">
      <div class="status-success"><strong>✅ Batch Test Complete</strong></div>
      <div><strong>Total:</strong> ${result.total}</div>
      <div><strong>Successful:</strong> ${result.successful}</div>
      <div><strong>Failed:</strong> ${result.failed}</div>
      <div><strong>Average Latency:</strong> ${result.averageLatency.toFixed(2)}ms</div>
      ${typeof result.totalCost === 'number' ? `<div><strong>Total Estimated Cost:</strong> $${result.totalCost.toFixed(4)}</div>` : ''}
    </div>
  `;

  result.results.forEach(item => {
    html += `
      <div class="result-item">
        <div class="status-${item.success ? 'success' : 'error'}">
          <strong>${item.success ? '✅ Prompt Success' : '❌ Prompt Error'}</strong>
        </div>
        ${item.response ? `<div><pre>${escapeHtml(item.response)}</pre></div>` : ''}
        ${item.error ? `<div><pre>${escapeHtml(item.error)}</pre></div>` : ''}
      </div>
    `;
  });

  showResults(html);
}

function displayVectorResult(message) {
  setLoading(false);
  const result = message.result;
  const html = `
    <div class="result-item">
      <div class="status-${result.success ? 'success' : 'error'}">
        <strong>${result.success ? '✅ Vector Success' : '❌ Vector Error'}</strong>
      </div>
      <div><strong>Query:</strong> ${escapeHtml(result.query)}</div>
      <div><strong>Latency:</strong> ${result.latency}ms</div>
      <div><strong>Results:</strong> ${result.results.length} items</div>
      ${result.results.length ? `
        <ul>
          ${result.results
            .map(item => `<li>${escapeHtml(item.id)} (${item.similarity.toFixed(3)})</li>`)
            .join('')}
        </ul>` : ''}
    </div>
  `;
  showResults(html);
}

function displayWorkflowResult(message) {
  setLoading(false);
  const results = message.results;
  let html = `
    <div class="result-item">
      <div class="status-success"><strong>✅ Workflow Simulation Complete</strong></div>
      <div><strong>Phases Tested:</strong> ${results.length}</div>
    </div>
  `;

  results.forEach((result, index) => {
    html += `
      <div class="result-item">
        <div class="status-${result.success ? 'success' : 'error'}">
          <strong>Phase ${index + 1}: ${result.success ? '✅ Success' : '❌ Error'}</strong>
        </div>
        <div><strong>Latency:</strong> ${result.latency}ms</div>
        ${result.response ? `<div><pre>${escapeHtml(result.response)}</pre></div>` : ''}
        ${result.error ? `<div><pre>${escapeHtml(result.error)}</pre></div>` : ''}
      </div>
    `;
  });

  showResults(html);
}

function displayConferenceResult(message) {
  setLoading(false);
  const result = message.result;
  let html = `
    <div class="result-item">
      <div class="status-${result.success ? 'success' : 'error'}">
        <strong>${result.success ? '✅ Conference Complete' : '❌ Conference Failed'}</strong>
      </div>
      <div><strong>Rounds:</strong> ${result.discussionRounds}</div>
      <div><strong>Total Tokens:</strong> ${result.totalTokens}</div>
      <div><strong>Total Cost:</strong> $${result.totalCost.toFixed(4)}</div>
      <div><strong>Duration:</strong> ${(result.conferenceTime / 1000).toFixed(1)}s</div>
      <div><strong>Final Decision:</strong><br><pre>${escapeHtml(result.finalDecision)}</pre></div>
    </div>
  `;

  if (Array.isArray(result.voteResults) && result.voteResults.length) {
    html += `
      <div class="result-item">
        <strong>Vote Summary</strong>
        <ul>
          ${result.voteResults
            .map(vote => `<li>${escapeHtml(vote.option)} — ${vote.votes} votes</li>`)
            .join('')}
        </ul>
      </div>
    `;
  }

  if (Array.isArray(result.participantResponses) && result.participantResponses.length) {
    html += `
      <div class="result-item">
        <strong>Participant Responses</strong>
        ${result.participantResponses
          .map(participant => `
            <div>
              <strong>LLM ${participant.llm} (${escapeHtml(participant.role)}):</strong>
              <div>Tokens: ${participant.tokens} | Cost: $${participant.cost.toFixed(4)}</div>
              <div><pre>${escapeHtml(participant.response)}</pre></div>
            </div>
          `)
          .join('')}
      </div>
    `;
  }

  showResults(html);
}

function displayKeyValidation(data) {
  const status = data.isValid ? '✅ Valid' : '❌ Invalid';
  const color = data.isValid ? 'status-success' : 'status-error';
  const detail = data.error ? ` — ${escapeHtml(data.error)}` : '';
  showMessage(`${status} API key for ${data.provider}${detail}`, color);
}

function displayError(data) {
  setLoading(false);
  showError(`Error in ${data.type}: ${data.message}`);
}

function setLoading(loading) {
  document.querySelectorAll(buttonsSelector).forEach(button => {
    if (loading) {
      button.classList.add('loading');
      button.disabled = true;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
    }
  });
}

function showResults(html) {
  const resultsDiv = document.getElementById('results');
  const contentDiv = document.getElementById('resultsContent');
  contentDiv.innerHTML = html;
  resultsDiv.style.display = 'block';
}

function showMessage(message, className = 'status-success') {
  const resultsDiv = document.getElementById('results');
  const contentDiv = document.getElementById('resultsContent');
  contentDiv.innerHTML = `<div class="result-item ${className}">${message}</div>`;
  resultsDiv.style.display = 'block';
}

function showError(message) {
  showMessage(message, 'status-error');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

