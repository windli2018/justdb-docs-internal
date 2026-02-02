import { sidebar } from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  "/": [
    "",
    {
      text: "指南",
      icon: "lightbulb",
      prefix: "/guide/",
      link: "/guide/",
      children: ["getting-started.md"],
    },
    {
      text: "演示",
      icon: "laptop-code",
      prefix: "/demos/",
      link: "/demos/",
      children: [
        "search-demo.md",
        "components-demo.md",
        "theme-features.md"
      ],
    },
  ],
});