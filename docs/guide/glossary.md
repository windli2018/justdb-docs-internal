---
icon: book-bookmark
date: 2024-01-01
title: 术语表
order: 4
category:
  - 指南
  - 参考
tag:
  - 术语
  - 参考
  - 概念
---

# 术语表

本文档解释 JustDB 中使用的核心概念和术语。

## 核心概念

### Schema（模式/架构）

数据库 Schema 是对数据库结构的**声明式定义**，描述了数据库中包含哪些表、视图、索引、约束等对象以及它们的属性。

```yaml
# 一个简单的 Schema 定义
namespace: com.example
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```

**关键特点**：
- **声明式**：描述"要什么"，而不是"怎么做"
- **数据库无关**：同一 Schema 可用于多种数据库
- **版本可控**：可作为代码纳入 Git 管理

### Migration（迁移）

迁移是将数据库从当前状态转换到目标 Schema 状态的过程。

```bash
# 执行迁移
justdb migrate
```

**迁移过程**：
1. 加载目标 Schema
2. 提取当前数据库状态
3. 计算差异（Diff）
4. 生成 SQL
5. 执行变更
6. 记录历史

### Deploy（部署）

部署是将 Schema 应用到数据库的操作，通常在首次创建数据库时使用。

```java
// Java API 部署
SchemaDeployer deployer = new SchemaDeployer(connection);
deployer.deploy(schema);
```

**部署 vs 迁移**：
- **部署**：用于全新的数据库，创建所有对象
- **迁移**：用于已有数据库，只应用变更

### Diff（差异）

Diff 是当前数据库状态与目标 Schema 之间的差异计算结果。

```bash
# 查看差异
justdb diff
```

**差异类型**：
- `ADDED` - 新增对象
- `REMOVED` - 删除对象
- `MODIFIED` - 修改对象
- `RENAMED` - 重命名对象

## Schema 对象

### Table（表）

表是数据库中存储数据的基本结构。

```yaml
Table:
  - name: users
    comment: 用户表
    Column: [...]
    Index: [...]
    Constraint: [...]
```

### Column（列）

列定义表中字段的属性。

```yaml
Column:
  - name: username
    type: VARCHAR(50)
    nullable: false
    defaultValue: guest
    comment: 用户名
```

### Index（索引）

索引用于提高查询性能。

```yaml
Index:
  - name: idx_username
    columns: [username]
    unique: true
    comment: 用户名唯一索引
```

### Constraint（约束）

约束定义表中数据的规则。

**约束类型**：
- `PRIMARY_KEY` - 主键约束
- `FOREIGN_KEY` - 外键约束
- `UNIQUE` - 唯一约束
- `CHECK` - 检查约束
- `NOT_NULL` - 非空约束

```yaml
Constraint:
  - name: fk_orders_user
    type: FOREIGN_KEY
    referencedTable: users
    referencedColumn: id
    foreignKey: user_id
    onDelete: CASCADE
```

### View（视图）

视图是基于 SQL 查询的虚拟表。

```yaml
View:
  - name: active_users
    query: SELECT * FROM users WHERE status = 'active'
    comment: 活跃用户视图
```

### Trigger（触发器）

触发器是在特定事件发生时自动执行的代码。

```yaml
Trigger:
  - name: trg_before_insert
    table: users
    timing: BEFORE
    events: [INSERT]
    sql: |
      SET NEW.created_at = CURRENT_TIMESTAMP;
```

### Sequence（序列）

序列是生成唯一数值的对象。

```yaml
Sequence:
  - name: seq_user_id
    startWith: 1
    incrementBy: 1
    maxValue: 999999
```

## JustDB 特有术语

### Justdb

Justdb 是 Schema 定义的根容器对象。

```yaml
namespace: com.example
catalog: myapp
Table: [...]
View: [...]
```

**属性**：
- `id` - Schema 唯一标识
- `namespace` - Java 命名空间（用于生成代码）
- `catalog` - 数据库目录

