# JustDB 项目概览

## 项目简介

**JustDB** 是一个**所见即所得（WYSIWYG）数据库开发套件**，革命性地改变了传统数据库开发方式。通过声明式 Schema 定义和智能差异计算，让数据库开发变得简单、高效、可靠。

### 核心理念

传统数据库开发流程：
1. 设计数据库表结构
2. 手写 CREATE TABLE 语句
3. 执行 SQL 创建表
4. 需要修改时，手写 ALTER TABLE 语句
5. 担心脚本执行顺序和错误处理

**JustDB 简化为**：
1. **声明期望的数据库状态**（通过 YAML、JSON、XML 等）
2. **工具自动计算差异**
3. **工具自动执行变更**

---------------------------

## 核心特性

### 1. 声明式 Schema 定义

```yaml
# users.yaml - 这就是你想要的数据库样子
Table:
  - id: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(255)
      - name: email
        type: VARCHAR(255)
```

JustDB 确保你的数据库**正好**是上面定义的样子。

### 2. 智能差异计算

当你修改 Schema 时，JustDB 会自动计算变更并生成对应的 SQL：

```sql
ALTER TABLE users ADD COLUMN avatar VARCHAR(500);
```

### 3. 多格式支持

JustDB 支持几乎所有常见的数据格式：

- **YAML** - 人类友好的配置格式
- **JSON** - 机器可读的数据交换格式
- **XML** - 企业级配置格式
- **Properties** - Java 风格配置
- **TOML** - 现代配置格式
- **SQL** - 直接执行 SQL 脚本
- **Markdown** - 文档即代码
- **Excel** - 业务友好的表格格式

### 4. AI 集成

通过自然语言直接操作数据库：

```bash
justdb ai "添加一个订单表，包含订单号、客户ID、金额和状态"
```

### 5. 完整的 JDBC 4.2 驱动

JustDB 提供了完整的 JDBC 驱动实现，支持：

- 标准 SQL 查询（SELECT、INSERT、UPDATE、DELETE）
- JOIN 查询
- 聚合函数（COUNT、SUM、AVG、MIN、MAX）
- 事务管理
- 批量操作

### 6. Spring Boot 集成

开箱即用的 Spring Boot Starter：

```yaml
justdb:
  enabled: true
  locations: classpath:justdb
  dry-run: false
```

应用启动时自动执行数据库迁移！

---------------------------

## 与其他工具的对比

| 特性 | JustDB | Flyway | Liquibase |
|------------------------------------------------------|--------------------------------------------------------|--------------------------------------------------------|-----------------------------------------------------------------------------------|
| 声明式 Schema | ✅ | ❌ | ❌ |
| 自动差异计算 | ✅ | ❌ | ❌ |
| 多格式支持 | ✅ | ❌ | ❌ |
| AI 集成 | ✅ | ❌ | ❌ |
| JDBC 驱动 | ✅ | ❌ | ❌ |
| 回滚支持 | ✅ | ✅ | ✅ |
| 增量迁移 | ✅ | ✅ | ✅ |
| 多数据库支持 | 30+ | 多种 | 多种 |

---------------------------

## 应用场景

### 1. 敏捷开发

快速迭代数据库 Schema，无需手写 SQL：

```bash
# 修改 Schema
vim users.yaml

# 应用变更
justdb migrate

# 完成！
```

### 2. 数据库文档化

Schema 即文档，文档即 Schema：

```yaml
Table:
  - id: orders
    name: 订单表
    comment: 存储所有订单信息
    Column:
      - name: order_no
        comment: 订单号，唯一标识
```

### 3. 多环境一致性

开发、测试、生产环境保持完全一致：

```bash
# 开发环境
justdb migrate -c dev-config.yaml

# 测试环境
justdb migrate -c test-config.yaml

# 生产环境
justdb migrate -c prod-config.yaml
```

### 4. 版本控制友好

将 Schema 纳入 Git 版本控制：

```bash
git add users.yaml
git commit -m "添加用户头像字段"
git push

# 团队成员执行
justdb migrate
```

### 5. CI/CD 集成

在持续集成流程中自动管理数据库：

```yaml
# .github/workflows/ci.yml
- name: Migrate Database
  run: |
    justdb migrate --dry-run
    justdb migrate
```

---------------------------

## 支持的数据库

JustDB 支持 30+ 种数据库，包括但不限于：

- **MySQL** - 5.6, 5.7, 8.0+
- **PostgreSQL** - 9.x, 10.x, 11.x, 12.x, 13.x, 14.x
- **Oracle** - 11g, 12c, 19c, 21c
- **SQL Server** - 2012, 2014, 2016, 2019
- **H2** - 1.x, 2.x
- **SQLite** - 3.x
- **MariaDB** - 10.x, 11.x
- **TiDB** - 3.x, 4.x, 5.x
- **达梦** - DM7, DM8
- **人大金仓** - KingBase
- **GBase** - 8s
- **OceanBase** - 2.x, 3.x, 4.x

---------------------------

## 技术架构

