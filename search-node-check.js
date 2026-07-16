const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  try {
    fs.readdirSync(dir).forEach(f => {
      let dirPath = path.join(dir, f);
      let isDirectory = fs.statSync(dirPath).isDirectory();
      if (isDirectory) {
        walkDir(dirPath, callback);
      } else {
        callback(dirPath);
      }
    });
  } catch(e) {}
}

const searchPath = path.join(__dirname, 'node_modules/next');
walkDir(searchPath, (filePath) => {
  if (filePath.endsWith('.js')) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('Node.js version') && content.includes('required')) {
      console.log(`Found in: ${filePath}`);
    }
  }
});
