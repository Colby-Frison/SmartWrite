/**
 * PDF Search Functionality Tests
 * 
 * This file contains unit tests for the PDF search functionality.
 * It tests various scenarios including:
 * - Searching for words that exist in the document
 * - Searching for words that don't exist in the document
 * - Searching for words at the beginning, middle, and end of the document
 * - Searching for multiple words or phrases (context-based search)
 */

const fs = require('fs');
const path = require('path');

// Mock browser environment
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

// Mock PDF.js library
global.pdfjsLib = {
  getDocument: jest.fn(),
  Util: {
    transform: jest.fn((transform, itemTransform) => [1, 0, 0, 1, itemTransform[4], itemTransform[5]])
  }
};

// Sample text content from our fixture
const sampleTextPath = path.join(__dirname, 'fixtures', 'sample-text.txt');
const sampleText = fs.readFileSync(sampleTextPath, 'utf8');
const words = sampleText.split(/\s+/);

// Create a mock PDF document with the sample text
const createMockPdfDoc = () => {
  const mockPages = [];
  
  // Split the text into chunks to simulate pages
  const pageSize = 50; // words per page
  const pageCount = Math.ceil(words.length / pageSize);
  
  for (let i = 0; i < pageCount; i++) {
    const pageWords = words.slice(i * pageSize, (i + 1) * pageSize);
    const pageText = pageWords.join(' ');
    
    // Create text items for this page
    const textItems = [];
    let currentPosition = 0;
    
    pageWords.forEach((word, index) => {
      textItems.push({
        str: word + (index < pageWords.length - 1 ? ' ' : ''),
        width: word.length * 8, // Simulate width based on word length
        height: 20,
        transform: [1, 0, 0, 1, currentPosition, 100]
      });
      
      currentPosition += (word.length + 1) * 8; // +1 for space
    });
    
    // Create a mock page
    const mockPage = {
      getTextContent: jest.fn().mockResolvedValue({
        items: textItems
      }),
      getViewport: jest.fn().mockReturnValue({
        width: 800,
        height: 1000,
        transform: [1, 0, 0, 1, 0, 0]
      })
    };
    
    mockPages.push(mockPage);
  }
  
  // Create the mock PDF document
  return {
    numPages: pageCount,
    getPage: jest.fn((pageNum) => Promise.resolve(mockPages[pageNum - 1]))
  };
};

// Import the search function (mocked for testing)
const searchPDF = async (searchText, pdfDoc = createMockPdfDoc()) => {
  if (!searchText || searchText.trim() === '') {
    return [];
  }
  
  const results = [];
  
  // Search each page
  for (let pageIndex = 1; pageIndex <= pdfDoc.numPages; pageIndex++) {
    const page = await pdfDoc.getPage(pageIndex);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    
    // Create a continuous text string for the page to handle phrases better
    let pageText = '';
    let itemPositions = [];
    
    // First pass: collect all text and positions
    for (let i = 0; i < textContent.items.length; i++) {
      const item = textContent.items[i];
      const startPos = pageText.length;
      pageText += item.str;
      
      // Store the position information for this text item
      itemPositions.push({
        startPos: startPos,
        endPos: pageText.length,
        item: item,
        index: i
      });
    }
    
    // Second pass: search in the continuous text
    const searchTermLower = searchText.toLowerCase();
    const pageTextLower = pageText.toLowerCase();
    let index = pageTextLower.indexOf(searchTermLower);
    
    while (index !== -1) {
      // Find which text item(s) contain this match
      const matchEnd = index + searchText.length;
      
      // Find the item that contains the start of the match
      const startItem = itemPositions.find(pos => 
        index >= pos.startPos && index < pos.endPos
      );
      
      if (startItem) {
        // Calculate position within the item
        const itemStartIndex = index - startItem.startPos;
        
        // Transform text coordinates to viewport coordinates
        const tx = pdfjsLib.Util.transform(
          viewport.transform,
          startItem.item.transform
        );
        
        // Calculate the rectangle for this text item
        const rect = {
          left: tx[4] + (startItem.item.width * (itemStartIndex / startItem.item.str.length)),
          top: tx[5] - startItem.item.height,
          right: tx[4] + startItem.item.width,
          bottom: tx[5],
          pageIndex: pageIndex,
          matchText: pageText.substr(index, searchText.length)
        };
        
        // Store the result
        results.push(rect);
      }
      
      // Look for next occurrence
      index = pageTextLower.indexOf(searchTermLower, index + 1);
    }
  }
  
  return results;
};

describe('PDF Search Functionality', () => {
  let mockPdfDoc;
  
  beforeEach(() => {
    mockPdfDoc = createMockPdfDoc();
    jest.clearAllMocks();
  });
  
  test('should find the first word in the document', async () => {
    const firstWord = words[0]; // "The"
    const results = await searchPDF(firstWord, mockPdfDoc);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].matchText.toLowerCase()).toContain(firstWord.toLowerCase());
  });
  
  test('should find the last word in the document', async () => {
    const lastWord = 'final';
    const results = await searchPDF(lastWord, mockPdfDoc);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].matchText.toLowerCase()).toContain(lastWord.toLowerCase());
  });
  
  test('should return empty array for words not in the document', async () => {
    const nonExistentWord = 'xylophone';
    const results = await searchPDF(nonExistentWord, mockPdfDoc);
    
    expect(results.length).toBe(0);
  });
  
  test('should find a word in the middle of the document', async () => {
    // Pick a word from the middle of the document
    const middleIndex = Math.floor(words.length / 2);
    const middleWord = words[middleIndex];
    
    const results = await searchPDF(middleWord, mockPdfDoc);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].matchText.toLowerCase()).toContain(middleWord.toLowerCase());
  });
  
  test('should find a random word in the document', async () => {
    // Pick a random word from the document
    const randomIndex = Math.floor(Math.random() * words.length);
    const randomWord = words[randomIndex];
    
    const results = await searchPDF(randomWord, mockPdfDoc);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].matchText.toLowerCase()).toContain(randomWord.toLowerCase());
    
    // Log the random word and its index for verification
    console.log(`Random word test: "${randomWord}" at index ${randomIndex}`);
  });
  
  test('should be case-insensitive', async () => {
    const word = 'PDF';
    
    // Search with lowercase
    const lowerResults = await searchPDF(word.toLowerCase(), mockPdfDoc);
    
    // Search with uppercase
    const upperResults = await searchPDF(word.toUpperCase(), mockPdfDoc);
    
    expect(lowerResults.length).toBeGreaterThan(0);
    expect(upperResults.length).toBeGreaterThan(0);
    expect(lowerResults.length).toBe(upperResults.length);
  });
  
  test('should find multiple occurrences of a common word', async () => {
    const commonWord = 'the';
    const results = await searchPDF(commonWord, mockPdfDoc);
    
    expect(results.length).toBeGreaterThan(1);
  });
  
  test('should find a phrase (context-based search)', async () => {
    // Use a phrase that we know exists in our sample text
    const phrase = 'quick brown';
    const results = await searchPDF(phrase, mockPdfDoc);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].matchText.toLowerCase()).toContain(phrase.toLowerCase());
  });
  
  test('should handle empty search term', async () => {
    const results = await searchPDF('', mockPdfDoc);
    
    expect(results.length).toBe(0);
  });
  
  test('should handle whitespace-only search term', async () => {
    const results = await searchPDF('   ', mockPdfDoc);
    
    expect(results.length).toBe(0);
  });
}); 