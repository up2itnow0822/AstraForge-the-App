import { InputValidator, SecureLogger } from '../inputValidation';

describe('InputValidator', () => {
  it('should instantiate', () => {
    const validator = new InputValidator();
    expect(validator).toBeDefined();
  });
});

describe('SecureLogger', () => {
  it('should instantiate', () => {
    const logger = new SecureLogger();
    expect(logger).toBeDefined();
  });
});
