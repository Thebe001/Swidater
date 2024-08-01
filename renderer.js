const { sendExtractZipFile, onZipExtractionSuccess, onZipExtractionError, openDirectoryDialog } = window.electron;

let selectedExtractPath = '';

document.getElementById('uploadForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const zipFile = document.getElementById('zipFile').files[0];
  const folderName = document.getElementById('folderName').value.trim() || 'extracted';

  if (!zipFile) {
    alert('Please select a ZIP file.');
    return;
  }

  if (!selectedExtractPath) {
    alert('Please select an extraction path.');
    return;
  }

  // Redirect to loading page
  window.location.href = 'loading.html';

  // Send a request to start the extraction process
  sendExtractZipFile(zipFile.path, selectedExtractPath, folderName);
});

document.getElementById('zipFile').addEventListener('change', function() {
  const fileName = this.files.length > 0 ? this.files[0].name : 'No file chosen';
  document.getElementById('fileStatus').textContent = fileName;
});

document.getElementById('choosePathBtn').addEventListener('click', function() {
  openDirectoryDialog().then(result => {
    if (result && result.length > 0) {
      selectedExtractPath = result[0];
      document.getElementById('extractPath').value = selectedExtractPath;
    }
  }).catch(err => {
    console.error('Error selecting directory:', err);
  });
});

// These listeners should be active when loading.html is shown
onZipExtractionSuccess(() => {
  window.location.href = 'download.html';
});

onZipExtractionError((errorMessage) => {
  alert(`Error extracting ZIP file: ${errorMessage}`);
  window.location.href = 'index.html';  // Redirect back to the main page on error
});
