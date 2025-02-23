const { contextBridge, ipcRenderer } = require('electron');

// Expose window control functions to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    handleTitleBarDoubleClick: () => ipcRenderer.send('titlebar-doubleclick')
}); 