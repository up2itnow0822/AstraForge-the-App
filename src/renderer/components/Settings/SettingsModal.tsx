import React, { useState, useEffect } from 'react';
import { bridge } from '../../api/bridge';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('apikeys');
  const [keys, setKeys] = useState({ openai: '', anthropic: '' });
  const [ollamaConfig, setOllamaConfig] = useState({ endpoint: 'http://127.0.0.1:11434', model: 'llama3' });

  useEffect(() => {
    if (isOpen) {
        // Load existing keys handled by bridge (mocking loading logic since bridge.getApiKey exists)
        // For simplicity in this phase, we assume empty or cached state.
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (keys.openai) await bridge.saveApiKey('openai', keys.openai);
    if (keys.anthropic) await bridge.saveApiKey('anthropic', keys.anthropic);
    
    // Save Ollama Config via the same mechanism (using keys for environment variables)
    await bridge.saveApiKey('ollama_endpoint', ollamaConfig.endpoint);
    await bridge.saveApiKey('ollama_model', ollamaConfig.model);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-gray-800 w-2/3 h-3/4 rounded-lg shadow-xl flex flex-col border border-gray-700">
        <div className="flex flex-row border-b border-gray-700 bg-gray-900/50">
          {['General', 'Inference', 'Models', 'Memory'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))}
              className={`px-6 py-3 font-medium transition-colors ${activeTab === tab.toLowerCase().replace(' ', '') ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
          <div className="flex-1"></div>
          <button onClick={onClose} className="px-4 text-gray-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto text-gray-300">
          {activeTab === 'general' && (
            <div>
              <h2 className="text-xl font-bold mb-4">General Settings</h2>
              <p>Theme: VS Dark (Locked)</p>
            </div>
          )}

          {activeTab === 'inference' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-bold mb-4">Cloud Providers</h2>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm mb-1 text-gray-400">OpenAI API Key</label>
                    <input
                      type="password"
                      className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white focus:border-blue-500 focus:outline-none transition-colors"
                      value={keys.openai}
                      onChange={e => setKeys({...keys, openai: e.target.value})}
                      placeholder="sk-..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-gray-400">Anthropic API Key</label>
                    <input
                      type="password"
                      className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white focus:border-blue-500 focus:outline-none transition-colors"
                      value={keys.anthropic}
                      onChange={e => setKeys({...keys, anthropic: e.target.value})}
                      placeholder="sk-ant-..."
                    />
                  </div>
                </div>
              </section>

              <div className="border-t border-gray-700 my-4"></div>

              <section>
                <div className="flex items-center gap-2 mb-4">
                   <h2 className="text-xl font-bold">Local Intelligence (Ollama)</h2>
                   <span className="bg-green-900 text-green-300 text-xs px-2 py-0.5 rounded font-mono">FREE</span>
                </div>
                
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm mb-1 text-gray-400">Ollama Endpoint URL</label>
                    <input
                      type="text"
                      className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white font-mono focus:border-blue-500 focus:outline-none"
                      value={ollamaConfig.endpoint}
                      onChange={e => setOllamaConfig({...ollamaConfig, endpoint: e.target.value})}
                      placeholder="http://127.0.0.1:11434"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-gray-400">Model Name</label>
                    <div className="flex gap-2">
                        <input
                        type="text"
                        className="flex-1 bg-gray-900 border border-gray-700 p-2 rounded text-white font-mono focus:border-blue-500 focus:outline-none"
                        value={ollamaConfig.model}
                        onChange={e => setOllamaConfig({...ollamaConfig, model: e.target.value})}
                        placeholder="llama3, mistral, phi3..."
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Ensure this model is pulled: <code>ollama pull {ollamaConfig.model || 'llama3'}</code></p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'models' && <p>Agent-Specific Router configuration coming soon.</p>}
          {activeTab === 'memory' && <p>Memory management coming soon.</p>}
        </div>

        <div className="p-4 border-t border-gray-700 flex flex-col gap-2 bg-gray-900/30">
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button onClick={handleSave} className="bg-blue-600 px-6 py-2 rounded text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">Save Configuration</button>
          </div>
          <div className="flex justify-center mt-2">
             <p className="text-[10px] text-gray-600">AstraForge Consensus Engine v0.5</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
