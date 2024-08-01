const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  sendExtractZipFile: (filePath, extractPath, folderName) => {
    ipcRenderer.send('extract-zip-file', filePath, extractPath, folderName);
  },
  onZipExtractionSuccess: (callback) => {
    ipcRenderer.on('zip-extraction-success', () => callback());
  },
  onZipExtractionError: (callback) => {
    ipcRenderer.on('zip-extraction-error', (event, errorMessage) => callback(errorMessage));
  },
  openDirectoryDialog: () => ipcRenderer.invoke('openDirectoryDialog'),
});
