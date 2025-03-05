/**
 * Jest Configuration
 */

module.exports = {
  // Use jsdom environment for browser-like environment
  testEnvironment: 'jsdom',
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Indicates whether the coverage information should be collected
  collectCoverage: false,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // A list of paths to directories that Jest should use to search for files in
  roots: [
    '<rootDir>/tests'
  ],
  
  // The test match pattern
  testMatch: [
    '**/__tests__/**/*.js?(x)',
    '**/?(*.)+(spec|test).js?(x)'
  ],
  
  // Transform files with babel
  transform: {},
  
  // Indicates whether each individual test should be reported during the run
  verbose: true,
}; 