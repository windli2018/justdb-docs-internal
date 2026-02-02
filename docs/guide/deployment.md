# 部署

## GitHub Pages 部署

本项目已配置自动部署到 GitHub Pages 的工作流。

### 配置步骤

1. 将代码推送到 GitHub 仓库
2. 在 GitHub 仓库中启用 GitHub Pages 功能
3. 确保 GitHub Actions 已启用（默认情况下已启用）

### 工作流文件

项目根目录下的 `.github/workflows/deploy.yml` 包含了完整的部署配置：

- 当推送到 `main` 或 `master` 分支时自动触发
- 使用 Ubuntu 环境进行构建
- 安装 pnpm 和项目依赖
- 执行 `pnpm docs:build` 构建静态文件
- 部署到 GitHub Pages

### 基础路径配置

当前配置的 `base` 路径为 `/vuepress-izvrnrbt/`，对应于仓库名称。如果您更改了仓库名称，请相应地更新 `docs/.vuepress/config.ts` 中的 `base` 配置。

### 手动部署

如果需要从本地手动部署，可以运行：

```bash
pnpm docs:deploy
```

这将构建站点并将输出部署到 GitHub Pages。