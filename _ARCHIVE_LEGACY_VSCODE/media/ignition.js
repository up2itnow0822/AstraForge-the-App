/* global acquireVsCodeApi, document, window */
(function () {
  'use strict';

  const vscode = acquireVsCodeApi();
  let initialized = false;
  const maxEntries = 8;

  const elements = {
    idea: () => document.getElementById('ideaInput'),
    option: () => document.getElementById('promptOption'),
    customBox: () => document.getElementById('customBox'),
    customText: () => document.getElementById('customText'),
    progress: () => document.getElementById('progressTracker')
  };

  function ensureInitialized() {
    if (initialized) {
      return;
    }

    const option = elements.option();
    if (option) {
      option.addEventListener('change', () => updateCustomBox(option.value));
      updateCustomBox(option.value);
    }

    window.addEventListener('message', handleMessage);
    initialized = true;
  }

  function updateCustomBox(selection) {
    const customBox = elements.customBox();
    if (!customBox) {
      return;
    }

    customBox.style.display = selection === 'custom' ? 'block' : 'none';
  }

  function submitIdea() {
    const ideaValue = elements.idea()?.value.trim() ?? '';
    const optionValue = elements.option()?.value ?? 'direct';
    const customValue = elements.customText()?.value.trim() ?? '';

    if (!ideaValue) {
      displayEntry('❗ Please provide an idea before submitting.', 'error');
      return;
    }

    vscode.postMessage({
      type: 'submitIdea',
      idea: ideaValue,
      option: optionValue,
      customText: optionValue === 'custom' ? customValue : undefined
    });

    displayEntry('🚀 Idea submitted to AstraForge. Waiting for workflow status…', 'info');
  }

  function handleMessage(event) {
    const { type, message } = event.data ?? {};
    if (!type) {
      return;
    }

    switch (type) {
      case 'progress':
        displayEntry(`✅ ${message ?? 'Workflow step completed.'}`, 'progress');
        break;
      case 'error':
        displayEntry(`❌ ${message ?? 'An unexpected error occurred.'}`, 'error');
        break;
      case 'complete':
        displayEntry(`🎉 ${message ?? 'Project Ignition workflow completed.'}`, 'complete');
        break;
      default:
        displayEntry(`ℹ️ ${message ?? 'Received update from AstraForge.'}`, 'info');
    }
  }

  function displayEntry(text, level) {
    const tracker = elements.progress();
    if (!tracker) {
      return;
    }

    const entry = document.createElement('div');
    entry.className = `progress-entry progress-${level}`;
    entry.textContent = text;
    tracker.appendChild(entry);

    while (tracker.childElementCount > maxEntries) {
      const first = tracker.firstElementChild;
      if (!first) {
        break;
      }
      tracker.removeChild(first);
    }

    tracker.scrollTop = tracker.scrollHeight;
  }

  window.submitIdea = submitIdea;

  document.addEventListener('DOMContentLoaded', ensureInitialized);
})();
