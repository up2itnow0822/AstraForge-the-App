import { describe, it, expect } from '@jest/globals';
import { ArchAgentPrompts } from '../ArchAgent/prompts';
import { BackendAgentPrompts } from '../BackendAgent/prompts';
import { SpecAgentPrompts } from '../SpecAgent/prompts';

describe('Prompts Coverage', () => {
    describe('ArchAgentPrompts', () => {
        it('should have system prompt string', () => {
            expect(typeof ArchAgentPrompts.system).toBe('string');
            expect(ArchAgentPrompts.system.length).toBeGreaterThan(0);
        });

        it('should generate analyze prompt with args', () => {
            const prompt = ArchAgentPrompts.analyze({ req: 'test requirement' }, { con: 'straint' });
            expect(prompt).toContain('ANALYZE ARCHITECTURE REQUIREMENTS');
            expect(prompt).toContain('test requirement');
            expect(prompt).toContain('straint');
        });

        it('should generate optimize prompt', () => {
            const prompt = ArchAgentPrompts.optimize({ metric: 'latency' });
            expect(prompt).toContain('OPTIMIZE ARCHITECTURE');
            expect(prompt).toContain('latency');
        });
    });

    describe('BackendAgentPrompts', () => {
        it('should explicitly test all properties for full coverage', () => {
            // 1. SYSTEM_PROMPT
            expect(typeof BackendAgentPrompts.SYSTEM_PROMPT).toBe('string');
            expect(BackendAgentPrompts.SYSTEM_PROMPT.length).toBeGreaterThan(0);

            // 2. SERVICE_GENERATION_PROMPT
            const servicePrompt = BackendAgentPrompts.SERVICE_GENERATION_PROMPT('Plan A', 'Service Def');
            expect(typeof servicePrompt).toBe('string');
            expect(servicePrompt).toContain('Plan A');
            expect(servicePrompt).toContain('Service Def');

            // 3. API_IMPLEMENTATION_PROMPT
            const apiPrompt = BackendAgentPrompts.API_IMPLEMENTATION_PROMPT('/api/v1', 'UserService');
            expect(typeof apiPrompt).toBe('string');
            expect(apiPrompt).toContain('/api/v1');
            expect(apiPrompt).toContain('UserService');

            // 4. DATABASE_SCHEMA_PROMPT
            const dbPrompt = BackendAgentPrompts.DATABASE_SCHEMA_PROMPT('Users Table');
            expect(typeof dbPrompt).toBe('string');
            expect(dbPrompt).toContain('Users Table');

            // 5. SECURITY_LAYER_PROMPT
            const secPrompt = BackendAgentPrompts.SECURITY_LAYER_PROMPT('server code', 'auth required');
            expect(typeof secPrompt).toBe('string');
            expect(secPrompt).toContain('server code');
            expect(secPrompt).toContain('auth required');

            // 6. TESTING_STRATEGY_PROMPT
            const testPrompt = BackendAgentPrompts.TESTING_STRATEGY_PROMPT('impl code', 'unit tests');
            expect(typeof testPrompt).toBe('string');
            expect(testPrompt).toContain('impl code');
            expect(testPrompt).toContain('unit tests');

            // 7. OPTIMIZATION_PROMPT
            const optPrompt = BackendAgentPrompts.OPTIMIZATION_PROMPT('slow code', 'memory leak');
            expect(typeof optPrompt).toBe('string');
            expect(optPrompt).toContain('slow code');
            expect(optPrompt).toContain('memory leak');
        });
    });

    describe('SpecAgentPrompts', () => {
        it('should explicitly test all properties for full coverage', () => {
            // 1. SYSTEM_PROMPT
            expect(typeof SpecAgentPrompts.SYSTEM_PROMPT).toBe('string');
            expect(SpecAgentPrompts.SYSTEM_PROMPT.length).toBeGreaterThan(0);

            // 2. TRANSLATION_PROMPT
            const transPrompt = SpecAgentPrompts.TRANSLATION_PROMPT('User wants login');
            expect(typeof transPrompt).toBe('string');
            expect(transPrompt).toContain('User wants login');

            // 3. VALIDATION_PROMPT
            const valPrompt = SpecAgentPrompts.VALIDATION_PROMPT('Spec JSON');
            expect(typeof valPrompt).toBe('string');
            expect(valPrompt).toContain('Spec JSON');

            // 4. REFINEMENT_PROMPT
            const refPrompt = SpecAgentPrompts.REFINEMENT_PROMPT('Old Spec', 'Add OAuth');
            expect(typeof refPrompt).toBe('string');
            expect(refPrompt).toContain('Old Spec');
            expect(refPrompt).toContain('Add OAuth');
        });
    });
});
