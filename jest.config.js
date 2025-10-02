const runFullSuite = process.env.RUN_FULL_TEST_SUITE === 'true';

const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  roots: ['<rootDir>/src', '<rootDir>/tests', '<rootDir>/__mocks__'],
  testMatch: runFullSuite
    ? ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts']
    : ['<rootDir>/tests/smoke/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/*.test.ts', '!src/**/*.spec.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};

if (runFullSuite) {
  config.coverageThreshold = {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  };
} else {
  config.coverageThreshold = {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  };
}

module.exports = config;