### referenceId（引用 ID）

用于实现 Schema 组件的复用和继承。

```yaml
# 定义可复用的列
Column:
  - id: global_id
    name: id
    type: BIGINT
    primaryKey: true

# 在表中引用
Table:
  - name: users
    Column:
      - referenceId: global_id
      - name: username
        type: VARCHAR(50)
```

### formerNames（曾用名）

用于追踪对象的重命名历史，实现智能迁移。

```yaml
Column:
  - name: user_name           # 新名称
    formerNames: [username]   # 旧名称
    type: VARCHAR(50)
```

### UnknownValues（未知值）

用于存储数据库特定的扩展属性。

```yaml
Table:
  - name: users
    engine: InnoDB           # MySQL 特定，存储在 UnknownValues
    row_format: COMPRESSED   # MySQL 特定，存储在 UnknownValues
```

### Canonical Name（规范名称）

字段的标准命名格式，使用 camelCase 约定。

| 规范名称 | 支持的别名 |
|:---|:---|
| `referenceId` | `refId`, `ref-id`, `ref_id` |
| `referencedTable` | `foreignTable`, `referenced-table` |
| `formerNames` | `oldNames`, `formerName`, `previousNames` |

## 模板系统术语

### Template（模板）

模板是用于生成 SQL 或代码的 Handlebars 模板。

```xml
<template id="create-table" name="create-table" type="SQL" category="db">
  <content>CREATE TABLE {{> table-name}} ({{> columns}});</content>
</template>
```

### Lineage Template（血统模板）

按数据库家族共享的模板。

| 血统 | 包含的数据库 |
|:---|:---|
| `-mysql-lineage` | MySQL, MariaDB, GBase, TiDB |
| `-postgres-lineage` | PostgreSQL, Redshift, TimescaleDB, KingBase |
| `-ansi-lineage` | Oracle, DB2, Derby, HSQLDB, Dameng |
| `-sqlserver-lineage` | SQL Server |
| `-sqlite-lineage` | SQLite |

### Template Helper（模板助手）

Handlebars 自定义函数，用于模板中的逻辑处理。

```java
{{#eq type "VARCHAR"}}VARCHAR({{length}}){{/eq}}
{{#not nullable}}NOT NULL{{/not}}
```

### TemplateRootContext（模板根上下文）

模板执行时的全局上下文对象。

```java
TemplateRootContext context = TemplateRootContext.builder()
    .justdbManager(justdbManager)
    .dbType("mysql")
    .idempotent(true)
    .safeDrop(false)
    .build();
```

**可用变量**：
- `@root.justdbManager` - JustDB 管理器
- `@root.dbType` - 数据库类型
- `@root.idempotent` - 幂等模式
- `@root.safeDrop` - 安全删除模式

## 生命周期钩子

### beforeCreates / afterCreates

在创建对象前后执行的 SQL 脚本。

```yaml
Table:
  - name: users
    beforeCreates:
      - dbms: mysql
        sql: "SET sql_mode='STRICT_TRANS_TABLES'"
    afterCreates:
      - sql: "INSERT INTO users (username) VALUES ('admin')"
```

### beforeDrops / afterDrops

在删除对象前后执行的 SQL 脚本。

### beforeAlters / afterAlters

在修改对象前后执行的 SQL 脚本。

### beforeAdds / afterAdds

在添加对象前后执行的 SQL 脚本。

## 插件系统术语

### JustdbPlugin

JustDB 插件，提供数据库特定的扩展。

```
JustdbPlugin
├── DatabaseAdapter[]     # 数据库适配器
├── GenericTemplate[]     # SQL 模板
├── ExtensionPoint[]      # 扩展点
├── TemplateHelper[]      # 模板助手
└── SchemaFormat[]        # 格式支持
```

### DatabaseAdapter（数据库适配器）

定义数据库的连接信息、驱动和类型映射。

