import React from 'react';
import Editor from '@monaco-editor/react';

const EditorComponent: React.FC = () => {
  return (
    <Editor
      height="100%"
      defaultLanguage="typescript"
      defaultValue="// Agents will write code here...\nfunction helloAstra() {\n  console.log('Ready.');\n}"
      theme="vs-dark"
      options={{ minimap: { enabled: false }, fontSize: 14 }}
    />
  );
};
export default EditorComponent;
