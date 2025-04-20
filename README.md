# SmartWrite

## Overview
SmartWrite is an innovative document processing and AI-powered workspace that helps you analyze, edit, and interact with various document types. With integrated AI assistants, PDF viewing capabilities, and markdown editing features, it offers a comprehensive environment for working with documents and notes.

## Features
- Advanced document analysis and processing
- Multiple AI assistant models with intelligent fallbacks
- Rich PDF viewer with search and navigation capabilities
- Markdown editing and preview functionality
- User-friendly desktop and web interfaces
- Theme customization and dark mode support
- Secure local storage with optional cloud sync
- File tree navigation and organization
- Smart AI model management with automatic fallbacks

## Project Structure
```
SmartWrite/
├── frontend/
│   ├── src/
│   │   ├── js/                # Modular JavaScript files
│   │   │   ├── main.js        # Main entry point
│   │   │   ├── state.js       # Shared state management
│   │   │   ├── modal.js       # Modal functionality
│   │   │   ├── settings.js    # Settings functionality
│   │   │   ├── sidebar.js     # Sidebar functionality
│   │   │   ├── theme.js       # Theme functionality
│   │   │   ├── chat.js        # Chat functionality
│   │   │   ├── pdf.js         # PDF viewer functionality
│   │   │   └── files.js       # File management functionality
│   └── public/
│       ├── assets/
│       │   ├── styles/        # CSS stylesheets
│       │   │   ├── style.css
│       │   │   └── workspace.css
│       │   └── js/           # JavaScript modules
│       │       ├── theme.js
│       │       └── model-manager.js  # AI model management
│       ├── index.html        # Main entry point
│       ├── workspace.html    # Main workspace interface
│       └── ... (other HTML files)
├── backend/
│   └── src/
│       └── js/              # Node.js/Electron backend
│           ├── main.js      # Main Electron process
│           └── preload.js   # Electron preload script
├── .env                     # Environment configuration
├── .gitignore
└── package.json            # Project dependencies and scripts
```

## PDF Viewer Features
The SmartWrite PDF viewer includes advanced functionality:

- **PDF.js Integration**: Uses Mozilla's PDF.js library for reliable PDF rendering
- **Text Layer Optimization**: Enhanced text layer with improved text grouping and positioning
- **Search Functionality**: Search within PDF documents with highlighted results
- **Search Navigation**: Navigate between search results with next/previous buttons
- **Zoom Controls**: Adjust zoom level for better readability
- **Responsive Layout**: Adapts to different screen sizes
- **Fallback Mechanisms**: Ensures functionality even when primary modules fail to load

## Markdown Editor Features
The application includes a full-featured markdown editor:

- **Live Preview**: Real-time rendering of markdown as you type
- **Split View Mode**: Edit and preview simultaneously
- **Syntax Highlighting**: Code syntax highlighting using Prism.js
- **File Management**: Save, load, and create markdown documents
- **CodeMirror Integration**: Powerful text editing capabilities
- **View Modes**: Choose between edit, preview, or split modes

## AI Model Management
The application features a robust AI model management system:

- **Multiple Model Support**: Integrates with various AI models (GPT-4, GPT-3.5, Claude 3, Gemini Pro)
- **Automatic Fallbacks**: Switches to alternative models when the primary model fails
- **Error Handling**: Tracks errors and disables problematic models after repeated failures
- **User Notifications**: Provides clear UI notifications about model switches and errors
- **Customizable Settings**: Allows users to select preferred AI models
- **Persistence**: Remembers user model preferences across sessions
- **Experimental Models**: Support for beta/experimental AI models with appropriate UI indicators

## Development Notes
- JavaScript code is organized into modular files in `frontend/src/js/`
- Each module handles a specific aspect of the application's functionality
- The main entry point is `frontend/src/js/main.js`
- HTML files in the public directory reference JavaScript files using ES6 modules
- The development server serves the `frontend/public` directory
- PDF viewer implementation provides multiple fallback mechanisms for reliability
- Model management is handled by the `model-manager.js` module
- Fallback implementations are provided for critical functionality

## Development Setup

