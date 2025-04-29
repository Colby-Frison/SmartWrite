/**
 * AiSimplify HTML Tests - Simple Version
 * 
 * Basic tests for the AiSimplify HTML structure
 */

const fs = require('fs');
const path = require('path');

// Test utilities
const assert = function(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
};

// Path to HTML file
const htmlPath = path.resolve(__dirname, '../../frontend/public/AiSimplify.html');

// Run the tests
console.log('\n=== Running AiSimplify HTML Tests ===\n');

try {
  // Test 1: Verify HTML file exists
  const fileExists = fs.existsSync(htmlPath);
  assert(fileExists, 'AiSimplify.html file exists');

  // Test 2: Load and check HTML content
  const html = fs.readFileSync(htmlPath, 'utf-8');
  
  // Test 3: Check for required elements
  assert(html.includes('id="uploadBtn"'), 'Upload button exists in HTML');
  assert(html.includes('id="pdfInput"'), 'PDF input exists in HTML');
  assert(html.includes('id="extractedText"'), 'Text area exists in HTML');
  assert(html.includes('id="runSimplify"'), 'Simplify button exists in HTML');
  assert(html.includes('id="copyBtn"'), 'Copy button exists in HTML');
  assert(html.includes('id="uploadView"'), 'Upload view exists in HTML');
  assert(html.includes('id="result"'), 'Result view exists in HTML');
  
  // Test 4: Check that necessary scripts are included
  assert(html.includes('pdf.min.js'), 'PDF.js is included');
  assert(html.includes('aisimplify-action.js'), 'AiSimplify action script is included');
  
  console.log('\n✅ All AiSimplify HTML tests passed!\n');
} catch (error) {
  console.error('\n❌ AiSimplify HTML tests failed:', error.message);
  process.exit(1);
} 