import { navbar } from "vuepress-theme-hope";

export const enNavbar = navbar([
  "/en/",
  {
    text: "Guide",
    icon: "lightbulb",
    link: "/en/guide/",
  },
  {
    text: "Quick Start",
    icon: "rocket",
    link: "/en/getting-started/",
  },
  {
    text: "Reference",
    icon: "book",
    children: [
      {
        text: "Schema Definition",
        link: "/en/reference/schema/",
        icon: "table",
      },
      {
        text: "Format Support",
        link: "/en/reference/formats/",
        icon: "file-code",
      },
      {
        text: "CLI Tools",
        link: "/en/reference/cli/",
        icon: "terminal",
      },
      {
        text: "Java API",
        link: "/en/reference/api/",
        icon: "code",
      },
      {
        text: "Database Support",
        link: "/en/reference/databases/",
        icon: "database",
      },
      {
        text: "AI Integration",
        link: "/en/reference/ai/",
        icon: "robot",
      },
    ],
  },
  {
    text: "Design",
    icon: "pen-to-square",
    children: [
      {
        text: "Architecture",
        link: "/en/design/architecture/",
        icon: "sitemap",
      },
      {
        text: "Schema System",
        link: "/en/design/schema-system/",
        icon: "layer-group",
      },
      {
        text: "Template System",
        link: "/en/design/template-system/",
        icon: "file-lines",
      },
      {
        text: "Migration System",
        link: "/en/design/migration-system/",
        icon: "rotate",
      },
      {
        text: "JDBC Driver",
        link: "/en/design/jdbc-driver/",
        icon: "plug",
      },
    ],
  },
  {
    text: "Development",
    icon: "wrench",
    children: [
      {
        text: "Build Guide",
        link: "/en/development/build/",
        icon: "hammer",
      },
      {
        text: "Plugin Development",
        link: "/en/development/plugin-development/",
        icon: "puzzle-piece",
      },
      {
        text: "Contributing",
        link: "/en/development/contributing/",
        icon: "handshake",
      },
    ],
  },
  {
    text: "Roadmap",
    icon: "road",
    link: "/en/plans/roadmap.md",
  },
  {
    text: "External Links",
    icon: "link",
    children: [
      {
        text: "GitHub",
        link: "https://github.com/justdb/justdb",
        icon: "github",
      },
      {
        text: "Gitee",
        link: "https://gitee.com/justdb/justdb",
        icon: "gitee",
      },
    ],
  },
]);
