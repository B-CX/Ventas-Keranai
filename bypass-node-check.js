const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'node_modules/next/dist/bin/next');

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Reemplazar la condición del semver check con false
  content = content.replace(/_semver\.default\.lt\(process\.versions\.node,\s*["']18\.17\.0["']\)/g, 'false');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched Next.js version check to false.');
} else {
  console.log('Next.js bin file not found.');
}
