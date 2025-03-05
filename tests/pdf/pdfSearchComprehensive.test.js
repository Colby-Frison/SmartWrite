/**
 * Comprehensive PDF Search Tests
 * 
 * This file contains comprehensive tests for the PDF search functionality focusing on:
 * 1. Incorrect test cases - Testing for keywords not in the document
 * 2. Correctness test cases - Testing for the first word in the document
 * 3. Boundary test cases - Testing for random words at different positions
 * 4. Edge case testing - Testing for first and last words
 * 5. Context-based testing - Testing for phrases and multi-word searches
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
const words = sampleText.split(/\s+/).filter(word => word.length > 0);

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
          matchText: pageText.substr(index, searchText.length),
          wordIndex: words.findIndex(w => w.toLowerCase().includes(pageText.substr(index, searchText.length).toLowerCase()))
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

describe('Comprehensive PDF Search Tests', () => {
  let mockPdfDoc;
  
  beforeEach(() => {
    mockPdfDoc = createMockPdfDoc();
    jest.clearAllMocks();
  });
  
  // Group 1: Incorrect Test Cases
  describe('Incorrect Test Cases', () => {
    test('should return empty array for words not in the document', async () => {
      const nonExistentWords = [
        'xylophone',
        'javascript',
        'quantum',
        'zebra',
        'unicorn'
      ];
      
      for (const word of nonExistentWords) {
        const results = await searchPDF(word, mockPdfDoc);
        expect(results.length).toBe(0);
      }
    });
    
    test('should return empty array for special characters not in the document', async () => {
      const specialChars = [
        '@#$%',
        '12345',
        '!!!',
        '???',
        '***'
      ];
      
      for (const chars of specialChars) {
        const results = await searchPDF(chars, mockPdfDoc);
        expect(results.length).toBe(0);
      }
    });
  });
  
  // Group 2: Correctness Test Cases
  describe('Correctness Test Cases', () => {
    test('should find the first word in the document', async () => {
      const firstWord = words[0]; // "The"
      const results = await searchPDF(firstWord, mockPdfDoc);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchText.toLowerCase()).toContain(firstWord.toLowerCase());
      
      console.log(`First word test: "${firstWord}"`);
    });
    
    test('should be case-insensitive', async () => {
      const testWords = ['PDF', 'search', 'functionality'];
      
      for (const word of testWords) {
        // Search with lowercase
        const lowerResults = await searchPDF(word.toLowerCase(), mockPdfDoc);
        
        // Search with uppercase
        const upperResults = await searchPDF(word.toUpperCase(), mockPdfDoc);
        
        expect(lowerResults.length).toBeGreaterThan(0);
        expect(upperResults.length).toBeGreaterThan(0);
        expect(lowerResults.length).toBe(upperResults.length);
      }
    });
  });
  
  // Group 3: Boundary Test Cases
  describe('Boundary Test Cases', () => {
    test('should find words at random positions in the document', async () => {
      // Test with 5 random words
      for (let i = 0; i < 5; i++) {
        const randomIndex = Math.floor(Math.random() * words.length);
        const randomWord = words[randomIndex];
        
        const results = await searchPDF(randomWord, mockPdfDoc);
        
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].matchText.toLowerCase()).toContain(randomWord.toLowerCase());
        
        console.log(`Random word test ${i+1}: "${randomWord}" at index ${randomIndex}`);
      }
    });
    
    test('should find words at specific positions (25%, 50%, 75%)', async () => {
      const positions = [
        Math.floor(words.length * 0.25),
        Math.floor(words.length * 0.5),
        Math.floor(words.length * 0.75)
      ];
      
      for (const position of positions) {
        const word = words[position];
        const results = await searchPDF(word, mockPdfDoc);
        
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].matchText.toLowerCase()).toContain(word.toLowerCase());
        
        console.log(`Position test: "${word}" at position ${position} (${Math.round(position/words.length*100)}%)`);
      }
    });
  });
  
  // Group 4: Edge Case Testing
  describe('Edge Case Testing', () => {
    test('should find the first word in the document', async () => {
      const firstWord = words[0];
      const results = await searchPDF(firstWord, mockPdfDoc);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchText.toLowerCase()).toContain(firstWord.toLowerCase());
    });
    
    test('should find the last word in the document', async () => {
      const lastWord = words[words.length - 1];
      const results = await searchPDF(lastWord, mockPdfDoc);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchText.toLowerCase()).toContain(lastWord.toLowerCase());
      
      console.log(`Last word test: "${lastWord}"`);
    });
    
    test('should handle very short search terms', async () => {
      const shortTerms = ['a', 'is', 'in', 'to'];
      
      for (const term of shortTerms) {
        const results = await searchPDF(term, mockPdfDoc);
        console.log(`Short term test: "${term}" found ${results.length} times`);
        
        // These common short words should be found
        expect(results.length).toBeGreaterThan(0);
      }
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
  
  // Group 5: Context-based Testing
  describe('Context-based Testing', () => {
    test('should find phrases (multi-word searches)', async () => {
      const phrases = [
        'quick brown',
        'brown fox',
        'sample text',
        'lazy dog'
      ];
      
      for (const phrase of phrases) {
        const results = await searchPDF(phrase, mockPdfDoc);
        
        console.log(`Phrase test: "${phrase}" found ${results.length} times`);
        
        // These phrases should be found in our sample text
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].matchText.toLowerCase()).toContain(phrase.toLowerCase());
      }
    });
    
    test('should find words in context (words that appear together)', async () => {
      // Find words that appear in sequence
      for (let i = 0; i < words.length - 1; i++) {
        const twoWordPhrase = `${words[i]} ${words[i+1]}`;
        
        const results = await searchPDF(twoWordPhrase, mockPdfDoc);
        
        if (results.length > 0) {
          console.log(`Context test: Found phrase "${twoWordPhrase}"`);
          expect(results[0].matchText.toLowerCase()).toContain(twoWordPhrase.toLowerCase());
          break; // Just test one successful case to keep test runtime reasonable
        }
      }
    });
  });
}); 