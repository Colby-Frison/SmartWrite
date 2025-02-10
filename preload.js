const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs').promises;
const path = require('path');

console.log('Preload script starting...'); // Debug log

const electronAPI = {
    minimizeWindow: () => {
        console.log('Minimize window called in preload');
        ipcRenderer.send('minimize-window');
    },
    maximizeWindow: () => {
        console.log('Maximize window called in preload');
        ipcRenderer.send('maximize-window');
    },
    closeWindow: () => {
        console.log('Close window called in preload');
        ipcRenderer.send('close-window');
    },
    selectDirectory: async () => {
        const result = await ipcRenderer.invoke('select-directory');
        return result;
    },
    readDirectory: async (dirPath) => {
        const result = await ipcRenderer.invoke('read-directory', dirPath);
        return result;
    },
    openFile: async (filePath) => {
        return await ipcRenderer.invoke('open-file', filePath);
    },
    readFile: async (filePath) => {
        return await ipcRenderer.invoke('read-file', filePath);
    },
    writeFile: async (filePath, content) => {
        return await ipcRenderer.invoke('write-file', filePath, content);
    }
};

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