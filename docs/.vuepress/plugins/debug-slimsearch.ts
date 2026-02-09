/**
 * VuePress Plugin to Debug SlimSearch Duplicate ID Issue
 *
 * This plugin dumps page information to help identify why duplicate IDs
 * are occurring in the SlimSearch index.
 */

import type { Plugin } from "vuepress/core";
import { path } from "vuepress/utils";
import fs from "fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PageInfo {
  path: string;
  pathLocale: string;
  filePathRelative: string | null;
  title: string;
  hasSearch: boolean | undefined;
  indexId?: string;
}

interface PageInfoExtended extends PageInfo {
  computedIndexId: string;
  collisionWith?: string;
}

/**
 * Debug plugin to dump page information and identify duplicates
 */
export const debugSlimSearchPlugin = (): Plugin => {
  return {
    name: "vuepress-plugin-debug-slimsearch",

    onInitialized(app) {
      console.log("\n=== SlimSearch Debug Plugin ===");
      console.log("Dumping page information to debug duplicate IDs...\n");

      const pagesByPathLocale: Record<string, PageInfo[]> = {};
      const pathToIndexId: Map<string, string> = new Map();
      const allPages: PageInfo[] = [];

      // Collect all page information
      for (const page of app.pages) {
        const pageInfo: PageInfo = {
          path: page.path,
          pathLocale: page.pathLocale,
          filePathRelative: page.filePathRelative,
          title: page.title,
          hasSearch: page.frontmatter.search,
        };
        allPages.push(pageInfo);

        if (!pagesByPathLocale[page.pathLocale]) {
          pagesByPathLocale[page.pathLocale] = [];
        }
        pagesByPathLocale[page.pathLocale].push(pageInfo);
      }

      // Simulate the PathStore behavior from VuePress slimsearch plugin
      // The PathStore assigns sequential IDs to unique paths
      const pathStore: string[] = [];
      const getPathIndex = (p: string): string => {
        const idx = pathStore.indexOf(p);
        if (idx === -1) {
          pathStore.push(p);
          return (pathStore.length - 1).toString();
        }
        return idx.toString();
      };

      // Compute index IDs for each page and detect collisions
      const pagesWithIndex: PageInfoExtended[] = [];
      const collisions: Map<string, PageInfoExtended[]> = new Map();

      for (const pageInfo of allPages) {
        const indexId = getPathIndex(pageInfo.path);
        const extendedInfo: PageInfoExtended = {
          ...pageInfo,
          computedIndexId: indexId,
        };
        pagesWithIndex.push(extendedInfo);

        // Check for collision
        if (pathToIndexId.has(indexId)) {
          const existingPage = pathToIndexId.get(indexId);
          extendedInfo.collisionWith = existingPage;

          if (!collisions.has(indexId)) {
            collisions.set(indexId, []);
          }
          collisions.get(indexId)!.push(extendedInfo);
        }
        pathToIndexId.set(indexId, pageInfo.path);
      }

      // Sort pages by locale and then by index ID
      const sortedLocales = Object.keys(pagesByPathLocale).sort();

      // Create output directory
      const outputDir = path.resolve(app.dir.temp(), "slimsearch-debug");
      fs.mkdirSync(outputDir, { recursive: true });

      // Write detailed report
      const reportLines: string[] = [];
      reportLines.push("# SlimSearch Duplicate ID Debug Report\n");
      reportLines.push(`Generated: ${new Date().toISOString()}\n`);
      reportLines.push(`Total Pages: ${allPages.length}\n`);
      reportLines.push(`Total Locales: ${sortedLocales.length}\n`);
      reportLines.push(`Unique Paths (for indexing): ${pathStore.length}\n`);
      reportLines.push(`Collisions Detected: ${collisions.size}\n`);

      // Group pages by locale
      for (const locale of sortedLocales) {
        reportLines.push(`\n## Locale: ${locale}\n`);
        const pages = pagesByPathLocale[locale];
        reportLines.push(`Page Count: ${pages.length}\n`);
        reportLines.push("```\n");

        for (const page of pages) {
          const indexId = getPathIndex(page.path);
          const hasCollision = collisions.has(indexId);
          const collisionInfo = hasCollision ? " ⚠️ COLLISION!" : "";
          reportLines.push(
            `  [${indexId}]${collisionInfo} path="${page.path}" filePath="${page.filePathRelative}" title="${page.title}" search="${page.hasSearch}"`
          );
        }
        reportLines.push("```\n");
      }

      // Collisions section
      if (collisions.size > 0) {
        reportLines.push(`\n## Collisions (${collisions.size} found)\n`);
        reportLines.push("\nThe following paths map to the same index ID:\n");

        for (const [indexId, pages] of collisions.entries()) {
          reportLines.push(`\n### Index ID: ${indexId}\n`);
          for (const page of pages) {
            reportLines.push(`- **${page.pathLocale}**: \`${page.path}\` (${page.filePathRelative})`);
          }
        }
      }

      // PathStore mapping
      reportLines.push(`\n## PathStore Mapping\n`);
      reportLines.push("```\n");
      reportLines.push("Index ID -> Path");
      for (let i = 0; i < pathStore.length; i++) {
        reportLines.push(`  ${i} -> ${pathStore[i]}`);
      }
      reportLines.push("```\n");

      // Write report to file
      const reportPath = path.join(outputDir, "slimsearch-debug-report.md");
      fs.writeFileSync(reportPath, reportLines.join("\n"));
      console.log(`Debug report written to: ${reportPath}`);

      // Write JSON dump for programmatic analysis
      const jsonData = {
        summary: {
          totalPages: allPages.length,
          totalLocales: sortedLocales.length,
          uniquePaths: pathStore.length,
          collisions: collisions.size,
        },
        locales: pagesByPathLocale,
        pathStore,
        collisions: Array.from(collisions.entries()).map(([id, pages]) => ({
          indexId: id,
          pages,
        })),
      };

      const jsonPath = path.join(outputDir, "slimsearch-debug-data.json");
      fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), "utf-8");
      console.log(`JSON data written to: ${jsonPath}`);

      // Print summary to console
      console.log("\n--- Summary ---");
      console.log(`Total pages: ${allPages.length}`);
      console.log(`Unique paths for indexing: ${pathStore.length}`);
      console.log(`Collisions: ${collisions.size}`);

      if (collisions.size > 0) {
        console.log("\n⚠️  COLLISIONS DETECTED:");
        for (const [indexId, pages] of collisions.entries()) {
          console.log(`\n  ID ${indexId}:`);
          for (const page of pages) {
            console.log(`    - ${page.pathLocale}: ${page.path}`);
          }
        }
      } else {
        console.log("\n✓ No collisions detected!");
      }

      console.log("\n=== End Debug Report ===\n");
    },
  };
};

export default debugSlimSearchPlugin;
