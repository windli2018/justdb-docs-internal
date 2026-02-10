/**
 * Detailed script to find SlimSearch duplicate ID issue
 */

import fs from 'fs';
import path from 'path';

// Read all markdown files
const docsDir = '/home/wind/workspace/justdb/justdb-docs/docs';
const pages = [];

function walkDir(dir, base = '') {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(fullPath, path.join(base, file));
    } else if (file.endsWith('.md')) {
      const relativePath = path.relative(docsDir, fullPath);
      pages.push({
        path: relativePath,
        full: fullPath
      });
    }
  }
}

walkDir(docsDir);

// Group by filename only (not path)
const byName = {};
for (const page of pages) {
  const name = path.basename(page.path);
  if (!byName[name]) {
    byName[name] = [];
  }
  byName[name].push(page.path);
}

// Find duplicates
console.log('=== Files with same basename ===\n');
for (const [name, paths] of Object.entries(byName)) {
  if (paths.length > 1) {
    console.log(`${name}: ${paths.length} occurrences`);
    for (const p of paths) {
      console.log(`  - ${p}`);
    }
  }
}

// Check for pages with explicit id field
console.log('\n=== Pages with explicit id field ===\n');
for (const page of pages) {
  const content = fs.readFileSync(page.full, 'utf-8');
  const match = content.match(/^id:\s*(.+)$/m);
  if (match) {
    console.log(`${page.path}: id="${match[1]}"`);
  }
}

// Count total pages
console.log(`\nTotal pages: ${pages.length}`);
