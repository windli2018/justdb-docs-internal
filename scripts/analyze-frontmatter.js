#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Find all markdown files recursively in a directory
 */
function findMarkdownFiles(dir, extensions = ['.md']) {
  let results = [];
  
  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
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
 */
function extractFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
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
      return null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Analyze frontmatter statistics
 */
function analyzeFrontmatter(docsDir) {
  console.log('📊 Frontmatter Analysis Report\n');
  
  const markdownFiles = findMarkdownFiles(docsDir);
  console.log(`📁 Total markdown files: ${markdownFiles.length}`);
  
  const frontmatters = [];
  const filesWithoutFrontmatter = [];
  
  // Extract all frontmatter
  for (const filePath of markdownFiles) {
    const fm = extractFrontmatter(filePath);
    if (fm && fm.data) {
      frontmatters.push(fm);
    } else {
      filesWithoutFrontmatter.push(filePath);
    }
  }
  
  console.log(`📑 Files with frontmatter: ${frontmatters.length}`);
  console.log(`📄 Files without frontmatter: ${filesWithoutFrontmatter.length}\n`);
  
  if (frontmatters.length === 0) {
    console.log('No frontmatter found in any files.');
    return;
  }
  
  // Collect all unique properties
  const allProperties = new Set();
  const propertyFrequency = {};
  const propertyValues = {};
  
  for (const fm of frontmatters) {
    for (const [key, value] of Object.entries(fm.data)) {
      allProperties.add(key);
      
      if (!propertyFrequency[key]) {
        propertyFrequency[key] = 0;
        propertyValues[key] = new Set();
      }
      
      propertyFrequency[key]++;
      
      // Store unique values (stringified for comparison)
      if (typeof value === 'object') {
        propertyValues[key].add(JSON.stringify(value));
      } else {
        propertyValues[key].add(String(value));
      }
    }
  }
  
  // Show property statistics
  console.log('📈 Frontmatter Property Statistics:');
  console.log('====================================');
  
  const sortedProperties = Array.from(allProperties).sort((a, b) => 
    propertyFrequency[b] - propertyFrequency[a]
  );
  
  for (const prop of sortedProperties) {
    const frequency = propertyFrequency[prop];
    const uniqueValues = propertyValues[prop].size;
    const percentage = ((frequency / frontmatters.length) * 100).toFixed(1);
    
    console.log(`${prop}:`);
    console.log(`  - Used in: ${frequency}/${frontmatters.length} files (${percentage}%)`);
    console.log(`  - Unique values: ${uniqueValues}`);
    
    // Show top 5 most common values
    if (uniqueValues > 1) {
      console.log(`  - Common values:`);
      const valueCounts = {};
      for (const fm of frontmatters) {
        if (fm.data[prop] !== undefined) {
          const value = typeof fm.data[prop] === 'object' 
            ? JSON.stringify(fm.data[prop]) 
            : String(fm.data[prop]);
          valueCounts[value] = (valueCounts[value] || 0) + 1;
        }
      }
      
      Object.entries(valueCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([value, count]) => {
          const displayValue = value.length > 50 ? value.substring(0, 47) + '...' : value;
          console.log(`    • ${displayValue} (${count} files)`);
        });
    }
    console.log();
  }
  
  // Show files without frontmatter
  if (filesWithoutFrontmatter.length > 0) {
    console.log('📄 Files without frontmatter:');
    console.log('=============================');
    filesWithoutFrontmatter
      .map(f => path.relative(docsDir, f))
      .sort()
      .forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
      });
    console.log();
  }
  
  // Summary
  console.log('📋 Summary:');
  console.log(`- Total files analyzed: ${markdownFiles.length}`);
  console.log(`- Files with frontmatter: ${frontmatters.length} (${((frontmatters.length/markdownFiles.length)*100).toFixed(1)}%)`);
  console.log(`- Files without frontmatter: ${filesWithoutFrontmatter.length} (${((filesWithoutFrontmatter.length/markdownFiles.length)*100).toFixed(1)}%)`);
  console.log(`- Unique frontmatter properties: ${allProperties.size}`);
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const docsDir = args[0] || path.join(__dirname, '../docs');
  
  if (!fs.existsSync(docsDir)) {
    console.error(`Error: Directory not found: ${docsDir}`);
    process.exit(1);
  }
  
  analyzeFrontmatter(docsDir);
}

if (require.main === module) {
  main();
}