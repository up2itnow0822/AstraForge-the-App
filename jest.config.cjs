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
      statements: 30,
      branches: 15,
      functions: 35,
      lines: 30
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
