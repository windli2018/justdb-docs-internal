import { defineClientConfig } from 'vuepress/client';
import InstallTabs from './components/InstallTabs.vue';
import HomeInstallSection from './components/HomeInstallSection.vue';
import Layout from './layouts/Layout.vue';

// Import custom styles
import './styles/index.css';

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
