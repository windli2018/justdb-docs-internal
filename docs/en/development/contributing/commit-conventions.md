---
icon: commit
title: 提交约定
order: 3
category:
  - 贡献指南
  - 开发指南
tag:
  - Git
  - 提交
  - 版本控制
---

# 提交约定

遵循清晰的提交约定有助于理解项目历史和自动化版本发布。

## 提交消息格式

JustDB 使用[语义化提交](https://www.conventionalcommits.org/)格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 必需部分

#### Type（类型）

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(plugin): add Oracle database support` |
| `fix` | Bug 修复 | `fix(migration): handle renamed columns correctly` |
| `docs` | 文档 | `docs(readme): update installation instructions` |
| `style` | 代码风格（不影响功能） | `style(core): format code with checkstyle` |
| `refactor` | 重构 | `refactor(cli): extract command parser` |
| `perf` | 性能优化 | `perf(generator): cache compiled templates` |
| `test` | 测试 | `test(schema): add tests for Table diff` |
| `chore` | 构建/工具 | `chore(maven): upgrade Jackson to 2.15.2` |
| `ci` | CI 配置 | `ci(github): add workflow for integration tests` |

#### Subject（主题）

- 使用现在时、祈使语气（例如 "add" 而非 "added" 或 "adds"）
- 首字母小写
- 不要以句号结尾
- 限制在 50 个字符以内

#### Body（正文）

- 解释**是什么**和**为什么**（而非**怎么做**）
- 每行限制在 72 个字符以内
- 可以包含多个段落

#### Footer（脚注）

- 关联 Issue: `Closes #123`
- 破坏性变更: `BREAKING CHANGE: ...`

### 示例提交

#### 简单提交

```bash
git commit -m "feat(cli): add interactive mode"
```

#### 带正文的提交

```bash
git commit -m "fix(migration): handle table rename with data preservation

When renaming a table, the old data should be preserved. This fix
ensures that the table is renamed using ALTER TABLE ... RENAME
instead of DROP + CREATE.

Closes #456"
```

#### 破坏性变更

```bash
git commit -m "feat(api): change SchemaLoader return type

BREAKING CHANGE: SchemaLoader.load() now returns Loaded&lt;Justdb&gt;
instead of Justdb directly. This provides better error handling
and file location tracking.

Migration guide:
- Before: Justdb schema = loader.load(file);
- After: Loaded&lt;Justdb&gt; result = loader.load(file);"
```

## 提交最佳实践

### 1. 一个提交做一件事

```bash
# Bad: 多个不相关的更改
git commit -m "various fixes"

# Good: 分别提交
git commit -m "fix(schema): handle null column names"
git commit -m "fix(cli): validate file path exists"
```

### 2. 提交前检查

```bash
# 运行测试
mvn test

# 检查代码风格
mvn spotless:check

# 格式化代码
mvn spotless:apply
```

### 3. 编写有意义的消息

```bash
# Bad: 不清晰
git commit -m "update code"

# Good: 明确具体更改
git commit -m "refactor(generator): extract template loading logic"
```

## 常见提交模式

### 新功能

```bash
git commit -m "feat(plugin): add SQLite database support

Implements full SQLite support including:
- Database adapter with JDBC URL pattern
- Type mappings for SQLite-specific types
- SQL templates for CREATE/DROP operations
- Integration tests using Testcontainers"
```

### Bug 修复

```bash
git commit -m "fix(diff): correctly identify renamed columns

Former names comparison was case-sensitive, causing renamed
columns to be detected as add+remove instead of rename.

This fix adds case-insensitive comparison for former names."
```

### 重构

```bash
git commit -m "refactor(templates): introduce template inheritance

Allows plugins to inherit templates from parent plugins using
the ref-id attribute. This reduces template duplication across
similar database dialects."
```

### 文档

```bash
git commit -m "docs(api): add JavaDoc for SchemaDeployer

Documents all public methods with examples and usage notes.
Adds @throws tags for documented exceptions."
```

## 提交钩子

项目使用 Git 钩子确保提交质量：

### commitlint

自动检查提交消息格式：

```bash
# 安装钩子（首次）
npm install -g @commitlint/cli @commitlint/config-conventional
echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js
```

### Pre-commit 钩子

`.git/hooks/pre-commit`:

```bash
#!/bin/bash
# 运行快速检查
mvn spotless:check
mvn test -Dtest=*SmokeTest
```

## 修改提交历史

### 修改最近的提交

```bash
# 修改提交消息
git commit --amend

# 添加遗漏的文件
git add forgotten-file.java
git commit --amend --no-edit
```

### 修改多个提交

```bash
# 交互式变基
git rebase -i HEAD~3

# 在编辑器中:
# pick = 使用该提交
# reword = 编辑提交消息
# edit = 编辑提交内容
# squash = 合并到前一个提交
```

## 与 Issue 关联

### 关键字

在提交消息或 PR 描述中使用：

| 关键字 | 效果 |
|--------|------|
| `Closes #123` | 提交合并后关闭 Issue #123 |
| `Fixes #456` | 提交合并后关闭 Issue #456 |
| `Resolves #789` | 提交合并后关闭 Issue #789 |
| `Refs #101` | 关联但不关闭 Issue |
| `Related to #202` | 弱关联 |

### 示例

```bash
git commit -m "feat(ai): add natural language schema generation

Closes #123
Related to #100"
```

## 撤销提交

### 撤销最近的提交（保留更改）

```bash
git reset --soft HEAD~1
```

### 撤销最近的提交（丢弃更改）

```bash
git reset --hard HEAD~1
```

### 撤销已推送的提交

```bash
# 创建新的提交来撤销
git revert <commit-hash>
```

## 下一步

- [Pull Request 指南](./pull-request.md) - 提交 PR 的详细步骤
- [编码规范](./coding-standards.md) - 代码规范
- [发布流程](./release-process.md) - 版本发布流程
