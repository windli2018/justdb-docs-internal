<script setup lang="ts">
import { Layout } from 'vuepress-theme-hope/client'
import HomeInstallSection from '../components/HomeInstallSection.vue'
</script>

<template>
  <Layout>
    <!-- 在 Hero 区域之后插入安装方式（Features 之前） -->
    <template #heroAfter>
      <HomeInstallSection />
    </template>
  </Layout>
</template>
