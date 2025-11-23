declare global {
  interface Window {
    electronAPI: {
      saveFile: (content: string) => Promise<string>;
      openFile: () => Promise<string>;
    };
  }
}

import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface MonacoEditorProps {
  value: string;
  language: string;
  theme: string;
  onChange: (value: string | undefined) => void;
  fileName: string;
}

/**
 * Monaco Editor Component for AstraForge Studio V3
 * Integrated with full editor capabilities and AI assistance
 */
export const MonacoEditorComponent: React.FC<MonacoEditorProps> = ({
  value,
  language,
  theme,
  onChange,
  fileName
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: true },
      wordWrap: 'on',
      automaticLayout: true,
      scrollBeyondLastLine: false,
      tabSize: 2,
      insertSpaces: true,
      formatOnType: true,
      formatOnPaste: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      parameterHints: { enabled: true },
      hover: { enabled: true },
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'always',
      unfoldOnClickAfterEndOfLine: true,
      find: {
        addExtraSpaceOnTop: false,
        autoFindInSelection: 'never',
        seedSearchStringFromSelection: 'always'
      }
    });

    // Register completion provider for AI-assisted coding
    monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: (model, position) => {
        // This would integrate with agent suggestions
        const suggestions: monaco.languages.CompletionItem[] = [
          {
            label: 'astraforge',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'astraforge.',
            detail: 'AstraForge API',
            documentation: 'Access AstraForge AI functionalities'
          }
        ];

        return { suggestions };
      }
    });

    // Add custom actions
    editor.addAction({
      id: 'astraforge-execute-agent',
      label: 'Execute AstraForge Agent',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI],
      contextMenuGroupId: 'astraforge',
      run: () => {
        const selection = editor.getSelection();
        if (selection) {
          const selectedText = editor.getModel()?.getValueInRange(selection);
          window.electronAPI?.executeAgent({
            agentType: 'backend',
            prompt: selectedText || '',
            context: { fileName, selection }
          });
        }
      }
    });
  };

  useEffect(() => {
    // Listen for agent-generated code suggestions
    window.addEventListener('agent-suggestion', (event: any) => {
      if (editorRef.current && event.detail?.code) {
        const editor = editorRef.current;
        const position = editor.getPosition();
        if (position) {
          const editOperation = {
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            text: event.detail.code
          };
          editor.executeEdits('agent-suggestion', [editOperation]);
        }
      }
    });

    return () => {
      window.removeEventListener('agent-suggestion', () => {});
    };
  }, []);

  return (
    <div className="monaco-editor-container" style={{ height: '100%', width: '100%' }}>
      <Editor
        height="100%"
        language={language}
        theme={theme}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        path={fileName}
        options={{
          readOnly: false,
          renderWhitespace: 'selection',
          rulers: [80, 120]
        }}
      />
    </div>
  );
};
