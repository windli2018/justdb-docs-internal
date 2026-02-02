import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
  "/",
  {
    text: "指南",
    icon: "lightbulb",
    link: "/guide/",
  },

  {
    text: "外部链接",
    icon: "house",
    children: [
      {
        text: "GitHub",
        link: "https://github.com",
        icon: "github",
      },
      {
        text: "VuePress",
        link: "https://v2.vuepress.vuejs.org",
        icon: "vuepress",
      },
    ],
  },
]);