# Getting Started

Welcome to the VuePress starter project! This guide will help you get started with VuePress.

## Installation

To install VuePress, run the following command:

```bash
npm install -g vuepress
```

Or using yarn:

```bash
yarn global add vuepress
```

## Create a Project

Create and change into a new directory:

```bash
mkdir my-project
cd my-project
```

Initialize with your preferred package manager:

```bash
# If using npm
npm init

# If using yarn
yarn init
```

Install VuePress as a local dependency:

```bash
# If using npm
npm install -D vuepress@next

# If using yarn
yarn add -D vuepress@next
```

## Create Your First Document

Create a `docs` directory:

```bash
mkdir docs
```

Create your first document `docs/README.md`:

```bash
echo '# Hello VuePress' > docs/README.md
```

## Add Some Content

Let's add some additional content to our page:

```markdown
# Hello VuePress

This is my first VuePress page!

- Item 1
- Item 2
- Item 3
```

## Add Scripts

Add some scripts to your `package.json`:

```json
{
  "scripts": {
    "docs:dev": "vuepress dev docs",
    "docs:build": "vuepress build docs"
  }
}
```

## Development Server

Run the development server:

```bash
# If using npm
npm run docs:dev

# If using yarn
yarn docs:dev
```

Your site will be available at `http://localhost:8080`.

## Build

Build your site:

```bash
# If using npm
npm run docs:build

# If using yarn
yarn docs:build
```

The static files will be generated in the `docs/.vuepress/dist` folder.

## Configuration

Create `.vuepress/config.js` to start applying configurations:

```js
module.exports = {
  title: 'Hello VuePress',
  description: 'Just playing around'
}
```

## Theme Configuration

VuePress comes with a default theme that provides basic layout for documentation. You can customize it by modifying the theme configuration in your config file.

For more information, please check out the [official documentation](https://v2.vuepress.vuejs.org/).