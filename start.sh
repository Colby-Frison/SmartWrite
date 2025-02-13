#!/bin/bash

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Add the backend directory to PYTHONPATH
export PYTHONPATH=$PYTHONPATH:$(pwd)/backend

# Start Django server in the background
echo "Starting Django server..."
cd backend
python manage.py runserver 8001 &
DJANGO_PID=$!

# Wait for Django to start
echo "Waiting for Django server to start..."
sleep 3

# Start Electron app
echo "Starting Electron app..."
cd ../electron
npm start

# When Electron app closes, kill Django server
kill $DJANGO_PID 