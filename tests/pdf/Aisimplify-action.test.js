/**
 * AiSimplify Action Tests - Simple Version
 * 
 * Basic tests for the aisimplify-action.js functionality.
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

// Run the tests
console.log('\n=== Running AiSimplify Action Tests ===\n');

try {
  // Simple test 1: Verify the action.js file exists
  const jsPath = path.resolve(__dirname, '../../frontend/public/js/aisimplify-action.js');
  const fileExists = fs.existsSync(jsPath);
  assert(fileExists, 'aisimplify-action.js file exists');
  
  // Simple test 2: Check that file contains key function calls
  const jsContent = fs.readFileSync(jsPath, 'utf-8');
  assert(jsContent.includes('fetch('), 'File contains fetch API call');
  assert(jsContent.includes('showLoading'), 'File contains showLoading function');
  assert(jsContent.includes('hideLoading'), 'File contains hideLoading function');
  assert(jsContent.includes('navigator.clipboard'), 'File contains clipboard functionality');
  
  // Simple test 3: Verify event listeners are attached
  assert(jsContent.includes('addEventListener'), 'File contains event listeners');
  assert(jsContent.includes('runSimplify'), 'File references simplify button');
  assert(jsContent.includes('copyBtn'), 'File references copy button');
  
  console.log('\n✅ All AiSimplify Action tests passed!\n');
} catch (error) {
  console.error('\n❌ AiSimplify Action tests failed:', error.message);
  process.exit(1);
} 