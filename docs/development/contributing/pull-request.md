---
icon: code-branch
title: Pull Request 指南
order: 4
category:
  - 贡献指南
  - 开发指南
tag:
  - Pull Request
  - GitHub
  - 代码审查
---

# Pull Request 指南

Pull Request (PR) 是贡献代码的主要方式。本指南介绍 PR 的完整流程。

## PR 前准备

### 1. Fork 项目

如果你还没有 Fork，请先 Fork [JustDB 仓库](https://github.com/verydb/justdb)。

### 2. 保持 Fork 同步

```bash
# 添加上游仓库（如果还没有）
git remote add upstream https://github.com/verydb/justdb.git

# 获取上游更改
git fetch upstream

# 合并到你的主分支
git checkout main
git merge upstream/main

# 推送到你的 Fork
git push origin main
```

### 3. 创建功能分支

```bash
# 从最新的 main 创建分支
git checkout main
git pull upstream main

# 创建功能分支
git checkout -b feature/your-feature-name

# 或修复分支
git checkout -b fix/issue-number-description
```

## 分支命名约定

| 类型 | 格式 | 示例 |
|------|------|------|
| 新功能 | `feature/*` | `feature/oracle-support` |
| Bug 修复 | `fix/*` | `fix/123-column-rename` |
| 重构 | `refactor/*` | `refactor/template-loading` |
| 文档 | `docs/*` | `docs/api-readme` |
| 性能 | `perf/*` | `perf/schema-caching` |
| 测试 | `test/*` | `test/integration-tests` |

## 开发流程

### 1. 编写代码

- 遵循[编码规范](./coding-standards.md)
- 编写测试
- 更新文档

### 2. 本地测试

```bash
# 运行所有测试
mvn clean test

# 运行特定测试
mvn test -Dtest=YourTestClass

# 检查代码风格
mvn spotless:check

# 格式化代码
mvn spotless:apply

# 完整构建
mvn clean install
```

### 3. 提交更改

```bash
# 添加更改
git add .

# 提交（遵循提交约定）
git commit -m "feat: add your feature description"

# 推送到你的 Fork
git push origin feature/your-feature-name
```

## 创建 PR

### 1. 在 GitHub 上打开 PR

访问: `https://github.com/YOUR_USERNAME/justdb/compare/feature/your-feature-name`

点击 "Compare & pull request" 按钮。

### 2. 填写 PR 模板

PR 描述应该包含：

```markdown
## 概述
&lt;!-- 简要描述此 PR 的目的 --&gt;

## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 破坏性变更
- [ ] 文档更新
- [ ] 性能改进
- [ ] 代码重构

## 相关 Issue
Closes #(issue number)

## 变更说明
&lt;!-- 详细说明你的更改 --&gt;

## 测试
&lt;!-- 描述如何测试这些更改 --&gt;

## 检查清单
- [ ] 代码遵循项目编码规范
- [ ] 添加了必要的测试
- [ ] 所有测试通过
- [ ] 更新了相关文档
- [ ] 提交消息遵循约定
```

### 3. PR 标题格式

使用与提交消息相同的格式：

```
type(scope): subject
```

例如：
- `feat(plugin): add Oracle database support`
- `fix(migration): handle renamed columns correctly`
- `docs(readme): update installation instructions`

## PR 审查流程

### 1. 自动检查

PR 创建后，以下自动检查会运行：

| 检查 | 说明 |
|------|------|
| CI Build | 编译和运行测试 |
| Code Style | Checkstyle 验证 |
| Coverage | 测试覆盖率检查 |

### 2. 代码审查

维护者会审查你的代码，可能会：

- 请求更改
- 提出建议
- 询问设计决策
- 要求添加测试

### 3. 响应审查

```bash
# 根据反馈进行更改
git commit -m "fix: address review comments"

# 推送到同一分支（PR 会自动更新）
git push origin feature/your-feature-name
```

### 4. 更新 PR

在 PR 描述中添加：

```markdown
## 更新日志
- 2024-01-15: 添加单元测试
- 2024-01-16: 修复审查问题
```

## PR 合并

### 合并方式

JustDB 使用以下合并策略：

| 策略 | 适用场景 |
|------|----------|
| Squash and merge | 大多数 PR |
| Merge commit | 多个相关提交 |
| Rebase and merge | 线性历史重要时 |

### 合并条件

PR 在满足以下条件后才会合并：

- [ ] 所有自动检查通过
- [ ] 至少一个维护者批准
- [ ] 没有未解决的审查意见
- [ ] CI 构建成功

## PR 最佳实践

### 1. 保持 PR 小而聚焦

```bash
# Bad: 大型 PR 包含多个不相关的更改
# Good: 拆分成多个小 PR
```

### 2. 及时响应审查

- 目标：24 小时内响应
- 如果需要时间，请告知维护者

### 3. 保持分支更新

```bash
# 在 review 过程中同步上游更改
git fetch upstream
git rebase upstream/main
git push origin feature/your-feature-name --force-with-lease
```

### 4. 编写清晰的描述

帮助审查者理解：
- 为什么要做这个更改？
- 如何实现这些更改？
- 如何测试这些更改？

## 常见问题

### CI 失败

**问题**: 自动检查失败

**解决**:
1. 检查失败日志
2. 在本地复现
3. 修复问题并推送新提交

### 冲突解决

```bash
# 获取上游更改
git fetch upstream

# 变基到最新的 main
git rebase upstream/main

# 解决冲突
# 编辑冲突文件
git add &lt;resolved-files&gt;
git rebase --continue

# 推送更新
git push origin feature/your-feature-name --force-with-lease
```

### PR 被拒绝

如果你的 PR 被拒绝，不要气馁：

- 仔细阅读反馈
- 在 Issue 中讨论设计
- 重新提交

## PR 清理

合并后可以删除分支：

```bash
# 删除本地分支
git branch -d feature/your-feature-name

# 删除远程分支
git push origin --delete feature/your-feature-name
```

## 下一步

- [提交约定](./commit-conventions.md) - 提交消息格式
- [编码规范](./coding-standards.md) - 代码规范
- [发布流程](./release-process.md) - 版本发布
