const fs = require('fs');
const path = require('path');

// Search for uploaded images in common locations
const searchPaths = [
  path.join(__dirname, 'public/uploads'),
  path.join(__dirname, 'server/public/uploads'),
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'server/uploads'),
  path.join(process.cwd(), 'public/uploads'),
  path.join(process.cwd(), 'server/public/uploads')
];

console.log('Searching for uploaded files...');

let foundFiles = [];

searchPaths.forEach(searchPath => {
  if (fs.existsSync(searchPath)) {
    console.log(`\nChecking: ${searchPath}`);
    try {
      const files = fs.readdirSync(searchPath);
      if (files.length > 0) {
        console.log(`Found ${files.length} files:`);
        files.forEach(file => {
          const filePath = path.join(searchPath, file);
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            console.log(`- ${file} (${stats.size} bytes)`);
            foundFiles.push({
              path: filePath,
              filename: file,
              size: stats.size
            });
          }
        });
      } else {
        console.log('No files found in this directory');
      }
    } catch (error) {
      console.log(`Error reading directory: ${error.message}`);
    }
  } else {
    console.log(`Directory does not exist: ${searchPath}`);
  }
});

if (foundFiles.length > 0) {
  console.log(`\n✅ Found ${foundFiles.length} uploaded files total`);
  // Copy them to the correct location
  const correctPath = path.join(__dirname, 'public/uploads');
  if (!fs.existsSync(correctPath)) {
    fs.mkdirSync(correctPath, { recursive: true });
  }
  
  console.log(`\nCopying files to correct location: ${correctPath}`);
  foundFiles.forEach(file => {
    const destPath = path.join(correctPath, file.filename);
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(file.path, destPath);
      console.log(`Copied: ${file.filename}`);
    } else {
      console.log(`Already exists: ${file.filename}`);
    }
  });
} else {
  console.log('\n❌ No uploaded files found anywhere');
}