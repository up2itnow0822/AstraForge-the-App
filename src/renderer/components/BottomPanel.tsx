import React, { useState, useEffect, useCallback } from 'react';
import Terminal from './Terminal';
import XTerminal from './XTerminal';
import { X, Plus } from 'lucide-react';

interface BottomPanelProps {
  isVisible: boolean;
  height: number;
  setHeight: (h: number) => void;
  onClose: () => void;
  logs: string[];
}

const MIN_HEIGHT = 100; // Minimum terminal height
const MAX_HEIGHT_RATIO = 0.8; // Maximum 80% of viewport height

interface TerminalTab {
  id: string;
  name: string;
}

const BottomPanel: React.FC<BottomPanelProps> = ({ isVisible, height, setHeight, onClose, logs }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState('terminal');
  const [terminalTabs, setTerminalTabs] = useState<TerminalTab[]>([{ id: 'terminal-1', name: 'Terminal 1' }]);
  const [activeTerminalTab, setActiveTerminalTab] = useState('terminal-1');
  const [nextTerminalId, setNextTerminalId] = useState(2);

  const createNewTerminalTab = useCallback(() => {
    const newId = `terminal-${nextTerminalId}`;
    const newTab: TerminalTab = {
      id: newId,
      name: `Terminal ${nextTerminalId}`
    };
    setTerminalTabs(prev => [...prev, newTab]);
    setActiveTerminalTab(newId);
    setNextTerminalId(prev => prev + 1);
  }, [nextTerminalId]);

  const closeTerminalTab = useCallback((tabId: string) => {
    setTerminalTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== tabId);
      // If we're closing the active tab, switch to another one
      if (activeTerminalTab === tabId && filtered.length > 0) {
        setActiveTerminalTab(filtered[0].id);
      }
      // If no tabs left, create a new one
      if (filtered.length === 0) {
        const newTab: TerminalTab = { id: 'terminal-1', name: 'Terminal 1' };
        setActiveTerminalTab('terminal-1');
        setNextTerminalId(2);
        return [newTab];
      }
      return filtered;
    });
  }, [activeTerminalTab]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[BottomPanel] Start resizing, current height:', height);
    setIsResizing(true);
  }, [height]);

  const stopResizing = useCallback(() => {
    console.log('[BottomPanel] Stop resizing');
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    // Calculate new height based on mouse position from bottom of viewport
    const newHeight = window.innerHeight - e.clientY;
    const maxHeight = Math.floor(window.innerHeight * MAX_HEIGHT_RATIO);
    
    // Clamp the height between min and max
    const clampedHeight = Math.max(MIN_HEIGHT, Math.min(newHeight, maxHeight));
    
    console.log('[BottomPanel] Resize:', { clientY: e.clientY, windowHeight: window.innerHeight, newHeight, maxHeight, clampedHeight });
    
    setHeight(clampedHeight);
  }, [isResizing, setHeight]);

  useEffect(() => {
    if (isResizing) {
      // Use document to ensure we capture events even over iframes
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResizing);
      // Also add to window as fallback
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    
    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  if (!isVisible) return null;

  return (
    <>
      {/* Full-screen overlay while resizing to capture all mouse events */}
      {isResizing && (
        <div 
          className="fixed inset-0 z-[9999] cursor-row-resize"
          style={{ background: 'transparent' }}
        />
      )}
      
    <div 
      className="bg-[#1e1e1e] border-t border-[#2b2b2b] flex flex-col relative shrink-0"
      style={{ height }}
    >
        {/* Drag Handle - INSIDE the panel at the very top, large hit area */}
      <div 
          className={`w-full h-4 cursor-row-resize flex items-center justify-center shrink-0 transition-all ${isResizing ? 'bg-astra-blue/30' : 'hover:bg-[#2a2d2e]'}`}
        onMouseDown={startResizing}
        >
          {/* Visual indicator - wide bar that's easy to see and grab */}
          <div className={`w-24 h-1 rounded-full transition-all ${isResizing ? 'bg-astra-blue' : 'bg-gray-500 hover:bg-astra-blue/70'}`} />
        </div>

      {/* Header */}
      <div className="flex items-center h-9 px-4 bg-[#1e1e1e] border-b border-[#2b2b2b]">
        <div className="flex gap-6">
            {['PROBLEMS', 'OUTPUT', 'DEBUG CONSOLE'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`text-xs font-medium h-9 border-b-2 transition-colors px-1 ${
                activeTab === tab.toLowerCase() 
                  ? 'text-white border-astra-blue' 
                  : 'text-[#969696] border-transparent hover:text-[#e0e0e0]'
              }`}
            >
              {tab}
            </button>
          ))}
            {/* Terminal Tabs */}
            <div className="flex items-center">
              {terminalTabs.map(tab => (
                <div key={tab.id} className="flex items-center">
                  <button
                    onClick={() => {
                      setActiveTab('terminal');
                      setActiveTerminalTab(tab.id);
                    }}
                    className={`text-xs font-medium h-9 border-b-2 transition-colors px-2 flex items-center gap-1 ${
                      activeTab === 'terminal' && activeTerminalTab === tab.id
                        ? 'text-white border-astra-blue'
                        : 'text-[#969696] border-transparent hover:text-[#e0e0e0]'
                    }`}
                  >
                    {tab.name}
                    {terminalTabs.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTerminalTab(tab.id);
                        }}
                        className="ml-1 hover:bg-[#3e3e42] rounded p-0.5"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </button>
                </div>
              ))}
              <button
                onClick={createNewTerminalTab}
                className="ml-2 text-[#969696] hover:text-white p-1 hover:bg-[#3e3e42] rounded"
                title="New Terminal"
              >
                <Plus size={12} />
              </button>
            </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
           <button onClick={onClose} className="text-[#969696] hover:text-white">
             <X size={14} />
           </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
        {activeTab === 'terminal' && (
            <XTerminal
              terminalId={activeTerminalTab}
              onTerminalReady={(id) => console.log(`Terminal ${id} ready`)}
              onTerminalClose={(id) => console.log(`Terminal ${id} closed`)}
            />
          )}
          {activeTab !== 'terminal' && (
            <div className="p-4 text-[#969696] text-sm">
              {activeTab === 'output' && (
             <Terminal logs={logs} />
        )}
              {activeTab !== 'output' && (
                `No output for ${activeTab}.`
              )}
            </div>
         )}
      </div>
    </div>
    </>
  );
};

export default BottomPanel;
