/**
 * PDF Search Test Runner
 * 
 * This script sets up the environment for running the PDF search tests.
 * It mocks the browser environment and runs the tests.
 */

// Mock browser environment for tests
global.document = {
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  createElement: jest.fn(() => ({
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    },
    style: {},
    setAttribute: jest.fn()
  }))
};

global.window = {
  addEventListener: jest.fn()
};

// Run the tests
console.log('Running PDF search tests...');
require('./pdfSearch.test.js');
require('./pdfSearchComprehensive.test.js');
console.log('Tests completed.'); 