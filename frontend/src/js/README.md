# JavaScript Module Structure

This directory contains the modular JavaScript files for the SmartWrite application. Each file is responsible for a specific aspect of the application's functionality.

## Module Overview

- **main.js**: The entry point that initializes all other modules and sets up global functions.
- **state.js**: Manages shared state between modules to avoid circular dependencies.
- **modal.js**: Handles modal dialogs (opening, closing, and event handling).
- **settings.js**: Manages application settings and user preferences.
- **sidebar.js**: Controls the sidebar functionality, including toggling and resizing.
- **theme.js**: Handles theme switching between light and dark modes.
- **chat.js**: Manages the chat interface and message handling.
- **pdf.js**: Controls PDF viewing, text rendering, search, and navigation.
- **files.js**: Handles file and folder management (creating, sorting, etc.).

## PDF.js Module

The `pdf.js` module has been significantly enhanced to provide robust PDF viewing capabilities:

### Key Functions

- **loadPDF(url)**: Loads and renders a PDF from a URL
- **renderPageToContainer(pageNum)**: Renders a single page with text layer
- **adjustTextSpanStyles(textLayer)**: Optimizes text positioning and styling
- **searchPDF(searchText)**: Searches for text within the PDF
- **setZoomLevel(zoom)**: Adjusts the zoom level and re-renders the PDF

### Text Layer Implementation

The text layer implementation has been improved to:

1. Group text items by vertical position (lines)
2. Sort text items within each line by horizontal position
3. Group adjacent text items with similar characteristics into chunks
4. Render chunks instead of individual characters for better performance

This approach reduces DOM element count while maintaining text searchability and selectability.

### Search Implementation

The search functionality now:

1. Identifies chunks containing the search text
2. Creates highlight elements that overlay the matching chunks
3. Provides navigation between matches
4. Displays matching text count and current position

### Fallback Mechanisms

The system includes multiple fallbacks:

1. Primary implementation in `pdf.js` module
2. Direct fallback implementation in `workspace.html`
3. Browser fallback using built-in capabilities when available

## Module Dependencies

```
main.js
 ├── state.js (shared by all modules)
 ├── modal.js
 ├── settings.js (depends on modal.js, state.js)
 ├── sidebar.js
 ├── theme.js (depends on state.js)
 ├── chat.js
 ├── pdf.js (depends on state.js)
 └── files.js (depends on modal.js)
```

## How to Add New Functionality

1. Determine which existing module should contain the new functionality
2. If it doesn't fit in any existing module, create a new module file
3. Add the necessary imports at the top of your module
4. Implement your functionality
5. Export the functions that need to be used by other modules
6. Import your module in main.js if needed
7. Make functions globally available in main.js if they need to be called from HTML

## Best Practices

- Keep modules focused on a single responsibility
- Use clear, descriptive function names
- Document complex functions with comments
- Initialize event listeners in a dedicated init function for each module
- Export only what's necessary for other modules to use
- Use the state.js module for sharing state between modules to avoid circular dependencies
- Implement fallback mechanisms for critical functionality
- Use progressive enhancement for optional features 