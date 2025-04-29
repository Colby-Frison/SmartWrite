require('dotenv').config();                                        // JS512
const express = require('express');                                // JS512
const summarizeRoute = require('./summarize');                     // JS512
// ── Lightweight API server (runs alongside Electron) ──          // JS512
const api = express();                                             // JS512
api.use(express.json());                                           // JS512
api.use('/api/summarize', summarizeRoute);                         // JS512
const PORT = process.env.PORT || 3001;                             // JS512
api.listen(PORT, () => console.log(`API listening on ${PORT}`));   // JS512

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
    // Create the browser window
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        frame: false,
        backgroundColor: '#1e1e1e',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false // Prevent white flash on load
    });

    // Load the index.html file from the frontend/public directory
    mainWindow.loadFile(path.join(__dirname, '../../frontend/public/index.html'));

    // Add electron-only class to body when app loads
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(`
            document.body.classList.add('electron-only');
        `);
    });

    // Prevent flickering on load
    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    // Handle window controls
    ipcMain.on('minimize-window', () => {
        mainWindow.minimize();
    });

    ipcMain.on('maximize-window', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });

    ipcMain.on('close-window', () => {
        mainWindow.close();
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
}); 