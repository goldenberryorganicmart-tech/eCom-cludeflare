import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

// 1. Update API routes
const apiDir = path.resolve('src/app/api');
walkDir(apiDir, filePath => {
  if (filePath.endsWith('route.ts') || filePath.endsWith('route.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes("runtime = 'edge'") && !content.includes('runtime = "edge"')) {
      console.log(`Adding edge runtime to API: ${filePath}`);
      content = `export const runtime = 'edge';\n\n` + content;
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});

console.log('Successfully added edge runtime export to all API routes!');
