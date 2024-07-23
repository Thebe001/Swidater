const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: true,
    enableLargerThanScreen: true, // Enable larger than screen size
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('extract-zip-file', async (event, filePath) => {
  try {
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();
    let htmlFilePath = null;

    for (let i = 0; i < zipEntries.length; i++) {
      const zipEntry = zipEntries[i];
      if (zipEntry.entryName.toLowerCase().includes('index.html')) {
        console.log('Extracting', zipEntry.entryName);
        const extractedPath = path.join(app.getPath('temp'), 'extracted');
        fs.mkdirSync(extractedPath, { recursive: true });
        zip.extractAllTo(extractedPath, true);
        htmlFilePath = path.join(extractedPath, zipEntry.entryName);
        break;
      }
    }

    if (htmlFilePath) {
      event.reply('zip-extraction-success', htmlFilePath);
    } else {
      event.reply('zip-extraction-error', 'No index.html found in the ZIP file.');
    }
  } catch (error) {
    event.reply('zip-extraction-error', error.message);
  }
});
