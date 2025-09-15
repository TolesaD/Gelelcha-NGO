const fs = require('fs');
const path = require('path');

// Source: where files are currently being saved (wrong location)
const sourceDir = path.join(__dirname, 'server/public/uploads');

// Destination: where files should be saved (correct location)
const destDir = path.join(__dirname, 'public/uploads');

console.log('Source directory:', sourceDir);
console.log('Destination directory:', destDir);

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log('Created destination directory');
}

// Check if source directory exists and has files
if (fs.existsSync(sourceDir)) {
  const files = fs.readdirSync(sourceDir);
  console.log(`Found ${files.length} files in source directory`);
  
  if (files.length > 0) {
    console.log('Moving files to correct location...');
    files.forEach(file => {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(destDir, file);
      
      if (fs.existsSync(sourcePath)) {
        // Move file
        fs.renameSync(sourcePath, destPath);
        console.log(`Moved: ${file}`);
      }
    });
    console.log('✅ All files moved successfully!');
  } else {
    console.log('No files found in source directory');
  }
} else {
  console.log('Source directory does not exist');
}

// Also check for any other potential upload locations
const otherLocations = [
  path.join(__dirname, 'uploads'),
  path.join(process.cwd(), 'uploads')
];

otherLocations.forEach(location => {
  if (fs.existsSync(location)) {
    const files = fs.readdirSync(location);
    if (files.length > 0) {
      console.log(`\nFound ${files.length} files in ${location}`);
      console.log('Consider moving these files to public/uploads/');
    }
  }
});