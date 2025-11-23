declare global {
  interface Window {
    electronAPI: {
      saveFile: (content: string) => Promise<string>;
      openFile: () => Promise<string>;
    };
  }
}

import React, { useState } from 'react';
import { MonacoEditorComponent } from './components/MonacoEditorComponent';
import { AgentPanel } from './components/AgentPanel';
import { DecisionPanel } from './components/DecisionPanel';
import { ThemeEngine } from './themes/ThemeEngine';
import './styles/App.css';

/**
 * Main AstraForge Studio V3 Application Component
 */
export const AstraForgeApp: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<string>('untitled.ts');
  const [theme, setTheme] = useState<string>('dark');
  const [code, setCode] = useState<string>('// Welcome to AstraForge Studio V3\nconsole.log("Hello, World!");');

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleSave = () => {
    window.electronAPI?.saveFile(currentFile, code);
  };

  const handleAgentExecute = (agentType: string, prompt: string) => {
    window.electronAPI?.executeAgent({ agentType, prompt });
  };

  return (
    <div className={`app-container theme-${theme}`}>
      <header className="app-header">
        <h1>AstraForge Studio V3</h1>
        <div className="header-controls">
          <ThemeEngine currentTheme={theme} onThemeChange={setTheme} />
          <button onClick={handleSave} className="save-button">
            Save
          </button>
        </div>
      </header>

      <div className="main-layout">
        {/* Left Panel: File Explorer & Tools */}
        <aside className="left-panel">
          <AgentPanel onAgentExecute={handleAgentExecute} />
        </aside>

        {/* Center: Monaco Editor */}
        <main className="editor-container">
          <MonacoEditorComponent
            value={code}
            language="typescript"
            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
            onChange={handleCodeChange}
            fileName={currentFile}
          />
        </main>

        {/* Right Panel: Decision Panel & Output */}
        <aside className="right-panel">
          <DecisionPanel />
        </aside>
      </div>
    </div>
  );
};
