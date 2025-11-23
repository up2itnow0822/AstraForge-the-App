import { describe, it, expect, afterEach, beforeEach } from '@jest/globals';
import { testEnv, setupTestEnvironment } from '../testEnv';

describe('testEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should export configuration object', () => {
    expect(testEnv.isTest).toBe(true);
    expect(testEnv.mockExternalApis).toBe(true);
    expect(testEnv.enableCoverage).toBe(true);
    expect(testEnv.coverageThreshold).toBe(85);
  });

  it('setupTestEnvironment should set environment variables', () => {
    setupTestEnvironment();
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.ENABLE_MOCKS).toBe('true');
  });
});
