<template>
  <section class="install-section">
    <div class="install-wrapper">
      <h2 class="install-title">{{ title }}</h2>
      <ClientOnly>
        <InstallTabs />
      </ClientOnly>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { locales } from '../locales';
import InstallTabs from './InstallTabs.vue';

const currentLang = ref('zh-CN');

// 检测语言
const detectLanguage = () => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    currentLang.value = path.startsWith('/en/') ? 'en-US' : 'zh-CN';
    console.log('[HomeInstallSection] 语言检测:', { path, currentLang: currentLang.value });
  }
};

onMounted(() => {
  detectLanguage();
});

const title = computed(() => {
  // 由于标题不在 locales 配置中，我们需要单独处理
  return currentLang.value === 'zh-CN' ? '快速安装' : 'Quick Installation';
});
</script>

<style scoped>
/* 快速安装区域 */
.install-section {
  padding: 4rem 1.5rem;
  background: linear-gradient(to bottom, var(--vp-c-bg-alt, #f6f8fa) 0%, var(--vp-c-bg, #ffffff) 100%);
}

.install-wrapper {
  max-width: 960px;
  margin: 0 auto;
}

.install-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 3rem;
  color: var(--vp-c-text-1, #2c3e50);
  position: relative;
}

.install-title::after {
  content: '';
  display: block;
  width: 60px;
  height: 3px;
  background: var(--vp-c-brand-1, #42b883);
  margin: 1rem auto 0;
  border-radius: 2px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .install-section {
    padding: 3rem 1.5rem;
  }

  .install-title {
    font-size: 2rem;
  }
}

/* 暗色主题适配 */
html[data-theme='dark'] .install-section {
  background: linear-gradient(to bottom, var(--vp-c-bg-alt, #1a1a1a) 0%, var(--vp-c-bg, #0d0d0d) 100%);
}

html[data-theme='dark'] .install-title {
  color: var(--vp-c-text-1, #aaaaaa);
}

html[data-theme='dark'] .install-title::after {
  background: var(--vp-c-brand-1, #42b883);
}
</style>
