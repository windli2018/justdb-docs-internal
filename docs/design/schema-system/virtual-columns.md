# Virtual Column 虚拟列设计

## 设计文档版本

**版本**: 2.1
**日期**: 2026-02-10
**作者**: JustDB Team
**状态**: 已实现

---------------------------

## 目录

1. [概述](#1-概述)
2. [核心概念](#2-核心概念)
3. [架构设计](#3-架构设计)
4. [实现细节](#4-实现细节)
5. [使用场景](#5-使用场景)
6. [示例](#6-示例)

---------------------------

## 1. 概述

### 1.1 问题背景

关联表（如 user_roles）存储纯 ID 难以维护：

```xml
<!-- 当前方式：只存储数字 ID -->
<Data table="user_roles">
    <Row user_id="1" role_id="5"/>
    <Row user_id="1" role_id="8"/>
    <Row user_id="2" role_id="5"/>
</Data>
```

**痛点**：
1. 无法直观理解（user_id=1 是谁？role_id=5 是什么角色？）
2. Schema 中的数据难以人工维护和审查
3. 导出/导入时需要手动维护 ID 关系
4. 数据迁移时 ID 可能发生变化

### 1.2 解决方案

Virtual Column（虚拟列）支持使用可读标识符来维护关联表数据：

```xml
<!-- 使用虚拟列：可读标识符 -->
<Table name="user_roles">
    <Column name="user_id" type="BIGINT" nullable="false"/>
    <Column name="role_id" type="BIGINT" nullable="false"/>

    <!-- 虚拟列：定义可读标识符到 ID 的映射 -->
    <Column name="username" virtual="true" from="users.username" on="user_id"/>
    <Column name="rolename" virtual="true" from="roles.rolename" on="role_id"/>
</Table>

<Data table="user_roles">
    <!-- 直接使用虚拟列名 -->
    <Row username="alice" rolename="admin"/>
    <Row username="alice" rolename="editor"/>
    <Row username="bob" rolename="viewer"/>
</Data>
```

---------------------------

## 2. 核心概念

### 2.1 Virtual Column 定义

虚拟列是在 Table 定义中添加的特殊列，用于数据导入时将可读标识符转换为实际 ID。

#### 属性说明

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `name` | String | ✓ | - | 虚拟列名（可读标识符，如 username） |
| `virtual` | Boolean | ✓ | false | 标记为虚拟列 |
| `from` | String | ✓ | - | 来源：表名.字段名（如 users.username） |
| `on` | String | ✓ | - | 映射到当前表的列名（如 user_id） |
| `preferColumn` | Boolean | ✗ | false | 支持预制数据解析 |
| `type` | String | ✗ | - | 列类型（可选） |

#### 示例

```xml
<!-- 完整格式 -->
<Column name="username" virtual="true" from="users.username" on="user_id"/>

<!-- 简化格式（省略表名） -->
<Column name="username" virtual="true" from="username" on="user_id"/>

<!-- 带 preferColumn -->
<Column name="username"
        type="VARCHAR(255)"
        virtual="true"
        preferColumn="true"
        from="users.username"
        on="user_id"/>
```

### 2.2 属性组合效果

| type | virtual | preferColumn | DDL 包含 | 预制数据 | 运行时查询 |
|------|---------|-------------|---------|---------|-----------|
| ✅ | false | false | ✅ | ❌ | ❌ |
| ✅ | false | true | ✅ | ✅ | ❌ |
| ✅ | true | false | ❌ | ❌ | ✅ |
| ✅ | true | true | ❌ | ✅ | ✅ |
| ❌ | true | false | ❌ | ❌ | ✅ |
| ❌ | true | true | ❌ | ✅ | ✅ |

### 2.3 设计决策

1. **统一类型系统**：虚拟列继承 `Column` 类，复用现有类型系统
2. **DDL 自动过滤**：生成 CREATE TABLE 时自动跳过 `virtual=true` 的列
3. **数据导入时解析**：只在 Data 部署时执行引用解析
4. **命名规范**：遵循 JustDB camelCase 规范
5. **别名支持**：使用 `@JsonAlias` 支持多种命名格式

### 2.4 与物理列的区别

| 特性 | 物理列 | 虚拟列 |
|------|--------|--------|
| 生成 DDL | ✓ | ✗ |
| 存储数据 | ✓ | ✗ |
| 数据导入时使用 | ✓ | ✓ |
| 定义位置 | Column list | Column list |
| 用途 | 实际存储 | 引用解析 |

---------------------------

## 3. 架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Schema Deployer                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Data Processor                          │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │         Virtual Column Resolver                │  │   │
│  │  │  1. Get virtual columns from Table             │  │   │
│  │  │  2. Match Row fields with virtual columns      │  │   │
│  │  │  3. Execute lookup queries                     │  │   │
│  │  │  4. Replace virtual fields with actual IDs     │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              SQL Executor                           │   │
│  │  Execute INSERT with resolved IDs                   │  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         ↓                           ↓
    ┌─────────┐                 ┌──────────┐
    │ Target  │                 │  Target  │
    │  users  │                 │  roles   │
    │ table   │                 │  table   │
    └─────────┘                 └──────────┘
```

### 3.2 解析流程

```
1. Schema Loading
   ↓
   Table with virtual columns loaded
   ↓
2. Data Deployment
   ↓
   VirtualColumnResolver.resolve(data, table, connection)
   ↓
   For each Row:
     a. Find matching virtual columns
     b. Extract virtual field values
     c. Execute lookup query per virtual column
     d. Build resolved Row with actual IDs
   ↓
3. Execute INSERT
   ↓
   Insert with resolved IDs (virtual fields removed)
```

### 3.3 SQL 模板设计

遵循 JustDB 的模板系统设计：

```xml
<!-- 模板: virtual-column-lookup -->
<!-- 用途: 根据可读标识符查找对应的 ID -->
<template id="virtual-column-lookup" type="SQL" category="data">
    SELECT {{targetTable}}.{{idField}}
    FROM {{targetTable}}
    WHERE {{targetTable}}.{{keyField}} = '{{{value}}}'
</template>
```

**模板变量**：
- `{{targetTable}}`: 目标表名
- `{{keyField}}`: 匹配字段名
- `{{idField}}`: 返回的 ID 字段名
- `{{{value}}}`: 可读标识符值（三重大括号转义）

---------------------------

## 4. 实现细节

### 4.1 Column 类扩展

虚拟列相关字段定义在 `ai.justdb.justdb.schema.Column`：

```java
/**
 * Mark as virtual column (not physical, for reference resolution only).
 * 标记为虚拟列（非物理列，仅用于引用解析）
 */
@JsonProperty("virtual")
@JsonAlias({"virtual", "isVirtual", "virtualColumn"})
private Boolean virtual = false;

/**
 * Source reference: table.field or just field name.
 * 来源引用：表名.字段名 或 仅字段名
 * Examples: "users.username", "username"
 */
@JsonProperty("from")
@JsonAlias({"from", "source", "ref", "reference", "lookup"})
private String from;

/**
 * Target column in current table to populate with resolved ID.
 * 映射到当前表的目标列名
 */
@JsonProperty("on")
@JsonAlias({"on", "to", "targetColumn", "targetField"})
private String on;

/**
 * Support pre-populated data resolution (data export/import friendly).
 * 支持预制数据解析（数据导出/导入友好）
 */
@JsonProperty("preferColumn")
@JsonAlias({"preferColumn", "prefer", "resolve"})
private Boolean preferColumn = false;
```

### 4.2 DDL 生成处理

DDL 生成时自动过滤虚拟列：

```xml
<!-- 模板更新: column-spec -->
<template id="column-spec" type="SQL" category="column">
    {{#unless virtual}}
    {{name}} {{type}}{{#if nullable}} nullable{{/if}}{{#if defaultValue}} DEFAULT {{{defaultValue}}}{{/if}}
    {{/unless}}
</template>
```

或使用 Java 端过滤（更灵活）：

```java
// In DBGenerator or Table processing
List<Column&gt;> physicalColumns = table.getColumns().stream()
    .filter(c -> c.getVirtual() == null || !c.getVirtual())
    .collect(Collectors.toList());
```

### 4.3 计算列生成策略

通过 `--computed-column` 参数控制 DDL 生成方式：

| 选项 | 说明 | 数据库支持时 | 数据库不支持时 |
|------|------|-------------|---------------|
| `auto` (默认) | 支持时生成 | 生成计算列 | 不生成（运行时解析） |
| `always` | 必然生成 | 生成计算列 | 生成物理列 |
| `never` | 不生成 | 不生成（运行时解析） | 不生成 |

#### MySQL 8.0+ (computedColumn="auto")

```sql
CREATE TABLE user_roles (
    user_id BIGINT,
    username VARCHAR(255) AS (SELECT username FROM users WHERE users.id = user_id) STORED
);
```

#### MySQL 5.7 (computedColumn="auto")

```sql
CREATE TABLE user_roles (
    user_id BIGINT
);
-- username not included, resolved at runtime
```

### 4.4 noMigrate 环境特定列

标记列值为环境特定，不支持跨环境迁移：

```xml
<Column name="user_id" type="BIGINT" noMigrate="true"/>
<Column name="username" type="VARCHAR(50)" preferColumn="true" from="users.username" on="user_id"/>
```

**行为规则**：

| 场景 | 行为 |
|------|------|
| 只提供 preferColumn | 解析为 ID，插入数据库 |
| 只提供 noMigrate 列值 | 直接使用该值 |
| 同时提供两者 | **优先 preferColumn** |

---------------------------

## 5. 使用场景

### 5.1 场景 1: 预制数据可读性

```xml
<Data table="user_roles">
    <!-- 使用可读值而非 ID -->
    <Row username="alice" rolename="admin"/>
    <Row username="bob" rolename="viewer"/>
</Data>
```

### 5.2 场景 2: 运行时查询

```sql
-- 查询虚拟列（自动解析）
SELECT username, rolename FROM user_roles;
-- 返回: alice, admin

-- 混合查询
SELECT user_id, username FROM user_roles;
-- 返回: 1, alice
```

### 5.3 场景 3: INSERT 自动解析

```sql
-- 插入可读值，自动转换为 ID
INSERT INTO user_roles (username) VALUES ('alice');
-- 转换为: INSERT INTO user_roles (user_id) VALUES (1);
```

### 5.4 场景 4: UPDATE 双向同步

```sql
-- 更新虚拟列，同步物理列
UPDATE user_roles SET username='bob' WHERE id=1;
-- 转换为: UPDATE user_roles SET user_id=2 WHERE id=1;
```

---------------------------

## 6. 示例

### 6.1 用户-角色关联

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="user-role-demo" namespace="org.example">

    <!-- 用户表 -->
    <Table id="users" name="users">
        <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
        <Column name="username" type="VARCHAR(50)" nullable="false"/>
        <Column name="email" type="VARCHAR(100)"/>
    </Table>

    <!-- 角色表 -->
    <Table id="roles" name="roles">
        <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
        <Column name="rolename" type="VARCHAR(50)" nullable="false"/>
        <Column name="description" type="VARCHAR(200)"/>
    </Table>

    <!-- 用户角色关联表 -->
    <Table id="user_roles" name="user_roles">
        <!-- 物理列 -->
        <Column name="user_id" type="BIGINT" nullable="false"/>
        <Column name="role_id" type="BIGINT" nullable="false"/>

        <!-- 虚拟列：用于数据导入 -->
        <Column name="username" virtual="true" from="users.username" on="user_id"/>
        <Column name="rolename" virtual="true" from="roles.rolename" on="role_id"/>
    </Table>

    <!-- 用户数据 -->
    <Data table="users" dataExportStrategy="ALL_DATA">
        <Row username="alice" email="alice@example.com"/>
        <Row username="bob" email="bob@example.com"/>
    </Data>

    <!-- 角色数据 -->
    <Data table="roles" dataExportStrategy="ALL_DATA">
        <Row rolename="admin" description="Administrator"/>
        <Row rolename="editor" description="Editor"/>
        <Row rolename="viewer" description="Viewer"/>
    </Data>

    <!-- 用户角色关联数据 - 使用虚拟列名 -->
    <Data table="user_roles" dataExportStrategy="ALL_DATA">
        <Row username="alice" rolename="admin"/>
        <Row username="alice" rolename="editor"/>
        <Row username="bob" rolename="viewer"/>
    </Data>

</Justdb>
```

**生成的 DDL**（虚拟列不包含）：
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100)
);

CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rolename VARCHAR(50) NOT NULL,
    description VARCHAR(200)
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL
);
```

### 6.2 分类层级关联

```xml
<Table name="categories">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="category_name" type="VARCHAR(100)" nullable="false"/>
    <Column name="parent_id" type="BIGINT"/>

    <!-- 自引用虚拟列 -->
    <Column name="parent_name" virtual="true" from="categories.category_name" on="parent_id"/>
</Table>

<Data table="categories" dataExportStrategy="ALL_DATA">
    <Row category_name="Electronics"/>
    <Row category_name="Computers" parent_name="Electronics"/>
    <Row category_name="Laptops" parent_name="Computers"/>
</Data>
```

### 6.3 简化格式（省略表名）

如果外键约束已定义，可以省略 `from` 中的表名：

```xml
<Table name="user_roles">
    <Column name="user_id" type="BIGINT" nullable="false"/>
    <Column name="role_id" type="BIGINT" nullable="false"/>

    <!-- 简化格式：from 仅指定字段名 -->
    <Column name="username" virtual="true" from="username" on="user_id"/>
    <Column name="rolename" virtual="true" from="rolename" on="role_id"/>

    <!-- 外键约束帮助推断目标表 -->
    <Constraint name="fk_user" type="FOREIGN_KEY" referencedTable="users" referencedColumn="id">
        user_id
    </Constraint>
    <Constraint name="fk_role" type="FOREIGN_KEY" referencedTable="roles" referencedColumn="id">
        role_id
    </Constraint>
</Table>
```

### 6.4 多虚拟列

```xml
<Table name="user_roles">
    <Column name="user_id" type="BIGINT"/>
    <Column name="role_id" type="BIGINT"/>
    <Column name="username" virtual="true" from="users.username" on="user_id"/>
    <Column name="rolename" virtual="true" from="roles.rolename" on="role_id"/>
</Table>
```

### 6.5 级联引用

```xml
<Table name="orders">
    <Column name="user_id" type="BIGINT"/>
    <Column name="username" virtual="true" from="users.username" on="user_id"/>
    <Column name="company_name" virtual="true" from="companies.name" on="user_id"/>
</Table>
```

### 6.6 双向存储

```xml
<Table name="user_roles">
    <!-- 两个列都存储 -->
    <Column name="user_id" type="BIGINT"/>
    <Column name="username" type="VARCHAR(50)" preferColumn="true" from="users.username" on="user_id"/>
</Table>

<Data table="user_roles">
    <!-- 插入后两列都有值 -->
    <Row username="alice"/>
    <!-- 结果：user_id=1, username='alice' -->
</Data>
```

---------------------------

## 附录

### A. 设计优势

1. **统一类型系统**：虚拟列继承 Column，无需新类型
2. **一目了然**：Table 定义中直接看到所有列
3. **语义清晰**：`virtual="true"` 明确标识
4. **自动过滤**：DDL 生成时自动跳过虚拟列
5. **可复用**：定义一次，所有 Data 节点可用

### B. 设计原则遵循

1. **不硬编码数据库方言**：使用模板系统处理 DDL 生成
2. **向后兼容**：现有 Schema 无需修改
3. **命名规范**：遵循 camelCase、SQL 术语
4. **别名支持**：使用 @JsonAlias 支持多种命名格式

### C. 扩展性考虑

1. **复合虚拟列**：支持 `from="table1.field1,table2.field2"`
2. **虚拟计算列**：支持表达式 `from="CONCAT(first_name, ' ', last_name)"`
3. **缓存机制**：缓存常用查找结果
4. **批量查找**：一次查询多个标识符

### D. 参考链接

- [Column 参考](../../reference/schema/column.md)
- [速查手册: Virtual Column](../../cheatsheet/virtual-column.md)
- [预制数据](../../reference/data/)
