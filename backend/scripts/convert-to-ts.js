#!/usr/bin/env node
/**
 * Script de conversion mécanique .js → .ts
 * - require() → import
 * - module.exports → export default / export {}
 * - exports.x → export const x / export { x }
 */

const fs = require('fs');
const path = require('path');

const EXTENSIONS = ['.js'];
const EXCLUDE_DIRS = ['node_modules', 'dist', 'coverage', 'tests', 'scripts'];
const EXCLUDE_FILES = ['convert-to-ts.js'];

function findJsFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (EXCLUDE_DIRS.includes(entry)) continue;
      findJsFiles(full, files);
    } else if (stat.isFile() && EXTENSIONS.includes(path.extname(entry)) && !EXCLUDE_FILES.includes(entry)) {
      files.push(full);
    }
  }
  return files;
}

function convertRequires(content) {
  // require('dotenv').config() → import dotenv from 'dotenv'; dotenv.config();
  content = content.replace(/require\(['"]([^'"]+)['"]\)\.config\(\)/g, "import $1 from '$1'; $1.config()");

  // require('dotenv').config({...}) → import dotenv from 'dotenv'; dotenv.config({...})
  content = content.replace(/require\(['"]([^'"]+)['"]\)\.config\(([^)]*)\)/g, "import $1 from '$1'; $1.config($2)");

  // new (require('https').Agent)(...) → import https from 'https'; new https.Agent(...)
  content = content.replace(
    /new \(require\(['"]([^'"]+)['"]\)\.Agent\)\(([^)]*)\)/g,
    "import $1 from '$1'; new $1.Agent($2)"
  );

  // require('path').join(...) → import path from 'path'; path.join(...)
  // require('os').platform() → import os from 'os'; os.platform()
  // etc.
  content = content.replace(/require\(['"]([^'"]+)['"]\)\.([A-Za-z0-9_]+)\(/g, "import $1 from '$1'; $1.$2(");

  // const { a, b } = require('module')
  content = content.replace(
    /const\s*\{\s*([^}]+)\s*\}\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    (match, destruct, mod) => {
      const clean = destruct
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .join(', ');
      return `import { ${clean} } from '${mod}';`;
    }
  );

  // const x = require('module')
  content = content.replace(/const\s+([A-Za-z0-9_]+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g, "import $1 from '$2';");

  // let x = require('module')
  content = content.replace(/let\s+([A-Za-z0-9_]+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g, "import $1 from '$2';");

  // require('module') standalone (side effect)
  content = content.replace(/require\(['"]([^'"]+)['"]\);?/g, "import '$1';");

  return content;
}

function convertExports(content) {
  // module.exports = app; → export default app;
  content = content.replace(/module\.exports\s*=\s*([A-Za-z0-9_]+)\s*;?/g, 'export default $1;');

  // module.exports = { a, b, c } → export { a, b, c }
  content = content.replace(/module\.exports\s*=\s*\{\s*([^}]+)\s*\}\s*;?/g, (match, inner) => {
    const clean = inner
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ');
    return `export { ${clean} };`;
  });

  // exports.foo = bar; → export const foo = bar;
  content = content.replace(/exports\.([A-Za-z0-9_]+)\s*=\s*function\s*\(/g, 'export function $1(');

  content = content.replace(/exports\.([A-Za-z0-9_]+)\s*=\s*async\s+function\s*\(/g, 'export async function $1(');

  content = content.replace(/exports\.([A-Za-z0-9_]+)\s*=\s*([A-Za-z0-9_]+)\s*;?/g, 'export { $2 as $1 };');

  return content;
}

function fixDuplicateImports(content) {
  // Regroupe les imports du même module
  const imports = new Map();
  const lines = content.split('\n');
  const output = [];

  for (const line of lines) {
    const match = line.match(/^import\s+(.+)\s+from\s+['"]([^'"]+)['"];?\s*$/);
    if (match) {
      const what = match[1].trim();
      const mod = match[2];
      if (!imports.has(mod)) imports.set(mod, []);
      imports.get(mod).push(what);
    } else {
      output.push(line);
    }
  }

  const importLines = [];
  for (const [mod, whats] of imports) {
    const defaults = [];
    const named = [];
    for (const w of whats) {
      if (w.startsWith('{')) {
        named.push(w.slice(1, -1).trim());
      } else if (w.startsWith('*')) {
        named.push(w);
      } else {
        defaults.push(w);
      }
    }
    const parts = [];
    if (defaults.length) parts.push(defaults[0]);
    if (named.length) parts.push(`{ ${named.join(', ')} }`);
    importLines.push(`import ${parts.join(', ')} from '${mod}';`);
  }

  return importLines.join('\n') + '\n' + output.join('\n');
}

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Détection require dynamique ou conditionnel — on garde tel quel
  const hasDynamicRequire = /\brequire\s*\(\s*[^'"]/.test(content);
  if (hasDynamicRequire) {
    console.warn(`  ⚠️ require dynamique détecté dans ${filePath} — conversion partielle`);
  }

  content = convertRequires(content);
  content = convertExports(content);
  content = fixDuplicateImports(content);

  // Remplacer les chemins d'import relatifs .js → (sans extension, TS gère)
  // On ne touche pas aux extensions car moduleResolution bundler les gère

  const newPath = filePath.replace(/\.js$/, '.ts');
  fs.writeFileSync(newPath, content, 'utf-8');
  fs.unlinkSync(filePath);
  console.log(`  ✅ ${path.relative(process.cwd(), filePath)} → ${path.relative(process.cwd(), newPath)}`);
}

const rootDir = process.cwd();
console.log(`🔍 Scanning ${rootDir}...`);
const files = findJsFiles(rootDir);
console.log(`📁 ${files.length} fichiers trouvés`);

for (const f of files) {
  convertFile(f);
}

console.log('🎉 Conversion terminée');
