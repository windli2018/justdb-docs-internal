---
title: Search Feature Demo
icon: search
category:
  - Feature Demo
tag:
  - Search
  - SlimSearch
---

# Search Feature Demo

This page demonstrates the search functionality features of VuePress.

## Search Plugin Description

This site uses `@vuepress/plugin-slimsearch` to provide powerful full-text search functionality.

### Main Features

::: info Search Features
- 🔍 **Full-Text Search**: Supports searching page titles, content, tags, etc.
- 🚀 **Fast Response**: Client-side search engine with quick response
- 🎯 **Smart Suggestions**: Automatically suggests relevant content while typing
- 📝 **Search History**: Automatically saves search history
- 🌐 **Multi-Language Support**: Supports Chinese and English search
:::

## Usage

### Shortcuts

- **Open Search**: Press `Ctrl + K` or `/` key
- **Close Search**: Press `ESC` key
- **Navigate Results**: Use `↑` `↓` arrow keys
- **Select Result**: Press `Enter` key

### Search Tips

1. **Keyword Search**
   - Enter keywords directly to search
   - For example: Search "VuePress" to find all pages containing this term

2. **Tag Search**
   - Search results show page tags
   - Quickly locate relevant content through tags

3. **Search History**
   - View previous search records
   - Quickly repeat previous searches

## Configuration Example

```typescript
// theme.ts
export default hopeTheme({
  plugins: {
    slimsearch: {
      indexContent: true,
      suggestion: true,
      customFields: [
        {
          key: 'tags',
          getter: (page) => page.data.frontmatter.tags ?? [],
          formatter: {
            '/en/': 'tags: $content',
            '/': '标签：$content',
          },
        },
      ],
      locales: {
        '/': { 
          cancel: "Cancel", 
          placeholder: "Search", 
          search: "Search",
        },
      },
    },
  },
})
```

## Search Scope

The search functionality can search the following content:

- ✅ Page titles
- ✅ Page content
- ✅ Headings and subheadings
- ✅ Custom tags
- ✅ Page descriptions

## Try Searching

Now try the search function! Press `Ctrl + K` to open the search box, and enter the following keywords:

- VuePress
- Search
- Features
- Demo

::: tip Tip
The search function automatically builds indexes when the page loads. It may take a moment on first use.
:::