import React from 'react';

interface TerminalProps {
  logs: string[];
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => (
  <div className="h-full bg-black border-t border-gray-700 p-2 font-mono text-xs overflow-y-auto">
    {logs.map((log, i) => (
      <div key={i} className="mb-1">
        <span className="text-green-500 mr-2">➜</span>
        <span className="text-gray-300">{log}</span>
      </div>
    ))}
  </div>
);
export default Terminal;
