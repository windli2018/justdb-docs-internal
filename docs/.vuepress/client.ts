import { defineClientConfig } from 'vuepress/client';
import InstallTabs from './components/InstallTabs.vue';
import HomeInstallSection from './components/HomeInstallSection.vue';
import Layout from './layouts/Layout.vue';

export default defineClientConfig({
  enhance({ app, router, siteData }) {
    app.component('InstallTabs', InstallTabs);
    app.component('HomeInstallSection', HomeInstallSection);
  },
  layouts: {
    Layout,
  },
  setup() {
    // ...
  },
  rootComponents: [
    // ...
  ],
});
