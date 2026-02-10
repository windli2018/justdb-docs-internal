---
icon: hands-helping
title: 贡献指南概述
order: 1
category:
  - 贡献指南
  - 开发指南
tag:
  - 贡献
  - 社区
  - 开发
---

# 贡献指南概述

感谢你对 JustDB 项目的关注！我们欢迎各种形式的贡献。

## 贡献类型

### 代码贡献

- **Bug 修复**: 修复已知问题
- **新功能**: 添加新特性
- **性能优化**: 提升性能
- **测试**: 增加测试覆盖率
- **文档**: 改进文档

### 非代码贡献

- **问题报告**: 报告 Bug 或提出建议
- **代码审查**: 审查 Pull Request
- **文档改进**: 修正错误或补充说明
- **社区支持**: 帮助其他用户

## 贡献流程

### 1. 寻找任务

查看以下来源寻找可贡献的任务：

| 来源 | 说明 |
|------|------|
| [GitHub Issues](https://github.com/justdb/justdb/issues) | Bug 和功能请求 |
| `good first issue` 标签 | 适合新手的任务 |
| [`help wanted`](https://github.com/justdb/justdb/labels/help%20wanted) 标签 | 需要帮助的任务 |
| [路线图](../../plans/roadmap.md) | 计划中的功能 |

### 2. 环境准备

```bash
# Fork 项目到你的 GitHub 账号

# 克隆你的 Fork
git clone https://github.com/YOUR_USERNAME/justdb.git
cd justdb

# 添加上游远程仓库
git remote add upstream https://github.com/justdb/justdb.git

# 创建功能分支
git checkout -b feature/your-feature-name
```

### 3. 开发

- 遵循[编码规范](./coding-standards.md)
- 编写测试
- 更新文档
- 确保构建通过

### 4. 提交代码

```bash
# 添加变更
git add .

# 提交（遵循提交约定）
git commit -m "feat: add support for custom database types"

# 推送到你的 Fork
git push origin feature/your-feature-name
```

### 5. 创建 Pull Request

在 GitHub 上创建 Pull Request，详见 [Pull Request 指南](./pull-request.md)。

## 开发规范

### 代码规范

- 遵循项目[编码规范](./coding-standards.md)
- 使用 Checkstyle 确保代码风格一致
- 编写单元测试，保持测试覆盖率
- 添加 JavaDoc 注释

### 提交规范

- 遵循[提交约定](./commit-conventions.md)
- 使用语义化提交消息
- 一个提交只做一件事
- 提交前运行测试

### 行为准则

- 尊重所有贡献者
- 建设性的反馈
- 接受不同观点
- 专注于项目目标

## 获取帮助

### 联系方式

| 方式 | 说明 |
|------|------|
| GitHub Issues | 报告 Bug 和功能请求 |
| GitHub Discussions | 技术讨论和问答 |
| Pull Request | 代码审查讨论 |

### 资源

- [文档首页](../..)
- [设计文档](../../design/)
- [API 参考](../../reference/api/)
- [插件开发](../plugin-development/)

## 认可贡献者

我们会在以下地方认可贡献者：

- 项目贡献者列表
- 发布说明
- 项目网站

## 下一步

- [编码规范](./coding-standards.md) - 了解代码规范
- [提交约定](./commit-conventions.md) - 学习提交消息格式
- [Pull Request 指南](./pull-request.md) - 提交 PR 的详细步骤
