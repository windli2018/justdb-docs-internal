/**
 * 国际化配置文件
 * 集中管理多语言文本
 */

export interface LocaleConfig {
  copy: string;
  copied: string;
  npm: string;
  yarn: string;
  pnpm: string;
  bun: string;
}

export const locales: Record<string, LocaleConfig> = {
  'zh-CN': {
    copy: '复制',
    copied: '✓ 已复制',
    npm: 'npm',
    yarn: 'Yarn',
    pnpm: 'pnpm',
    bun: 'Bun'
  },
  'en-US': {
    copy: 'Copy',
    copied: '✓ Copied',
    npm: 'npm',
    yarn: 'Yarn',
    pnpm: 'pnpm',
    bun: 'Bun'
  }
};

// 获取当前语言环境
export const getCurrentLocale = (): string => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    return path.startsWith('/en/') ? 'en-US' : 'zh-CN';
  }
  return 'zh-CN'; // 服务端渲染时的默认值
};

// 通用翻译函数
export const translate = (key: string, locale?: string): string => {
  const currentLocale = locale || getCurrentLocale();
  const localeConfig = locales[currentLocale];
  return localeConfig?.[key as keyof typeof localeConfig] || key;
};

// 创建翻译函数工厂
export const createTranslation = (locale?: string) => {
  return (key: string) => translate(key, locale);
};