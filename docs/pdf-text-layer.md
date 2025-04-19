# PDF Text Layer Implementation

This document describes the implementation of the PDF text layer in SmartWrite, which is designed to optimize PDF text rendering for better performance, searchability, and user experience.

## Overview

PDF.js provides basic text rendering capabilities, but the default implementation creates individual spans for each piece of text, resulting in thousands of DOM elements for a typical page. Our enhanced implementation groups text into logical chunks, reducing DOM elements while maintaining searchability and selectability.

## Implementation Design

### Text Chunking Process

The text layer implementation follows this process:

1. **Text Element Grouping**: First, text elements from PDF.js are grouped by their vertical position (y-coordinate) to identify lines of text.

2. **Line-Based Sorting**: Within each line, text elements are sorted by their horizontal position (x-coordinate) to establish reading order.

3. **Chunk Formation**: Adjacent text elements with similar characteristics (font size, style) are grouped into "chunks" - typically words or phrases.

4. **DOM Element Creation**: A single span element is created for each chunk, rather than for each character or word fragment.

5. **Style Application**: Each chunk span receives appropriate styling, including position, font properties, and a horizontal scale factor.

```javascript
// Pseudocode of the implementation
function renderTextLayer(textContent, viewport) {
    // Group by vertical position (lines)
    const lines = groupByVerticalPosition(textContent.items);
    
    // Process each line
    Object.keys(lines).forEach(baselineY => {
        // Sort by horizontal position
        const lineItems = lines[baselineY].sort((a, b) => a.x - b.x);
        
        // Group into chunks with similar properties
        const chunks = createChunksFromLineItems(lineItems);
        
        // Create and position spans for each chunk
        chunks.forEach(chunk => {
            const span = createSpanForChunk(chunk);
            textLayer.appendChild(span);
        });
    });
}
```

## Style Properties

Each text chunk is styled with the following key properties:

- **Position**: `position: absolute; left: {x}px; top: {y}px;`
- **Font Properties**: `font-size: {size}px; font-family: {family};`
- **Horizontal Scale**: `transform: scaleX(1.0); transform-origin: 0% 0%;`
- **Text Color**: `color: transparent;` (allowing background content to show through)
- **Text Selection**: `user-select: text;`

## Benefits

This implementation provides several benefits:

1. **Reduced DOM Elements**: Fewer DOM elements means better performance and lower memory usage.
2. **Improved Search**: Searching within chunks is more efficient than searching across individual spans.
3. **Better Text Selection**: Users can select logical groups of text instead of disconnected spans.
4. **Consistent Styling**: Text appears more consistent with proper spacing and alignment.
5. **Improved Rendering Performance**: Fewer DOM manipulations means faster rendering.

## Search Integration

The text chunking approach is tightly integrated with the search functionality:

1. **Chunk-Based Search**: The search function looks for matches within each chunk.
2. **Whole Chunk Highlighting**: When a match is found, the entire chunk is highlighted.
3. **Search Navigation**: Users can navigate between highlighted chunks using next/previous buttons.

```javascript
// Pseudocode for search
function searchInTextLayer(textLayer, searchText) {
    const chunks = textLayer.querySelectorAll('.text-chunk');
    const matches = [];
    
    chunks.forEach(chunk => {
        if (chunk.textContent.toLowerCase().includes(searchText.toLowerCase())) {
            // Create highlight overlay
            const highlight = createHighlightElement(chunk);
            matches.push({ chunk, highlight });
        }
    });
    
    return matches;
}
```

## Fallback Mechanisms

To ensure reliability, the implementation includes multiple fallback mechanisms:

1. **Direct Fallback**: The `workspace.html` file contains a direct implementation of the text layer rendering logic that runs if the module-based version fails.

2. **Style Adjustment Fallback**: A separate `adjustTextSpanStyles` function is provided to improve text styling even if the chunking process isn't available.

3. **Browser Search Fallback**: If the custom search implementation fails, the browser's built-in search functionality is used.

## Technical Considerations

### Scale Factor

The horizontal scale factor (scaleX) is set to 1.0 in the current implementation. This value was chosen to:

1. Match the natural width of the text
2. Ensure proper spacing between words
3. Make selection behavior more intuitive

### Text Color

Text is set to transparent to allow proper highlighting and selection while letting the rendered PDF show through. This approach:

1. Allows users to see the underlying PDF content
2. Enables custom highlighting without affecting readability
3. Maintains proper selection behavior

### Performance Optimizations

Several optimizations are applied:

1. **DocumentFragment**: Using document fragments for batch DOM operations
2. **Minimal Style Recalculation**: Setting all styles at once to minimize reflows
3. **Efficient Chunk Detection**: Using heuristics to identify logical chunk boundaries
4. **Lazy Rendering**: Pages are only rendered when they become visible in the viewport

## Customization Options

The text layer implementation can be customized through several parameters:

1. **Tolerance**: The vertical tolerance for grouping text into lines (default: 5px)
2. **Gap Threshold**: The maximum gap between items to consider them part of the same chunk (default: 10px)
3. **Horizontal Scale**: The scale factor applied to text (default: 1.0)

## Best Practices

When working with the text layer implementation:

1. **Don't Modify Original PDF.js Text Content**: The original text content is needed for accurate positioning.
2. **Maintain Scale Factor Consistency**: Use the same scale factor for text rendering and selection.
3. **Test with Different PDF Types**: Different PDFs may have different text structures.
4. **Consider Text Direction**: The implementation assumes left-to-right text; right-to-left would need adjustments.

## Troubleshooting

Common issues and solutions:

1. **Text Misalignment**: Check that the viewport scale matches between canvas and text layer.
2. **Search Not Finding Results**: Verify that the search is looking within the rendered chunks.
3. **Selection Behavior Issues**: Confirm that the text spans have proper user-select properties.
4. **Performance Problems**: Reduce the number of chunks by adjusting the gap threshold.

## Future Improvements

Potential enhancements for future versions:

1. **Language Detection**: Automatically adjust text direction based on detected language.
2. **Smarter Chunking**: Use NLP techniques to identify semantic word boundaries.
3. **Annotation Integration**: Allow annotations to interact properly with the text layer.
4. **Improved Text Selection**: Better handling of multi-line text selection.
5. **Accessibility Enhancements**: Improved screen reader support with ARIA attributes. 