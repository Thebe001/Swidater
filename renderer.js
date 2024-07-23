// renderer.js
const { sendExtractZipFile, onZipExtractionSuccess, onZipExtractionError } = window.electron;
const { dialog } = require('electron').remote;
const path = require('path');
const fs = require('fs');

document.getElementById('uploadForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const zipFile = document.getElementById('zipFile').files[0];
  const emptyFolder = document.getElementById('emptyFolder').checked;
  const folderName = document.getElementById('folderName').value.trim() || 'extracted';

  if (!zipFile) {
    alert('Please select a ZIP file.');
    return;
  }

  // Verify if the selected file is a ZIP file
  if (zipFile.name.slice(-4).toLowerCase() !== '.zip') {
    alert('Please select a valid ZIP file.');
    return;
  }

  const dialogOptions = {
    title: 'Select Extraction Path',
    properties: ['openDirectory']
  };

  dialog.showOpenDialog(dialogOptions).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const extractPath = result.filePaths[0];

      sendExtractZipFile(zipFile.path);

      onZipExtractionSuccess((htmlFilePath) => {
        const targetFolder = path.join(extractPath, folderName);

        if (emptyFolder && fs.existsSync(targetFolder)) {
          fs.rmdirSync(targetFolder, { recursive: true });
        }

        fs.mkdirSync(targetFolder, { recursive: true });
        const newWindow = window.open(htmlFilePath, 'Extracted HTML', 'width=800,height=600');
        newWindow.onbeforeunload = () => {
          // Implement cleanup logic if needed
        };
      });

      onZipExtractionError((errorMessage) => {
        alert(`Error extracting ZIP file: ${errorMessage}`);
      });
    }
  }).catch(err => {
    console.error('Error selecting directory:', err);
  });
});

document.getElementById('zipFile').addEventListener('change', function() {
  const fileName = this.files.length > 0 ? this.files[0].name : 'No file chosen';
  document.getElementById('fileStatus').textContent = fileName;
});

document.getElementById('choosePathBtn').addEventListener('click', function() {
  dialog.showOpenDialog(dialogOptions).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      document.getElementById('extractPath').value = result.filePaths[0];
    }
  }).catch(err => {
    console.error('Error selecting directory:', err);
  });
});
