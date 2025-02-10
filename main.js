const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;
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
            sandbox: false,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false
    });

    mainWindow.webContents.openDevTools();

    mainWindow.loadFile('workspace.html');
    
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Window loaded');
        mainWindow.webContents.executeJavaScript(`
            document.body.classList.add('electron-only');
            console.log('electronAPI available:', !!window.electronAPI);
        `);
    });

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });

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
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Kill Django server
        if (djangoProcess) {
            djangoProcess.kill('SIGTERM');
        }
        app.quit();
    }
});

// Window control handlers
ipcMain.on('minimize-window', (event) => {
    console.log('Minimize received in main process');
    try {
        if (!mainWindow) {
            console.error('mainWindow is null');
            return;
        }
        mainWindow.minimize();
        console.log('Window minimized');
    } catch (error) {
        console.error('Error minimizing window:', error);
    }
});

ipcMain.on('maximize-window', (event) => {
    console.log('Maximize received in main process');
    try {
        if (!mainWindow) {
            console.error('mainWindow is null');
            return;
        }
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
            console.log('Window unmaximized');
        } else {
            mainWindow.maximize();
            console.log('Window maximized');
        }
    } catch (error) {
        console.error('Error maximizing window:', error);
    }
});

ipcMain.on('close-window', (event) => {
    console.log('Close received in main process');
    try {
        if (!mainWindow) {
            console.error('mainWindow is null');
            return;
        }
        mainWindow.close();
        app.quit();
        console.log('Window closed');
    } catch (error) {
        console.error('Error closing window:', error);
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Directory handling
ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('read-directory', async (event, dirPath) => {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const fileTree = await Promise.all(entries.map(async (entry) => {
            const fullPath = path.join(dirPath, entry.name);
            const stats = await fs.stat(fullPath);
            return {
                name: entry.name,
                path: fullPath,
                isDirectory: entry.isDirectory(),
                created: stats.birthtime,
                modified: stats.mtime,
                size: stats.size
            };
        }));
        return fileTree;
    } catch (error) {
        console.error('Error reading directory:', error);
        return [];
    }
});

// Add this with your other IPC handlers
ipcMain.handle('open-file', async (event, filePath) => {
    try {
        // Open file with default system application
        await shell.openPath(filePath);
        return true;
    } catch (error) {
        console.error('Error opening file:', error);
        return false;
    }
});

// Add these with your other IPC handlers
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return content;
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
        await fs.writeFile(filePath, content, 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing file:', error);
        throw error;
    }
}); 