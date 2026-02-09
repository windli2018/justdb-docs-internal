# JustDB 关联表数据维护优化方案

## 设计文档版本

**版本**: 2.0
**日期**: 2026-02-08
**作者**: Claude Code
**状态**: 设计中

---------------------------

## 目录

1. [问题描述](#1-问题描述)
2. [核心设计](#2-核心设计)
3. [架构设计](#3-架构设计)
4. [实现步骤](#4-实现步骤)
5. [关键文件](#5-关键文件)
6. [验证方式](#6-验证方式)
7. [示例](#7-示例)

---------------------------

## 1. 问题描述

### 1.1 当前痛点

关联表（如 user_roles）存储纯 ID 难以维护：

```xml
&lt;!-- 当前方式：只存储数字 ID --&gt;
&lt;Data table="user_roles"&gt;
    &lt;Row user_id="1" role_id="5"/&gt;
    &lt;Row user_id="1" role_id="8"/&gt;
    &lt;Row user_id="2" role_id="5"/&gt;
&lt;/Data&gt;
```

**问题**：
1. 无法直观理解（user_id=1 是谁？role_id=5 是什么角色？）
2. Schema 中的数据难以人工维护和审查
3. 导出/导入时需要手动维护 ID 关系
4. 数据迁移时 ID 可能发生变化

### 1.2 目标

支持使用可读标识符来维护关联表数据：

```xml
&lt;!-- 期望方式：使用可读标识符 --&gt;
&lt;Table name="user_roles"&gt;
    &lt;Column name="user_id" type="BIGINT" nullable="false"/&gt;
    &lt;Column name="role_id" type="BIGINT" nullable="false"/&gt;

    &lt;!-- 虚拟列：定义可读标识符到 ID 的映射 --&gt;
    &lt;Column name="username" virtual="true" from="users.username" on="user_id"/&gt;
    &lt;Column name="rolename" virtual="true" from="roles.rolename" on="role_id"/&gt;
&lt;/Table&gt;

&lt;Data table="user_roles"&gt;
    &lt;!-- 直接使用虚拟列名 --&gt;
    &lt;Row username="alice" rolename="admin"/&gt;
    &lt;Row username="alice" rolename="editor"/&gt;
    &lt;Row username="bob" rolename="viewer"/&gt;
&lt;/Data&gt;
```

---------------------------

## 2. 核心设计

### 2.1 Virtual Column 虚拟列

**概念**：在 Table 定义中添加虚拟列，用于数据导入时将可读标识符转换为实际 ID。

**属性**：

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|--------------------------------------------------------|------------------------------------------------------|
| `name` | String | ✓ | - | 虚拟列名（可读标识符，如 username） |
| `virtual` | Boolean | ✓ | false | 标记为虚拟列 |
| `from` | String | ✓ | - | 来源：表名.字段名（如 users.username） |
| `on` | String | ✓ | - | 映射到当前表的列名（如 user_id） |

**示例**：
```xml
&lt;Column name="username" virtual="true" from="users.username" on="user_id"/&gt;
```

**含义**：
- `name="username"`：数据导入时可以使用 `username` 字段
- `virtual="true"`：标记为虚拟列，不生成物理列
- `from="users.username"`：从 `users` 表的 `username` 字段查找
- `on="user_id"`：找到的 ID 填充到当前表的 `user_id` 列

### 2.2 设计决策

1. **统一类型系统**：虚拟列继承 `Column` 类，复用现有类型系统
2. **DDL 自动过滤**：生成 CREATE TABLE 时自动跳过 `virtual=true` 的列
3. **数据导入时解析**：只在 Data 部署时执行引用解析
4. **命名规范**：遵循 JustDB camelCase 规范
5. **别名支持**：使用 `@JsonAlias` 支持多种命名格式

### 2.3 与物理列的区别

| 特性 | 物理列 | 虚拟列 |
|------------------------------------------------------|--------------------------------------------------------|--------------------------------------------------------|
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
│  │  Execute INSERT with resolved IDs                   │   │
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
&lt;!-- 模板: virtual-column-lookup --&gt;
&lt;!-- 用途: 根据可读标识符查找对应的 ID --&gt;
&lt;template id="virtual-column-lookup" type="SQL" category="data"&gt;
    SELECT {{targetTable}}.{{idField}}
    FROM {{targetTable}}
    WHERE {{targetTable}}.{{keyField}} = '{{{value}}}'
&lt;/template&gt;
```

**模板变量**：
- `{{targetTable}}`: 目标表名
- `{{keyField}}`: 匹配字段名
- `{{idField}}`: 返回的 ID 字段名
- `{{{value}}}`: 可读标识符值（三重大括号转义）

---------------------------

## 4. 实现步骤

### Phase 1: Column 类扩展

**修改文件**：`justdb-core/src/main/java/org/verydb/justdb/schema/Column.java`

添加虚拟列相关字段：

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
 * Parse from attribute to extract table and field.
 * 解析 from 属性提取表名和字段名
 */
public VirtualColumnRef getVirtualColumnRef() {
    if (from == null || !virtual) {
        return null;
    }

    String[] parts = from.split("\\.");
    if (parts.length == 2) {
        return new VirtualColumnRef(parts[0], parts[1]);
    } else if (parts.length == 1) {
        return new VirtualColumnRef(null, parts[0]);
    }
    return null;
}

/**
 * Virtual column reference holder.
 * 虚拟列引用持有者
 */
@Data
@AllArgsConstructor
public static class VirtualColumnRef {
    private String table;
    private String field;
}
```

### Phase 2: 虚拟列解析器

**新建文件**：`justdb-core/src/main/java/org/verydb/justdb/deploy/VirtualColumnResolver.java`

```java
package org.verydb.justdb.deploy;

import org.verydb.justdb.schema.Column;
import org.verydb.justdb.schema.Data;
import org.verydb.justdb.schema.Row;
import org.verydb.justdb.schema.Table;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Resolves virtual column references to actual IDs.
 * 虚拟列解析器：将虚拟列引用解析为实际 ID
 */
public class VirtualColumnResolver {

    /**
     * Resolves all virtual columns in the data.
     * 解析数据中的所有虚拟列
     */
    public static Data resolve(Data data, Table table, Connection connection) throws SQLException {
        // Get virtual columns from table
        List&lt;Column&gt; virtualColumns = table.getColumns().stream()
            .filter(c -> c.getVirtual() != null && c.getVirtual())
            .collect(Collectors.toList());

        if (virtualColumns.isEmpty()) {
            return data; // No virtual columns to resolve
        }

        List&lt;Row&gt; resolvedRows = new ArrayList&lt;&gt;();

        for (Row row : data.getRows()) {
            Map&lt;String, Object&gt; resolvedValues = new HashMap&lt;&gt;(row.getValues());

            // Resolve each virtual column
            for (Column vc : virtualColumns) {
                String virtualFieldName = vc.getName();
                if (resolvedValues.containsKey(virtualFieldName)) {
                    Object identifier = resolvedValues.get(virtualFieldName);
                    Object actualId = lookupId(vc, identifier, connection, table);

                    // Populate target column with resolved ID
                    resolvedValues.put(vc.getOn(), actualId);

                    // Remove the virtual field
                    resolvedValues.remove(virtualFieldName);
                }
            }

            resolvedRows.add(new Row(resolvedValues));
        }

        // Create new Data with resolved rows
        Data resolvedData = new Data();
        resolvedData.setTable(data.getTable());
        resolvedData.setRows(resolvedRows);
        // Copy other properties...

        return resolvedData;
    }

    /**
     * Looks up the actual ID from target table.
     * 从目标表查找实际 ID
     */
    private static Object lookupId(Column virtualColumn, Object identifier,
                                   Connection connection, Table currentTable) throws SQLException {
        Column.VirtualColumnRef ref = virtualColumn.getVirtualColumnRef();

        String targetTable = ref.getTable();
        String keyField = ref.getField();
        String idField = "id"; // Default, can be made configurable

        // If target table not specified, try to infer from current table's foreign keys
        if (targetTable == null) {
            targetTable = inferTargetTable(currentTable, virtualColumn.getOn());
        }

        String sql = String.format(
            "SELECT %s FROM %s WHERE %s = ?",
            idField,
            targetTable,
            keyField
        );

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setObject(1, identifier);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return rs.getObject(1);
            } else {
                throw new SQLException(String.format(
                    "Virtual column reference not found: %s.%s = '%s'",
                    targetTable,
                    keyField,
                    identifier
                ));
            }
        }
    }

    /**
     * Infer target table from foreign key constraints.
     * 从外键约束推断目标表名
     */
    private static String inferTargetTable(Table table, String column) {
        // Try to find foreign key constraint for the column
        if (table.getConstraints() != null) {
            return table.getConstraints().stream()
                .filter(c -> c.getReferencedTable() != null)
                .filter(c -> c.getColumns() != null && c.getColumns().contains(column))
                .map(c -> c.getReferencedTable())
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                    "Cannot infer target table for virtual column on " + column));
        }
        throw new IllegalArgumentException("Cannot infer target table for virtual column on " + column);
    }
}
```

### Phase 3: DDL 生成集成

**修改文件**：`justdb-core/src/main/resources/default-plugins.xml`

更新 column-spec 模板，过滤虚拟列：

```xml
&lt;!-- 更新后的列定义模板 --&gt;
&lt;template id="column-spec" type="SQL" category="column"&gt;
    {{#unless virtual}}
    {{name}} {{type}}{{#if nullable}} nullable{{/if}}{{#if defaultValue}} DEFAULT {{{defaultValue}}}{{/if}}
    {{/unless}}
&lt;/template&gt;
```

或者使用 Java 端过滤（更灵活）：

```java
// In DBGenerator or Table processing
List&lt;Column&gt; physicalColumns = table.getColumns().stream()
    .filter(c -> c.getVirtual() == null || !c.getVirtual())
    .collect(Collectors.toList());
```

### Phase 4: 生命周期集成

**修改文件**：`justdb-core/src/main/java/org/verydb/justdb/SchemaDeployer.java`

在 `deployData()` 方法中集成虚拟列解析：

```java
private void deployData(Data data, Justdb justdb, Connection connection) throws SQLException {
    // Get table definition
    Table table = justdb.getTable(data.getTable());

    // Resolve virtual columns before deployment
    Data resolvedData = VirtualColumnResolver.resolve(data, table, connection);

    // Continue with normal deployment...
    // ... execute INSERT with resolved data
}
```

### Phase 5: 测试和文档

**新建测试文件**：`justdb-core/src/test/java/org/verydb/justdb/deploy/VirtualColumnResolverTest.java`

**新建示例文件**：`docs/virtual-column-usage.md`

---------------------------

## 5. 关键文件

| 文件 | 操作 | 说明 |
|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| `schema/Column.java` | 修改 | 添加 virtual, from, on 字段 |
| `deploy/VirtualColumnResolver.java` | 新建 | 虚拟列解析器 |
| `SchemaDeployer.java` | 修改 | 集成虚拟列解析 |
| `generator/DBGenerator.java` | 修改 | DDL 生成时过滤虚拟列 |
| `resources/default-plugins.xml` | 修改 | 更新列模板 |
| `deploy/VirtualColumnResolverTest.java` | 新建 | 单元测试 |
| `docs/virtual-column-usage.md` | 新建 | 使用文档 |

---------------------------

## 6. 验证方式

### 6.1 单元测试

```bash
# 运行虚拟列解析器测试
mvn test -Dtest=VirtualColumnResolverTest
```

### 6.2 集成测试

```bash
# 运行完整的数据部署测试
mvn test -Dtest=DataDeployWithVirtualColumnTest
```

### 6.3 手动验证

1. 创建包含虚拟列的 Schema
2. 执行部署
3. 验证 DDL 正确生成（无虚拟列）
4. 验证数据正确导入（虚拟列被解析）

---------------------------

## 7. 示例

### 7.1 用户-角色关联

```xml
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;Justdb id="user-role-demo" namespace="org.example"&gt;

    &lt;!-- 用户表 --&gt;
    &lt;Table id="users" name="users"&gt;
        &lt;Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/&gt;
        &lt;Column name="username" type="VARCHAR(50)" nullable="false"/&gt;
        &lt;Column name="email" type="VARCHAR(100)"/&gt;
    &lt;/Table&gt;

    &lt;!-- 角色表 --&gt;
    &lt;Table id="roles" name="roles"&gt;
        &lt;Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/&gt;
        &lt;Column name="rolename" type="VARCHAR(50)" nullable="false"/&gt;
        &lt;Column name="description" type="VARCHAR(200)"/&gt;
    &lt;/Table&gt;

    &lt;!-- 用户角色关联表 --&gt;
    &lt;Table id="user_roles" name="user_roles"&gt;
        &lt;!-- 物理列 --&gt;
        &lt;Column name="user_id" type="BIGINT" nullable="false"/&gt;
        &lt;Column name="role_id" type="BIGINT" nullable="false"/&gt;

        &lt;!-- 虚拟列：用于数据导入 --&gt;
        &lt;Column name="username" virtual="true" from="users.username" on="user_id"/&gt;
        &lt;Column name="rolename" virtual="true" from="roles.rolename" on="role_id"/&gt;
    &lt;/Table&gt;

    &lt;!-- 用户数据 --&gt;
    &lt;Data table="users" dataExportStrategy="ALL_DATA"&gt;
        &lt;Row username="alice" email="alice@example.com"/&gt;
        &lt;Row username="bob" email="bob@example.com"/&gt;
    &lt;/Data&gt;

    &lt;!-- 角色数据 --&gt;
    &lt;Data table="roles" dataExportStrategy="ALL_DATA"&gt;
        &lt;Row rolename="admin" description="Administrator"/&gt;
        &lt;Row rolename="editor" description="Editor"/&gt;
        &lt;Row rolename="viewer" description="Viewer"/&gt;
    &lt;/Data&gt;

    &lt;!-- 用户角色关联数据 - 使用虚拟列名 --&gt;
    &lt;Data table="user_roles" dataExportStrategy="ALL_DATA"&gt;
        &lt;Row username="alice" rolename="admin"/&gt;
        &lt;Row username="alice" rolename="editor"/&gt;
        &lt;Row username="bob" rolename="viewer"/&gt;
    &lt;/Data&gt;

&lt;/Justdb&gt;
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

### 7.2 分类层级关联

```xml
&lt;Table name="categories"&gt;
    &lt;Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/&gt;
    &lt;Column name="category_name" type="VARCHAR(100)" nullable="false"/&gt;
    &lt;Column name="parent_id" type="BIGINT"/&gt;

    &lt;!-- 自引用虚拟列 --&gt;
    &lt;Column name="parent_name" virtual="true" from="categories.category_name" on="parent_id"/&gt;
&lt;/Table&gt;

&lt;Data table="categories" dataExportStrategy="ALL_DATA"&gt;
    &lt;Row category_name="Electronics"/&gt;
    &lt;Row category_name="Computers" parent_name="Electronics"/&gt;
    &lt;Row category_name="Laptops" parent_name="Computers"/&gt;
&lt;/Data&gt;
```

### 7.3 简化格式（省略表名）

如果外键约束已定义，可以省略 `from` 中的表名：

```xml
&lt;Table name="user_roles"&gt;
    &lt;Column name="user_id" type="BIGINT" nullable="false"/&gt;
    &lt;Column name="role_id" type="BIGINT" nullable="false"/&gt;

    &lt;!-- 简化格式：from 仅指定字段名 --&gt;
    &lt;Column name="username" virtual="true" from="username" on="user_id"/&gt;
    &lt;Column name="rolename" virtual="true" from="rolename" on="role_id"/&gt;

    &lt;!-- 外键约束帮助推断目标表 --&gt;
    &lt;Constraint name="fk_user" type="FOREIGN_KEY" referencedTable="users" referencedColumn="id"&gt;
        user_id
    &lt;/Constraint&gt;
    &lt;Constraint name="fk_role" type="FOREIGN_KEY" referencedTable="roles" referencedColumn="id"&gt;
        role_id
    &lt;/Constraint&gt;
&lt;/Table&gt;
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

### D. 与 ReferenceMap 方案对比

| 特性 | ReferenceMap 方案 | Virtual Column 方案 |
|------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 类型系统 | 新建类型 | 复用 Column |
| 定义位置 | Data 节点 | Table 节点 |
| 可复用性 | 需重复定义 | 一次定义 |
| DDL 集成 | 需特殊处理 | 自动过滤 |
| 语义清晰度 | 中等 | 高 |

---------------------------

**文档结束**
