const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'public/uploads');

console.log('Checking uploads directory:', uploadsDir);

if (fs.existsSync(uploadsDir)) {
  const files = fs.readdirSync(uploadsDir);
  console.log('Files in uploads directory:');
  files.forEach(file => {
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    console.log(`- ${file} (${stats.size} bytes, ${stats.mtime})`);
  });
  
  if (files.length === 0) {
    console.log('No files found in uploads directory!');
  }
} else {
  console.log('Uploads directory does not exist!');
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Uploads directory created.');
}