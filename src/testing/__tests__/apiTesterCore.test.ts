import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { APITester } from '../apiTesterCore';

const mockLanceDB = {
    insert: jest.fn()
};

describe('APITester', () => {
    let tester: APITester;

    beforeEach(() => {
        jest.clearAllMocks();
        tester = new APITester(mockLanceDB as any);
    });

    it('should test endpoint and return result', async () => {
        const config = { url: 'http://test', method: 'GET' };
        const result = await tester.testEndpoint(config);
        
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should validate response', () => {
        expect(tester.validateResponse({ data: 1 })).toBe(true);
        expect(tester.validateResponse(null)).toBe(false);
    });

    it('should track performance', async () => {
        const result = { success: true, responseTime: 100 };
        await tester.trackPerformance(result);
        expect(mockLanceDB.insert).toHaveBeenCalledWith([result]);
    });
});
