const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
app.disableHardwareAcceleration();
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      zoomFactor: 1.0
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.handle('openDirectoryDialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Extraction Path',
    properties: ['openDirectory']
  });
  return result.filePaths;
});

ipcMain.on('extract-zip-file', (event, filePath, extractPath, folderName) => {
  const extractScript = path.join(__dirname, 'extract.js');

  const extractProcess = fork(extractScript, [filePath, extractPath, folderName]);

  extractProcess.on('message', (message) => {
    if (message.type === 'success') {
      event.reply('zip-extraction-success');
    } else if (message.type === 'error') {
      event.reply('zip-extraction-error', message.message);
    }
  });

  extractProcess.on('exit', (code) => {
    if (code !== 0) {
      event.reply('zip-extraction-error', 'Unknown error occurred during extraction.');
    }
  });

  extractProcess.on('error', (error) => {
    event.reply('zip-extraction-error', `Process error: ${error.message}`);
  });
});
