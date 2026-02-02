---
title: 搜索功能演示
icon: search
category:
  - 功能演示
tag:
  - 搜索
  - SlimSearch
---

# 搜索功能演示

本页面展示了 VuePress 的搜索功能特性。

## 搜索插件说明

本站使用 `@vuepress/plugin-slimsearch` 提供强大的全文搜索功能。

### 主要特性

::: info 搜索特性
- 🔍 **全文搜索**：支持搜索页面标题、内容、标签等
- 🚀 **快速响应**：基于客户端的搜索引擎，响应迅速
- 🎯 **智能建议**：输入时自动提示相关内容
- 📝 **搜索历史**：自动保存搜索历史记录
- 🌐 **多语言支持**：支持中英文搜索
:::

## 使用方法

### 快捷键

- **打开搜索**：按 `Ctrl + K` 或 `/` 键
- **关闭搜索**：按 `ESC` 键
- **导航结果**：使用 `↑` `↓` 方向键
- **选择结果**：按 `Enter` 键

### 搜索技巧

1. **关键词搜索**
   - 直接输入关键词即可搜索
   - 例如：搜索 "碳排放" 可以找到所有包含该词的页面

2. **标签搜索**
   - 搜索结果会显示页面标签
   - 可以通过标签快速定位相关内容

3. **搜索历史**
   - 查看之前的搜索记录
   - 快速重复之前的搜索

## 配置示例

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
          cancel: "取消", 
          placeholder: "搜索", 
          search: "搜索",
        },
      },
    },
  },
})
```

## 搜索范围

本站搜索功能可以搜索以下内容：

- ✅ 页面标题
- ✅ 页面正文内容
- ✅ 标题和副标题
- ✅ 自定义标签
- ✅ 页面描述

## 试试搜索

现在就试试搜索功能吧！按 `Ctrl + K` 打开搜索框，输入以下关键词试试：

- VuePress
- 搜索
- 功能
- 演示

::: tip 提示
搜索功能会在页面加载时自动构建索引，首次使用可能需要稍等片刻。
:::