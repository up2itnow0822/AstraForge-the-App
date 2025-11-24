import React from 'react';

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

const AgentPanel: React.FC<AgentPanelProps> = ({ agents }) => (
  <div className="w-64 bg-gray-900 border-l border-gray-700 p-4 flex flex-col overflow-y-auto">
    <h2 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Agent Sync</h2>
    <div className="flex flex-col gap-2">
      {agents.map(agent => (
        <AgentCard key={agent.id} {...agent} />
      ))}
    </div>
  </div>
);

export default AgentPanel;
