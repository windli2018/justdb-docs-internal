---
icon: tag
title: 发布流程
order: 5
category:
  - 贡献指南
  - 开发指南
tag:
  - 发布
  - 版本
  - Maven
---

# 发布流程

本文档描述 JustDB 的版本发布流程，由维护者执行。

## 版本号约定

JustDB 使用[语义化版本](https://semver.org/)：

```
MAJOR.MINOR.PATCH
```

| 部分 | 说明 | 示例 |
|------|------|------|
| MAJOR | 破坏性变更 | 1.0.0 → 2.0.0 |
| MINOR | 新功能（向后兼容） | 1.0.0 → 1.1.0 |
| PATCH | Bug 修复（向后兼容） | 1.0.0 → 1.0.1 |

## 发布前检查

### 1. 创建发布分支

```bash
git checkout -b release/1.0.0
```

### 2. 更新版本号

#### 根 POM

`pom.xml`:

```xml
<version>1.0.0</version>
```

#### 子模块 POM

确保所有子模块继承父 POM 版本。

### 3. 运行完整测试

```bash
# 清理并完整构建
mvn clean install

# 运行所有测试
mvn verify

# 检查代码覆盖率
mvn jacoco:report
```

### 4. 更新文档

- 更新 CHANGELOG.md
- 更新版本说明
- 检查 API 文档完整性

## 发布流程

### 1. 提交版本更新

```bash
git add pom.xml **/pom.xml
git commit -m "chore: bump version to 1.0.0"
```

### 2. 创建发布标签

```bash
# 创建带注释的标签
git tag -a v1.0.0 -m "Release JustDB 1.0.0

Features:
- MySQL, PostgreSQL, Oracle support
- AI integration with OpenAI
- Spring Boot Starter
- JDBC Driver

Bug Fixes:
- Fix column rename detection
- Fix template loading

Documentation:
- Complete API documentation
- Plugin development guide"
```

### 3. 推送到远程

```bash
# 推送分支
git push origin release/1.0.0

# 推送标签
git push origin v1.0.0
```

### 4. 触发 CI 发布

GitHub Actions 会自动：

1. 构建所有模块
2. 运行完整测试套件
3. 生成 Javadoc
4. 部署到 Maven Central
5. 创建 GitHub Release

### 5. 验证发布

```bash
# 验证 Maven Central 可用
mvn dependency:get -Dartifact=org.verydb.justdb:justdb-core:1.0.0

# 验证 GitHub Release
# 访问: https://github.com/verydb/justdb/releases
```

## 发布后任务

### 1. 合并到 main

```bash
git checkout main
git merge release/1.0.0
git push origin main
```

### 2. 准备下一版本

```bash
# 更新到开发版本
git checkout -b develop/1.1.0-SNAPSHOT

# 更新 POM 版本
vim pom.xml  # 改为 1.1.0-SNAPSHOT

git add pom.xml
git commit -m "chore: bump version to 1.1.0-SNAPSHOT"
git push origin develop/1.1.0-SNAPSHOT
```

### 3. 发布公告

在以下渠道发布公告：

- GitHub Release
- 项目网站
- 邮件列表（如有）
- 社交媒体

## 回滚流程

如果发布出现严重问题：

### 1. 标记为预发布

```bash
# 删除标签（如可能）
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

### 2. 发布修复版本

```bash
# 创建修复分支
git checkout -b hotfix/1.0.1 main

# 修复问题
git add .
git commit -m "fix: critical bug in production"

# 发布修复版本
git tag -a v1.0.1 -m "Hotfix: critical bug fix"
git push origin v1.0.1
```

## Maven Central 发布

### GPG 密钥配置

```bash
# 生成 GPG 密钥
gpg --gen-key

# 导出公钥
gpg --keyserver hkp://pool.sks-keyservers.net --send-keys YOUR_KEY_ID

# 配置 Maven settings.xml
<settings>
    <servers>
        <server>
            <id>ossrh</id>
            <username>your-username</username>
            <password>your-password</password>
        </server>
    </servers>
</settings>
```

### 手动发布（如需要）

```bash
# 部署到 OSSRH
mvn clean deploy -P release

# 验证在 OSSRH staging 仓库
# 登录: https://oss.sonatype.org/
```

## 版本兼容性

### 公共 API 稳定性

| 版本范围 | API 兼容性 |
|----------|------------|
| 1.x.x | 完全兼容 |
| 1.x.y → 1.x.z | 完全兼容 |
| 1.x.x → 2.0.0 | 可能有破坏性变更 |

### 弃用策略

```java
/**
 * @deprecated Use {@link #newMethod()} instead.
 * This method will be removed in version 2.0.0
 */
@Deprecated
public void oldMethod() {
    // ...
}
```

## 发布检查清单

### 发布前

- [ ] 所有测试通过
- [ ] 代码覆盖率 >= 70%
- [ ] 文档更新完整
- [ ] CHANGELOG.md 更新
- [ ] 版本号更新

### 发布中

- [ ] 创建 Git 标签
- [ ] 推送标签到远程
- [ ] CI 构建成功
- [ ] Maven Central 部署成功

### 发布后

- [ ] 验证 Maven 依赖可用
- [ ] 验证 GitHub Release
- [ ] 发布公告
- [ ] 合并到 main 分支
- [ ] 准备下一版本

## 下一步

- [提交约定](./commit-conventions.md) - 提交消息格式
- [Pull Request 指南](./pull-request.md) - PR 流程
- [编码规范](./coding-standards.md) - 代码规范
