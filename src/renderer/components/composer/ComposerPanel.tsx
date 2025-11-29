import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FileDiffView from './FileDiffView';
import { bridge, FileChange, DebateResult } from '../../api/bridge';
import { CheckCircle2, XCircle, Clock, Loader2, FileCode, AlertTriangle, Sparkles } from 'lucide-react';

interface FileChangeItem extends FileChange {
    status: 'pending' | 'writing' | 'success' | 'error';
    errorMessage?: string;
}

interface ComposerPanelProps {
    debateLogs: string[];
}

const ComposerPanel: React.FC<ComposerPanelProps> = ({ debateLogs }) => {
    const [changes, setChanges] = useState<FileChangeItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileChangeItem | null>(null);
    const [proposal, setProposal] = useState<string>('');
    const [isWaiting, setIsWaiting] = useState(true);
    const [applyStatus, setApplyStatus] = useState<'idle' | 'applying' | 'done' | 'error'>('idle');
    const [activeTab, setActiveTab] = useState<'discussion' | 'code'>('code');

    useEffect(() => {
        // Listen for file changes from the debate
        console.log('[ComposerPanel] Setting up file_changes listener');
        
        const handleFileChanges = (data: DebateResult) => {
            console.log('[ComposerPanel] Received file_changes:', data);
            console.log('[ComposerPanel] data.success:', data.success);
            console.log('[ComposerPanel] data.fileChanges:', data.fileChanges);
            console.log('[ComposerPanel] data.fileChanges.length:', data.fileChanges?.length);
            
            if (data.success && data.fileChanges && data.fileChanges.length > 0) {
                console.log('[ComposerPanel] Processing', data.fileChanges.length, 'file changes');
                const items: FileChangeItem[] = data.fileChanges.map(fc => {
                    console.log('[ComposerPanel] Processing file:', fc.path, fc.action);
                    return {
                        ...fc,
                        status: 'pending' as const
                    };
                });
                console.log('[ComposerPanel] Setting changes:', items);
                setChanges(items);
                setSelectedFile(items[0]);
                setProposal(data.proposal || '');
                setIsWaiting(false);
            } else if (!data.success) {
                console.log('[ComposerPanel] Debate failed, showing error state');
                setIsWaiting(false);
                // Show error state
                setChanges([{
                    path: 'error',
        action: 'create',
                    content: 'Debate failed to reach consensus or generate code.',
                    status: 'error',
                    errorMessage: 'No consensus reached after maximum rounds'
                }]);
            } else {
                console.log('[ComposerPanel] No file changes to process');
            }
        };
        
        // Use the returned unsubscribe function for proper cleanup
        const unsubscribe = bridge.onFileChanges(handleFileChanges);

        return () => {
            console.log('[ComposerPanel] Removing file_changes listener');
            if (unsubscribe) {
                unsubscribe();
            } else {
                bridge.removeFileChangesListener(handleFileChanges);
            }
        };
    }, []);

    const handleApplyChanges = async () => {
        setApplyStatus('applying');
        
        // Mark all as writing
        setChanges(prev => prev.map(c => ({ ...c, status: 'writing' as const })));
        
        try {
            // Actually apply changes to disk via server
            const result = await bridge.applyFileChanges(
                changes.map(c => ({
                    path: c.path,
                    action: c.action,
                    content: c.content,
                    originalContent: c.originalContent
                }))
            );
            
            // Update status based on results
            setChanges(prev => prev.map(c => {
                const fileResult = result.results.find(r => r.path === c.path);
                if (fileResult) {
                    return {
                        ...c,
                        status: fileResult.success ? 'success' as const : 'error' as const,
                        errorMessage: fileResult.error
                    };
                }
                return { ...c, status: 'success' as const };
            }));
            
            setApplyStatus(result.success ? 'done' : 'error');
        } catch (err: any) {
            // Mark all as error
            setChanges(prev => prev.map(c => ({ 
                ...c, 
                status: 'error' as const, 
                errorMessage: err.message 
            })));
            setApplyStatus('error');
        }
    };

    const handleDiscard = () => {
        setChanges([]);
        setSelectedFile(null);
        setProposal('');
        setIsWaiting(true);
        setApplyStatus('idle');
    };

    const getStatusIcon = (status: FileChangeItem['status']) => {
        switch (status) {
            case 'success': return <CheckCircle2 size={12} className="text-green-400" />;
            case 'error': return <XCircle size={12} className="text-red-400" />;
            case 'writing': return <Loader2 size={12} className="text-yellow-400 animate-spin" />;
            default: return <Clock size={12} className="text-gray-500" />;
        }
    };

    const getActionBadgeColor = (action: FileChange['action']) => {
        switch (action) {
            case 'create': return 'bg-green-900/50 text-green-300 border-green-700';
            case 'update': return 'bg-blue-900/50 text-blue-300 border-blue-700';
            case 'delete': return 'bg-red-900/50 text-red-300 border-red-700';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-gray-300 font-sans">
            {/* Header / Stats */}
            <div className="h-12 border-b border-[#3e3e42] flex items-center px-4 justify-between bg-[#252526] relative">
                <div className="flex items-center gap-3">
                    <Sparkles size={16} className="text-purple-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-astra-blue">
                        Consensus Composer
                </h2>
                </div>
                <div className="flex gap-6 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">Pending:</span>
                        <span className="text-white font-bold">{changes.filter(c => c.status === 'pending').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">Completed:</span>
                        <span className="text-green-400 font-bold">{changes.filter(c => c.status === 'success').length}</span>
                    </div>
                </div>

                {/* Tab Toggle */}
                <div className="absolute top-4 right-4 flex bg-[#1e1e1e] rounded p-1 border border-[#3e3e42]">
                    <button
                        onClick={() => setActiveTab('discussion')}
                        className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'discussion' ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Discussion
                    </button>
                    <button
                        onClick={() => setActiveTab('code')}
                        className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'code' ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Code
                    </button>
                </div>
            </div>

            {/* Waiting State */}
            {isWaiting && changes.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-500">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                        <Sparkles size={48} className="text-purple-400/50" />
                    </motion.div>
                    <p className="text-sm">Waiting for consensus...</p>
                    <p className="text-xs text-gray-600">Submit a task to begin the AI debate process</p>
                </div>
            )}

            {/* Main Content */}
            {activeTab === 'code' && changes.length > 0 && (
            <div className="flex flex-1 overflow-hidden">
                {/* File List Sidebar */}
                    <div className="w-72 border-r border-[#3e3e42] flex flex-col bg-[#252526]">
                        {/* Proposal Summary */}
                        {proposal && (
                            <div className="p-3 border-b border-[#3e3e42] bg-purple-900/10">
                                <div className="text-[10px] font-bold text-purple-400 uppercase mb-1">Approved Proposal</div>
                                <p className="text-xs text-gray-400 line-clamp-3">{proposal.substring(0, 200)}...</p>
                            </div>
                        )}
                        
                        <div className="p-2 text-xs font-bold text-gray-500 uppercase border-b border-[#3e3e42]">
                            Change Set ({changes.length} files)
                        </div>
                        
                    <div className="flex-1 overflow-y-auto">
                            <AnimatePresence>
                                {changes.map((file, idx) => (
                            <motion.div
                                key={file.path}
                                        initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                onClick={() => setSelectedFile(file)}
                                        className={`p-3 cursor-pointer border-l-2 hover:bg-white/5 transition-all ${
                                            selectedFile?.path === file.path 
                                                ? 'border-astra-blue bg-white/5' 
                                                : 'border-transparent'
                                }`}
                            >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileCode size={14} className="text-gray-500 shrink-0" />
                                                <span className="text-xs font-mono text-gray-300 truncate" title={file.path}>
                                        {file.path.split('/').pop()}
                                    </span>
                                            </div>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold ${getActionBadgeColor(file.action)}`}>
                                        {file.action}
                                    </span>
                                </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-gray-600 truncate" title={file.path}>
                                                {file.path.split('/').slice(0, -1).join('/')}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                {getStatusIcon(file.status)}
                                                <span className={`text-[10px] capitalize ${
                                                    file.status === 'error' ? 'text-red-400' : 
                                                    file.status === 'success' ? 'text-green-400' : 
                                                    'text-gray-500'
                                                }`}>
                                                    {file.status}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {file.status === 'error' && file.errorMessage && (
                                            <div className="mt-2 text-[10px] text-red-300 bg-red-900/30 p-1.5 rounded flex items-start gap-1.5">
                                                <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                                                {file.errorMessage}
                                </div>
                                        )}
                            </motion.div>
                        ))}
                            </AnimatePresence>
                    </div>
                </div>

                {/* Diff View Area */}
                    <div className="flex-1 bg-[#1e1e1e] flex flex-col">
                    {selectedFile ? (
                        <FileDiffView
                                original={selectedFile.originalContent || ''}
                                modified={selectedFile.content}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-600">
                            Select a file to view changes
                        </div>
                    )}
                </div>
            </div>
            )}

            {/* Discussion View */}
            {activeTab === 'discussion' && (
                <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
                    <div className="h-full overflow-y-auto p-4">
                        <div className="space-y-4">
                            {/* Waiting State */}
                            {isWaiting && (
                                <div className="flex flex-col items-center justify-center gap-4 py-12">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <Sparkles size={48} className="text-purple-400/50" />
                                    </motion.div>
                                    <p className="text-sm text-gray-400">Waiting for agents to begin discussion...</p>
                                </div>
                            )}

                            {/* Discussion Content */}
                            {!isWaiting && (
                                <div className="space-y-6">
                                    {proposal && (
                                        <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
                                            <div className="text-sm font-bold text-purple-400 mb-2">Approved Proposal</div>
                                            <div className="text-gray-300 text-sm whitespace-pre-wrap">{proposal}</div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase">Agent Discussion</h3>
                                        <div className="bg-[#1e1e1e] border border-[#3e3e42] rounded max-h-96 overflow-y-auto">
                                            {debateLogs.length > 0 ? (
                                                debateLogs.map((log, i) => (
                                                    <div key={i} className="p-2 border-b border-[#2d2d2d] last:border-b-0 text-xs">
                                                        <span className="text-green-500 mr-2">➜</span>
                                                        <span className="text-gray-300 font-mono">{log}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-gray-500 text-xs">
                                                    No discussion logs yet. Start a task to begin agent debate.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Footer */}
            {activeTab === 'code' && changes.length > 0 && (
                <div className="h-14 border-t border-[#3e3e42] bg-[#252526] p-2 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                        {applyStatus === 'done' && (
                            <span className="text-green-400 flex items-center gap-1.5">
                                <CheckCircle2 size={14} /> All changes applied successfully
                            </span>
                        )}
                        {applyStatus === 'applying' && (
                            <span className="text-yellow-400 flex items-center gap-1.5">
                                <Loader2 size={14} className="animate-spin" /> Applying changes...
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleDiscard}
                            disabled={applyStatus === 'applying'}
                            className="px-4 py-2 rounded text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
                        >
                    Discard All
                </button>
                        <button 
                            onClick={handleApplyChanges}
                            disabled={applyStatus === 'applying' || applyStatus === 'done' || changes.every(c => c.status === 'success')}
                            className="px-6 py-2 rounded text-sm font-bold bg-astra-blue hover:bg-blue-600 text-white shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {applyStatus === 'applying' ? 'Applying...' : 'Apply Changes to Disk'}
                </button>
            </div>
                </div>
            )}
        </div>
    );
};

export default ComposerPanel;
