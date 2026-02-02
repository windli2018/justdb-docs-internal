import { defineUserConfig } from 'vuepress';
import { viteBundler } from '@vuepress/bundler-vite';
import theme from './theme.ts';

export default defineUserConfig({
  base: '/',
  title: 'VuePress Starter',
  description: 'VuePress Starter Project in Stackblitz',
  port: 8081,

  bundler: viteBundler({
    // vite bundler options here
  }),
  theme,
  plugins: [
    // 移除与主题冲突的插件
  ],
  locales: {
    // The key is the path for the locale to be nested under.
    // As a special case, the default locale can use '/' as its path.
    '/': {
      lang: 'zh-CN',
      title: 'VuePress Starter',
      description: 'VuePress Starter Project in Stackblitz',
    },
    '/en/': {
      lang: 'en-US',
      title: 'VuePress Starter',
      description: 'VuePress Starter Project in Stackblitz',
    },
  },
});