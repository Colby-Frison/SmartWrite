# AiSimplify Tests

This directory contains automated tests for the AiSimplify PDF simplification functionality. The tests validate both the HTML structure and JavaScript interactions.

## Overview

These tests ensure that the AiSimplify feature works correctly, including:

- User interface elements and initial state
- PDF text extraction functionality
- API communication for AI summarization
- Copy to clipboard functionality

## Test Files

The test suite includes three main files:

1. **`Aisimplify-html.test.js`** - Tests the HTML structure and DOM elements

   - Verifies all required UI elements exist
   - Ensures the initial application state is correct

2. **`Aisimplify-action.test.js`** - Tests the JavaScript functionality

   - Mocks the fetch API for testing AI summarization
   - Tests clipboard integration
   - Validates UI state changes

3. **`runAiSimplifyTests.js`** - Test runner script
   - Executes all AiSimplify tests in sequence
   - Provides consolidated test results

## Running the Tests

To run all tests, execute the runner script:

````bash
node tests/pdf/runAiSimplifyTests.js
ç```

To run individual test files:

```bash
node tests/pdf/Aisimplify-html.test.js
node tests/pdf/Aisimplify-action.test.js
````

## Requirements

The tests require the following dependencies:

- Node.js (v14 or higher recommended)
- JSDOM (for simulating a browser environment)

## Test Implementation

The tests use JSDOM to create a virtual DOM environment that simulates a browser. This allows testing JavaScript that would normally run in a browser context.

Key testing techniques used:

- DOM element validation
- Event simulation
- API mocking
- Asynchronous test flows

## Extending the Tests

To add new tests:

1. Add test functions to the existing test files
2. Create new test files and add them to the `testFiles` array in `runAiSimplifyTests.js`
3. Follow the existing pattern of setting up a JSDOM environment

## Troubleshooting

If tests fail, check the following:

- File paths are correct
- JSDOM dependency is installed
- Frontend files (HTML and JS) exist in the expected locations
