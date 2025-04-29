/**
 * AiSimplify Test Runner - Simple Version
 * 
 * This script executes all AiSimplify-related test files.
 * Run with: node tests/pdf/runAiSimplifyTests.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('\n🧪 Starting AiSimplify Tests 🧪\n');

const testFiles = [
  'Aisimplify-html.test.js',
  'Aisimplify-action.test.js'
];

let allPassed = true;

// Run each test file
testFiles.forEach(testFile => {
  const testPath = path.join(__dirname, testFile);
  
  console.log(`\n📋 Running test file: ${testFile}`);
  console.log('═════════════════════════════════════════\n');
  
  try {
    // Execute the test file with stdio inheritance to see output directly
    execSync(`node "${testPath}"`, { stdio: 'inherit' });
    console.log(`\n✅ ${testFile} completed successfully\n`);
  } catch (error) {
    allPassed = false;
    console.error(`\n❌ ${testFile} failed\n`);
  }
});

// Display final results
if (allPassed) {
  console.log('\n🎉 All AiSimplify tests passed! 🎉\n');
} else {
  console.error('\n❌ Some AiSimplify tests failed ❌\n');
  process.exit(1);
} 