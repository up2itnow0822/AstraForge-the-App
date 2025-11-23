import { Logger, logger } from '../logger';

describe('Logger', () => {
    let logSpy: jest.SpyInstance;
    let warnSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
        logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should log info messages with default name', () => {
        logger.info('test info');
        expect(logSpy).toHaveBeenCalledWith('[INFO][Global] test info');
    });

    it('should log warn messages with custom name', () => {
        const customLogger = new Logger('Custom');
        customLogger.warn('test warn');
        expect(warnSpy).toHaveBeenCalledWith('[WARN][Custom] test warn');
    });

    it('should log error messages', () => {
        logger.error('test error');
        expect(errorSpy).toHaveBeenCalledWith('[ERROR][Global] test error');
    });

    it('should correct log generic messages', () => {
        logger.log('test log');
        expect(logSpy).toHaveBeenCalledWith('[LOG][Global] test log');
    });
});
