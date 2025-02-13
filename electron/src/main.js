require('dotenv').config();
const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const fetch = require('node-fetch');
const isDev = process.env.NODE_ENV === 'development';

console.log('Checking environment variables...');
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables');
}

let mainWindow;
let djangoProcess;

function startDjangoServer() {
    const djangoProcess = spawn('python', ['manage.py', 'runserver'], {
        cwd: path.join(__dirname, '../../backend')
    });

    djangoProcess.stdout.on('data', (data) => {
        console.log(`Django: ${data}`);
    });

    djangoProcess.stderr.on('data', (data) => {
        console.error(`Django Error: ${data}`);
    });

    return djangoProcess;
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
            nodeIntegration: true,
            contextIsolation: true,
            sandbox: false,
            webSecurity: false, // Only for development
            preload: path.join(__dirname, 'preload.js'),
            webviewTag: true,
            allowRunningInsecureContent: false
        },
        show: false
    });

    // Register protocol for static files
    protocol.handle('static', (request) => {
        const url = request.url.slice('static://'.length);
        const filePath = path.join(__dirname, '../../frontend/static', url);
        return new Response(filePath);
    });

    const htmlPath = path.join(__dirname, '../../frontend/templates/workspace.html');
    console.log('Loading HTML from:', htmlPath);
    mainWindow.loadFile(htmlPath);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

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

    const djangoProcess = startDjangoServer();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    app.on('window-all-closed', () => {
        djangoProcess.kill();
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
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
ipcMain.handle('convert-markdown', async (event, { markdown, filePath }) => {
    console.log('Main: convert-markdown called with:', {
        markdown: markdown,
        filePath: filePath
    });
    
    return new Promise((resolve, reject) => {
        const python = spawn('python', [path.join(__dirname, '../markdown_converter.py')], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdoutData = '';
        let stderrData = '';

        python.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        python.stderr.on('data', (data) => {
            stderrData += data.toString();
            console.error('Python stderr:', data.toString());
        });

        python.on('close', (code) => {
            if (code !== 0) {
                console.error('Python process exited with code:', code);
                console.error('stderr:', stderrData);
                reject(new Error(`Markdown conversion failed: ${stderrData}`));
                return;
            }
            
            try {
                resolve(stdoutData);
            } catch (error) {
                console.error('Error parsing Python output:', error);
                reject(error);
            }
        });

        const input = {
            markdown: markdown,
            filePath: filePath
        };

        python.stdin.write(JSON.stringify(input));
        python.stdin.end();
    });
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

// Django communication handler
ipcMain.handle('django:request', async (event, endpoint, data) => {
    try {
        const response = await fetch(`http://localhost:8001/api/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('Error communicating with Django:', error);
        throw error;
    }
});

// Theme handling
ipcMain.on('set-theme', (event, theme) => {
    if (mainWindow) {
        mainWindow.webContents.executeJavaScript(`
            document.documentElement.setAttribute('data-theme', '${theme}');
        `);
    }
});

ipcMain.handle('get-theme', () => {
    return mainWindow?.webContents.executeJavaScript(`
        document.documentElement.getAttribute('data-theme')
    `);
});

// Version info
ipcMain.handle('get-version', () => {
    return app.getVersion();
});

// File system handlers
ipcMain.handle('fs:readDirectory', async (event, dirPath) => {
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

ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
}); 