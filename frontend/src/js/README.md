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
- **pdf.js**: Controls PDF viewing, navigation, and zooming.
- **files.js**: Handles file and folder management (creating, sorting, etc.).

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