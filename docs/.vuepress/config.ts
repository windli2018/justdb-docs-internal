import { defineUserConfig } from 'vuepress';
import { viteBundler } from '@vuepress/bundler-vite';
import theme from './theme.ts';
import { debugSlimSearchPlugin } from './plugins/debug-slimsearch';

export default defineUserConfig({
  base: '/',
  title: 'JustDB',
  description: '所见即所得数据库开发套件 - 声明式 Schema 定义和智能迁移',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
  ],
  port: 8081,

  bundler: viteBundler({
    // vite bundler options here
  }),
  theme,
  plugins: [
    // Debug SlimSearch duplicate ID issue
    debugSlimSearchPlugin(),
  ],
  locales: {
    // The key is the path for the locale to be nested under.
    // As a special case, the default locale can use '/' as its path.
    '/': {
      lang: 'zh-CN',
      title: 'JustDB',
      description: '所见即所得数据库开发套件 - 声明式 Schema 定义和智能迁移',
    },
    '/en/': {
      lang: 'en-US',
      title: 'JustDB',
      description: 'WYSIWYG Database Development Kit - Declarative Schema Definition and Intelligent Migration',
    },
  },
});