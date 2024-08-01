const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

// Read command-line arguments
const [,, filePath, extractPath, folderName] = process.argv;

// Check if the file exists
if (!fs.existsSync(filePath)) {
  console.error('ZIP file does not exist.');
  process.exit(1);
}

// Check if the file is a ZIP file
const zipExtension = path.extname(filePath).toLowerCase();
if (zipExtension !== '.zip') {
  console.error('Invalid file type. Please provide a ZIP file.');
  process.exit(1);
}

// Check if the extraction path exists
if (!fs.existsSync(extractPath)) {
  console.error('Extraction path does not exist.');
  process.exit(1);
}

// Prepare target folder
const targetFolder = path.join(extractPath, folderName);
if (fs.existsSync(targetFolder)) {
  console.error('The folder already exists.');
  process.exit(1);
}

fs.mkdirSync(targetFolder, { recursive: true });

try {
  const zip = new AdmZip(filePath);
  zip.extractAllTo(targetFolder, true);
  console.log('Extraction completed.');
  process.exit(0);
} catch (error) {
  console.error('Error extracting ZIP file:', error.message);
  process.exit(1);
}
