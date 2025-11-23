import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { TestLogger } from '../testLogger';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs', () => ({
    writeFileSync: jest.fn(),
    appendFileSync: jest.fn(),
    existsSync: jest.fn(),
    mkdirSync: jest.fn()
}));

describe('TestLogger', () => {
    let logger: TestLogger;
    const config = { logDir: '/test/logs', consoleOutput: true };

    beforeEach(() => {
        jest.clearAllMocks();
        (fs.existsSync as any).mockReturnValue(false);
        logger = new TestLogger(config);
    });

    it('should create log directory if missing', () => {
        expect(fs.mkdirSync).toHaveBeenCalledWith('/test/logs', { recursive: true });
    });

    it('should log messages and append to file', () => {
        logger.log('test message');
        expect(fs.appendFileSync).toHaveBeenCalled();
        const callArgs = (fs.appendFileSync as any).mock.calls[0];
        expect(callArgs[0]).toContain('test.log');
        expect(callArgs[1]).toContain('test message');
    });

    it('should emit log events', (done) => {
        logger.on('log', (entry) => {
            expect(entry.message).toBe('event test');
            done();
        });
        logger.log('event test');
    });
});
