# SmartWrite

## Overview
SmartWrite is an innovative tool that transforms handwritten notes into digital text. Powered by AI technology, it not only converts your handwritten content but also helps improve and organize your notes. The integrated AI assistant can answer questions about your notes, making it a comprehensive solution for a more efficient learning experience

## Features
- Handwritten text to digital conversion
- AI-powered note enhancement
- Intelligent note organization
- Built-in AI assistant for answering questions
- User-friendly desktop interface
- Secure local database storage

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
│       │   └── js/           # Legacy JavaScript
│       │       └── theme.js
│       ├── index.html        # Main entry point
│       ├── workspace.html
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

## Development Notes
- JavaScript code is organized into modular files in `frontend/src/js/`
- Each module handles a specific aspect of the application's functionality
- The main entry point is `frontend/src/js/main.js`
- HTML files in the public directory reference JavaScript files using ES6 modules
- The development server serves the `frontend/public` directory

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
- API keys
- File processing settings

## Getting Started

### Using the Web Interface
1. Open your browser and navigate to http://localhost:8080
2. Upload your handwritten notes through the drag-and-drop interface
3. Use the workspace to view and edit your converted notes
4. Interact with the AI assistant for enhanced note organization

### Using the Desktop Application
1. Launch the SmartWrite application
2. Follow the same steps as the web interface
3. Enjoy additional desktop features like system integration

## Future Developments
We are actively working on several exciting features:
- Cross-device synchronization through cloud database integration
- Customizable AI model selection for the assistant
- Multi-language support
- Mobile application support

## Technical Details
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js with Electron
- Storage: Local database (cloud sync coming soon)
- Language Support: Currently English (expansion planned)

## Community and Support
We value community feedback and engagement. Users can:
- Report issues or bugs
- Submit feature requests
- Ask questions about the product
- Join our community discussions

## Contributing
While SmartWrite is primarily developed by our core team, we welcome community input through our feedback channels. Please visit our community section to:
- Report bugs
- Share suggestions
- Ask questions
- Provide feedback

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