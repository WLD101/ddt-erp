const fs = require('fs');
const path = require('path');

function checkCaseSensitiveExistence(filepath) {
  const dir = path.dirname(filepath);
  const basename = path.basename(filepath);
  if (!fs.existsSync(dir)) return false;
  const files = fs.readdirSync(dir);
  return files.includes(basename);
}

function resolveImport(importPath, currentDir) {
  if (importPath.startsWith('@/')) {
    importPath = importPath.replace('@/', './');
    currentDir = process.cwd();
  }
  
  let targetPath = path.resolve(currentDir, importPath);
  
  // try exact
  if (checkCaseSensitiveExistence(targetPath)) return true;
  // try .ts
  if (checkCaseSensitiveExistence(targetPath + '.ts')) return true;
  // try .tsx
  if (checkCaseSensitiveExistence(targetPath + '.tsx')) return true;
  // try index.ts
  if (checkCaseSensitiveExistence(path.join(targetPath, 'index.ts'))) return true;
  
  return false;
}

const file = 'modules/voice/review/service.ts';
const content = fs.readFileSync(file, 'utf8');
const regex = /from\s+['"]([^'"]+)['"]/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const importPath = match[1];
  if (importPath.startsWith('.') || importPath.startsWith('@/')) {
    if (!resolveImport(importPath, path.dirname(file))) {
      console.log('MISSING OR CASE MISMATCH:', importPath, 'in', file);
    }
  }
}