### Prerequisites
- Node.js (Latest LTS version recommended)
- npm or yarn package manager
  - For detailed npm installation instructions, see the [official npm documentation](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

### Installation
1. Clone the repository:
```bash
git clone https://github.com/yourusername/SmartWrite.git
cd SmartWrite
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file:
```bash
cp .env.example .env  # Then edit .env with your configuration
```

### Running the Application

#### Web Development Mode
To run the application in web development mode:
```bash
npm run dev
```
This will start a development server at http://localhost:8080

#### Desktop Development Mode
To run the application as an Electron desktop app:
```bash
npm start
```

### Building
To create a production build:
```bash
npm run build
```

## Environment Configuration
The application uses a .env file for configuration. Key configurations include:
- Development mode settings
- Server configuration (port, host)
- API keys and model configurations
- File processing settings
- Feature flags for experimental features

## PDF Module Architecture
The PDF functionality is implemented with multiple layers of fallbacks:

1. **Primary Implementation**: Uses the modular PDF.js module in `frontend/src/js/pdf.js`
2. **Direct Fallback**: Implements critical functions directly in workspace.html
3. **Browser Fallback**: Uses built-in browser capabilities when available

This architecture ensures that core functionality remains available even if one layer fails.

## Application Architecture

SmartWrite implements primarily an Event-Driven Architecture with elements of a Layered Architecture.

### Event-Driven Architecture

The application's core functionality is built around an event-driven model where components interact primarily through events rather than direct method calls:

1. **Event Sources**:
   - User interactions (clicks, typing, file selection)
   - System events (file loading, AI model responses)
   - Document state changes (rendering completion, content updates)
   - Timers and network responses

2. **Event Flow**:
   - Events are dispatched by source components
   - Event listeners pick up and process these events
   - Processing can trigger additional events
   - The flow is non-linear and reactive to user actions

3. **Key Event Examples**:
   - File selection events trigger document rendering pipelines
   - UI interaction events (modal opening/closing, tab switching)
   - AI model switching events propagate through the system
   - Document rendering completion events trigger post-processing

4. **Benefits**:
   - Loose coupling between components
   - Enhanced modularity and maintainability
   - Flexibility to add or modify features with minimal impact
   - Improved resilience through component isolation

### Layered Architecture Elements

While primarily event-driven, the application incorporates layered architecture principles for clarity and separation of concerns:

1. **Presentation Layer**:
   - HTML templates and structure (`workspace.html`, `index.html`)
   - CSS styling and theming (`assets/styles/`)
   - Direct user interaction handlers
   - Modal and UI component management
   - Event listeners that interface with users

2. **Business Logic Layer**:
   - Document processing logic (`pdf.js`)
   - AI model management (`model-manager.js`)
   - File type detection and handling
   - Search functionality implementation
   - State management and business rules

3. **Data Layer**:
   - File system interactions
   - Local storage management
   - Document content management
   - Configuration persistence
   - Model settings storage

### Component Interactions

Components interact through a combination of events, direct method calls, and shared state:

1. **Model Manager ↔ Chat Interface**:
   - Chat inputs trigger model requests through the model manager
   - Model manager handles model selection, fallbacks, and error recovery
   - Responses are passed back to the chat interface via callbacks
   - UI notifications inform users of model status and switches

2. **PDF Viewer ↔ Document State**:
   - File loading events trigger PDF rendering pipeline
   - Rendering events update the document state
   - Search functionality interacts with rendered document
   - Multiple fallback mechanisms ensure reliability

3. **UI Components ↔ Application State**:
   - UI interactions update application state
   - State changes trigger UI updates
   - Modal system manages focused interactions
   - Theme system handles appearance changes

4. **File System ↔ Document Management**:
   - File selection events trigger appropriate handlers
   - Content is loaded and processed based on file type
   - File tree updates reflect filesystem changes
   - Document state persists relevant file information

### Resilience Patterns

The architecture implements several resilience patterns:

1. **Fallback Chains**:
   - PDF module implements multiple fallback mechanisms
   - AI model manager provides automatic model switching
   - UI components gracefully degrade when features are unavailable

2. **Error Recovery**:
   - Model errors trigger fallback to alternative models
   - Document loading errors provide clear user feedback
   - System automatically attempts to recover from transient issues

3. **State Persistence**:
   - User preferences are stored in local storage
   - Document state is preserved when possible
   - Application can recover from interruptions

### Architecture Summary

SmartWrite's architecture combines event-driven responsiveness with layered organization to create a resilient, maintainable application. By prioritizing loose coupling through events while maintaining clear separation of concerns through layers, the system achieves both flexibility and structure.

## Getting Started

### Using the Web Interface
1. Open your browser and navigate to http://localhost:8080
2. Use the file navigation tree to open or create documents
3. For PDFs, utilize the search functionality to find content within documents
4. For markdown files, switch between edit and preview modes as needed
5. Interact with the AI assistant by using the chat interface in the sidebar

### Using the Desktop Application
1. Launch the SmartWrite application
2. Follow the same steps as the web interface
3. Enjoy additional desktop features like system integration and improved file access

## Current Development Focus
We are currently focused on the following areas:

- **Stability & Resilience**: Enhancing the fallback mechanisms and error recovery
- **UI/UX Improvements**: Refining the user interface and experience
- **AI Integration**: Expanding the model manager to support more AI providers
- **Performance Optimization**: Improving PDF rendering and search performance
- **Accessibility**: Making the application more accessible to all users

## Technical Details
- **Frontend**: HTML5, CSS3, Modern JavaScript (ES6+)
- **UI Framework**: Custom components with vanilla JavaScript
- **PDF Processing**: PDF.js with custom extensions
- **Markdown**: Marked.js for parsing, CodeMirror for editing
- **Theme System**: CSS variables with dynamic switching
- **AI Integration**: Model-agnostic interface supporting multiple providers
- **Storage**: Browser local storage with optional filesystem access
- **Build System**: Webpack with Babel for transpilation

## Community and Support
We value community feedback and engagement. Users can:
- Report issues or bugs via GitHub Issues
- Submit feature requests through our feedback form
- Ask questions about the product in our community forum

## Contributing
We welcome contributions from the community:
- For bug reports, please use the issue template on GitHub
- For feature requests, please describe the use case and expected behavior


## Branching Strategy
Our development follows a structured branching strategy:

1. **Feature Branches**: Each new feature has a primary branch labeled with the feature name (e.g., `feature/note-organization`).

2. **Frontend and Backend Branches**: Each feature branch has two sub-branches:
   - `feature/[feature-name]/frontend` - For all frontend-related development
   - `feature/[feature-name]/backend` - For all backend-related development

3. **Workflow**:
   - Development begins in the respective frontend and backend branches
   - When a component is complete, it's merged back to the primary feature branch
   - Once the entire feature is tested and ready, the feature branch is merged to main

This approach allows for parallel development of frontend and backend components while maintaining clear separation of concerns.

## License
License information coming soon.

---
*SmartWrite - Transform Your Notes, Enhance Your Learning*