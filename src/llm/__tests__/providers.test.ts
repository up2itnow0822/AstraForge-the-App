import { OpenAICompatibleProvider } from '../providers/OpenAICompatibleProvider';
import { AnthropicProvider } from '../providers/AnthropicProvider';
import { GitHubProvider } from '../providers/GitHubProvider';

describe('Providers', () => {
    describe('OpenAICompatibleProvider', () => {
        it('should generate response', async () => {
            const provider = new OpenAICompatibleProvider({ apiKey: 'sk-test' });
            const response = await provider.generate('prompt');
            expect(response.content).toContain('OpenAI response');
            expect(provider.name).toBe('base'); // default from BaseLLMProvider if not passed
        });

        it('should return embeddings', async () => {
            const provider = new OpenAICompatibleProvider({ apiKey: 'sk-test' });
            const embedding = await provider.embed('text');
            expect(embedding).toHaveLength(3);
        });
        
        it('should set properties from config', () => {
            const provider = new OpenAICompatibleProvider({ apiKey: 'sk-test', name: 'gpt-4', model: 'gpt-4' });
            expect(provider.name).toBe('gpt-4');
            expect(provider.model).toBe('gpt-4');
        });
    });

    describe('AnthropicProvider', () => {
        it('should generate response', async () => {
            const provider = new AnthropicProvider({ apiKey: 'sk-ant' });
            const response = await provider.generate('prompt');
            expect(response.content).toContain('Anthropic response');
        });

        it('should return embeddings', async () => {
             const provider = new AnthropicProvider({ apiKey: 'sk-ant' });
             const embedding = await provider.embed('text');
             expect(embedding).toEqual([0.1, 0.2, 0.3]);
        });
    });

    describe('GitHubProvider', () => {
        it('should generate response', async () => {
            const provider = new GitHubProvider({ apiKey: 'ghp-test' });
            const response = await provider.generate('prompt');
            expect(response.content).toContain('GitHub response');
        });
    });
});
