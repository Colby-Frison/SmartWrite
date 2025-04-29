/**
 * Code Quality Test Runner
 * 
 * This script executes tests that analyze code quality aspects
 * such as comment quality, formatting, etc.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('\n🔍 Running Code Quality Tests 🔍\n');

// List of code quality tests to run
const testFiles = [
  'commentQuality.test.js'
];

let allPassed = true;

// Run each test file
testFiles.forEach(testFile => {
  const testPath = path.join(__dirname, testFile);
  
  console.log(`\n📋 Running quality test: ${testFile}`);
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
  console.log('\n🎉 All code quality tests passed! 🎉\n');
} else {
  console.error('\n⚠️ Some code quality tests failed ⚠️\n');
  process.exit(1);
} 