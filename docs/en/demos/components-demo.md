---
title: Component Feature Demo
icon: puzzle-piece
category:
  - Feature Demo
tag:
  - Components
  - VPCard
  - Badge
---

# Component Feature Demo

This page demonstrates the various built-in components provided by VuePress Hope theme.

## Badge Component

### Basic Badges

<Badge text="Tip" type="tip" />
<Badge text="Warning" type="warning" />
<Badge text="Danger" type="danger" />
<Badge text="Info" type="info" />
<Badge text="Note" type="note" />

### Custom Colors

<Badge text="VuePress" color="blue" />
<Badge text="Hope Theme" color="green" />
<Badge text="v2.0" color="orange" />

### Vertical Alignment

- Text <Badge text="Important" vertical="middle" />
- Text <Badge text="New Feature" type="tip" vertical="top" />
- Text <Badge text="Deprecated" type="warning" vertical="bottom" />

## VPCard Component

### Basic Card

<VPCard
  title="VuePress Project"
  desc="A static site generator"
  logo="🚀"
  link="/en/"
/>

### Card with Background

<VPCard
  title="User Guide"
  desc="Quickly learn how to use VuePress"
  logo="📘"
  link="/en/guide/"
  background="linear-gradient(to right, #42b883, #35495e)"
  color="white"
/>

### Card Group

<div class="vp-card-group">
  <VPCard
    title="Getting Started"
    desc="Get started with VuePress in 5 minutes"
    logo="🚀"
    link="/en/guide/getting-started.html"
  />
  <VPCard
    title="Feature Demo"
    desc="View various feature examples"
    logo="🎯"
    link="/en/demos/"
  />
  <VPCard
    title="FAQs"
    desc="Solve questions during use"
    logo="❓"
    link="/en/faqs/"
  />
</div>

## Containers

### Info Containers

::: tip Tip
This is a tip message
:::

::: info Info
This is a general information message
:::

::: note Note
This is information that needs attention
:::

::: warning Warning
This is a warning message
:::

::: danger Danger
This is a danger warning message
:::

::: details Click to expand details
This is detailed content, collapsed by default. Click the title to expand and view.

- Supports Markdown syntax
- Can contain code blocks
- Can also nest other content

```javascript
console.log('Hello, VuePress!')
```
:::

### Custom Titles

::: tip 💡 Tips
Use the shortcut Ctrl+K to quickly open search
:::

::: warning ⚠️ Important Reminder
Ensure network connectivity is normal before saving data
:::

## Code Tabs

### Code Tabs

::: code-tabs

@tab npm

```bash
npm install vuepress-theme-hope
```

@tab yarn

```bash
yarn add vuepress-theme-hope
```

@tab pnpm

```bash
pnpm add vuepress-theme-hope
```

:::

### Code Highlighting

```typescript{1,4-6}
import { hopeTheme } from "vuepress-theme-hope";

export default hopeTheme({
  plugins: {
    slimsearch: true,
  },
});
```

## Task Lists

- [x] Support task lists
- [x] Support checkboxes
- [ ] Pending tasks
- [ ] Another pending task

## Footnotes

This is a paragraph with footnotes[^1].

This is another footnote[^note].

[^1]: This is the content of the first footnote.
[^note]: This is the content of the named footnote, which can use any identifier.

## Image Markup

Support adding markup and sizing to images:

![VuePress Logo](/logo.svg){width=200}

## Custom Alignment

::: center
This text is center aligned
:::

::: right
This text is right aligned
:::

## Superscript and Subscript

- H~2~O is the chemical formula for water
- 19^th^ represents nineteenth
- CO~2~ is carbon dioxide
- E = mc^2^ is the mass-energy equation

## Mark and Spoiler

==This text is marked and highlighted==

This is ordinary text !!spoiler content here!! Continue with ordinary text.

## Emoji Support

:tada: :100: :rocket: :star: :sparkles: :fire:

For the complete list of emojis, please refer to [Emoji Cheat Sheet](https://www.webfx.com/tools/emoji-cheat-sheet/).

## Charts and Diagrams

For more chart demonstrations, please visit:
- [Mermaid Diagrams](/en/demos/mermaid.html)
- [Flowchart](/en/demos/flowchart.html)
- [ECharts](/en/demos/echarts.html)
- [Chart.js](/en/demos/chartjs.html)

## Styles

To learn more about component features, please visit [VuePress Hope Theme Documentation](https://theme-hope.vuejs.press/).