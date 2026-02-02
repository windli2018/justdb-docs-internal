---
title: 组件功能演示
icon: puzzle-piece
category:
  - 功能演示
tag:
  - 组件
  - VPCard
  - Badge
---

# 组件功能演示

本页面展示了 VuePress Hope 主题提供的各种内置组件。

## Badge 徽章

### 基础徽章

<Badge text="提示" type="tip" />
<Badge text="警告" type="warning" />
<Badge text="危险" type="danger" />
<Badge text="信息" type="info" />
<Badge text="注意" type="note" />

### 自定义颜色

<Badge text="VuePress" color="blue" />
<Badge text="Hope 主题" color="green" />
<Badge text="v2.0" color="orange" />

### 垂直对齐

- 文本 <Badge text="重要" vertical="middle" />
- 文本 <Badge text="新功能" type="tip" vertical="top" />
- 文本 <Badge text="已弃用" type="warning" vertical="bottom" />

## VPCard 卡片

### 基础卡片

<VPCard
  title="VuePress 项目"
  desc="一个静态站点生成器"
  logo="🚀"
  link="/"
/>

### 带背景的卡片

<VPCard
  title="用户指南"
  desc="快速了解 VuePress 的使用方法"
  logo="📘"
  link="/guide/"
  background="linear-gradient(to right, #42b883, #35495e)"
  color="white"
/>

### 卡片组合

<div class="vp-card-group">
  <VPCard
    title="快速开始"
    desc="5分钟上手 VuePress"
    logo="🚀"
    link="/guide/getting-started.html"
  />
  <VPCard
    title="功能演示"
    desc="查看各种功能示例"
    logo="🎯"
    link="/demos/"
  />
  <VPCard
    title="常见问题"
    desc="解决使用中的疑问"
    logo="❓"
    link="/faqs/"
  />
</div>

## 容器

### 提示容器

::: tip 提示
这是一条提示信息
:::

::: info 信息
这是一条普通信息
:::

::: note 注意
这是一条需要注意的信息
:::

::: warning 警告
这是一条警告信息
:::

::: danger 危险
这是一条危险警告信息
:::

::: details 点击展开详情
这是详细内容，默认折叠。点击标题可以展开查看。

- 支持 Markdown 语法
- 可以包含代码块
- 也可以嵌套其他内容

```javascript
console.log('Hello, VuePress!')
```
:::

### 自定义标题

::: tip 💡 小贴士
使用快捷键 Ctrl+K 可以快速打开搜索
:::

::: warning ⚠️ 重要提醒
保存数据前请确保网络连接正常
:::

## 代码组

### 代码选项卡

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

### 代码高亮

```typescript{1,4-6}
import { hopeTheme } from "vuepress-theme-hope";

export default hopeTheme({
  plugins: {
    slimsearch: true,
  },
});
```

## 任务列表

- [x] 支持任务列表
- [x] 支持复选框
- [ ] 待完成的任务
- [ ] 另一个待完成任务

## 脚注

这是一段带脚注的文本[^1]。

这是另一个脚注[^note]。

[^1]: 这是第一个脚注的内容。
[^note]: 这是命名脚注的内容，可以使用任意标识符。

## 图片标记

支持给图片添加标记和尺寸：

![VuePress Logo](/logo.svg){width=200}

## 自定义对齐

::: center
这段文本居中对齐
:::

::: right
这段文本右对齐
:::

## 上标和下标

- H~2~O 是水的化学式
- 19^th^ 表示第19
- CO~2~ 是二氧化碳
- E = mc^2^ 是质能方程

## 标记和剧透

==这段文本被标记高亮==

这是一段普通文本 !!剧透内容在这里!! 继续普通文本。

## Emoji 支持

:tada: :100: :rocket: :star: :sparkles: :fire:

完整的 Emoji 列表请参考 [Emoji Cheat Sheet](https://www.webfx.com/tools/emoji-cheat-sheet/)。

## 图表和图示

更多图表演示请查看：
- [Mermaid 图示](/demos/mermaid.html)
- [Flowchart 流程图](/demos/flowchart.html)
- [ECharts 图表](/demos/echarts.html)
- [Chart.js 图表](/demos/chartjs.html)

## 样式

希望了解更多组件功能，请访问 [VuePress Hope 主题文档](https://theme-hope.vuejs.press/zh/)。