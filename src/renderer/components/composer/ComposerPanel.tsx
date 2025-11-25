
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FileDiffView from './FileDiffView';

interface FileChangeItem {
    path: string;
    status: 'pending' | 'writing' | 'success' | 'error';
    action: 'create' | 'update' | 'delete';
    originalContent: string;
    newContent: string;
}

// Mock Data for UI visualization
const MOCK_CHANGES: FileChangeItem[] = [
    {
        path: 'src/core/NewFeature.ts',
        status: 'pending',
        action: 'create',
        originalContent: '',
        newContent: 'export const newFeature = () => { console.log("New Feature"); }'
    },
    {
        path: 'src/utils/Helper.ts',
        status: 'success',
        action: 'update',
        originalContent: 'export const help = () => false;',
        newContent: 'export const help = () => true;'
    }
];

const ComposerPanel: React.FC = () => {
    const [changes, setChanges] = useState<FileChangeItem[]>(MOCK_CHANGES);
    const [selectedFile, setSelectedFile] = useState<FileChangeItem | null>(MOCK_CHANGES[0]);

    return (
        <div className="flex flex-col h-full bg-gray-900 text-gray-300 font-sans">
            {/* Header / Stats */}
            <div className="h-12 border-b border-gray-700 flex items-center px-4 justify-between bg-black/20">
                <h2 className="text-sm font-bold uppercase tracking-wider text-astra-blue">
                    <span className="mr-2 text-purple-400">⚡</span> Consensus Composer
                </h2>
                <div className="flex gap-4">
                    <div className="text-xs text-gray-500">
                        Pending: <span className="text-white">{changes.filter(c => c.status === 'pending').length}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                        Completed: <span className="text-green-400">{changes.filter(c => c.status === 'success').length}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* File List Sidebar */}
                <div className="w-64 border-r border-gray-700 flex flex-col bg-gray-900/50">
                    <div className="p-2 text-xs font-bold text-gray-500 uppercase">Change Set</div>
                    <div className="flex-1 overflow-y-auto">
                        {changes.map((file) => (
                            <motion.div
                                key={file.path}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                onClick={() => setSelectedFile(file)}
                                className={`p-3 cursor-pointer border-l-2 hover:bg-white/5 transition-colors ${
                                    selectedFile?.path === file.path ? 'border-astra-blue bg-white/5' : 'border-transparent'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-mono text-gray-400 truncate max-w-[150px]" title={file.path}>
                                        {file.path.split('/').pop()}
                                    </span>
                                    <span className={`text-[10px] px-1.5 rounded uppercase ${
                                        file.action === 'create' ? 'bg-green-900 text-green-300' :
                                        file.action === 'delete' ? 'bg-red-900 text-red-300' :
                                        'bg-blue-900 text-blue-300'
                                    }`}>
                                        {file.action}
                                    </span>
                                </div>
                                <div className="flex items-center text-[10px] space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                        file.status === 'success' ? 'bg-green-500' :
                                        file.status === 'writing' ? 'bg-yellow-400 animate-pulse' :
                                        file.status === 'error' ? 'bg-red-500' :
                                        'bg-gray-600'
                                    }`} />
                                    <span className="capitalize text-gray-500">{file.status}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Diff View Area */}
                <div className="flex-1 bg-gray-900 flex flex-col">
                    {selectedFile ? (
                        <FileDiffView
                            original={selectedFile.originalContent}
                            modified={selectedFile.newContent}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-600">
                            Select a file to view changes
                        </div>
                    )}
                </div>
            </div>

            {/* Action Footer */}
            <div className="h-14 border-t border-gray-700 bg-gray-800 p-2 flex items-center justify-end gap-3">
                <button className="px-4 py-2 rounded text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10">
                    Discard All
                </button>
                <button className="px-6 py-2 rounded text-sm font-bold bg-astra-blue hover:bg-blue-600 text-white shadow-lg shadow-blue-900/20">
                    Apply Changes to Disk
                </button>
            </div>
        </div>
    );
};

export default ComposerPanel;
