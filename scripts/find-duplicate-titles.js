#!/usr/bin/env node

/**
 * Find duplicate titles in VuePress markdown files
 * Usage: node scripts/find-duplicate-titles.js
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../docs');

function extractTitles(dir) {
  const titles = new Map(); // title -> array of file paths

  function walkDir(currentDir) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.md')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const match = content.match(/^title:\s*(.+)$/m);

        if (match) {
          const title = match[1].trim();
          const relativePath = path.relative(DOCS_DIR, filePath);

          if (!titles.has(title)) {
            titles.set(title, []);
          }
          titles.get(title).push(relativePath);
        }
      }
    }
  }

  walkDir(dir);
  return titles;
}

function main() {
  console.log('Scanning for duplicate titles...\n');

  const titles = extractTitles(DOCS_DIR);
  const duplicates = [];

  for (const [title, files] of titles.entries()) {
    if (files.length > 1) {
      duplicates.push({ title, files });
    }
  }

  // Sort by number of duplicates (most first)
  duplicates.sort((a, b) => b.files.length - a.files.length);

  if (duplicates.length === 0) {
    console.log('✓ No duplicate titles found!');
  } else {
    console.log(`Found ${duplicates.length} duplicate title(s):\n`);

    for (const { title, files } of duplicates) {
      console.log(`"${title}"`);
      console.log(`  Found in ${files.length} file(s):`);
      for (const file of files) {
        console.log(`    - ${file}`);
      }
      console.log('');
    }

    console.log('\n=== Fix Commands ===');
    for (const { title, files } of duplicates) {
      console.log(`\n# Fix duplicate: "${title}"`);
      for (let i = 1; i < files.length; i++) {
        console.log(`# File: docs/${files[i]}`);
        console.log(`# Suggested unique title: "${title} (${i})" or "${path.basename(files[i], '.md')}"`);
      }
    }

    console.log('\n=== Quick Fix Script (sed) ===');
    for (const { title, files } of duplicates) {
      console.log(`\n# Fix duplicate: "${title}"`);
      for (let i = 1; i < files.length; i++) {
        const file = files[i];
        const uniqueTitle = `${title} (${i + 1})`;
        console.log(`sed -i 's/^title: ${title}/title: ${uniqueTitle}/' docs/${file}`);
      }
    }
  }

  process.exit(duplicates.length > 0 ? 1 : 0);
}

main();
