import React, { useState, useEffect } from 'react';
import { bridge } from '../../api/bridge';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AGENTS = [
    { id: 'agent-1', name: 'Nexus', role: 'Orchestrator' },
    { id: 'agent-2', name: 'Vanguard', role: 'Security' },
    { id: 'agent-3', name: 'Prism', role: 'Product' },
    { id: 'agent-4', name: 'Helix', role: 'AI Systems' },
    { id: 'agent-5', name: 'Cipher', role: 'Impl. Architect' }
];

const PROVIDERS = ['OpenAI', 'Anthropic', 'Grok', 'OpenRouter', 'LM-Studio', 'Ollama'];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('inference');
  
  // Global Keys / Defaults
  const [keys, setKeys] = useState({ 
      openai: '', 
      anthropic: '', 
      grok: '',
      openrouter: '',
      lmstudio: '' 
  });
  
  const [ollamaConfig, setOllamaConfig] = useState({ endpoint: 'http://127.0.0.1:11434', model: 'llama3' });

  // Testing State
  const [testStatus, setTestStatus] = useState<{ [key: string]: { loading: boolean, success?: boolean, message?: string } }>({});

  // Agent Specific Configs
  const [agentConfigs, setAgentConfigs] = useState<Record<string, { provider: string, model: string, apiKey: string, enableReasoning?: boolean }>>({});
  
  // Loading State
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loadSettings = async () => {
        setIsLoadingSettings(true);
        setLoadError(null);
        
        try {
          // Wait for connection first
          const connected = await bridge.waitForConnection(5000);
          if (!connected) {
            setLoadError('Unable to connect to server. Please ensure the server is running.');
            setIsLoadingSettings(false);
            return;
          }
          
          // Load Global Keys with error handling
          const [openai, anthropic, grok, openrouter, lmstudio, ollamaEndpoint, ollamaModel] = await Promise.all([
            bridge.getApiKey('openai').catch(() => ''),
            bridge.getApiKey('anthropic').catch(() => ''),
            bridge.getApiKey('grok').catch(() => ''),
            bridge.getApiKey('openrouter').catch(() => ''),
            bridge.getApiKey('lmstudio').catch(() => ''),
            bridge.getApiKey('ollama_endpoint').catch(() => ''),
            bridge.getApiKey('ollama_model').catch(() => '')
          ]);

        setKeys({ 
            openai: openai || '', 
            anthropic: anthropic || '',
            grok: grok || '',
            openrouter: openrouter || '',
            lmstudio: lmstudio || ''
        });

        if (ollamaEndpoint) setOllamaConfig(prev => ({ ...prev, endpoint: ollamaEndpoint }));
        if (ollamaModel) setOllamaConfig(prev => ({ ...prev, model: ollamaModel }));

        // Load Agent Configs
        const loadedConfigs: any = {};
        for (const agent of AGENTS) {
            try {
            const config = await bridge.getAgentConfig(agent.id);
            if (config) {
                // @ts-ignore - handling legacy configs without enableReasoning
                loadedConfigs[agent.id] = { ...config, enableReasoning: config.enableReasoning || false };
            } else {
                loadedConfigs[agent.id] = { provider: 'Ollama', model: 'llama3', apiKey: '', enableReasoning: false };
              }
            } catch {
              loadedConfigs[agent.id] = { provider: 'Ollama', model: 'llama3', apiKey: '', enableReasoning: false };
            }
        }
        setAgentConfigs(loadedConfigs);
          
        } catch (err: any) {
          setLoadError(err.message || 'Failed to load settings');
        } finally {
          setIsLoadingSettings(false);
        }
      };
      loadSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const isMasked = (val: string) => val.includes('...');

    // Save Global Keys
    if (!isMasked(keys.openai)) await bridge.saveApiKey('openai', keys.openai);
    if (!isMasked(keys.anthropic)) await bridge.saveApiKey('anthropic', keys.anthropic);
    if (!isMasked(keys.grok)) await bridge.saveApiKey('grok', keys.grok);
    if (!isMasked(keys.openrouter)) await bridge.saveApiKey('openrouter', keys.openrouter);
    // LM Studio URL is not masked
    await bridge.saveApiKey('lmstudio', keys.lmstudio);
    
    await bridge.saveApiKey('ollama_endpoint', ollamaConfig.endpoint);
    await bridge.saveApiKey('ollama_model', ollamaConfig.model);
    
    // Save Agent Configs
    for (const agentId in agentConfigs) {
        const config = { ...agentConfigs[agentId] } as any;
        // If apiKey is masked, set it to undefined so server knows not to update it
        if (config.apiKey && isMasked(config.apiKey)) {
            config.apiKey = undefined;
        }
        await bridge.saveAgentConfig(agentId, config);
    }
    
    onClose();
  };

  const handleAgentConfigChange = (agentId: string, field: string, value: any) => {
      setAgentConfigs(prev => ({
          ...prev,
          [agentId]: {
              ...prev[agentId],
              [field]: value
          }
      }));
  };

  const runConnectionTest = async (keyId: string, provider: string, model: string, apiKey?: string, endpoint?: string) => {
      setTestStatus(prev => ({ ...prev, [keyId]: { loading: true } }));
      try {
          const result = await bridge.testConnection(provider, model, apiKey, endpoint);
          setTestStatus(prev => ({ ...prev, [keyId]: { loading: false, success: result.success, message: result.message } }));
      } catch (e: any) {
          setTestStatus(prev => ({ ...prev, [keyId]: { loading: false, success: false, message: e.message } }));
      }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-gray-800 w-3/4 h-[85vh] rounded-lg shadow-xl flex flex-col border border-gray-700">
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
          {/* Loading State */}
          {isLoadingSettings && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 size={48} className="text-blue-400 animate-spin" />
              <p className="text-gray-400">Loading settings from server...</p>
            </div>
          )}
          
          {/* Error State */}
          {loadError && !isLoadingSettings && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <AlertCircle size={48} className="text-red-400" />
              <p className="text-red-400 font-medium">{loadError}</p>
              <button 
                onClick={() => {
                  setIsLoadingSettings(true);
                  setLoadError(null);
                  // Re-trigger the useEffect by toggling
                  setTimeout(() => setIsLoadingSettings(false), 100);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                Retry
              </button>
            </div>
          )}
          
          {/* Content - only show when loaded */}
          {!isLoadingSettings && !loadError && activeTab === 'general' && (
            <div>
              <h2 className="text-xl font-bold mb-4">General Settings</h2>
              <p>Theme: VS Dark (Locked)</p>
            </div>
          )}

          {!isLoadingSettings && !loadError && activeTab === 'inference' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-bold mb-4">Global API Keys</h2>
                <div className="bg-blue-900/20 border border-blue-900/50 p-3 rounded mb-4">
                    <p className="text-xs text-blue-200">
                        <strong>Recommendation:</strong> Providing multiple API keys improves performance and reduces concurrency conflicts. 
                        External providers (OpenAI, Anthropic, etc.) handle parallel requests better than local models.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-sm mb-1 text-gray-400">Grok (xAI) API Key</label>
                    <input
                      type="password"
                      className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white focus:border-blue-500 focus:outline-none transition-colors"
                      value={keys.grok}
                      onChange={e => setKeys({...keys, grok: e.target.value})}
                      placeholder="xai-..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-gray-400">OpenRouter API Key</label>
                    <input
                      type="password"
                      className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white focus:border-blue-500 focus:outline-none transition-colors"
                      value={keys.openrouter}
                      onChange={e => setKeys({...keys, openrouter: e.target.value})}
                      placeholder="sk-or-..."
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm mb-1 text-gray-400">LM-Studio Base URL</label>
                    <input
                      type="text"
                      className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white focus:border-blue-500 focus:outline-none transition-colors"
                      value={keys.lmstudio}
                      onChange={e => setKeys({...keys, lmstudio: e.target.value})}
                      placeholder="http://localhost:1234/v1"
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
                    <label className="block text-sm mb-1 text-gray-400">Default Model Name</label>
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
                    <p className="text-xs text-yellow-500 mt-2">
                        <strong>Note:</strong> Local models are processed sequentially to prevent system overload. Parallel agent tasks will be queued.
                    </p>
                    
                    <div className="mt-4 flex items-center gap-4">
                        <button 
                            onClick={() => runConnectionTest('ollama', 'ollama', ollamaConfig.model, undefined, ollamaConfig.endpoint)}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white flex items-center gap-2"
                            disabled={testStatus['ollama']?.loading}
                        >
                            {testStatus['ollama']?.loading ? 'Testing...' : 'Test Connection'}
                        </button>
                        {testStatus['ollama'] && (
                            <span className={`text-xs ${testStatus['ollama'].success ? 'text-green-400' : 'text-red-400'}`}>
                                {testStatus['ollama'].message}
                            </span>
                        )}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {!isLoadingSettings && !loadError && activeTab === 'models' && (
            <div className="space-y-6">
                <h2 className="text-xl font-bold mb-4">Agent Specific Configuration</h2>
                <p className="text-gray-400 text-sm mb-4">Assign specific models and providers to each agent. If API Key is left blank, the global key for that provider will be used.</p>
                
                <div className="grid gap-6">
                    {AGENTS.map(agent => (
                        <div key={agent.id} className="bg-gray-900/50 p-4 rounded border border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-astra-blue flex items-center justify-center font-bold text-white">
                                    {agent.name[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{agent.name}</h3>
                                    <p className="text-xs text-gray-500">{agent.role}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-3 flex justify-end">
                                     <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => runConnectionTest(
                                                agent.id, 
                                                agentConfigs[agent.id]?.provider || 'Ollama',
                                                agentConfigs[agent.id]?.model || 'llama3',
                                                agentConfigs[agent.id]?.apiKey,
                                                (agentConfigs[agent.id]?.provider?.toLowerCase() === 'ollama' ? ollamaConfig.endpoint : undefined)
                                            )}
                                            className="text-xs text-blue-400 hover:text-blue-300 underline mr-4"
                                        >
                                            {testStatus[agent.id]?.loading ? 'Testing...' : 'Test Agent Connection'}
                                        </button>
                                        {testStatus[agent.id] && (
                                            <span className={`text-xs mr-4 ${testStatus[agent.id].success ? 'text-green-400' : 'text-red-400'}`}>
                                                {testStatus[agent.id].success ? '✓ Connected' : '✗ Failed'}
                                            </span>
                                        )}

                                        <label className="flex items-center gap-2 cursor-pointer" title="Enable reasoning/thinking models (e.g. o1, R1)">
                                            <input 
                                                type="checkbox" 
                                                className="rounded bg-gray-800 border-gray-600"
                                                checked={agentConfigs[agent.id]?.enableReasoning || false}
                                                onChange={(e) => handleAgentConfigChange(agent.id, 'enableReasoning', e.target.checked)}
                                            />
                                            <span className="text-xs text-gray-400">Reasoning Mode</span>
                                        </label>
                                     </div>
                                </div>
                                <div>
                                    <label className="block text-xs mb-1 text-gray-500">Provider</label>
                                    <select
                                        className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                                        value={agentConfigs[agent.id]?.provider || 'Ollama'}
                                        onChange={e => handleAgentConfigChange(agent.id, 'provider', e.target.value)}
                                    >
                                        {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs mb-1 text-gray-500">Model Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white text-sm font-mono focus:border-blue-500 focus:outline-none"
                                        placeholder="e.g. gpt-4, llama3"
                                        value={agentConfigs[agent.id]?.model || ''}
                                        onChange={e => handleAgentConfigChange(agent.id, 'model', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs mb-1 text-gray-500">API Key (Optional Override)</label>
                                    <input
                                        type="password"
                                        className="w-full bg-gray-800 border border-gray-700 p-2 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                                        placeholder="Use Global Key"
                                        value={agentConfigs[agent.id]?.apiKey || ''}
                                        onChange={e => handleAgentConfigChange(agent.id, 'apiKey', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}
          
          {!isLoadingSettings && !loadError && activeTab === 'memory' && <p>Memory management coming soon.</p>}
        </div>

        <div className="p-4 border-t border-gray-700 flex flex-col gap-2 bg-gray-900/30">
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button onClick={handleSave} className="bg-blue-600 px-6 py-2 rounded text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">Save Configuration</button>
          </div>
          <div className="flex justify-center mt-2">
             <p className="text-[10px] text-gray-600">AstraForge Consensus Engine v0.7</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