```xml
<DatabaseAdapter id="mysql" dialect="mysql">
  <driverClass>com.mysql.cj.jdbc.Driver</driverClass>
  <urlPattern>jdbc:mysql://.*</urlPattern>
  <typeMappings>...</typeMappings>
</DatabaseAdapter>
```

### ExtensionPoint（扩展点）

定义对象可以接受的自定义属性。

```xml
<ExtensionPoint id="mysql-table" target="Table">
  <attributes>
    <ExtensionAttribute name="engine" type="string" defaultValue="InnoDB"/>
    <ExtensionAttribute name="charset" type="string" defaultValue="utf8mb4"/>
  </attributes>
</ExtensionPoint>
```

## 数据库类型相关

### Dialect（方言）

特定数据库的 SQL 语法和特性。

```bash
justdb migrate --dialect postgresql
```

**支持的方言**：`mysql`, `postgresql`, `oracle`, `sqlserver`, `sqlite`, `h2`, `db2`, `dameng`, `kingbase`, `gbase`, `oceanbase`, `tidb`, `mariadb` 等

### Type Mapping（类型映射）

JustDB 类型与数据库特定类型的映射关系。

| JustDB 类型 | MySQL | PostgreSQL | Oracle | SQL Server |
|:---|:---|:---|:---|:---|
| `BIGINT` | `BIGINT` | `BIGINT` | `NUMBER(19)` | `BIGINT` |
| `VARCHAR(n)` | `VARCHAR(n)` | `VARCHAR(n)` | `VARCHAR2(n)` | `NVARCHAR(n)` |
| `TIMESTAMP` | `TIMESTAMP` | `TIMESTAMP` | `TIMESTAMP` | `DATETIME2` |
| `BOOLEAN` | `TINYINT(1)` | `BOOLEAN` | `NUMBER(1)` | `BIT` |

## 配置相关

### Schema Format（Schema 格式）

JustDB 支持的输入/输出格式。

- `YAML` - 人类友好的配置格式
- `JSON` - 机器可读的数据格式
- `XML` - 企业级配置格式
- `PROPERTIES` - Java 属性文件
- `TOML` - Tom 的配置格式
- `SQL` - SQL 脚本
- `MARKDOWN` - Markdown 文档
- `EXCEL` - Excel 电子表格

### Location（位置）

Schema 文件的搜索路径。

```
默认搜索路径：
./justdb/
./db/
./
classpath:justdb/
```

## 迁移相关

### Baseline（基线）

为已有数据库设置版本起点。

```bash
justdb migrate --baseline
```

### Safe Drop（安全删除）

删除操作时重命名而不是直接删除。

```bash
justdb migrate --safe-drop

# users -> users_deleted_20240115103000
```

### Idempotent（幂等）

确保重复执行不会产生错误。

```bash
justdb migrate --idempotent

# 生成 IF NOT EXISTS 等幂等 SQL
```

### Dry Run（试运行）

预览变更而不实际执行。

```bash
justdb migrate --dry-run
```

## 历史和版本

### History（历史）

Schema 变更的历史记录。

```bash
justdb history
```

### Rollback（回滚）

将数据库恢复到之前的版本。

```bash
justdb rollback 002
```

## AI 相关

### AI Service（AI 服务）

JustDB 的 AI 集成服务，支持自然语言操作 Schema。

```bash
justdb ai "创建一个用户表"
```

### Prompt（提示词）

发送给 AI 的自然语言指令。

```yaml
# 通过 Schema 定义 AI 提示词
ai:
  prompts:
    - "生成用户登录相关的表结构"
    - "添加订单管理功能"
```

## 相关文档

<VPCard
  title="什么是 JustDB"
  desc="了解 JustDB 的核心概念"
  link="/guide/what-is-justdb.html"
/>

<VPCard
  title="第一个 Schema"
  desc="学习如何定义 Schema"
  link="/guide/first-schema.html"
/>

<VPCard
  title="Schema 演进"
  desc="了解 Schema 变更管理"
  link="/guide/schema-evolution.html"
/>
