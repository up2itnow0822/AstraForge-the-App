export const testEnv = {
  isTest: true,
  mockExternalApis: true,
  enableCoverage: true,
  coverageThreshold: 85
};

/**
 *
 */
export function setupTestEnvironment(): void {
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_MOCKS = 'true';
}
