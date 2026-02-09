---
icon: hammer
title: 从源码构建
order: 1
category:
  - 构建指南
  - 开发指南
tag:
  - 构建
  - Maven
  - 开发
---

# 从源码构建

本指南介绍如何从源码构建 JustDB 项目。

## 环境要求

### 必需组件

| 组件 | 最低版本 | 推荐版本 | 说明 |
|------|----------|----------|------|
| JDK | 1.8 | 11 或 17 | Java 开发工具包 |
| Maven | 3.6 | 3.8+ | 项目构建工具 |

### 可选组件

| 组件 | 用途 |
|------|------|
| Git | 版本控制，用于克隆仓库 |
| Docker | 运行集成测试中的数据库 |

### 验证环境

```bash
# 检查 Java 版本
java -version
# 输出示例: java version "1.8.0_XXX"

# 检查 Maven 版本
mvn -version
# 输出示例: Apache Maven 3.6.X
```

## 克隆仓库

```bash
# 使用 HTTPS 克隆
git clone https://github.com/verydb/justdb.git
cd justdb

# 或使用 SSH 克隆（需要配置 SSH 密钥）
git clone git@github.com:verydb/justdb.git
cd justdb
```

## 构建命令

### 完整构建（含测试）

执行完整构建，包括编译、测试和安装到本地仓库：

```bash
mvn clean install
```

此命令会：
1. 清理之前的构建输出 (`clean`)
2. 编译所有模块源代码
3. 运行所有单元测试和集成测试
4. 将构建产物安装到本地 Maven 仓库 (`~/.m2/repository`)

### 跳过测试构建

如果不需要运行测试（例如，快速验证编译）：

```bash
mvn clean install -DskipTests
```

### 仅编译

只编译不安装：

```bash
mvn clean compile
```

### 打包

生成 JAR 文件：

```bash
mvn clean package
```

构建产物位于各模块的 `target/` 目录下。

## 测试配置

### 运行测试

```bash
# 运行所有测试
mvn test

# 运行特定测试类
mvn test -Dtest=ItemScopesTest

# 运行特定测试方法
mvn test -Dtest=ItemScopesTest#testTableScopesDeserialization
```

### 测试分组

JustDB 使用 JUnit 5 的标签功能对测试进行分组：

```bash
# 仅运行冒烟测试（快速验证）
mvn test -Psmoke-test

# 仅运行核心测试（关键功能）
mvn test -Pcore-test

# 运行冒烟和核心测试（跳过功能测试）
mvn test -Psmoke-core

# 运行所有测试（默认）
mvn test -Pfull-test
```

### Testcontainers 配置

集成测试使用 [Testcontainers](https://www.testcontainers.org/) 运行真实数据库：

```bash
# 确保 Docker 正在运行
docker --version

# 运行集成测试（需要 Docker）
mvn verify
```

**测试数据库要求**：
- MySQL 5.7+
- PostgreSQL 12+
- 其他数据库根据测试需求

## Maven 配置

### 本地仓库设置

如需使用自定义 Maven 本地仓库：

```bash
mvn clean install -Dmaven.repo.local=/path/to/local/repo
```

### Maven Settings

配置 `~/.m2/settings.xml` 以设置镜像和认证：

```xml
<settings>
    <!-- 阿里云镜像（中国用户推荐） -->
    <mirrors>
        <mirror>
            <id>aliyun</id>
            <mirrorOf>central</mirrorOf>
            <name>Aliyun Maven Mirror</name>
            <url>https://maven.aliyun.com/repository/public</url>
        </mirror>
    </mirrors>

    <!-- 凭证配置（如需发布） -->
    <servers>
        <server>
            <id>ossrh</id>
            <username>your-username</username>
            <password>your-password</password>
        </server>
    </servers>
</settings>
```

## 常见问题

### 编译失败

**问题**: 找不到某些依赖

**解决方案**:
```bash
# 清理并重新下载依赖
rm -rf ~/.m2/repository/org/verydb
mvn clean install -U
```

### 测试失败

**问题**: 集成测试因数据库连接失败

**解决方案**:
```bash
# 检查 Docker 是否运行
docker ps

# 或跳过集成测试
mvn clean install -DskipTests
```

### 内存不足

**问题**: 构建时 Maven 内存溢出

**解决方案**:
```bash
# 增加 Maven 内存
export MAVEN_OPTS="-Xmx2048m -Xms512m"
mvn clean install
```

## 构建产物

构建完成后，主要产物包括：

| 产物 | 位置 | 说明 |
|------|------|------|
| justdb-core JAR | `justdb-core/target/` | 核心库 |
| justdb-cli JAR | `justdb-cli/target/` | CLI 工具 |
| justdb-jdbc JAR | `justdb-jdbc/target/` | JDBC 驱动 |
| justdb-spring-boot-starter JAR | `justdb-spring-boot-starter/target/` | Spring Boot Starter |

## 下一步

- [Maven 项目结构](./maven-structure.md) - 了解项目模块结构
- [测试指南](./testing.md) - 编写和运行测试
- [编码规范](../contributing/coding-standards.md) - 了解代码规范
