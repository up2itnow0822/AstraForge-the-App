import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { runApiTests } from '../apiTesterCLI';

describe('apiTesterCLI', () => {
    const originalLog = console.log;
    let logOutput: string[] = [];

    beforeEach(() => {
        logOutput = [];
        console.log = jest.fn((...args) => logOutput.push(args.join(' ')));
    });

    afterEach(() => {
        console.log = originalLog;
    });

    it('should log running message', () => {
        runApiTests();
        expect(logOutput).toContain('Running API tests...');
    });
});
