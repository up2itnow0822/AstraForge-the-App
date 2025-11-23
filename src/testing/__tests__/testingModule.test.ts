import { describe, it, expect } from '@jest/globals';
import * as TestingModule from '../index';

describe('TestingModule', () => {
    it('should export APITester', () => {
        expect(TestingModule.APITester).toBeDefined();
    });

    it('should export EmergentBehaviorDetector', () => {
        expect(TestingModule.EmergentBehaviorDetector).toBeDefined();
    });
});
