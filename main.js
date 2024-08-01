const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
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

  extractProcess.on('exit', (code) => {
    if (code === 0) {
      event.reply('zip-extraction-success');
    } else {
      event.reply('zip-extraction-error', 'Extraction failed. Please check the console for details.');
    }
  });

  extractProcess.on('error', (error) => {
    event.reply('zip-extraction-error', error.message);
  });
});
