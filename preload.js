const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'electronAPI', {
        selectFile: (title) => ipcRenderer.invoke('select-file', title),
        analyze: (options) => ipcRenderer.invoke('analyze', options),
        onAnalysisProgress: (callback) => ipcRenderer.on('analysis-progress', (event, data) => callback(data)),
        saveCsv: (csvData, viewType) => ipcRenderer.invoke('save-csv', csvData, viewType)
    }
);

