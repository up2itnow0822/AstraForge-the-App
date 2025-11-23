import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ApiTesterProvider } from '../apiTesterProvider';
import { APITester } from '../apiTesterCore';

const mockLanceDB = {};

describe('ApiTesterProvider', () => {
    let provider: ApiTesterProvider;

    beforeEach(() => {
        provider = new ApiTesterProvider(mockLanceDB as any);
    });

    it('should provide tester instance', () => {
        const tester1 = provider.getTester('test1');
        expect(tester1).toBeInstanceOf(APITester);
    });

    it('should return same instance for same id', () => {
        const tester1 = provider.getTester('test1');
        const tester2 = provider.getTester('test1');
        expect(tester1).toBe(tester2);
    });

    it('should return different instances for different ids', () => {
        const tester1 = provider.getTester('test1');
        const tester2 = provider.getTester('test2');
        expect(tester1).not.toBe(tester2);
    });
});
