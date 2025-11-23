import { SecureLogger } from '../secureLogger';

describe('SecureLogger', () => {
  it('should be instantiated', () => {
    const logger = new SecureLogger();
    expect(logger).toBeInstanceOf(SecureLogger);
  });

  it('should inherit logger methods', () => {
    const logger = new SecureLogger();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('test');
    expect(logSpy).toHaveBeenCalledWith('[INFO][Global] test');
    logSpy.mockRestore();
  });
});
