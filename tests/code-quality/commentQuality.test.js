/**
 * Comment Quality Test
 * 
 * This test checks the comment quality across the codebase by:
 * - Scanning files for comments
 * - Analyzing comment-to-code ratio
 * - Checking for descriptive comments
 * - Reporting on comment coverage
 */

const fs = require('fs');
const path = require('path');

// Base directory - adjust as needed
const BASE_DIR = path.resolve(__dirname, '../../');

// File types to check
const FILE_TYPES = ['.js', '.html', '.css'];

// Minimum requirements
const MIN_COMMENT_RATIO = 0.05; // At least 5% comments
const MIN_DESCRIPTIVE_WORDS = 3; // Comments should have at least 3 words on average

// Counters
let totalFiles = 0;
let filesWithGoodComments = 0;
let totalLinesOfCode = 0;
let totalCommentLines = 0;
let descriptiveCommentCount = 0;
let poorCommentCount = 0;

/**
 * Checks if a line is a comment
 * @param {string} line Line of code to check
 * @param {string} fileExt File extension
 * @returns {boolean} True if the line is a comment
 */
function isComment(line, fileExt) {
  const trimmedLine = line.trim();
  
  if (fileExt === '.js') {
    return trimmedLine.startsWith('//') || 
           trimmedLine.startsWith('/*') || 
           trimmedLine.startsWith('*') || 
           trimmedLine.startsWith('*/');
  } else if (fileExt === '.html') {
    return trimmedLine.startsWith('<!--') || 
           trimmedLine.includes('-->') ||
           (trimmedLine.startsWith('//') && trimmedLine.includes('<script'));
  } else if (fileExt === '.css') {
    return trimmedLine.startsWith('/*') || 
           trimmedLine.startsWith('*') || 
           trimmedLine.startsWith('*/');
  }
  
  return false;
}

/**
 * Check if a comment is descriptive
 * @param {string} comment The comment text
 * @returns {boolean} True if the comment is descriptive
 */
function isDescriptiveComment(comment) {
  // Remove comment symbols and trim
  let cleanComment = comment
    .replace(/^\/\/\s*/, '')
    .replace(/^\/\*\s*/, '')
    .replace(/\s*\*\/$/, '')
    .replace(/^\*\s*/, '')
    .replace(/^<!--\s*/, '')
    .replace(/\s*-->$/, '')
    .trim();
  
  // Skip empty comments
  if (!cleanComment) return false;
  
  // Skip comments that are just separators
  if (/^[=\-*/#]+$/.test(cleanComment)) return false;
  
  // Count words (simple approximation)
  const words = cleanComment.split(/\s+/).filter(word => word.length > 1);
  
  return words.length >= MIN_DESCRIPTIVE_WORDS;
}

/**
 * Analyze a file for comment quality
 * @param {string} filePath Path to the file
 */
function analyzeFile(filePath) {
  try {
    const fileExt = path.extname(filePath);
    
    if (!FILE_TYPES.includes(fileExt)) return;
    
    totalFiles++;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let fileCodeLines = 0;
    let fileCommentLines = 0;
    let fileDescriptiveComments = 0;
    let filePoorComments = 0;
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return; // Skip empty lines
      
      if (isComment(line, fileExt)) {
        fileCommentLines++;
        totalCommentLines++;
        
        if (isDescriptiveComment(line)) {
          fileDescriptiveComments++;
          descriptiveCommentCount++;
        } else {
          filePoorComments++;
          poorCommentCount++;
        }
      } else {
        fileCodeLines++;
      }
    });
    
    totalLinesOfCode += fileCodeLines;
    
    // Calculate comment ratio for this file
    const commentRatio = fileCommentLines / (fileCodeLines + fileCommentLines);
    const descriptiveRatio = fileDescriptiveComments / (fileCommentLines || 1);
    
    // Determine if this file has good comments
    const hasGoodComments = commentRatio >= MIN_COMMENT_RATIO && descriptiveRatio >= 0.5;
    
    if (hasGoodComments) {
      filesWithGoodComments++;
    }
    
    console.log(`Analyzed: ${path.relative(BASE_DIR, filePath)}`);
    console.log(`  - Comment ratio: ${(commentRatio * 100).toFixed(1)}%`);
    console.log(`  - Descriptive comments: ${(descriptiveRatio * 100).toFixed(1)}%`);
    console.log(`  - Quality: ${hasGoodComments ? '✅ Good' : '⚠️ Needs improvement'}`);
    console.log();
    
  } catch (error) {
    console.error(`Error analyzing ${filePath}: ${error.message}`);
  }
}

/**
 * Recursively scan directories for files to analyze
 * @param {string} dirPath Directory path to scan
 */
function scanDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Skip node_modules and other non-project directories
      if (entry.isDirectory()) {
        if (
          entry.name !== 'node_modules' && 
          entry.name !== '.git' && 
          !entry.name.startsWith('.')
        ) {
          scanDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        analyzeFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}: ${error.message}`);
  }
}

// Run the comment quality test
console.log('=== Running Comment Quality Test ===\n');

// Start scanning from these directories
const dirsToScan = [
  path.join(BASE_DIR, 'frontend'),
  path.join(BASE_DIR, 'backend')
];

// Scan each directory
dirsToScan.forEach(dir => {
  if (fs.existsSync(dir)) {
    scanDirectory(dir);
  }
});

// Calculate final statistics
const overallCommentRatio = totalCommentLines / (totalLinesOfCode + totalCommentLines);
const overallDescriptiveRatio = descriptiveCommentCount / (totalCommentLines || 1);
const passRatio = filesWithGoodComments / totalFiles;

// Print report
console.log('\n=== Comment Quality Report ===\n');
console.log(`Files analyzed: ${totalFiles}`);
console.log(`Files with good comments: ${filesWithGoodComments} (${(passRatio * 100).toFixed(1)}%)`);
console.log(`Total lines of code: ${totalLinesOfCode}`);
console.log(`Comment lines: ${totalCommentLines} (${(overallCommentRatio * 100).toFixed(1)}%)`);
console.log(`Descriptive comments: ${descriptiveCommentCount} (${(overallDescriptiveRatio * 100).toFixed(1)}%)`);
console.log(`Poor comments: ${poorCommentCount}`);
console.log();

// Final assessment
if (passRatio >= 0.8 && overallCommentRatio >= MIN_COMMENT_RATIO) {
  console.log('✅ PASSED: Overall comment quality is good');
} else {
  console.log('⚠️ NEEDS IMPROVEMENT: Comment quality could be better');
  
  if (passRatio < 0.8) {
    console.log(`- Too many files (${Math.round((1-passRatio) * 100)}%) have insufficient comments`);
  }
  
  if (overallCommentRatio < MIN_COMMENT_RATIO) {
    console.log(`- Comment-to-code ratio is too low (${(overallCommentRatio * 100).toFixed(1)}%)`);
  }
  
  if (overallDescriptiveRatio < 0.7) {
    console.log(`- Many comments lack description (${Math.round((1-overallDescriptiveRatio) * 100)}%)`);
  }
}

// Exit with appropriate code
process.exit(passRatio >= 0.8 && overallCommentRatio >= MIN_COMMENT_RATIO ? 0 : 1); 