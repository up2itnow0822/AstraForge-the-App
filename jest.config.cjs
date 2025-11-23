module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/setupTests.ts',
    '!src/app/**',
    '!**/*.tsx',
    '!src/electron-main.ts'
  ],
  coverageThreshold: {
    global: {
      statements: 92,
      branches: 90,
      functions: 92,
      lines: 92
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json'
    }]
  },
  moduleFileExtensions: ['ts', 'js'],
  moduleDirectories: ['node_modules', 'src']
};
