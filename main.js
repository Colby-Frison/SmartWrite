require('dotenv').config();
const { app, BrowserWindow, ipcMain, dialog, shell, protocol } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;

console.log('Checking environment variables...');
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables');
}

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
            webSecurity: true,
            preload: path.join(__dirname, 'preload.js'),
            webviewTag: true,
            allowRunningInsecureContent: false
        },
        show: false
    });

    // Open DevTools in detached mode
    mainWindow.webContents.openDevTools({ mode: 'detach' });

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

// Register file protocol handler
app.whenReady().then(() => {
    protocol.registerFileProtocol('file', (request, callback) => {
        try {
            const filePath = decodeURIComponent(request.url.replace('file:///', ''));
            const resolvedPath = path.resolve(filePath);
            return callback(resolvedPath);
        } catch (error) {
            console.error('Protocol handler error:', error);
            callback({ error: -2 });
        }
    });

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

// Add to your existing ipcMain handlers
ipcMain.handle('convert-markdown', async (event, markdown, filePath) => {
    console.log('Main: convert-markdown called with:', {
        markdown: markdown,
        filePath: filePath
    });
    
    try {
        const python = spawn('python', ['markdown_converter.py'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        const input = {
            markdown: markdown,
            filePath: filePath
        };

        console.log('Main: Sending to Python:', JSON.stringify(input));

        python.stdin.write(JSON.stringify(input));
        python.stdin.end();

        let result = '';
        let error = '';

        python.stdout.on('data', (data) => {
            result += data.toString();
            console.log('Main: Python stdout:', data.toString());
        });

        python.stderr.on('data', (data) => {
            error += data.toString();
            console.error('Main: Python stderr:', data.toString());
        });

        return new Promise((resolve, reject) => {
            python.on('close', (code) => {
                console.log('Main: Python process closed with code:', code);
                if (code !== 0) {
                    reject(new Error(`Python process exited with code ${code}\nError: ${error}`));
                } else {
                    resolve(result);
                }
            });
        });
    } catch (error) {
        console.error('Main: Error in markdown conversion:', error);
        throw error;
    }
});

// Replace the chat handler
ipcMain.handle('send-chat-message', (event, message) => {
    console.log('Main process: Handling chat message:', message);
    
    return new Promise((resolve, reject) => {
        // Get absolute path to Python script
        const scriptPath = path.join(__dirname, 'chat_handler.py');
        console.log('Main process: Python script path:', scriptPath);
        
        const python = spawn('python', [scriptPath], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let outputData = '';
        let errorData = '';

        python.stdout.on('data', (data) => {
            const chunk = data.toString();
            console.log('Main process: Python stdout:', chunk);
            outputData += chunk;
        });

        python.stderr.on('data', (data) => {
            const chunk = data.toString();
            console.log('Main process: Python stderr:', chunk);
            errorData += chunk;
        });

        python.on('error', (error) => {
            console.error('Main process: Failed to start Python process:', error);
            reject(new Error('Failed to start Python process'));
        });

        python.on('close', (code) => {
            console.log('Main process: Python process closed with code:', code);
            console.log('Main process: Final output:', outputData);
            console.log('Main process: Error output:', errorData);

            if (code !== 0) {
                reject(new Error(`Python process failed (${code}): ${errorData}`));
                return;
            }

            try {
                const result = JSON.parse(outputData);
                console.log('Main process: Parsed result:', result);
                
                if (result.success) {
                    resolve(result.response);
                } else {
                    reject(new Error(result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Main process: Failed to parse Python output:', error);
                reject(new Error('Failed to parse Python response'));
            }
        });

        // Send message to Python
        const input = JSON.stringify({ message });
        console.log('Main process: Sending to Python:', input);
        python.stdin.write(input);
        python.stdin.end();
    });
}); 