### 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI 层                               │
│  - convert: 格式转换                                         │
│  - migrate: 数据库迁移                                       │
│  - db2schema: 从数据库提取 Schema                           │
│  - interactive: 交互式终端                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       核心层                                │
│  - SchemaLoader: 多格式 Schema 加载                          │
│  - SchemaDiff: 差异计算引擎                                   │
│  - SchemaEvolutionManager: Schema 演进管理                   │
│  - TemplateEngine: 模板引擎（Handlebars）                     │
│  - PluginManager: 插件管理器                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      插件层                                 │
│  - DatabaseAdapter: 数据库适配器                              │
│  - GenericTemplate: SQL 生成模板                             │
│  - ExtensionPoint: 扩展点定义                                │
│  - TemplateHelper: 模板辅助函数                               │
│  - SchemaFormat: Schema 格式化器                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    JDBC 驱动层                               │
│  - JustdbDataSource: 数据源实现                               │
│  - JustdbConnection: 连接实现                                 │
│  - JustdbPreparedStatement: 语句实现                           │
│  - JustdbResultSet: 结果集实现                                │
└─────────────────────────────────────────────────────────────┘
```

### 模板系统

基于 Handlebars 的模板引擎，支持：

- **方言继承**：数据库方言族（MySQL-lineage、PostgreSQL-lineage、ANSI-lineage）
- **模板优先级**：name + category + type + dialect > name + category + type > name + category > name
- **模板引用**：`{{> template-name}}` 语法复用模板片段
- **条件渲染**：`{{#if @root.idempotent}}`、`{{@root.dbType}}` 等根上下文变量

### 插件系统

可扩展的插件架构，支持：

- **自定义数据库适配器**：通过 `DatabaseAdapter` 接口
- **自定义模板**：通过 `GenericTemplate` 定义 SQL 生成模板
- **扩展点**：通过 `ExtensionPoint` 定义 Schema 扩展属性
- **辅助函数**：通过 `TemplateHelper` 注册 Handlebars 辅助函数

---------------------------

## Schema 结构设计

### 核心类型系统

```
Item (基类 - 所有 Schema 对象)
├── UnknownValues (动态扩展机制)
├── SchemaSense (上下文持有者)
├── QueryAble (生命周期钩子)
│   ├── Table
│   ├── View
│   └── Query
├── Column
├── Index
├── Constraint
├── Trigger
├── Sequence
└── Procedure

Justdb (根容器)
└── SchemaSense
```

### 生命周期钩子系统

支持完整的 DDL 生命周期钩子：

- `beforeCreates` / `afterCreates` - CREATE TABLE/VIEW/SEQUENCE 前/后
- `beforeAlters` / `afterAlters` - ALTER TABLE 前/后
- `beforeDrops` / `afterDrops` - DROP TABLE/VIEW/SEQUENCE 前/后

支持条件执行：

- `dbms` - 按数据库类型执行
- Schema 状态比较 - 基于字段值差异执行

### 别名系统

通过 `@JsonAlias` 支持多种命名格式：

**规范命名**：camelCase，复数集合，SQL 术语

- `referenceId` (规范) → 别名: `refId`, `ref-id`, `ref_id`
- `formerNames` (规范) → 别名: `oldNames`, `oldName`, `formerName`, `previousNames`
- `referencedTable` (规范) → 别名: `foreignTable`

### Schema 演进追踪

两种追踪机制：

1. **referenceId 系统**：组件复用和继承
2. **formerNames 系统**：重命名历史追踪

---------------------------

## 设计原则

### 1. 简洁性 (Simplicity)
- 优先选择最简洁的表达方式
- 避免冗余的配置选项
- 提供合理的默认值

### 2. 一致性 (Consistency)
- 统一的命名规范
- 统一的类型系统
- 统一的生命周期钩子命名

### 3. 可扩展性 (Extensibility)
- 通过 `UnknownValues` 基类支持动态属性
- 通过插件系统支持数据库特定扩展
- 开放的继承层次结构

### 4. 向后兼容 (Backward Compatibility)
- 通过 `@JsonAlias` 支持旧字段名
- 保留已弃用功能的兼容层

---------------------------

## 核心模块

### CLI 模块 (justdb-cli)
- `convert` - 格式转换
- `migrate` - 数据库迁移
- `db2schema` - 从数据库提取 Schema
- `interactive` - 交互式终端
- `ai` - AI 助手

### 核心模块 (justdb-core)
- Schema 加载和序列化
- 差异计算引擎
- 模板引擎
- 插件管理器

### JDBC 驱动模块 (justdb-jdbc)
- 标准 JDBC 接口实现
- SQL 解析和执行
- 事务管理

### AI 模块 (justdb-ai)
- AI 集成
- 自然语言处理
- 智能Schema生成

---------------------------

## 开源协议

- **协议**: Apache License 2.0
- **作者**: Wind Li
- **版本**: 1.0-SNAPSHOT

---------------------------

## 相关资源

- **源代码**: https://github.com/verydb/justdb
- **文档**: docs/ 目录
- **问题反馈**: GitHub Issues
