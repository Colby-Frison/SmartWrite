# PDF Search Tests

This directory contains unit tests for the PDF search functionality in SmartWrite.

## Test Structure

The tests are organized as follows:

- `fixtures/` - Contains sample text files used for testing
- `pdfSearch.test.js` - Basic tests for PDF search functionality
- `pdfSearchComprehensive.test.js` - Comprehensive tests covering incorrect, boundary, and edge cases
- `runTests.js` - Script to run all tests

## Test Categories

The tests cover the following categories:

1. **Incorrect Test Cases** - Testing for keywords not in the document
2. **Correctness Test Cases** - Testing for the first word in the document
3. **Boundary Test Cases** - Testing for random words at different positions
4. **Edge Case Testing** - Testing for first and last words
5. **Context-based Testing** - Testing for phrases and multi-word searches

## Running the Tests

You can run the tests using Jest:

```bash
# Run all tests
npm test

# Run PDF search tests specifically
npx jest tests/pdf

# Run a specific test file
npx jest tests/pdf/pdfSearch.test.js
```

## Test Fixtures

The tests use a sample text file (`fixtures/sample-text.txt`) to simulate PDF content. This file contains various words and phrases that are used for testing different search scenarios.

## Mock Implementation

Since the actual PDF search functionality relies on PDF.js and browser DOM elements, the tests use mock implementations to simulate the behavior of these dependencies. This allows us to test the search algorithm independently of the browser environment.

## Test Results

The tests output information about the search results, including:

- Number of matches found
- Position of matches in the document
- Text content of matches

This information can be used to verify that the search functionality is working correctly.

## Test Summary

All tests are currently passing. The test suite verifies that:

1. The search function correctly finds words at the beginning, middle, and end of the document
2. The search function returns empty results for words not in the document
3. The search function is case-insensitive
4. The search function can find multiple occurrences of common words
5. The search function can find phrases (multi-word searches)
6. The search function handles edge cases like empty search terms and very short words

## Implementation Notes

The search function works by:

1. Creating a continuous text string for each page
2. Searching for the term in the continuous text
3. Mapping the search results back to the original text items
4. Calculating the position and dimensions of the search results
5. Returning the search results with page information

This approach allows for accurate searching of phrases that might span multiple text items in the PDF. 