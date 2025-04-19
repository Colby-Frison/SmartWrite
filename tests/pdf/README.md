# PDF Search Tests

This directory contains unit tests for the PDF search functionality in SmartWrite.

## Test Structure

The tests are organized as follows:

- `fixtures/` - Contains sample text files and PDFs used for testing
- `pdfSearch.test.js` - Basic tests for PDF search functionality
- `pdfSearchComprehensive.test.js` - Comprehensive tests covering incorrect, boundary, and edge cases
- `textLayerRendering.test.js` - Tests for the new text layer rendering implementation
- `runTests.js` - Script to run all tests

## Test Categories

The tests cover the following categories:

1. **Incorrect Test Cases** - Testing for keywords not in the document
2. **Correctness Test Cases** - Testing for the first word in the document
3. **Boundary Test Cases** - Testing for random words at different positions
4. **Edge Case Testing** - Testing for first and last words
5. **Context-based Testing** - Testing for phrases and multi-word searches
6. **Text Layer Testing** - Testing for proper text chunking and positioning
7. **Search Highlighting** - Testing for proper highlight positioning and styling

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

## Text Layer Implementation

The tests now also verify the new text layer implementation, which includes:

- **Text Chunking** - Testing that text is properly grouped into logical chunks
- **Line Detection** - Testing that text is correctly grouped by vertical position
- **Positioning** - Testing that chunks are correctly positioned on the page
- **Style Application** - Testing that styles are correctly applied to text chunks
- **Scale Factor** - Testing that the horizontal scale factor is correctly applied

## Test Fixtures

The tests use a combination of:

- Sample text files (`fixtures/sample-text.txt`) to simulate PDF content
- Real PDF files with various layouts and content types
- Mock DOM elements to simulate the browser environment

## Mock Implementation

Since the actual PDF search functionality relies on PDF.js and browser DOM elements, the tests use mock implementations to simulate the behavior of these dependencies. This allows us to test the search algorithm independently of the browser environment.

## Test Results

The tests output information about:

- Text chunking quality and accuracy
- Search results accuracy and position
- Highlight rendering and positioning
- Performance metrics for rendering and searching

## Implementation Notes

### Text Layer Implementation

The text layer works by:

1. Grouping text items by vertical position to create lines
2. Sorting items within each line by horizontal position
3. Grouping adjacent items with similar characteristics into chunks
4. Creating span elements for each chunk with the appropriate styling
5. Positioning the spans absolutely within the text layer

This chunking approach reduces the number of DOM elements while maintaining text searchability and selectability.

### Search Implementation

The search function works by:

1. Searching for the term in each text chunk
2. Creating highlight elements for chunks containing matches
3. Positioning the highlights over the matching chunks
4. Adding navigation functionality to move between matches

This approach allows searching to work reliably with the new text chunking implementation.

## Fallback Mechanisms

The tests also verify the fallback mechanisms:

1. **Direct Fallback** - Testing that critical functions are available directly in workspace.html
2. **Module Fallback** - Testing the automatic loading of the PDF.js module
3. **Browser Fallback** - Testing the use of browser capabilities when available

These fallbacks ensure that PDF functionality remains available even if one layer fails. 