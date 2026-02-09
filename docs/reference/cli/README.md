---
title: CLI 概述
icon: terminal
description: JustDB 命令行界面简介、安装和基本用法
order: 1
---

# CLI 概述

JustDB CLI 是一个功能强大的命令行工具，用于管理数据库 Schema、执行迁移、生成代码和与 AI 助手交互。

## 安装

### 使用 Maven 构建

```bash
# 克隆仓库
git clone https://github.com/verydb/justdb.git
cd justdb

# 构建项目
mvn clean package -DskipTests

# CLI 工具位于 justdb-cli/target/justdb-cli-*-bin.tar.gz
```

### 使用 Docker

```bash
docker pull verydb/justdb:latest
docker run -it --rm verydb/justdb:latest --help
```

### 从发布版本下载

从 [GitHub Releases](https://github.com/verydb/justdb/releases) 下载预编译的二进制文件。

## 基本用法

```bash
# 显示帮助信息
justdb --help

# 显示特定命令的帮助
justdb migrate --help

# 查看版本
justdb --version
```

## 命令分类

### Schema 管理

| 命令 | 描述 |
|------|------|
| [`init`](./commands.md#init) | 初始化新的 JustDB 项目 |
| [`db2schema`](./commands.md#db2schema) | 从数据库导出 Schema |
| [`format`](./commands.md#format) | 格式化 Schema 文件 |
| [`validate`](./commands.md#validate) | 验证 Schema 定义 |

### 迁移和部署

| 命令 | 描述 |
|------|------|
| [`migrate`](./commands.md#migrate) | 执行 Schema 迁移 |
| [`diff`](./commands.md#diff) | 比较 Schema 差异 |
| [`deploy`](./commands.md#deploy) | 部署 Schema 到数据库 |

### 代码生成

| 命令 | 描述 |
|------|------|
| [`convert`](./commands.md#convert) | 转换 Schema 格式或生成代码 |

### SQL 操作

| 命令 | 描述 |
|------|------|
| [`sql`](./commands.md#sql) | SQL 交互式模式或执行 SQL |

### AI 集成

| 命令 | 描述 |
|------|------|
| [`ai`](./commands.md#ai) | 一次性 AI 查询 |
| [`interactive`](./interactive-mode.md) | 交互式 Shell（含 AI 助手） |
| [`ai-history`](./commands.md#ai-history) | 管理 AI 历史记录 |

### 配置和插件

| 命令 | 描述 |
|------|------|
| [`config`](./commands.md#config) | 管理 CLI 配置 |
| [`plugin`](./commands.md#plugin) | 管理插件 |
| [`driver`](./commands.md#driver) | 管理 JDBC 驱动 |

### 其他工具

| 命令 | 描述 |
|------|------|
| [`show`](./commands.md#show) | 显示 Schema 信息 |
| [`test`](./commands.md#test) | 测试数据库连接 |
| [`testrun`](./commands.md#testrun) | 测试运行 Schema |
| [`load`](./commands.md#load) | 加载 Schema 文件 |
| [`save`](./commands.md#save) | 保存 Schema 文件 |
| [`watch`](./commands.md#watch) | 监控文件变化 |

## 通用选项

所有命令都支持以下通用选项：

### 输入选项 (InputMixin)

```bash
-i, --input &lt;files&gt;      # 输入文件/目录/URL（逗号分隔）
--type &lt;types&gt;           # 文件类型 (yaml, json, xml, sql, java, class)
-p, --project &lt;name&gt;     # 项目名称或路径
```

### 输出选项 (OutputMixin)

```bash
-o, --output &lt;path&gt;      # 输出文件或目录（自动检测）
-t, --format &lt;fmt&gt;       # 输出格式: yaml, json, xml, toml, sql, java
-r, --report-format &lt;fmt&gt; # 报告格式: text, xml, md, html, json, yaml
```

### 数据库连接选项 (DatabaseConnectionMixin)

```bash
-U, --db-url &lt;url&gt;       # JDBC URL
-u, --db-username &lt;user&gt; # 数据库用户名
-w, --db-password &lt;pass&gt; # 数据库密码
-D, --dialect &lt;type&gt;     # 数据库方言（自动检测）
-C, --current-database &lt;name&gt; # 使用配置文件中的数据库
```

### 表过滤选项 (TableFilterMixin)

```bash
-I, --include-tables &lt;patterns&gt;  # 包含表模式（支持通配符 * 和 ?）
-X, --exclude-tables &lt;patterns&gt;  # 排除表模式
```

### 数据过滤选项 (DataFilterMixin)

```bash
--data-filter &lt;condition&gt;         # 数据过滤条件
--process-data                    # 处理数据节点
```

### 全局选项

```bash
-c, --config &lt;files&gt;     # 配置文件（可多次指定）
--disable-plugins &lt;list&gt; # 禁用插件
-v, --verbose            # 详细输出
-q, --quiet              # 静默模式
--log-level &lt;level&gt;      # 日志级别: trace, debug, info, warn, error
--log-file &lt;file&gt;        # 日志文件
-f, --force              # 强制执行
-n, --dry-run            # 模拟运行
```

## 配置文件

JustDB CLI 支持多种配置格式：

### 配置文件查找顺序（优先级从低到高）

1. 内置配置 (`justdb/builtin-config.*`)
2. 自动发现配置 (`~/.justdb-cli.*`, `./.justdb-cli.*`)
3. 用户指定配置 (`-c` 选项)
4. 环境变量
5. 命令行参数（最高优先级）

### 支持的配置格式

- YAML (`.yaml`, `.yml`)
- JSON (`.json`)
- XML (`.xml`)
- Properties (`.properties`)
- TOML (`.toml`)

详细配置说明请参考 [配置文件文档](./configuration.md)。

## 快速开始

### 1. 初始化项目

```bash
justdb init myproject
cd myproject
```

### 2. 连接数据库

编辑 `justdb.yaml`：

```yaml
databases:
  - name: production
    type: mysql
    jdbcUrl: jdbc:mysql://localhost:3306/mydb
    username: root
    password: password
```

### 3. 导出 Schema

```bash
justdb db2schema -C production -o schema.yaml
```

### 4. 执行迁移

```bash
justdb migrate -C production schema.yaml
```

### 5. 使用 AI 助手

```bash
# 进入交互模式
justdb interactive

# 或一次性查询
justdb ai "创建一个用户表"
```

## 最佳实践

1. **使用配置文件**：将数据库连接信息存储在配置文件中，避免每次输入
2. **版本控制**：将 Schema 文件纳入版本控制
3. **先验证后迁移**：使用 `validate` 命令在迁移前检查 Schema
4. **使用 AI 辅助**：利用 AI 助手快速生成 Schema 定义
5. **查看差异**：使用 `diff` 命令在迁移前查看变更

## 相关文档

- [命令参考](./commands.md) - 完整的命令列表和选项
- [交互式模式](./interactive-mode.md) - 交互式 Shell 使用指南
- [配置文件](./configuration.md) - 配置文件详细说明
- [文件加载机制](./file-loading.md) - Schema 文件加载规则
