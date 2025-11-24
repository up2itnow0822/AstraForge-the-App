import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Cpu, Shield, Search, Brain, Activity } from 'lucide-react';

// Custom Node Component
const AgentNode = ({ data, selected }: NodeProps) => {
  const status = data.status as string;
  const role = data.role as string;

  // Dynamic styles based on status
  const isSpeaking = status === 'speaking';
  const isThinking = status === 'thinking';

  const getBorderColor = () => {
    if (isSpeaking) return 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]';
    if (isThinking) return 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
    return 'border-gray-600';
  };

  const getIcon = () => {
    switch(data.name) {
      case 'Nexus': return <Brain size={20} className="text-purple-400" />;
      case 'Vanguard': return <Shield size={20} className="text-red-400" />;
      case 'Prism': return <Search size={20} className="text-yellow-400" />;
      case 'Helix': return <Activity size={20} className="text-pink-400" />;
      case 'Cipher': return <Cpu size={20} className="text-cyan-400" />;
      default: return <Cpu size={20} className="text-gray-400" />;
    }
  };

  return (
    <div className={`px-4 py-3 shadow-md rounded-lg bg-gray-900 border-2 transition-all duration-300 w-48 ${getBorderColor()} ${selected ? 'scale-105' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-gray-500" />
      
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-full bg-gray-800 ${isSpeaking ? 'animate-pulse' : ''}`}>
          {getIcon()}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-200">{data.label as string}</span>
          <span className="text-[10px] text-gray-500 uppercase">{role}</span>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${
          isSpeaking ? 'w-full bg-green-500' : 
          isThinking ? 'w-3/4 bg-blue-500 animate-pulse' : 
          'w-2 bg-gray-700'
        }`} />
        <span className="text-[10px] ml-2 text-gray-400 font-mono">{status.toUpperCase()}</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-gray-500" />
    </div>
  );
};

export default memo(AgentNode);
