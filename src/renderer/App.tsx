import React, { useState, useEffect, useRef, useCallback } from 'react';
import ActivityBar from './components/ActivityBar';
import PrimarySideBar from './components/PrimarySideBar';
import BottomPanel from './components/BottomPanel';
import AgentPanel, { AgentState } from './components/AgentPanel';
import EditorComponent from './components/Editor';
import SettingsModal from './components/Settings/SettingsModal';
import ComposerPanel from './components/composer/ComposerPanel';
import { bridge, ConnectionStatus, UserApprovalRequest } from './api/bridge';
import { Maximize2, Minimize2, LayoutPanelLeft, GripVertical, Wifi, WifiOff, Loader2, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

// Initial Roster for UI
const INITIAL_ROSTER: AgentState[] = [
    { id: 'agent-1', name: 'Nexus', role: 'Orchestrator', status: 'idle' },
    { id: 'agent-2', name: 'Vanguard', role: 'Security', status: 'idle' },
    { id: 'agent-3', name: 'Prism', role: 'Product', status: 'idle' },
    { id: 'agent-4', name: 'Helix', role: 'AI Systems', status: 'idle' },
    { id: 'agent-5', name: 'Cipher', role: 'Impl. Architect', status: 'idle' }
];

type ViewMode = 'editor' | 'composer';

const App: React.FC = () => {
    const [objective, setObjective] = useState('');
    const [logs, setLogs] = useState<string[]>(['System initialized. Ready.']);
    const [debateLogs, setDebateLogs] = useState<string[]>([]);
    const [agents, setAgents] = useState<AgentState[]>(INITIAL_ROSTER);
    
    // Layout State
    const [activeActivity, setActiveActivity] = useState('explorer');
    const [isPrimarySidebarOpen, setIsPrimarySidebarOpen] = useState(true);
    const [primarySidebarWidth, setPrimarySidebarWidth] = useState(250);
    
    const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
    const [bottomPanelHeight, setBottomPanelHeight] = useState(300); // Increased from 200 for better readability

    const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(true);
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('editor');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

    // User Approval Dialog
    const [approvalRequest, setApprovalRequest] = useState<UserApprovalRequest | null>(null);
    const [approvalFeedback, setApprovalFeedback] = useState('');

    // New Task Box state - larger defaults for better usability
    const [taskBoxPos, setTaskBoxPos] = useState({ x: 0, y: 16 });
    const [taskBoxSize, setTaskBoxSize] = useState({ width: 800, height: 180 }); // Increased from 600x120
    const [isDraggingTaskBox, setIsDraggingTaskBox] = useState(false);
    const [isResizingTaskBox, setIsResizingTaskBox] = useState(false);
    const taskBoxRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
    const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

    // Task box drag handlers
    const handleTaskBoxDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingTaskBox(true);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            posX: taskBoxPos.x,
            posY: taskBoxPos.y
        };
    }, [taskBoxPos]);

    const handleTaskBoxDrag = useCallback((e: MouseEvent) => {
        if (!isDraggingTaskBox) return;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setTaskBoxPos({
            x: dragStartRef.current.posX + dx,
            y: Math.max(0, dragStartRef.current.posY + dy)
        });
    }, [isDraggingTaskBox]);

    const handleTaskBoxDragEnd = useCallback(() => {
        setIsDraggingTaskBox(false);
    }, []);

    // Task box resize handlers
    const handleTaskBoxResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizingTaskBox(true);
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            width: taskBoxSize.width,
            height: taskBoxSize.height
        };
    }, [taskBoxSize]);

    const handleTaskBoxResize = useCallback((e: MouseEvent) => {
        if (!isResizingTaskBox) return;
        const dx = e.clientX - resizeStartRef.current.x;
        const dy = e.clientY - resizeStartRef.current.y;
        setTaskBoxSize({
            width: Math.max(300, resizeStartRef.current.width + dx),
            height: Math.max(100, resizeStartRef.current.height + dy)
        });
    }, [isResizingTaskBox]);

    const handleTaskBoxResizeEnd = useCallback(() => {
        setIsResizingTaskBox(false);
    }, []);

    // Global mouse event listeners for task box
    useEffect(() => {
        if (isDraggingTaskBox) {
            document.addEventListener('mousemove', handleTaskBoxDrag);
            document.addEventListener('mouseup', handleTaskBoxDragEnd);
        }
        return () => {
            document.removeEventListener('mousemove', handleTaskBoxDrag);
            document.removeEventListener('mouseup', handleTaskBoxDragEnd);
        };
    }, [isDraggingTaskBox, handleTaskBoxDrag, handleTaskBoxDragEnd]);

    useEffect(() => {
        if (isResizingTaskBox) {
            document.addEventListener('mousemove', handleTaskBoxResize);
            document.addEventListener('mouseup', handleTaskBoxResizeEnd);
        }
        return () => {
            document.removeEventListener('mousemove', handleTaskBoxResize);
            document.removeEventListener('mouseup', handleTaskBoxResizeEnd);
        };
    }, [isResizingTaskBox, handleTaskBoxResize, handleTaskBoxResizeEnd]);

    // Expand/collapse handler
    const handleExpandToggle = useCallback(() => {
        if (!isExpanded) {
            // Expanding - make it much larger for detailed prompts
            setTaskBoxSize({ width: Math.max(taskBoxSize.width, 900), height: 500 });
        } else {
            // Collapsing - back to comfortable default
            setTaskBoxSize({ width: 800, height: 180 });
        }
        setIsExpanded(!isExpanded);
    }, [isExpanded, taskBoxSize.width]);

    // Connection status monitoring
    useEffect(() => {
        bridge.onConnectionStatusChange((status) => {
            setConnectionStatus(status);
            if (status === 'connected') {
                setLogs(prev => [...prev, '[System] Connected to AstraForge server']);
            } else if (status === 'disconnected') {
                setLogs(prev => [...prev, '[System] Disconnected from server - attempting reconnect...']);
            } else if (status === 'error') {
                setLogs(prev => [...prev, '[System] Connection error - check if server is running']);
            }
        });
    }, []);

    useEffect(() => {
        bridge.onAgentUpdate((data: any) => {
            if (data.type === 'log') {
                // Route agent discussion logs to debateLogs, system logs to terminal logs
                const isAgentDiscussion = data.message.includes('proposes:') ||
                                         data.message.includes('voted') ||
                                         data.message.includes('Round') ||
                                         data.message.includes('consensus') ||
                                         data.message.includes('critique') ||
                                         data.message.includes('synthesis') ||
                                         data.message.includes('DEBATE STARTED') ||
                                         data.message.includes('DEBATE FAILED');

                if (isAgentDiscussion) {
                    setDebateLogs(prev => {
                        const newLogs = [...prev, data.message];
                        if (newLogs.length > 1000) return newLogs.slice(-1000);
                        return newLogs;
                    });
                } else {
                setLogs(prev => {
                    const newLogs = [...prev, data.message];
                    if (newLogs.length > 1000) return newLogs.slice(-1000);
                    return newLogs;
                });
                }
            }
            if (data.type === 'status') {
                setAgents(prev => prev.map(agent =>
                    agent.id === data.agentId ? { ...agent, status: data.status } : agent
                ));
            }
            if (data.type === 'phase') {
                if (data.phase === 'voting_concluded') {
                    setAgents(prev => prev.map(a => ({ ...a, status: 'idle' })));
                    setIsLoading(false);
                }
            }
            if (data.type === 'user_approval_required') {
                setApprovalRequest(data as UserApprovalRequest);
                setIsLoading(false);
            }
        });
        return () => bridge.removeAgentUpdateListener();
    }, []);

    const handleDebate = async () => {
        if (!objective.trim()) return;
        setIsLoading(true);
        setDebateLogs([]); // Clear previous debate logs
        setLogs(prev => [...prev, `>>> User Initiated Task: ${objective.substring(0, 50)}...`]);
        try {
            await bridge.startDebate(objective);
            if (isExpanded) setIsExpanded(false);
            setViewMode('composer');
        } catch (e) {
            setLogs(prev => [...prev, 'Error: Failed to start debate IPC']);
            setIsLoading(false);
        }
    };

    const handleApproveProposal = () => {
        bridge.approveProposal();
        setApprovalRequest(null);
        setApprovalFeedback('');
        setIsLoading(true);
    };

    const handleRequestChanges = () => {
        if (approvalFeedback.trim()) {
            bridge.requestRefinement(approvalFeedback);
            setApprovalRequest(null);
            setApprovalFeedback('');
            setIsLoading(true);
        }
    };

    const handleCancelDebate = () => {
        setApprovalRequest(null);
        setApprovalFeedback('');
        setIsLoading(false);
    };

    const toggleActivity = (view: string) => {
        if (activeActivity === view) {
            setIsPrimarySidebarOpen(!isPrimarySidebarOpen);
        } else {
            setActiveActivity(view);
            setIsPrimarySidebarOpen(true);
        }
    };

    return (
        <div className="flex h-screen bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden">
            {/* Far Left: Activity Bar */}
            <ActivityBar 
                activeView={isPrimarySidebarOpen ? activeActivity : ''} 
                onViewChange={toggleActivity}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />

            {/* Primary Sidebar (Explorer, etc) */}
            <PrimarySideBar 
                isVisible={isPrimarySidebarOpen} 
                width={primarySidebarWidth} 
                setWidth={setPrimarySidebarWidth}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                
                {/* Top Bar / Tabs Area */}
                <div className="h-9 bg-[#2d2d2d] flex items-center px-4 border-b border-[#1e1e1e] justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-white">AstraForge Standalone</span>
                        {/* Connection Status Indicator */}
                        <div className="flex items-center gap-1.5">
                            {connectionStatus === 'connected' && (
                                <>
                                    <Wifi size={12} className="text-green-400" />
                                    <span className="text-[10px] text-green-400 font-medium">Connected</span>
                                </>
                            )}
                            {connectionStatus === 'connecting' && (
                                <>
                                    <Loader2 size={12} className="text-yellow-400 animate-spin" />
                                    <span className="text-[10px] text-yellow-400 font-medium">Connecting...</span>
                                </>
                            )}
                            {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
                                <>
                                    <WifiOff size={12} className="text-red-400" />
                                    <span className="text-[10px] text-red-400 font-medium">Disconnected</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <button 
                             onClick={() => setIsAgentPanelOpen(!isAgentPanelOpen)}
                             className={`p-1 rounded hover:bg-[#3e3e42] ${isAgentPanelOpen ? 'text-astra-blue' : 'text-gray-400'}`}
                             title="Toggle AI Agent Panel"
                         >
                             <LayoutPanelLeft size={16} className="rotate-180" />
                         </button>
                    </div>
                </div>

                <div className="flex-1 flex min-h-0 overflow-hidden">
                    <div className="flex-1 flex flex-col min-w-0 min-h-0 relative overflow-hidden">
                        
                        {/* Full-screen overlay while dragging/resizing task box */}
                        {(isDraggingTaskBox || isResizingTaskBox) && (
                            <div 
                                className="fixed inset-0 z-[9998]" 
                                style={{ cursor: isDraggingTaskBox ? 'move' : 'se-resize' }}
                            />
                        )}
                        
                        {/* Prompt / Input Area Overlay - Manual drag and resize */}
                        <div
                            ref={taskBoxRef}
                            className="absolute z-[100] bg-[#252526] rounded-lg border border-[#3e3e42] shadow-2xl flex flex-col"
                            style={{
                                left: `calc(50% + ${taskBoxPos.x}px)`,
                                top: taskBoxPos.y,
                                transform: 'translateX(-50%)',
                                width: taskBoxSize.width,
                                height: isExpanded ? taskBoxSize.height : 'auto',
                                minWidth: 300,
                                minHeight: 100
                            }}
                        >
                            {/* Drag Handle - Header */}
                            <div 
                                className="flex items-center justify-between p-2 border-b border-[#3e3e42] bg-[#2d2d2d] rounded-t-lg cursor-move shrink-0 select-none"
                                onMouseDown={handleTaskBoxDragStart}
                            >
                                <div className="flex items-center gap-2">
                                    <GripVertical size={14} className="text-gray-500" />
                                    <span className="text-xs font-bold text-astra-blue uppercase">New Task</span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleExpandToggle} 
                                        className="p-1 hover:bg-[#3e3e42] rounded text-gray-400"
                                        onMouseDown={e => e.stopPropagation()}
                                    >
                                        {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="p-3 flex flex-col gap-3 flex-1 overflow-hidden">
                                {/* Always use textarea for better text wrapping */}
                                        <textarea
                                    className="w-full flex-1 bg-[#1e1e1e] text-white p-3 rounded border border-[#3e3e42] focus:border-astra-blue focus:outline-none resize-none font-mono text-sm"
                                    placeholder={isExpanded ? "Describe your task in detail..." : "Type a command or prompt... (Shift+Enter for new line)"}
                                            value={objective}
                                            onChange={e => setObjective(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleDebate();
                                        }
                                    }}
                                    style={{ minHeight: isExpanded ? '200px' : '80px' }}
                                />
                                <div className="flex justify-between items-center shrink-0">
                                    <span className="text-xs text-gray-500">Press Enter to submit, Shift+Enter for new line</span>
                                        <button 
                                            onClick={handleDebate}
                                            disabled={isLoading || !objective.trim()}
                                        className="px-6 py-2 bg-astra-blue text-white text-sm font-bold rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                        >
                                            {isLoading ? 'Processing...' : 'Generate'}
                                        </button>
                                    </div>
                                </div>
                            
                            {/* Resize Handle - Bottom Right Corner */}
                            <div 
                                className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center"
                                onMouseDown={handleTaskBoxResizeStart}
                            >
                                <div className="w-3 h-3 border-r-2 border-b-2 border-gray-500/70 rounded-br" />
                            </div>
                        </div>

                        {/* Editor Area - min-h-0 allows it to shrink when terminal expands */}
                        <div className="flex-1 bg-[#1e1e1e] relative min-h-0 overflow-hidden">
                             {/* View Toggle (Editor/Composer) */}
                             <div className="absolute top-4 right-4 z-30 flex bg-[#252526] rounded p-1 border border-[#3e3e42]">
                                <button 
                                    onClick={() => setViewMode('editor')}
                                    className={`px-3 py-1 rounded text-xs font-bold ${viewMode === 'editor' ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Code
                                </button>
                                <button 
                                    onClick={() => setViewMode('composer')}
                                    className={`px-3 py-1 rounded text-xs font-bold ${viewMode === 'composer' ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Composer
                                </button>
                             </div>

                            {viewMode === 'editor' ? <EditorComponent /> : <ComposerPanel debateLogs={debateLogs} />}
                        </div>

                        {/* Bottom Panel (Terminal) */}
                        <BottomPanel 
                            isVisible={isBottomPanelOpen} 
                            height={bottomPanelHeight} 
                            setHeight={setBottomPanelHeight}
                            onClose={() => setIsBottomPanelOpen(false)}
                            logs={logs}
                        />
                    </div>

                    {/* Secondary Sidebar (Agent Panel) */}
                    {isAgentPanelOpen && (
                        <div className="h-full shrink-0">
                             <AgentPanel agents={agents} />
                        </div>
                    )}
                </div>
            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* User Approval Dialog */}
            {approvalRequest && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[#1e1e1e] border border-[#3e3e42] rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[#3e3e42]">
                            <div className="flex items-center gap-3">
                                <MessageSquare size={20} className="text-purple-400" />
                                <h2 className="text-lg font-bold text-white">Agent Proposal Ready</h2>
                            </div>
                            <span className="text-xs text-gray-400">{approvalRequest.debateSummary}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden flex">
                            {/* Proposals Sidebar */}
                            <div className="w-80 border-r border-[#3e3e42] flex flex-col bg-[#252526]">
                                <div className="p-3 border-b border-[#3e3e42]">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase">Agent Proposals ({approvalRequest.proposals.length})</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {approvalRequest.proposals.map((proposal, idx) => (
                                        <div key={idx} className="p-3 border-b border-[#2d2d2d] hover:bg-white/5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-bold text-astra-blue uppercase">{proposal.agentName}</span>
                                                <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300 capitalize">{proposal.domain}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 line-clamp-4">{proposal.proposal.substring(0, 200)}...</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Synthesis Result */}
                            <div className="flex-1 flex flex-col">
                                <div className="p-3 border-b border-[#3e3e42]">
                                    <h3 className="text-sm font-bold text-purple-400 uppercase">Synthesized Proposal</h3>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Confidence: {Math.round(approvalRequest.synthesis.confidence * 100)}% |
                                        Contributors: {approvalRequest.synthesis.contributingAgents.length}
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4">
                                    <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {approvalRequest.synthesis.hybridProposal}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-[#3e3e42] bg-[#252526]">
                            <div className="flex gap-3 mb-3">
                                <textarea
                                    className="flex-1 bg-[#1e1e1e] text-white p-3 rounded border border-[#3e3e42] focus:border-astra-blue focus:outline-none resize-none text-sm"
                                    placeholder="Optional feedback for refinement..."
                                    value={approvalFeedback}
                                    onChange={e => setApprovalFeedback(e.target.value)}
                                    rows={2}
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={handleCancelDebate}
                                    className="px-4 py-2 rounded text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRequestChanges}
                                    disabled={!approvalFeedback.trim()}
                                    className="px-4 py-2 rounded text-sm font-medium text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    <MessageSquare size={14} />
                                    Request Changes
                                </button>
                                <button
                                    onClick={handleApproveProposal}
                                    className="px-6 py-2 rounded text-sm font-bold bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/30 transition-colors flex items-center gap-2"
                                >
                                    <CheckCircle size={14} />
                                    Approve & Generate Code
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
