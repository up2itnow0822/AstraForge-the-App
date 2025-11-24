import React from 'react';

const Sidebar: React.FC = () => (
  <div className="w-16 bg-vscode-sidebar flex flex-col items-center py-4 border-r border-gray-700">
    <div className="w-10 h-10 bg-astra-blue rounded mb-4 flex items-center justify-center text-white font-bold">AF</div>
    <div className="w-8 h-8 text-gray-400 hover:text-white cursor-pointer mb-4">Running</div>
    <div className="w-8 h-8 text-gray-400 hover:text-white cursor-pointer mb-4">Debug</div>
    <div className="mt-auto w-8 h-8 text-gray-400 hover:text-white cursor-pointer">Set</div>
  </div>
);
export default Sidebar;
