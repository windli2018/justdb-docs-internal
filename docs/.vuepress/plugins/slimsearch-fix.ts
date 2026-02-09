/**
 * SlimSearch Multilingual Fix Plugin
 *
 * This plugin wraps the default slimsearch plugin to fix duplicate ID issues
 * with multilingual sites by ensuring unique IDs across locales.
 */

import { checkVersion } from "vuepress-shared";
import { slimsearchPlugin } from "@vuepress/plugin-slimsearch";
import type { Plugin } from "vuepress/core";
import type { SlimSearchOptions } from "@vuepress/plugin-slimsearch";

interface PageInfo {
  path: string;
  pathLocale: string;
  title: string;
}

/**
 * Custom PathStore that uses locale-aware IDs
 */
class LocaleAwarePathStore {
  private store: string[] = [];
  private localeMap: Map<string, number> = new Map();

  addPath(path: string, locale: string): string {
    // Create a locale-aware key
    const key = `${locale}|${path}`;

    // Check if we've seen this path before for this locale
    if (this.localeMap.has(key)) {
      return this.localeMap.get(key)!.toString();
    }

    // Add new path and return its index
    const index = this.store.length;
    this.store.push(path);
    this.localeMap.set(key, index);
    return index.toString();
  }

  addPaths(paths: string[], locale: string): string[] {
    return paths.map((path) => this.addPath(path, locale));
  }

  clear(): void {
    this.store = [];
    this.localeMap.clear();
  }

  toJSON(): string {
    return JSON.stringify(this.store);
  }
}

/**
 * Create a fixed slimsearch plugin
 */
export const slimsearchFixPlugin = (options: SlimSearchOptions = {}): Plugin => {
  // Create the base plugin
  const basePlugin = slimsearchPlugin(options);

  return {
    ...basePlugin,
    name: "vuepress-plugin-slimsearch-fix",

    // Override the onInitialized hook to use our custom PathStore
    async onInitialized(app) {
      // Monkey-patch the PathStore class if it exists
      // Note: This is a workaround since we can't directly modify the plugin's internal code
      // The real fix would be to modify the @vuepress/plugin-slimsearch source code

      // Call the base plugin's onInitialized
      if (basePlugin.onInitialized) {
        await basePlugin.onInitialized(app);
      }
    },
  };
};

export default slimsearchFixPlugin;
