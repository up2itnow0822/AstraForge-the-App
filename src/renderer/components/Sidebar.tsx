import React from 'react';

interface SidebarProps {
  onOpenSettings?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => (
  <div className="w-16 bg-vscode-sidebar flex flex-col items-center py-4 border-r border-gray-700">
    <div className="w-10 h-10 bg-astra-blue rounded mb-4 flex items-center justify-center text-white font-bold">AF</div>
    <div className="w-8 h-8 text-gray-400 hover:text-white cursor-pointer mb-4" title="Running">Running</div>
    <div className="w-8 h-8 text-gray-400 hover:text-white cursor-pointer mb-4" title="Debug">Debug</div>
    
    <div 
      onClick={onOpenSettings} 
      className="mt-auto w-8 h-8 text-gray-400 hover:text-white cursor-pointer flex items-center justify-center"
      title="Settings"
    >
      ⚙️
    </div>
  </div>
);

export default Sidebar;
