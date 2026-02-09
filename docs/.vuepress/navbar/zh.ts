import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
  "/",
  {
    text: "指南",
    icon: "lightbulb",
    link: "/guide/",
  },
  {
    text: "快速开始",
    icon: "rocket",
    link: "/getting-started/",
  },
  {
    text: "参考文档",
    icon: "book",
    children: [
      {
        text: "Schema 定义",
        link: "/reference/schema/",
        icon: "table",
      },
      {
        text: "格式支持",
        link: "/reference/formats/",
        icon: "file-code",
      },
      {
        text: "CLI 工具",
        link: "/reference/cli/",
        icon: "terminal",
      },
      {
        text: "Java API",
        link: "/reference/api/",
        icon: "code",
      },
      {
        text: "数据库支持",
        link: "/reference/databases/",
        icon: "database",
      },
      {
        text: "AI 集成",
        link: "/reference/ai/",
        icon: "robot",
      },
    ],
  },
  {
    text: "设计文档",
    icon: "pen-to-square",
    children: [
      {
        text: "架构设计",
        link: "/design/architecture/",
        icon: "sitemap",
      },
      {
        text: "Schema 系统",
        link: "/design/schema-system/",
        icon: "layer-group",
      },
      {
        text: "模板系统",
        link: "/design/template-system/",
        icon: "file-lines",
      },
      {
        text: "迁移系统",
        link: "/design/migration-system/",
        icon: "rotate",
      },
      {
        text: "JDBC 驱动",
        link: "/design/jdbc-driver/",
        icon: "plug",
      },
    ],
  },
  {
    text: "开发指南",
    icon: "wrench",
    children: [
      {
        text: "构建指南",
        link: "/development/build/",
        icon: "hammer",
      },
      {
        text: "插件开发",
        link: "/development/plugin-development/",
        icon: "puzzle-piece",
      },
      {
        text: "贡献指南",
        link: "/development/contributing/",
        icon: "handshake",
      },
    ],
  },
  {
    text: "路线图",
    icon: "road",
    link: "/plans/roadmap.md",
  },
  {
    text: "外部链接",
    icon: "link",
    children: [
      {
        text: "GitHub",
        link: "https://github.com/verydb/justdb",
        icon: "github",
      },
      {
        text: "Gitee",
        link: "https://gitee.com/verydb/justdb",
        icon: "gitee",
      },
    ],
  },
]);