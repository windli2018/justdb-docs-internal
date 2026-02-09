---
icon: layers
title: Maven 项目结构
order: 2
category:
  - 构建指南
  - 开发指南
tag:
  - Maven
  - 模块
  - 架构
---

# Maven 项目结构

JustDB 是一个多模块 Maven 项目，采用分层架构设计。本文介绍项目的模块结构和依赖关系。

## 项目结构

```
justdb/
├── pom.xml                           # 根 POM
├── justdb-root/                      # 根模块
├── justdb-parent/                    # 父 POM（依赖管理）
├── justdb-api/                       # 公共 API 定义
├── justdb-core/                      # 核心实现
├── justdb-cli/                       # 命令行工具
├── justdb-jdbc/                      # JDBC 驱动
├── justdb-ai/                        # AI 集成
├── justdb-spring-boot-starter/       # Spring Boot Starter
├── justdb-excel/                     # Excel 支持
├── justdb-ui/                        # Web UI
├── justdb-desktop/                   # 桌面应用
├── justdb-plugins/                   # 插件包
├── justdb-integration-tests/         # 集成测试
├── justdb-examples/                  # 示例代码
├── justdb-mysql-protocol/            # MySQL 协议兼容层
├── justdb-mcp/                       # MCP 服务器
└── justdb-ikvm/                      # IKVM .NET 兼容层
```

## 模块说明

### 核心模块

#### justdb-api

**定位**: 公共 API 定义模块

**职责**:
- 定义 JustDB 的公共接口
- Schema 模型接口
- 扩展点接口定义

**依赖**: 无（或最小依赖）

**依赖者**: 所有其他模块

#### justdb-core

**定位**: 核心功能实现

**职责**:
- Schema 加载和解析（XML/JSON/YAML/TOML）
- SQL 生成引擎
- 模板系统
- 插件管理器
- Schema 差异计算
- 迁移执行引擎

**关键组件**:
- `org.verydb.justdb.schema.*` - Schema 模型
- `org.verydb.justdb.generator.*` - SQL 生成
- `org.verydb.justdb.templates.*` - 模板引擎
- `org.verydb.justdb.plugin.*` - 插件系统
- `org.verydb.justdb.migration.*` - 迁移管理

**依赖**:
- `justdb-api` - 公共 API
- Jackson - JSON 处理
- JAXB - XML 处理
- SnakeYAML - YAML 处理
- Handlebars - 模板引擎

### 工具模块

#### justdb-cli

**定位**: 命令行工具

**职责**:
- 提供命令行界面
- 命令解析和执行
- 交互式模式

**主要命令**:
- `migrate` - 执行迁移
- `diff` - 计算差异
- `db2schema` - 从数据库提取 Schema
- `validate` - 验证 Schema
- `ai` - AI 助手

**依赖**:
- `justdb-core` - 核心功能
- Picocli - CLI 框架

#### justdb-jdbc

**定位**: JDBC 驱动实现

**职责**:
- 实现 JDBC Driver 接口
- 支持 MySQL 协议兼容
- SQL 解析和路由

**依赖**:
- `justdb-core` - 核心功能

#### justdb-ai

**定位**: AI 集成模块

**职责**:
- 集成 OpenAI API
- 集成通义千问 API
- 本地 LLM 支持
- 自然语言 Schema 生成

**依赖**:
- `justdb-core` - 核心功能
- OpenAI SDK / HTTP 客户端

### 集成模块

#### justdb-spring-boot-starter

**定位**: Spring Boot 自动配置

**职责**:
- 自动配置 JustDB 组件
- Spring Boot 属性绑定
- 自动迁移支持

**依赖**:
- `justdb-core` - 核心功能
- Spring Boot - 自动配置

#### justdb-excel

**定位**: Excel 数据导入导出

**职责**:
- 从 Excel 读取数据
- 将数据写入 Excel
- Schema 和数据迁移

**依赖**:
- `justdb-core` - 核心功能
- Apache POI - Excel 处理

### UI 模块

#### justdb-ui

**定位**: Web 用户界面

**职责**:
- Schema 可视化编辑
- 数据浏览和编辑
- 迁移历史查看

**依赖**:
- `justdb-core` - 核心功能

#### justdb-desktop

**定位**: 桌面应用程序

**职责**:
- 跨平台桌面应用
- 离线工作支持

**依赖**:
- `justdb-core` - 核心功能

### 测试和示例

#### justdb-integration-tests

**定位**: 集成测试

