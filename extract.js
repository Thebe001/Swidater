const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

// Read command-line arguments
const [,, filePath, extractPath, folderName] = process.argv;

function exitWithError(message) {
  console.error(message);
  process.send({ type: 'error', message });
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  exitWithError('ZIP file does not exist.');
}

if (path.extname(filePath).toLowerCase() !== '.zip') {
  exitWithError('Invalid file type. Please provide a ZIP file.');
}

if (!fs.existsSync(extractPath)) {
  exitWithError('Extraction path does not exist.');
}

const targetFolder = path.join(extractPath, folderName);
if (fs.existsSync(targetFolder)) {
  exitWithError('The folder already exists.');
}

fs.mkdirSync(targetFolder, { recursive: true });

try {
  const zip = new AdmZip(filePath);
  zip.extractAllTo(targetFolder, true);
  console.log('Extraction completed.');
  process.send({ type: 'success' });
  process.exit(0);
} catch (error) {
  exitWithError(`Error extracting ZIP file: ${error.message}`);
}
