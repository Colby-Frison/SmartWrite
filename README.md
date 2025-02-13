# SmartWrite

SmartWrite is an AI-powered writing assistant built with Django and Electron.

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

## Setup Instructions

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

## Development

- Backend API endpoints are located in `backend/smartwrite/api/`
- Frontend templates are in `frontend/templates/`
- Static assets (CSS, JS) are in `frontend/static/`
- Electron main process code is in `electron/src/`

## Testing

Run backend tests:
```bash
cd backend
python manage.py test
```

Run frontend tests:
```bash
cd electron
npm test
```

## Building for Production

1. Build the Electron app:
   ```bash
   cd electron
   npm run build
   ```

2. Collect static files for Django:
   ```bash
   cd backend
   python manage.py collectstatic
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.

---
*SmartWrite - Transform Your Notes, Enhance Your Learning*