# SmartWrite

SmartWrite is an AI-powered writing assistant built with Django and Electron. It combines the power of modern AI with a sleek desktop interface to help users write, edit, and enhance their documents intelligently.

## Features

- AI-powered writing assistance
- Real-time markdown preview
- Document organization and management
- Cross-platform desktop application
- Secure and private document handling
- Customizable writing environment

## Technology Stack

- **Backend:**
  - FastAPI for the REST API
  - Python 3.8+
  - Google's Generative AI (Gemini) integration
  - uvicorn for ASGI server

- **Frontend:**
  - Electron for cross-platform desktop app
  - HTML/CSS/JavaScript
  - Custom templating system

## Project Structure

```
SmartWrite/
├── backend/                    # Django backend
│   ├── smartwrite/            # Main Django project
│   │   ├── api/              # API views and endpoints
│   │   ├── core/             # Core application logic
│   │   └── templates/        # Django templates
│   ├── tests/                # Backend tests
│   │   ├── unit/
│   │   └── integration/
│   ├── manage.py
│   └── requirements.txt
│
├── electron/                  # Electron desktop app
│   ├── src/
│   │   ├── main.js          # Main process
│   │   └── preload.js       # Preload scripts
│   └── package.json
│
└── frontend/                 # Frontend assets
    ├── static/
    │   ├── css/
    │   ├── js/
    │   └── images/
    └── templates/           # HTML templates
```

## Comprehensive Setup Guide

### Prerequisites

Before starting the setup, ensure you have the following installed:
- Python 3.8 or higher
- Node.js 14.x or higher
- npm 6.x or higher
- Git

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/SmartWrite.git
   cd SmartWrite
   ```

2. Create and configure the environment file:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

### Backend Setup

1. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

4. Start the Django development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Install Node.js dependencies:
   ```bash
   cd electron
   npm install
   ```

2. Start the Electron app:
   ```bash
   npm start
   ```

### Additional Configuration

1. Configure the development environment:
   - Set up your preferred code editor (VS Code recommended)
   - Install recommended extensions for Python and JavaScript development
   - Configure linting and formatting tools

2. Verify the installation:
   ```bash
   # Test backend
   curl http://localhost:8000/api/health

   # Test frontend
   npm run test
   ```

### Common Issues and Solutions

1. **Port Conflicts**
   - If port 8000 is in use, modify the backend port in `backend/manage.py`
   - For Electron port conflicts, adjust the port in `electron/src/main.js`

2. **Dependencies Issues**
   - Clear npm cache: `npm cache clean --force`
   - Rebuild node modules: `npm rebuild`
   - Update pip: `python -m pip install --upgrade pip`

3. **API Key Setup**
   - Obtain a Gemini API key from Google AI Studio
   - Ensure the key is properly set in your `.env` file
   - Check API key permissions and quotas

### Development Workflow

1. **Starting the Development Environment**
   ```bash
   # Terminal 1 - Backend
   cd backend
   source .venv/bin/activate
   python manage.py runserver

   # Terminal 2 - Frontend
   cd electron
   npm start
   ```

2. **Making Changes**
   - Follow the project's coding standards
   - Write tests for new features
   - Update documentation as needed

3. **Testing**
   - Run backend tests: `python manage.py test`
   - Run frontend tests: `npm test`
   - Perform manual testing of UI changes

### Production Deployment

1. **Backend Deployment**
   ```bash
   cd backend
   python manage.py collectstatic
   gunicorn smartwrite.wsgi:application
   ```

2. **Frontend Distribution**
   ```bash
   cd electron
   npm run dist
   ```

3. **Environment Considerations**
   - Set DEBUG=False in production
   - Use secure HTTPS connections
   - Configure proper database settings
   - Set up proper logging

## Support and Community

- Report issues on GitHub

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- Thanks to the Google Generative AI team
- All our open-source contributors
- The FastAPI and Electron communities

---
*SmartWrite - Transform Your Notes, Enhance Your Learning*