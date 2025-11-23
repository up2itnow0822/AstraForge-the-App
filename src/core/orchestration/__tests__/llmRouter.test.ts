import { LLMRouter } from '../llmRouter';

describe('LLMRouter', () => {
    let router: LLMRouter;

    beforeEach(() => {
        router = new LLMRouter();
    });

    it('should use default route', () => {
        const route = router.getRoute('unknown');
        expect(route.provider).toBe('openai'); // default in implementation
    });

    it('should register and retrieve route', () => {
        router.registerRoute('code', { provider: 'anthropic', model: 'claude' });
        const route = router.getRoute('code');
        expect(route.provider).toBe('anthropic');
    });

    it('should set default route', () => {
        router.setDefaultRoute({ provider: 'test', model: 'test' });
        const route = router.getRoute('unknown');
        expect(route.provider).toBe('test');
    });

    it('should route based on prompt length', () => {
        const shortPrompt = 'hi';
        const routeShort = router.routePrompt(shortPrompt);
        expect(routeShort.model).toBe('gpt-3.5-turbo'); // from implementation logic

        const longPrompt = 'long '.repeat(20);
        const routeLong = router.routePrompt(longPrompt);
        // Expect default since length >= 50
        expect(routeLong.provider).toBe('openai'); 
        expect(routeLong.model).toBe('gpt-4');
    });
});
