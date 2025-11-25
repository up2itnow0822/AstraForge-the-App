
import React from 'react';
import { DiffEditor } from '@monaco-editor/react';

interface FileDiffViewProps {
    original: string;
    modified: string;
    language?: string;
}

const FileDiffView: React.FC<FileDiffViewProps> = ({ original, modified, language = 'typescript' }) => {
    return (
        <div className="h-full w-full border border-gray-700 rounded overflow-hidden">
            <DiffEditor
                height="100%"
                language={language}
                original={original}
                modified={modified}
                theme="vs-dark"
                options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    renderSideBySide: true,
                }}
            />
        </div>
    );
};

export default FileDiffView;
