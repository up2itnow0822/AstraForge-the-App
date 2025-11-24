import { describe, it, expect } from '@jest/globals';
import * as BackendPrompts from '../BackendAgent/prompts';
import * as BackendTypes from '../BackendAgent/types';
import * as ArchPrompts from '../ArchAgent/prompts';
import * as SpecPrompts from '../SpecAgent/prompts';
import * as SpecTypes from '../SpecAgent/types';

describe('Definitions Coverage', () => {
    it('should load BackendAgent prompts', () => {
        expect(BackendPrompts).toBeDefined();
    });

    it('should load BackendAgent types', () => {
        expect(BackendTypes).toBeDefined();
    });

    it('should load ArchAgent prompts', () => {
        expect(ArchPrompts).toBeDefined();
    });

    it('should load SpecAgent prompts', () => {
        expect(SpecPrompts).toBeDefined();
    });

    it('should load SpecAgent types', () => {
        expect(SpecTypes).toBeDefined();
    });
});
