---
icon: download
title: 安装指南
order: 5
category:
  - 指南
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

## Maven 依赖

### 核心模块

JustDB 核心 API，提供 Schema 定义和数据库操作功能。

```xml
<dependency>
    <groupId>org.verydb.justdb</groupId>
    <artifactId>justdb-core</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Spring Boot Starter

开箱即用的 Spring Boot 集成，应用启动时自动执行数据库迁移。

```xml
<dependency>
    <groupId>org.verydb.justdb</groupId>
    <artifactId>justdb-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

### CLI 工具

命令行工具，提供交互式数据库管理功能。

```xml
<dependency>
    <groupId>org.verydb.justdb</groupId>
    <artifactId>justdb-cli</artifactId>
    <version>1.0.0</version>
</dependency>
```

### AI 集成

AI 助手集成，支持自然语言操作数据库。

```xml
<dependency>
    <groupId>org.verydb.justdb</groupId>
    <artifactId>justdb-ai</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Excel 支持

支持从 Excel 文件导入/导出 Schema。

```xml
<dependency>
    <groupId>org.verydb.justdb</groupId>
    <artifactId>justdb-excel</artifactId>
    <version>1.0.0</version>
</dependency>
```

## CLI 工具安装

### 方式一：使用发行版

#### Linux / macOS

```bash
# 下载
wget https://github.com/verydb/justdb/releases/download/v1.0.0/justdb-1.0.0-linux.tar.gz

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

### 方式二：从源码构建

```bash
# 克隆仓库
git clone https://github.com/verydb/justdb.git
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

### 方式三：使用 Maven 直接运行

```bash
# 克隆仓库
git clone https://github.com/verydb/justdb.git
cd justdb/justdb-cli

# 使用 Maven 运行
mvn exec:java -Dexec.mainClass="org.verydb.justdb.cli.JustDBCli"
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

4. **推荐插件**
   - Lombok Plugin
   - YAML/ANSI Support
   - Maven Helper

### Eclipse

1. **导入项目**
   - File → Import → Maven → Existing Maven Projects
   - 选择项目根目录

2. **启用注解处理**
   - 项目属性 → Java Compiler → Annotation Processing
   - 启用 "Enable project specific settings"

3. **安装 Lombok**
   - 下载 lombok.jar
   - 运行 `java -jar lombok.jar`
   - 选择 Eclipse 安装目录并安装

### VS Code

1. **安装扩展**
   - Extension Pack for Java
   - Maven for Java
   - YAML

2. **配置 settings.json**
   ```json
   {
     "java.configuration.runtimes": [
       {
         "name": "JavaSE-1.8",
         "default": true
       }
     ],
     "java.jdt.ls.java.home": "/path/to/jdk1.8"
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
  - name: test_table
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

### Oracle

```xml
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc8</artifactId>
    <version>21.3.0.0</version>
</dependency>
```

### SQL Server

```xml
<dependency>
    <groupId>com.microsoft.sqlserver</groupId>
    <artifactId>mssql-jdbc</artifactId>
    <version>9.4.1.jre8</version>
</dependency>
```

## 常见问题

### 依赖下载失败

**问题**: Maven 无法下载依赖

**解决方案**：

1. 配置阿里云镜像（见上文）
2. 清理本地仓库缓存：

```bash
rm -rf ~/.m2/repository/org/verydb
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
  link="/guide/spring-boot.html"
/>
