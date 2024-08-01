const { sendExtractZipFile, onZipExtractionSuccess, onZipExtractionError, openDirectoryDialog } = window.electron;

let selectedExtractPath = ''; // Global variable to store the extraction path

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
      selectedExtractPath = result[0]; // Save the selected extraction path
      document.getElementById('extractPath').value = selectedExtractPath;
    }
  }).catch(err => {
    console.error('Error selecting directory:', err);
  });
});

  onZipExtractionSuccess(() => {
  window.location.href = 'download.html';
});

onZipExtractionError((errorMessage) => {
  alert(`Error extracting ZIP file: ${errorMessage}`);
  // Optionally, redirect or handle the error case
});
