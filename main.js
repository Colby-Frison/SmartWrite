const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
let mainWindow;
let djangoProcess;

function startDjangoServer() {
    // Start Django server on port 8001 instead of 8000
    djangoProcess = spawn('python', ['manage.py', 'runserver', '8001'], {
        detached: false,
        stdio: 'pipe'
    });

    djangoProcess.stdout.on('data', (data) => {
        console.log(`Django: ${data}`);
    });

    djangoProcess.stderr.on('data', (data) => {
        console.error(`Django Error: ${data}`);
    });
}

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
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

    // Load workspace.html directly instead of going through Django
    mainWindow.loadFile('workspace.html');

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
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

// This method will be called when Electron has finished initialization
app.on('ready', () => {
    // Remove Django server start
    // startDjangoServer();
    createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        // Kill Django server
        if (djangoProcess) {
            djangoProcess.kill('SIGTERM');
        }
        app.quit();
    }
});

// Window control handlers
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

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
}); 