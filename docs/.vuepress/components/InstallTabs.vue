<template>
  <div class="install-tabs-container">
    <div class="tabs-header">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tabs-content">
      <div v-show="activeTab === 'npm'" class="tab-panel">
        <div class="code-block">
          <code>npm install vuepress@next</code>
          <button class="copy-button" @click="copyCode('npm install vuepress@next')">
            {{ copied === 'npm' ? t('copied') : t('copy') }}
          </button>
        </div>
      </div>
      <div v-show="activeTab === 'yarn'" class="tab-panel">
        <div class="code-block">
          <code>yarn add vuepress@next</code>
          <button class="copy-button" @click="copyCode('yarn add vuepress@next')">
            {{ copied === 'yarn' ? t('copied') : t('copy') }}
          </button>
        </div>
      </div>
      <div v-show="activeTab === 'pnpm'" class="tab-panel">
        <div class="code-block">
          <code>pnpm add vuepress@next</code>
          <button class="copy-button" @click="copyCode('pnpm add vuepress@next')">
            {{ copied === 'pnpm' ? t('copied') : t('copy') }}
          </button>
        </div>
      </div>
      <div v-show="activeTab === 'bun'" class="tab-panel">
        <div class="code-block">
          <code>bun add vuepress@next</code>
          <button class="copy-button" @click="copyCode('bun add vuepress@next')">
            {{ copied === 'bun' ? t('copied') : t('copy') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { locales, getCurrentLocale, createTranslation } from '../locales';

const activeTab = ref('npm');
const copied = ref('');
const currentLang = ref('zh-CN');

// 使用更可靠的方法检测语言
const detectLanguage = () => {
  if (typeof window !== 'undefined') {
    // 从 URL 路径判断语言
    const path = window.location.pathname;
    // 如果路径以 /en/ 开头，则为英文，否则为中文
    currentLang.value = path.startsWith('/en/') ? 'en-US' : 'zh-CN';
  } else {
    // 服务端渲染时的默认值
    currentLang.value = 'zh-CN';
  }
};

onMounted(() => {
  detectLanguage();
  
  // 监听 URL 变化
  const handleUrlChange = () => {
    detectLanguage();
  };
  
  // 监听浏览器前进后退事件
  window.addEventListener('popstate', handleUrlChange);
  
  // 如果有 hashchange 事件也触发检测
  window.addEventListener('hashchange', handleUrlChange);
});

// 从当前语言判断是否为中文
const isChinese = computed(() => currentLang.value === 'zh-CN');

// 定义翻译函数
const t = computed(() => {
  return createTranslation(currentLang.value);
});

const tabs = computed(() => [
  { id: 'npm', label: t.value('npm') },
  { id: 'yarn', label: t.value('yarn') },
  { id: 'pnpm', label: t.value('pnpm') },
  { id: 'bun', label: t.value('bun') },
]);

const copyCode = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = activeTab.value;
    setTimeout(() => {
      copied.value = '';
    }, 2000);
  } catch (err) {
    console.error('复制失败:', err);
  }
};

</script>

<style scoped>
.install-tabs-container {
  margin: 3rem auto;
  max-width: 800px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  background: var(--vp-c-bg);
}

.tabs-header {
  display: flex;
  background: var(--vp-code-block-bg, #f6f6f7);
  border-bottom: 1px solid var(--vp-c-divider, #e2e2e3);
}

.tab-button {
  flex: 1;
  padding: 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: var(--vp-c-text-2, #666);
  transition: all 0.3s ease;
  position: relative;
}

.tab-button:hover {
  background: rgba(66, 184, 131, 0.1);
  color: #42b883;
}

.tab-button.active {
  color: #42b883;
  background: var(--vp-code-block-bg, white);
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #42b883;
}

.tabs-content {
  background: var(--vp-code-block-bg, white);
}

.tab-panel {
  padding: 2rem;
}

.code-block {
  position: relative;
  background: var(--vp-code-block-bg, #f6f8fa);
  color: var(--vp-code-block-color, #333333);
  padding: 1.5rem;
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.code-block code {
  color: var(--vp-c-brand-1, #42b883);
  font-size: 1.1rem;
}

.copy-button {
  padding: 0.5rem 1rem;
  background: var(--vp-c-brand-1, #42b883);
  color: var(--vp-c-bg, white);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.copy-button:hover {
  background: var(--vp-c-brand-2, #33a06f);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(66, 184, 131, 0.3);
}

.copy-button:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .tabs-header {
    flex-wrap: wrap;
  }

  .tab-button {
    flex: 1 0 50%;
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .code-block {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .code-block code {
    font-size: 0.9rem;
    word-break: break-all;
  }

  .copy-button {
    align-self: stretch;
  }
}

/* 暗色主题适配 */
html[data-theme='dark'] .install-tabs-container {
  background: var(--vp-c-bg, #0d0d0d);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
}

html[data-theme='dark'] .tabs-header {
  background: var(--vp-code-block-bg, #1a1a1a);
  border-bottom: 1px solid var(--vp-c-divider, #333);
}

html[data-theme='dark'] .tab-button {
  color: var(--vp-c-text-2, #888);
}

html[data-theme='dark'] .tab-button.active {
  background: var(--vp-code-block-bg, #151515);
}

html[data-theme='dark'] .tabs-content {
  background: var(--vp-code-block-bg, #151515);
}

html[data-theme='dark'] .code-block {
  background: var(--vp-code-block-bg, #1a1a1a);
  color: var(--vp-code-block-color, #aaa);
}

html[data-theme='dark'] .code-block code {
  color: var(--vp-c-brand-1, #4a9d7f);
}</style>