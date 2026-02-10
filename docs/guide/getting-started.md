# 开始使用

欢迎来到 VuePress 启动项目！本指南将帮助您开始使用 VuePress。

## 安装

要安装 VuePress，请运行以下命令：

```bash
npm install -g vuepress
```

或使用 yarn：

```bash
yarn global add vuepress
```

## 创建项目

创建并进入一个新目录：

```bash
mkdir my-project
cd my-project
```

使用您喜欢的包管理器初始化：

```bash
# 如果使用 npm
npm init

# 如果使用 yarn
yarn init
```

将 VuePress 作为本地依赖安装：

```bash
# 如果使用 npm
npm install -D @justdb/cli

# 如果使用 yarn
yarn add -D @justdb/cli
```

## 创建您的第一个文档

创建一个 `docs` 目录：

```bash
mkdir docs
```

创建您的第一个文档 `docs/README.md`：

```bash
echo '# Hello VuePress' > docs/README.md
```

## 添加一些内容

让我们给我们的页面添加一些额外的内容：

```markdown
# Hello VuePress

这是我第一个 VuePress 页面！

- 项目 1
- 项目 2
- 项目 3
```

## 添加脚本

向您的 `package.json` 添加一些脚本：

```json
{
  "scripts": {
    "docs:dev": "vuepress dev docs",
    "docs:build": "vuepress build docs"
  }
}
```

## 开发服务器

运行开发服务器：

```bash
# 如果使用 npm
npm run docs:dev

# 如果使用 yarn
yarn docs:dev
```

您的网站将在 `http://localhost:8080` 上可用。

## 构建

构建您的网站：

```bash
# 如果使用 npm
npm run docs:build

# 如果使用 yarn
yarn docs:build
```

静态文件将在 `docs/.vuepress/dist` 文件夹中生成。

## 配置

创建 `.vuepress/config.js` 以开始应用配置：

```js
module.exports = {
  title: 'Hello VuePress',
  description: 'Just playing around'
}
```

## 主题配置

VuePress 自带一个默认主题，为文档提供基本布局。您可以通过修改配置文件中的主题配置来自定义它。

有关更多信息，请查看 [官方文档](https://v2.vuepress.vuejs.org/)。