---
date: 2024-01-01
icon: download
title: 安装 JustDB
order: 2
category:
  - 快速开始
  - 安装
tag:
  - 安装
  - 配置
  - 环境
---

# 安装指南

本文档介绍如何安装和配置 JustDB。

## 环境要求

### 必需环境

| 环境 | 版本要求 | 说明 |
|:---|:---|:---|
| **JDK** | 1.8+ | 推荐 JDK 11 或更高版本 |
| **Maven** | 3.6+ | 用于构建项目 |

### 可选环境

| 环境 | 用途 |
|:---|:---|
| Git | 版本控制和贡献代码 |
| IDE | IntelliJ IDEA / Eclipse / VS Code |
| 数据库 | MySQL / PostgreSQL / Oracle / H2 等（用于测试） |

## 验证环境

### 验证 Java 安装

```bash
java -version
# java version "1.8.0_292"
# Java(TM) SE Runtime Environment (build 1.8.0_292-b08)
```

### 验证 Maven 安装

```bash
mvn -v
# Apache Maven 3.6.3
# Java version: 1.8.0_292, vendor: Oracle Corporation
```

## 安装方式

### 方式一：Maven 依赖（推荐）

适用于 Java 项目集成 JustDB：

#### 核心模块

```xml
<dependency>
    <groupId>ai.justdb.justdb</groupId>
    <artifactId>justdb-core</artifactId>
    <version>1.0.0</version>
</dependency>
```

#### Spring Boot Starter

```xml
<dependency>
    <groupId>ai.justdb.justdb</groupId>
    <artifactId>justdb-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

#### CLI 工具

```xml
<dependency>
    <groupId>ai.justdb.justdb</groupId>
    <artifactId>justdb-cli</artifactId>
    <version>1.0.0</version>
</dependency>
```

#### AI 集成

```xml
<dependency>
    <groupId>ai.justdb.justdb</groupId>
    <artifactId>justdb-ai</artifactId>
    <version>1.0.0</version>
</dependency>
```

#### Excel 支持

```xml
<dependency>
    <groupId>ai.justdb.justdb</groupId>
    <artifactId>justdb-excel</artifactId>
    <version>1.0.0</version>
</dependency>
```

### 方式二：下载发行版

从 GitHub Releases 页面下载预编译的二进制包：

#### Linux / macOS

```bash
# 下载
wget https://github.com/justdb/justdb/releases/download/v1.0.0/justdb-1.0.0-linux.tar.gz

# 解压
tar -xzf justdb-1.0.0-linux.tar.gz
cd justdb-1.0.0

# 配置环境变量
export PATH=$PATH:$PWD/bin

# 验证安装
justdb --version
```

#### Windows

```powershell
# 下载并解压 justdb-1.0.0-windows.zip

# 将 bin 目录添加到系统 PATH 环境变量

# 验证安装
justdb --version
```

### 方式三：从源码构建

```bash
# 克隆仓库
git clone https://github.com/justdb/justdb.git
cd justdb

# 构建全部模块
mvn clean install

# 或跳过测试快速构建
mvn clean install -DskipTests
```

构建产物位于各模块的 `target/` 目录：

```
justdb-core/target/justdb-core-1.0.0.jar
justdb-cli/target/justdb-cli-1.0.0.jar
...
```

### 方式四：使用 Docker

```bash
# 拉取镜像
docker pull justdb/justdb:1.0.0

# 运行容器
docker run -v $(pwd)/schemas:/schemas justdb/justdb:1.0.0 migrate

# 使用 Docker Compose
version: '3'
services:
  justdb:
    image: justdb/justdb:1.0.0
    volumes:
      - ./schemas:/schemas
      - ./config:/config
    environment:
      - JUSTDB_DATABASE_URL=jdbc:mysql://db:3306/myapp
```

## Maven 仓库配置

### 使用阿里云镜像（推荐国内用户）

在 `~/.m2/settings.xml` 中配置：

```xml
<settings>
  <mirrors>
    <mirror>
      <id>aliyun</id>
      <mirrorOf>central</mirrorOf>
      <name>Aliyun Maven</name>
      <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
  </mirrors>
