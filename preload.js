// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe subset of ipcRenderer methods
contextBridge.exposeInMainWorld('electron', {
  sendExtractZipFile: (filePath) => ipcRenderer.send('extract-zip-file', filePath),
  onZipExtractionSuccess: (callback) => ipcRenderer.on('zip-extraction-success', (event, htmlFilePath) => callback(htmlFilePath)),
  onZipExtractionError: (callback) => ipcRenderer.on('zip-extraction-error', (event, errorMessage) => callback(errorMessage))
});
