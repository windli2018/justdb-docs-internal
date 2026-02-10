/**
 * VuePress plugin to detect duplicate page IDs
 * Uses the SAME logic as SlimSearch plugin to identify issues
 */

// PathStore class - exact same logic as SlimSearch
class PathStore {
  store = [];

  addPath(path) {
    const index = this.store.indexOf(path);
    if (index === -1) {
      this.store.push(path);
      return this.store.length - 1;
    }
    return index;
  }

  getDuplicates() {
    const seen = new Map();
    const duplicates = new Map();

    this.store.forEach((path, index) => {
      if (seen.has(path)) {
        const firstIndex = seen.get(path);
        if (!duplicates.has(path)) {
          duplicates.set(path, [firstIndex, index]);
        } else {
          duplicates.get(path).push(index);
        }
      } else {
        seen.set(path, index);
      }
    });

    return duplicates;
  }
}

/**
 * Generate search entries for a page - SIMPLIFIED version of SlimSearch's L function
 * This mimics how SlimSearch generates multiple entries per page (page + headers + custom fields)
 */
function generateSearchEntries(page, pathStore, customFields = [], indexContent = false) {
  const pathId = pathStore.addPath(page.path).toString();
  const entries = [];

  // Main page entry
  entries.push({
    id: pathId,
    type: 'page',
    path: page.path,
    pathLocale: page.pathLocale,
    title: page.title,
    filePath: page.filePathRelative,
  });

  // Custom field entries (same ID pattern as SlimSearch: pathId@fieldIndex)
  customFields.forEach((field, index) => {
    try {
      const value = typeof field.getter === 'function' ? field.getter(page) : (page.data.frontmatter[field.key] ?? []);
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        entries.push({
          id: `${pathId}@${index}`,
          type: 'custom',
          field: field.key,
          path: page.path,
          pathLocale: page.pathLocale,
          title: page.title,
        });
      }
    } catch (e) {
      // Skip on error
    }
  });

  return entries;
}

export const detectDuplicateIdsPlugin = (options = {}) => {
  return {
    name: 'vuepress-plugin-detect-duplicate-ids',

    onInitialized(app) {
      const pathStore = new PathStore();

      // SlimSearch custom fields configuration (from theme.ts)
      const customFields = [
        {
          key: 'tags',
          getter: (page) => page.data.frontmatter.tags ?? [],
        },
      ];

      // Group entries by locale (same as SlimSearch)
      const entriesByLocale = {};
      const allEntries = [];
      const pathToPages = new Map();

      // Process all pages EXACTLY like SlimSearch
      app.pages.forEach((page) => {
        if (page.frontmatter.search !== false) {
          const entries = generateSearchEntries(page, pathStore, customFields, true);
          const locale = page.pathLocale || '/';

          if (!entriesByLocale[locale]) {
            entriesByLocale[locale] = [];
          }
          entriesByLocale[locale].push(...entries);
          allEntries.push(...entries);

          // Track which pages share the same base path
          const basePath = page.path.replace(/^\/[a-z]{2}\//, '/');
          if (!pathToPages.has(basePath)) {
            pathToPages.set(basePath, []);
          }
          pathToPages.get(basePath).push(page);
        }
      });

      // Check for duplicate IDs WITHIN each locale (this is what causes SlimSearch to fail)
      const duplicatesPerLocale = {};
      const duplicateIdDetails = [];

      for (const [locale, entries] of Object.entries(entriesByLocale)) {
        const idMap = new Map();
        const duplicates = [];

        entries.forEach((entry) => {
          if (idMap.has(entry.id)) {
            duplicates.push({
              id: entry.id,
              locale: locale,
              existing: idMap.get(entry.id),
              duplicate: entry,
            });
          } else {
            idMap.set(entry.id, entry);
          }
        });

        if (duplicates.length > 0) {
          duplicatesPerLocale[locale] = duplicates;
        }
      }

      // Also check PathStore duplicates
      const pathStoreDuplicates = pathStore.getDuplicates();

      if (options.verbose || Object.keys(duplicatesPerLocale).length > 0 || pathStoreDuplicates.size > 0) {
        console.log('\n=== SlimSearch Duplicate ID Detection Results ===\n');

        if (Object.keys(duplicatesPerLocale).length > 0) {
          console.log('❌ DUPLICATE IDs FOUND (This causes SlimSearch to fail!):\n');
          for (const [locale, duplicates] of Object.entries(duplicatesPerLocale)) {
            console.log(`Locale: "${locale}"`);
            for (const dup of duplicates) {
              console.log(`  Duplicate ID: "${dup.id}"`);
              console.log(`    Existing: ${dup.existing.type} - "${dup.existing.title || '(no title)'}" (${dup.existing.filePath || 'no file'})`);
              console.log(`    Duplicate: ${dup.duplicate.type} - "${dup.duplicate.title || '(no title)'}" (${dup.duplicate.filePath || 'no file'})`);
            }
            console.log('');
          }
        } else {
          console.log('✅ No duplicate IDs within locales\n');
        }

        if (pathStoreDuplicates.size > 0) {
          console.log('⚠️  PathStore has duplicate paths (may indicate page configuration issues):\n');
          for (const [path, indices] of pathStoreDuplicates.entries()) {
            console.log(`  Path: "${path}" - IDs: ${indices.join(', ')}`);
          }
          console.log('');
        }

        // Statistics
        console.log('\n=== Statistics ===\n');
        console.log(`Total pages: ${app.pages.length}`);
        console.log(`Total search entries: ${allEntries.length}`);
        console.log(`PathStore size: ${pathStore.store.length}`);
        console.log(`Locales: ${Object.keys(entriesByLocale).join(', ')}`);

        console.log('\n=== Entry Counts by Locale ===\n');
        for (const [locale, entries] of Object.entries(entriesByLocale)) {
          console.log(`${locale}: ${entries.length} entries`);
        }

        console.log('\n=====================================\n');

        if (Object.keys(duplicatesPerLocale).length > 0) {
          console.error('\n❌ SLIMSEARCH WILL FAIL - Duplicate IDs detected!\n');
          console.error('This is caused by multiple pages with the same path in the same locale.\n');
          console.error('Common causes:\n');
          console.error('  1. Tag pages with inconsistent capitalization (e.g., "Schema" vs "schema")');
          console.error('  2. Category pages with inconsistent capitalization');
          console.error('  3. Blog plugin generating duplicate auto-generated pages\n');
          if (options.throwOnError) {
            throw new Error(`SlimSearch duplicate IDs: ${Object.keys(duplicatesPerLocale).join(', ')}`);
          }
        }
      }
    },
  };
};

export default detectDuplicateIdsPlugin;
