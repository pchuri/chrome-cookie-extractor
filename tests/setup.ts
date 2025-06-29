// Mock console during tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock file system operations for testing
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

// Mock sqlite3 for testing
jest.mock('sqlite3', () => ({
  Database: jest.fn().mockImplementation(() => ({
    close: jest.fn(),
    all: jest.fn(),
    run: jest.fn()
  }))
}));