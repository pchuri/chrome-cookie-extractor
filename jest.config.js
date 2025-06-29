module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/cli.ts',
    '!src/auth-curl.ts'
  ],
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/src/**/*.test.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};