</settings>
```

## IDE 配置

### IntelliJ IDEA

1. **导入项目**
   - File → Open → 选择 `pom.xml`
   - 选择 "Import as Maven Project"

2. **配置 JDK**
   - File → Project Structure → Project SDK
   - 选择 JDK 1.8+

3. **启用注解处理**
   - File → Settings → Build, Execution, Deployment → Compiler → Annotation Processors
   - 启用 "Enable annotation processing"

### Eclipse

1. **导入项目**
   - File → Import → Maven → Existing Maven Projects
   - 选择项目根目录

2. **启用注解处理**
   - 项目属性 → Java Compiler → Annotation Processing
   - 启用 "Enable project specific settings"

### VS Code

1. **安装扩展**
   - Extension Pack for Java
   - Maven for Java

2. **配置 settings.json**
   ```json
   {
     "java.configuration.runtimes": [
       {
         "name": "JavaSE-1.8",
         "default": true
       }
     ]
   }
   ```

## 验证安装

### 验证 CLI 工具

```bash
justdb --version
# JustDB 1.0.0

justdb --help
# 显示帮助信息
```

### 验证 Java API

创建测试文件 `test.yaml`：

```yaml
id: test
namespace: com.test
Table:
  - id: test_table
    Column:
      - name: id
        type: INT
        primaryKey: true
```

执行测试：

```bash
justdb migrate test.yaml --dry-run
```

## 配置文件

### CLI 配置

JustDB CLI 支持通过配置文件设置默认值：

```yaml
# justdb-config.yaml
database:
  url: jdbc:mysql://localhost:3306/myapp
  username: root
  password: password

migrate:
  auto-diff: true
  safe-drop: false
  baseline-on-migrate: true

schema:
  locations:
    - ./justdb
    - ./db
  format: yaml
```

使用配置文件：

```bash
justdb migrate -c justdb-config.yaml
```

### 环境变量

```bash
# 数据库配置
export JUSTDB_DATABASE_URL="jdbc:mysql://localhost:3306/myapp"
export JUSTDB_DATABASE_USERNAME="root"
export JUSTDB_DATABASE_PASSWORD="password"

# 迁移配置
export JUSTDB_MIGRATION_AUTO_DIFF="true"
export JUSTDB_MIGRATION_SAFE_DROP="false"
```

## 数据库驱动

JustDB 会自动下载支持的数据库驱动，也可以手动配置：

### MySQL

```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.28</version>
</dependency>
```

### PostgreSQL

```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <version>42.3.1</version>
</dependency>
```

### H2（内存数据库，适合测试）

```xml
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <version>2.1.210</version>
</dependency>
```

## 常见问题

### 依赖下载失败

**问题**: Maven 无法下载依赖

**解决方案**：

1. 配置阿里云镜像（见上文）
2. 清理本地仓库缓存：

```bash
rm -rf ~/.m2/repository/ai.justdb
mvn clean install
```

### 编译失败

**问题**: 编译时出现错误

**解决方案**：

```bash
# 清理并重新构建
mvn clean compile

# 更新依赖
mvn clean install -U

# 跳过测试构建
mvn clean install -DskipTests
```

### Java 版本不兼容

**问题**: Java 版本过低导致构建失败

**解决方案**：

```bash
# 检查 Java 版本
java -version

# 设置 JAVA_HOME（Linux/macOS）
export JAVA_HOME=/path/to/jdk11

# 设置 JAVA_HOME（Windows）
set JAVA_HOME=C:\Program Files\Java\jdk-11
```

### CLI 命令找不到

**问题**: 执行 `justdb` 命令提示找不到

**解决方案**：

```bash
# 检查 PATH
echo $PATH  # Linux/macOS
echo %PATH% # Windows

# 确认 bin 目录在 PATH 中
which justdb  # Linux/macOS
where justdb  # Windows

# 如果不在 PATH，添加到 PATH
export PATH=$PATH:/path/to/justdb/bin
```

## 下一步

安装完成后，继续学习：

<VPCard
  title="快速开始"
  desc="5分钟快速上手 JustDB"
  link="/getting-started/quick-start.html"
/>

<VPCard
  title="第一个 Schema"
  desc="创建你的第一个 Schema 定义"
  link="/getting-started/first-schema.html"
/>

<VPCard
  title="Spring Boot 集成"
  desc="在 Spring Boot 中使用 JustDB"
  link="/getting-started/spring-boot-integration.html"
/>