**职责**:
- 端到端测试
- 多数据库兼容性测试
- Testcontainers 集成

**依赖**:
- 所有业务模块

#### justdb-examples

**定位**: 示例代码

**内容**:
- 基础用法示例
- 高级特性示例
- Spring Boot 集成示例

### 扩展模块

#### justdb-mysql-protocol

**定位**: MySQL 协议兼容层

**职责**:
- 实现 MySQL 协议
- 允许 MySQL 客户端连接

**依赖**:
- `justdb-core` - 核心功能

#### justdb-mcp

**定位**: Model Context Protocol 服务器

**职责**:
- AI Agent 集成
- LLM 上下文提供

**依赖**:
- `justdb-core` - 核心功能

## 依赖关系图

```
                    ┌─────────────┐
                    │ justdb-api  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ justdb-core │◄──────┐
                    └──────┬──────┘       │
                           │              │
        ┌──────────────────┼──────────────┼──────────────┐
        │                  │              │              │
┌───────▼──────┐  ┌────────▼─────┐ ┌────▼─────┐  ┌────▼──────┐
│ justdb-cli   │  │ justdb-jdbc  │ │justdb-ai │  │justdb-ui  │
└──────────────┘  └──────────────┘ └──────────┘  └───────────┘
        │                  │              │
┌───────▼──────┐  ┌────────▼─────┐ ┌────▼─────┐
│ justdb-      │  │ justdb-      │ │justdb-   │
│ spring-boot- │  │ mysql-       │ │mcp       │
│ starter      │  │ protocol     │ │          │
└──────────────┘  └──────────────┘ └──────────┘
```

## 依赖管理

### 父 POM (justdb-parent)

`justdb-parent/pom.xml` 统一管理所有依赖版本：

```xml
&lt;properties&gt;
    &lt;maven.compiler.source&gt;8&lt;/maven.compiler.source&gt;
    &lt;maven.compiler.target&gt;8&lt;/maven.compiler.target&gt;
    &lt;project.build.sourceEncoding&gt;UTF-8&lt;/project.build.sourceEncoding&gt;
    &lt;!-- 依赖版本 --&gt;
    &lt;jackson.version&gt;2.15.2&lt;/jackson.version&gt;
    &lt;slf4j.version&gt;2.0.7&lt;/slf4j.version&gt;
    &lt;!-- ... --&gt;
&lt;/properties&gt;

&lt;dependencyManagement&gt;
    &lt;dependencies&gt;
        &lt;!-- 统一版本管理 --&gt;
    &lt;/dependencies&gt;
&lt;/dependencyManagement&gt;
```

### 根 POM (justdb-root)

`justdb-root/pom.xml` 定义模块列表和构建 profile：

```xml
&lt;modules&gt;
    &lt;module&gt;justdb-parent&lt;/module&gt;
    &lt;module&gt;justdb-api&lt;/module&gt;
    &lt;module&gt;justdb-core&lt;/module&gt;
    &lt;!-- ... --&gt;
&lt;/modules&gt;

&lt;profiles&gt;
    &lt;!-- 测试分组 --&gt;
    &lt;profile&gt;
        &lt;id&gt;smoke-test&lt;/id&gt;
        &lt;!-- ... --&gt;
    &lt;/profile&gt;
    &lt;!-- ... --&gt;
&lt;/profiles&gt;
```

## 配置文件

### justdb-core 主要配置

| 配置文件 | 位置 | 用途 |
|----------|------|------|
| default-plugins.xml | `src/main/resources/` | 内置插件和模板 |
| logback.xml | `src/main/resources/` | 日志配置 |
| checkstyle.xml | 项目根目录 | 代码风格检查 |

### Maven Profile

| Profile | 用途 |
|---------|------|
| smoke-test | 仅运行冒烟测试 |
| core-test | 仅运行核心测试 |
| full-test | 运行所有测试（默认） |
| smoke-core | 运行冒烟和核心测试 |
| dist | 构建分发包 |

## 模块依赖最佳实践

1. **单向依赖**: 高层模块依赖低层模块，避免循环依赖
2. **接口隔离**: 公共接口定义在 `justdb-api`
3. **核心独立**: `justdb-core` 不依赖 CLI、UI 等工具模块
4. **可选依赖**: AI、Excel 等功能通过可选依赖引入

## 下一步

- [从源码构建](./build-from-source.md) - 构建项目
- [测试指南](./testing.md) - 运行和编写测试
- [插件开发](../plugin-development/) - 开发自定义插件
