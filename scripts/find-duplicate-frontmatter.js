#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Find all markdown files recursively in a directory
 * @param {string} dir - Directory path
 * @param {string[]} extensions - File extensions to include
 * @returns {string[]} Array of file paths
 */
function findMarkdownFiles(dir, extensions = ['.md']) {
  let results = [];
  
  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .git, and other common ignored directories
        if (!['node_modules', '.git', '.vuepress', '.cache', '.temp', 'dist'].includes(file)) {
          walk(filePath);
        }
      } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
  }
  
  walk(dir);
  return results;
}

/**
 * Extract frontmatter from a markdown file
 * @param {string} filePath - Path to the markdown file
 * @returns {Object|null} Parsed frontmatter object or null if no frontmatter
 */
function extractFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Match frontmatter between --- delimiters at the start of file
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    
    if (!frontmatterMatch) {
      return null;
    }
    
    const frontmatterContent = frontmatterMatch[1];
    
    try {
      const parsed = yaml.load(frontmatterContent);
      return {
        data: parsed,
        raw: frontmatterContent,
        filePath: filePath
      };
    } catch (yamlError) {
      console.warn(`Warning: Could not parse YAML in ${filePath}:`, yamlError.message);
      return null;
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Normalize frontmatter for comparison
 * @param {Object} frontmatter - Frontmatter object
 * @returns {string} Normalized string representation
 */
function normalizeFrontmatter(frontmatter) {
  // Remove file-specific properties that shouldn't affect duplication detection
  const normalized = { ...frontmatter };
  
  // Remove properties that are typically file-specific
  delete normalized.filePath;
  delete normalized.date; // Common auto-generated property
  delete normalized.lastUpdated; // Common auto-generated property
  delete normalized.editLink; // VuePress specific
  
  // Sort keys for consistent comparison
  const sorted = {};
  Object.keys(normalized)
    .sort()
    .forEach(key => {
      if (typeof normalized[key] === 'object' && normalized[key] !== null) {
        // For arrays and objects, convert to JSON string for comparison
        sorted[key] = JSON.stringify(normalized[key]);
      } else {
        sorted[key] = normalized[key];
      }
    });
  
  return JSON.stringify(sorted);
}

/**
 * Find duplicated frontmatter
 * @param {string} docsDir - Path to docs directory
 */
function findDuplicateFrontmatter(docsDir) {
  console.log('🔍 Scanning for duplicate frontmatter...\n');
  
  // Find all markdown files
  const markdownFiles = findMarkdownFiles(docsDir);
  console.log(`Found ${markdownFiles.length} markdown files\n`);
  
  // Extract frontmatter from all files
  const frontmatters = [];
  
  for (const filePath of markdownFiles) {
    const fm = extractFrontmatter(filePath);
    if (fm && fm.data) {
      frontmatters.push({
        ...fm,
        normalized: normalizeFrontmatter(fm.data)
      });
    }
  }
  
  console.log(`Found frontmatter in ${frontmatters.length} files\n`);
  
  // Group by normalized frontmatter
  const groups = {};
  
  for (const fm of frontmatters) {
    if (!groups[fm.normalized]) {
      groups[fm.normalized] = [];
    }
    groups[fm.normalized].push(fm);
  }
  
  // Find duplicates (groups with more than one file)
  const duplicates = Object.values(groups).filter(group => group.length > 1);
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicate frontmatter found!');
    return;
  }
  
  console.log(`❌ Found ${duplicates.length} groups of duplicate frontmatter:\n`);
  
  duplicates.forEach((group, index) => {
    console.log(`=== Duplicate Group ${index + 1} (${group.length} files) ===`);
    
    // Show the common frontmatter
    console.log('Common frontmatter:');
    console.log('```yaml');
    console.log(group[0].raw);
    console.log('```\n');
    
    // List all files with this frontmatter
    console.log('Files:');
    group.forEach((fm, i) => {
      console.log(`  ${i + 1}. ${path.relative(docsDir, fm.filePath)}`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
  });
  
  // Summary
  const totalDuplicates = duplicates.reduce((sum, group) => sum + group.length, 0);
  console.log(`📊 Summary: ${duplicates.length} duplicate groups affecting ${totalDuplicates} files`);
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const docsDir = args[0] || path.join(__dirname, '../docs');
  
  if (!fs.existsSync(docsDir)) {
    console.error(`Error: Directory not found: ${docsDir}`);
    process.exit(1);
  }
  
  findDuplicateFrontmatter(docsDir);
}

if (require.main === module) {
  main();
}

module.exports = { findDuplicateFrontmatter, extractFrontmatter, findMarkdownFiles };