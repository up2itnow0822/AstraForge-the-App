import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AgentPanel, { AgentState } from './components/AgentPanel';
import Terminal from './components/Terminal';
import EditorComponent from './components/Editor';
import SettingsModal from './components/Settings/SettingsModal';
import { bridge } from './api/bridge';  // New Import

// Initial Roster for UI
const INITIAL_ROSTER: AgentState[] = [
  { id: 'agent-1', name: 'Nexus', role: 'Orchestrator', status: 'idle' },
  { id: 'agent-2', name: 'Vanguard', role: 'Security', status: 'idle' },
  { id: 'agent-3', name: 'Prism', role: 'Product', status: 'idle' },
  { id: 'agent-4', name: 'Helix', role: 'AI Systems', status: 'idle' },
  { id: 'agent-5', name: 'Cipher', role: 'Impl. Architect', status: 'idle' }
];

const App: React.FC = () => {
  const [objective, setObjective] = useState('');
  const [logs, setLogs] = useState<string[]>(['System initialized. Ready.']);
  const [agents, setAgents] = useState<AgentState[]>(INITIAL_ROSTER);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    bridge.onAgentUpdate((data: any) => {
      if (data.type === 'log') {
        setLogs(prev => [...prev, data.message]);
      }
      if (data.type === 'status') {
        setAgents(prev => prev.map(agent => 
          agent.id === data.agentId ? { ...agent, status: data.status } : agent
        ));
      }
      if (data.type === 'phase' && data.phase === 'voting_concluded') {
        setAgents(prev => prev.map(a => ({ ...a, status: 'idle' })));
      }
    });
    return () => bridge.removeAgentUpdateListener();
  }, []);

  const handleDebate = async () => {
    if (!objective) return;
    setLogs(prev => [...prev, `>>> User: ${objective}`]);
    try {
      await bridge.startDebate(objective);
    } catch (e) {
      setLogs(prev => [...prev, 'Error: Failed to start debate IPC']);
    }
  };

  return (
    <div className="flex h-screen bg-vscode-dark text-gray-300 font-sans">
      <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-6 flex flex-col">
          <h1 className="text-2xl font-bold text-white mb-4">AstraForge IDE</h1>
          
          <div className="bg-gray-800 p-4 rounded mb-4">
            <label className="block text-xs uppercase font-bold text-gray-500 mb-2">Development Objective</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 bg-gray-900 border border-gray-700 text-white p-2 rounded focus:outline-none focus:border-astra-blue"
                placeholder="Describe feature..."
                value={objective}
                onChange={e => setObjective(e.target.value)}
              />
              <button 
                onClick={handleDebate} 
                className="bg-astra-blue hover:bg-blue-600 text-white px-6 py-2 rounded font-medium transition-colors"
              >
                Start
              </button>
            </div>
          </div>

          <div className="flex-1 bg-gray-900 border border-gray-700 rounded overflow-hidden">
            <EditorComponent />
          </div>
        </div>
        <Terminal logs={logs} />
      </div>
      <AgentPanel agents={agents} />
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default App;
