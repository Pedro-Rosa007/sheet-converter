const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    checkApiStatus: () => ipcRenderer.invoke('check-api-status'),
    openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
    showMessage: (options) => ipcRenderer.invoke('show-message', options),
    log: (message) => ipcRenderer.send('log', message)
});