import { hopeTheme } from "vuepress-theme-hope";

import { enNavbar, zhNavbar } from "./navbar/index.js";
import { enSidebar, zhSidebar } from "./sidebar/index.js";

export default hopeTheme({
  hostname: "https://vuepress-theme-hope.github.io",
  author: {
    name: "VuePress Theme Hope",
    url: "https://theme-hope.vuejs.press",
  },

  // 使用新配置方式
  icon: {
    assets: "fontawesome-with-brands",
  },

  logo: "/logo.svg",

  repo: "vuepress-theme-hope/vuepress-theme-hope",

  docsDir: "docs",

  // 导航栏
  navbar: zhNavbar,

  // 侧边栏
  sidebar: zhSidebar,

  // 页脚
  footer: "默认页脚",
  displayFooter: true,

  // 加密配置
  encrypt: {
    config: {
      "/guide/encrypt.html": ["1234"],
    },
  },

  // Markdown增强插件 - 移到顶层
  mdEnhance: {
    align: true,
    attrs: true,
    codetabs: true,
    component: true,
    demo: true,
    figure: true,
    imgLazyload: true,
    imgSize: true,
    include: true,
    mark: true,
    stylize: [
      {
        matcher: "Recommended",
        replacer: ({ tag }) => {
          if (tag === "em")
            return {
              tag: "Badge",
              attrs: { type: "tip" },
              children: "Recommended",
            };
        },
      },
    ],
    sub: true,
    sup: true,
    tasklist: true,
    vPre: true,

    // 启用图表
    chart: true,

    // 启用 ECharts
    echarts: true,

    // 启用 Mermaid
    mermaid: true,

    // 启用 Flowchart
    flowchart: true,

    // 启用 Markmap
    markmap: [
      "/markmap/",
      "http://localhost:8081/markmap/",
    ],

    // 启用 PlantUML
    plantuml: true,

    // 启用 vue-playground
    vuePlayground: true,

    // 启用 playground
    playground: {
      presets: ["ts", "vue"],
    },
  },

  // 多语言配置
  locales: {
    "/": {
      // 导航栏和侧边栏
      navbar: zhNavbar,
      sidebar: zhSidebar,
      
      // 多语言下拉菜单的标题
      selectLanguageName: "简体中文",
      selectLanguageText: "选择语言",
      selectLanguageAriaLabel: "选择语言",

      // 语言下拉菜单
      navbarLocales: {
        langName: "简体中文",
      },

      // 书签
      bookmark: {
        label: "在阅读列表中添加书签",
        save: "添加书签",
      },

      // 页面元数据
      meta: {
        contributorsText: "贡献者",
      },

      // 404页面
      notFound: [
        "这里什么都没有",
        "我们怎么到这来了？",
        "这是一个 404 页面",
        "看起来我们进入了错误的链接",
      ],
      backToHome: "返回首页",

      // 无障碍
      a11y: {
        darkMode: "暗黑模式",
        lightMode: "明亮模式",
        accessible: "无障碍网站",
        toggleSidebar: "切换侧边栏",
      },

      // 元数据
      blog: {
        article: "文章",
        articleList: "文章列表",
        category: "分类",
        tag: "标签",
        timeline: "时间轴",
        timelineText: "昨日不再",
        allText: "全部",
      },
    },

    "/en/": {
      // 导航栏和侧边栏
      navbar: enNavbar,
      sidebar: enSidebar,
      
      selectLanguageName: "English",
      selectLanguageText: "Languages",
      selectLanguageAriaLabel: "Select language",

      // 语言下拉菜单
      navbarLocales: {
        langName: "English",
      },

      // 书签
      bookmark: {
        label: "Bookmark this post",
        save: "Bookmark",
      },

      // 页面元数据
      meta: {
        contributorsText: "Contributors",
      },

      // 404页面
      notFound: [
        "There's nothing here",
        "How did we get here?",
        "That's a 404 page",
        "Looks like we've got lost",
      ],
      backToHome: "Back to home",

      // 无障碍
      a11y: {
        darkMode: "Dark Mode",
        lightMode: "Light Mode",
        accessible: "Accessible Website",
        toggleSidebar: "Toggle sidebar",
      },

      // 元数据
      blog: {
        article: "Articles",
        articleList: "Article List",
        category: "Category",
        tag: "Tag",
        timeline: "Timeline",
        timelineText: "Yesterday Once More",
        allText: "All",
      },
    },
  },

  plugins: {
    // 评论插件
    comment: {
      provider: "Giscus",
      repo: "vuepress-theme-hope/giscus-discussions",
      repoId: "R_kgDOG_Pt2A",
      category: "Announcements",
      categoryId: "DIC_kwDOG_Pt2M4COD69",
    },

    // 组件插件
    components: {
      components: ["Badge", "VPCard"],
    },

    // 搜索插件
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
          searching: "搜索中", 
          defaultTitle: "文档", 
          select: "选择", 
          navigate: "切换", 
          autocomplete: "自动补全", 
          exit: "关闭", 
          queryHistory: "搜索历史", 
          resultHistory: "历史结果", 
          emptyHistory: "无搜索历史", 
          emptyResult: "没有找到结果", 
          loading: "正在加载搜索索引..." 
        },
        '/en/': { 
          cancel: "Cancel", 
          placeholder: "Search", 
          search: "Search", 
          searching: "Searching", 
          defaultTitle: "Documentation", 
          select: "to select", 
          navigate: "to navigate", 
          autocomplete: "to autocomplete", 
          exit: "to exit", 
          queryHistory: "Search History", 
          resultHistory: "Result History", 
          emptyHistory: "Empty Search History", 
          emptyResult: "No results found", 
          loading: "Loading search indexes..." 
        },
      },
    },

    // SEO插件
    seo: {
      canonical: "https://theme-hope.vuejs.press",
    },
  },
});