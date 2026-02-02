import { navbar } from "vuepress-theme-hope";

export const enNavbar = navbar([
  "/en/",
  {
    text: "Guide",
    icon: "lightbulb",
    link: "/en/guide/",
  },

  {
    text: "External Links",
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
