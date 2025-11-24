import React, { useState } from 'react';
import { bridge } from '../../api/bridge';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('apikeys');
  const [keys, setKeys] = useState({ openai: '', anthropic: '' });

  if (!isOpen) return null;

  const handleSave = async () => {
    if (keys.openai) await bridge.saveApiKey('openai', keys.openai);
    if (keys.anthropic) await bridge.saveApiKey('anthropic', keys.anthropic);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-gray-800 w-2/3 h-3/4 rounded-lg shadow-xl flex flex-col">
        <div className="flex flex-row border-b border-gray-700">
          {['General', 'API Keys', 'Models', 'Memory'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))}
              className={`px-6 py-3 font-medium ${activeTab === tab.toLowerCase().replace(' ', '') ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
          <div className="flex-1"></div>
          <button onClick={onClose} className="px-4 text-gray-400 hover:text-white">✕</button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto text-gray-300">
          {activeTab === 'general' && (
            <div>
              <h2 className="text-xl font-bold mb-4">General Settings</h2>
              <p>Theme: VS Dark (Locked)</p>
            </div>
          )}

          {activeTab === 'apikeys' && (
            <div>
              <h2 className="text-xl font-bold mb-4">API Configuration</h2>
              <p className="text-sm text-gray-400 mb-4">Keys are stored locally in .env (or secure storage in prod).</p>
              <div className="mb-4">
                <label className="block text-sm mb-1">OpenAI API Key</label>
                <input 
                  type="password" 
                  className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white"
                  value={keys.openai}
                  onChange={e => setKeys({...keys, openai: e.target.value})}
                  placeholder="sk-..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm mb-1">Anthropic API Key (Optional)</label>
                <input 
                  type="password" 
                  className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white"
                  value={keys.anthropic}
                  onChange={e => setKeys({...keys, anthropic: e.target.value})}
                  placeholder="sk-ant-..."
                />
              </div>
            </div>
          )}
          
          {activeTab === 'models' && <p>Model selection coming soon.</p>}
          {activeTab === 'memory' && <p>Memory management coming soon.</p>}
        </div>

        <div className="p-4 border-t border-gray-700 flex flex-col gap-2">
          <div className="flex justify-end gap-2">
             <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
             <button onClick={handleSave} className="bg-blue-600 px-6 py-2 rounded text-white hover:bg-blue-500">Save Changes</button>
          </div>
          <div className="flex justify-center mt-2">
             <p className="text-xs text-gray-500">Settings UI adapted from <a href="https://github.com/agent0ai/agent-zero" target="_blank" className="underline hover:text-blue-300">agent-zero</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
