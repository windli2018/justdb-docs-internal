# Documentation Scripts

This directory contains utility scripts for maintaining the JustDB documentation.

## Scripts

### find-duplicate-frontmatter.js

Finds duplicate frontmatter across all markdown files in the documentation.

> **Note**: Requires `js-yaml` dependency. Install with `npm install` first.

### find-duplicate-frontmatter-simple.js

Finds duplicate frontmatter across all markdown files in the documentation.

> **Note**: Uses built-in Node.js modules only - no external dependencies required.

### analyze-frontmatter.js

Provides detailed statistics about frontmatter usage across all documentation files.

> **Note**: Requires `js-yaml` dependency. Install with `npm install` first.

#### Usage

```bash
# Method 1: Using the full version with js-yaml (more robust YAML parsing)
npm install
npm run find-duplicates
# Or directly:
node find-duplicate-frontmatter.js [path/to/docs]

# Method 2: Using the simple version (no dependencies required)
node find-duplicate-frontmatter-simple.js [path/to/docs]

# Analyze frontmatter statistics
npm run analyze-frontmatter
# Or directly:
node analyze-frontmatter.js [path/to/docs]
```

#### What it does

- Recursively scans all `.md` files in the specified directory
- Extracts YAML frontmatter from each file (content between `---` delimiters)
- Normalizes frontmatter by:
  - Removing file-specific properties (`filePath`, `date`, `lastUpdated`, `editLink`)
  - Sorting keys for consistent comparison
  - Converting complex values to JSON strings
- Groups files by identical normalized frontmatter
- Reports any groups containing 2 or more files as duplicates

#### Output

The script will show:
1. Total number of markdown files found
2. Number of files with frontmatter
3. Any duplicate groups found, including:
   - The common frontmatter content
   - List of all files sharing that frontmatter
4. Summary statistics

#### Example Output

```
🔍 Scanning for duplicate frontmatter...

Found 154 markdown files

Found frontmatter in 126 files

❌ Found 2 groups of duplicate frontmatter:

=== Duplicate Group 1 (3 files) ===
Common frontmatter:
```yaml
icon: book
title: User Guide
order: 2
```

Files:
  1. guide/README.md
  2. en/guide/README.md
  3. zh/guide/README.md

==================================================

=== Duplicate Group 2 (2 files) ===
Common frontmatter:
```yaml
icon: rocket
title: Getting Started
order: 1
```

Files:
  1. getting-started/README.md
  2. en/getting-started/README.md

==================================================

📊 Summary: 2 duplicate groups affecting 5 files
```

#### Notes

- The script automatically ignores common directories like `node_modules`, `.git`, `.vuepress`, etc.
- File-specific properties are ignored during comparison to focus on meaningful duplicates
- YAML parsing errors are reported as warnings but don't stop the script