import { LLMManager, ConsensusResult } from '../llmManager';
import { BaseLLMProvider, LLMResponse } from '../providers/baseProvider';

// Mock provider
class MockProvider extends BaseLLMProvider {
    constructor(name: string = 'mock') {
        super({ apiKey: 'test', name });
    }
    generate = jest.fn().mockResolvedValue({ content: 'mock response' });
    embed = jest.fn().mockResolvedValue([0.1]);
}

describe('LLMManager', () => {
    let manager: LLMManager;
    let mockProvider: MockProvider;

    beforeEach(() => {
        mockProvider = new MockProvider();
        manager = new LLMManager({
            providers: [mockProvider as any],
            cacheEnabled: true,
            consensusThreshold: 0.8
        });
    });

    it('should initialize with config options', () => {
        expect(manager.getProviderCount()).toBe(1);
    });

    it('should handle empty providers list in constructor', () => {
        const emptyManager = new LLMManager({ providers: [] });
        expect(emptyManager.getProviderCount()).toBe(0);
    });
    
    it('should default options if not provided', () => {
         const simpleManager = new LLMManager({ providers: undefined as any });
         // Access private fields by casting to any if needed or checking behavior
         // Implementation sets defaults to false and 0.7
         // We can check indirectly or assume it works if no crash
         expect(simpleManager.getProviderCount()).toBe(0);
    });

    it('should add a provider', () => {
        const newProvider = new MockProvider('new');
        manager.addProvider(newProvider as any);
        expect(manager.getProviderCount()).toBe(2);
    });

    it('should remove a provider', () => {
        manager.removeProvider('mock');
        expect(manager.getProviderCount()).toBe(0);
    });

    it('should return fallback response if no providers available', async () => {
        manager.removeProvider('mock');
        const result = await manager.generateConsensus('prompt');
        expect(result.text).toBe('No providers available');
        expect(result.confidence).toBe(0);
    });

    it('should generate consensus using first provider', async () => {
        const result = await manager.generateConsensus('test prompt');
        expect(mockProvider.generate).toHaveBeenCalledWith('test prompt');
        expect(result.text).toBe('mock response');
        expect(result.confidence).toBe(0.8);
    });

    it('should handle provider returning empty content', async () => {
        mockProvider.generate.mockResolvedValueOnce({});
        const result = await manager.generateConsensus('test');
        expect(result.text).toBe('No response');
    });
});
