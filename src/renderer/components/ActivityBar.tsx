import React from 'react';
import { Files, Search, GitGraph, Play, Settings, Command } from 'lucide-react';

interface ActivityBarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onOpenSettings: () => void;
}

const ActivityBar: React.FC<ActivityBarProps> = ({ activeView, onViewChange, onOpenSettings }) => {
  const items = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'scm', icon: GitGraph, label: 'Source Control' },
    { id: 'run', icon: Play, label: 'Run & Debug' },
  ];

  return (
    <div className="w-12 bg-[#181818] flex flex-col items-center py-2 border-r border-[#2b2b2b] shrink-0 z-20">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={`w-10 h-10 mb-2 rounded flex items-center justify-center transition-colors relative group ${
            activeView === item.id ? 'text-white' : 'text-[#858585] hover:text-white'
          }`}
          title={item.label}
        >
          <item.icon size={24} strokeWidth={1.5} />
          {activeView === item.id && (
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-astra-blue" />
          )}
        </button>
      ))}

      <div className="mt-auto flex flex-col items-center gap-2">
        <button onClick={onOpenSettings} className="w-10 h-10 text-[#858585] hover:text-white flex items-center justify-center" title="Settings">
          <Settings size={24} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

export default ActivityBar;

