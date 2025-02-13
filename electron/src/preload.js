const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs').promises;
const path = require('path');

console.log('Preload script starting...'); // Debug log

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'electronAPI', {
        // Window controls
        minimizeWindow: () => ipcRenderer.send('minimize-window'),
        maximizeWindow: () => ipcRenderer.send('maximize-window'),
        closeWindow: () => ipcRenderer.send('close-window'),
        
        // File system operations
        selectDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
        readDirectory: (path) => ipcRenderer.invoke('fs:readDirectory', path),
        
        // Django communication
        sendToDjango: (endpoint, data) => ipcRenderer.invoke('django:request', endpoint, data),
        
        // Theme handling
        setTheme: (theme) => ipcRenderer.send('set-theme', theme),
        getTheme: () => ipcRenderer.invoke('get-theme'),
        
        // Version info
        getVersion: () => ipcRenderer.invoke('get-version'),
        
        // Additional methods
        openFile: async (filePath) => {
            return await ipcRenderer.invoke('open-file', filePath);
        },
        readFile: async (filePath) => {
            return await ipcRenderer.invoke('read-file', filePath);
        },
        writeFile: async (filePath, content) => {
            return await ipcRenderer.invoke('write-file', filePath, content);
        },
        path: {
            dirname: path.dirname,
            join: path.join
        },
        convertMarkdown: async (markdown, filePath) => {
            console.log('Preload: convertMarkdown called with:', {
                markdown: markdown,
                filePath: filePath
            });
            try {
                const result = await ipcRenderer.invoke('convert-markdown', markdown, filePath);
                console.log('Preload: convertMarkdown result:', result);
                return result;
            } catch (error) {
                console.error('Preload: convertMarkdown error:', error);
                throw error;
            }
        },
        fileExists: async (filePath) => {
            try {
                await fs.access(filePath);
                return true;
            } catch {
                return false;
            }
        },
        sendChatMessage: async (message) => {
            console.log('Preload: sending chat message:', message);
            try {
                const response = await ipcRenderer.invoke('send-chat-message', message);
                console.log('Preload: received response:', response);
                return response;
            } catch (error) {
                console.error('Preload: error sending message:', error);
                throw error;
            }
        }
    }
);

// Expose the API
try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI);
    console.log('electronAPI exposed successfully');
} catch (error) {
    console.error('Failed to expose electronAPI:', error);
}

// Verify the API is exposed
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded in preload');
    console.log('electronAPI available:', !!window.electronAPI);
}); 