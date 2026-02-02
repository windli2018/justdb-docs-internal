# VuePress 站点

这是一个使用 VuePress 构建的静态网站，已配置自动部署到 GitHub Pages。

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
# 或
pnpm docs:dev
```

## 构建静态文件

```bash
# 构建站点
pnpm docs:build
```

## 部署到 GitHub Pages

此项目已配置 GitHub Actions 自动部署工作流。当您向 `main` 或 `master` 分支推送更改时，站点会自动构建并部署到 GitHub Pages。

工作流文件位于 `.github/workflows/deploy.yml`。

### 手动部署（可选）

如果您想从本地手动部署：

```bash
pnpm docs:deploy
```

注意：这需要您已配置好 GitHub 令牌。

## 配置说明

- 站点基础路径设置为 `/` 以适配 GitHub Pages（根据您的仓库名称）
- 构建输出目录为 `docs/.vuepress/dist`
- 支持多语言（中文和英文）

## GitHub Pages 设置

为了使部署正常工作，请确保在仓库设置中启用 GitHub Pages：

1. 进入仓库的 "Settings" 选项卡
2. 在左侧菜单中选择 "Pages"
3. 将 "Source" 设置为 "Deploy from a branch"
4. 选择 "gh-pages" 分支和 "/" 文件夹
5. 点击 "Save"

您的站点将在 `https://<your-username>.github.io/<repository-name>` 上可用。