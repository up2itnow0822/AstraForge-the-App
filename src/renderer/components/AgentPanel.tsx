import React, { useState } from 'react';
import { Network, List } from 'lucide-react';
import AgentFlow from './AgentFlow';

export interface AgentState {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'thinking' | 'speaking';
}

interface AgentPanelProps {
  agents: AgentState[];
}

const AgentCard: React.FC<AgentState> = ({ name, role, status }) => (
  <div className="bg-gray-800 p-3 rounded border border-gray-700 flex flex-col gap-1 mb-2 transition-all duration-200 hover:border-gray-600">
    <div className="flex justify-between items-center">
      <span className="text-sm font-bold text-gray-200">{name}</span>
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono tracking-wider ${
        status === 'speaking' ? 'bg-green-900 text-green-300 animate-pulse' :
        status === 'thinking' ? 'bg-blue-900 text-blue-300 animate-pulse' :
        'bg-gray-700 text-gray-400'
      }`}>
        {status.toUpperCase()}
      </span>
    </div>
    <span className="text-xs text-gray-500 italic">{role}</span>
  </div>
);

const AgentPanel: React.FC<AgentPanelProps> = ({ agents }) => {
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');

  return (
    <div className="bg-gray-900 border-l border-gray-700 flex flex-col h-full w-full">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/50 backdrop-blur">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Agent Sync</h2>
        <div className="flex bg-gray-800 rounded-md p-0.5 border border-gray-700">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-gray-700 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
            title="List View"
          >
            <List size={14} />
          </button>
          <button 
            onClick={() => setViewMode('graph')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'graph' ? 'bg-gray-700 text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
            title="Graph View"
          >
            <Network size={14} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'list' ? (
          <div className="flex flex-col gap-2 p-4 overflow-y-auto h-full w-64">
            {agents.map(agent => (
              <AgentCard key={agent.id} {...agent} />
            ))}
          </div>
        ) : (
          <AgentFlow agents={agents} />
        )}
      </div>
    </div>
  );
};

export default AgentPanel;
