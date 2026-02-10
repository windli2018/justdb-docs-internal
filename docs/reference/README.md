---
icon: list
title: 参考文档
order: 10
---

# 参考文档

JustDB 完整参考文档，涵盖 Schema 定义、CLI 命令、API 使用等内容。

## 参考文档章节

### Schema 定义

**[Schema 参考](./schema/)** - 完整的 Schema 定义文档

- [Schema 概述](./schema/README.md) - Schema 概念和对象层次结构
- 表定义 - 表结构和属性
- 列定义 - 列类型和约束
- 索引定义 - 索引配置
- 约束定义 - 主键、外键和约束
- 视图定义 - 视图创建和管理
- 序列定义 - 序列配置
- 触发器定义 - 触发器配置
- 存储过程定义 - 存储过程
- 生命周期钩子 - DDL 生命周期钩子

### 格式支持

**[格式](./formats/)** - 支持的序列化格式

- [格式概述](./formats/README.md) - 格式比较和选择
- YAML 格式 - YAML Schema 定义
- JSON 格式 - JSON Schema 定义
- XML 格式 - XML Schema 定义
- TOML 格式 - TOML Schema 定义
- Properties 格式 - Properties Schema 定义
- SQL 格式 - SQL 逆向工程
- Markdown 格式 - 文档格式
- Excel 格式 - 基于 Excel 的 Schema 编辑

### CLI 参考

**[CLI 命令](./cli/)** - 命令行界面文档

- [CLI 概述](./cli/README.md) - CLI 介绍和安装
- 命令参考 - 完整命令参考
- 交互模式 - 交互式 Shell 使用
- 配置文件 - 配置文件格式
- 文件加载 - Schema 文件加载机制

### API 参考

**[API 文档](./api/)** - 编程 API 参考

- [API 概述](./api/README.md) - API 设计和使用模式
- JDBC 驱动 - JDBC 驱动文档
- Java API - Java 编程接口
- Schema API - Schema 操作 API
- 迁移 API - 迁移控制 API
- Schema 加载器 - Schema 加载 API
- Schema 部署器 - Schema 部署 API
- Schema 差异计算 - Schema 差异计算 API

### 数据库支持

**[数据库](./databases/)** - 支持的数据库平台

- [数据库概述](./databases/README.md) - 支持的数据库列表和兼容性
- MySQL/MariaDB - MySQL 和 MariaDB 专属信息
- PostgreSQL - PostgreSQL 专属信息
- Oracle - Oracle 专属信息
- SQL Server - SQL Server 专属信息
- SQLite - SQLite 专属信息
- H2/HSQLDB - 嵌入式数据库
- 国产数据库 - 达梦、人大金仓、GBase、TiDB、OceanBase 等

### AI 集成

**[AI 功能](./ai/)** - AI 驱动的功能

- [AI 概述](./ai/README.md) - AI 能力和配置
- 自然语言 Schema - 使用自然语言创建 Schema
- AI 迁移规划 - AI 辅助迁移规划
- AI 配置 - AI 提供商配置
- AI 最佳实践 - 使用 AI 功能的技巧

## 快速参考

### Schema 对象层次结构

```
Justdb (根节点)
├── Database       # 数据库定义
├── Table          # 表定义
├── Column         # 列定义（全局）
├── View           # 视图定义
├── Query          # 查询定义
├── Index          # 索引定义（全局）
├── Constraint     # 约束定义（全局）
├── Trigger        # 触发器定义
├── Sequence       # 序列定义
├── Procedure      # 存储过程定义
└── Data           # 数据导出定义
```

### 常用 CLI 命令

```bash
# Schema 管理
justdb init                    # 初始化项目
justdb db2schema -o schema.yaml  # 从数据库导出
justdb validate                # 验证 Schema

# 迁移
justdb migrate                 # 执行迁移
justdb diff                    # 显示差异
justdb migrate --dry-run       # 预览变更

# 格式转换
justdb convert -f yaml -t json schema.yaml > schema.json

# AI 辅助
justdb ai "创建用户表"  # 使用 AI 生成 Schema
justdb interactive             # AI 交互模式
```

### 基本 Schema 示例

```yaml
namespace: com.example
Table:
  - name: users
    comment: 用户表
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
      - name: username
        type: VARCHAR(50)
        nullable: false
      - name: email
        type: VARCHAR(100)
    Index:
      - name: idx_username
        columns: [username]
        unique: true
```

## 导航

- **[快速开始](/getting-started/)** - 快速入门
- **[用户指南](/guide/)** - 深度指南
- **[设计文档](/design/)** - 架构和设计
- **[开发指南](/development/)** - 插件开发和贡献
