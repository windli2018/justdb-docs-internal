---
title: 列名映射系统
icon: code
order: 5
category: 设计文档
tags:
  - schema
  - data
  - mapping
  - row
---

# 列名映射系统

## 概述

JustDB 的列名映射系统用于在数据加载时自动处理不同命名风格的兼容性，确保 Row 中的字段名与 Table 定义保持一致。

> **格式兼容在加载数据时一次性完成**

**核心设计思路**：
1. **数据加载时转换**：从 JSON/XML/YAML 加载数据时，自动将用户输入的字段名（userId）转换为 Table 定义的字段名（user_id）
2. **内部无需特殊处理**：Row 的字段名与 Table 定义一致，DataManager、DataValidator 等内部代码直接使用 Table 定义的字段名
3. **JDBC Driver 映射**：JDBC ResultSet 需要处理数据库列名到 Row 字段名的映射

**目的**：
- 兼容旧数据的不同命名格式（userId、user-id 等）
- 不影响内部代码逻辑（Row 和 Table 始终使用一致的字段名）
- JDBC Driver 提供灵活的列名访问方式

## 设计目标

1. **加载时转换**: 数据加载时一次性完成字段名转换
2. **内部一致性**: Row 字段名与 Table 定义保持一致
3. **最小改动**: 内部代码（DataManager、DataValidator 等）无需修改
4. **JDBC 映射**: Driver 层处理数据库列名到字段名的映射

## 命名风格支持

### 支持的命名格式

| 格式 | 示例 | 说明 |
|------|------|------|
| snake_case | `user_id`, `created_at` | 数据库常用格式 |
| camelCase | `userId`, `createdAt` | Java/JavaScript 常用格式 |
| PascalCase | `UserId`, `CreatedAt` | C#/.NET 常用格式 |
| kebab-case | `user-id`, `created-at` | CSS/HTML 常用格式 |

### 映射示例

假设数据库表中有列 `user_id`，用户可以使用以下任一格式访问：

```java
Table table = new Table();
table.setName("users");
// 添加列 user_id

Row row = new Row();
ColumnNameResolver resolver = new ColumnNameResolver();

// 以下方式都等效
row.setColumnValue(table, "user_id", 123, resolver);  // snake_case (精确)
row.setColumnValue(table, "userId", 123, resolver);    // camelCase
row.setColumnValue(table, "UserId", 123, resolver);    // PascalCase
row.setColumnValue(table, "user-id", 123, resolver);   // kebab-case

// 读取时同样支持
Object value = row.getColumnValue(table, "userId", resolver);  // 返回 123
```

## 实现计划

### 需要创建的文件

| 文件 | 路径 | 说明 |
|------|------|------|
| `ColumnNameResolver.java` | `justdb-core/src/main/java/ai/justdb/justdb/data/ColumnNameResolver.java` | 列名解析器工具类 |
| `ColumnNameResolverTest.java` | `justdb-core/src/test/java/ai/justdb/justdb/data/ColumnNameResolverTest.java` | 单元测试 |

### 需要修改的现有文件

| 文件 | 改动内容 | 优先级 |
|------|----------|--------|
| **SchemaLoader.java** | 加载数据时使用 ColumnNameResolver 转换字段名 | P0 |

**注意**：
- JDBC Driver 暂不处理（SQL 解析器改造延后）
- DataManager、DataValidator 等内部代码**无需修改**（因为 Row 的字段名与 Table 定义已保持一致）

**注意**：DataManager、DataValidator 等内部代码**无需修改**，因为 Row 的字段名与 Table 定义已保持一致。

### 具体改动点

#### 1. 创建 ColumnNameResolver.java（工具类）

```java
package ai.justdb.justdb.data;

import ai.justdb.justdb.schema.Column;
import ai.justdb.justdb.schema.Table;
import ai.justdb.justdb.util.StringCaseUtils;

import java.util.List;

/**
 * Column name resolver utility.
 * 用于在数据加载时将用户输入的字段名转换为 Table 定义的字段名。
 *
 * 匹配顺序：精确匹配 → snake_case → camelCase → PascalCase → kebab-case → formerNames
 */
public class ColumnNameResolver {

    /**
     * 解析输入的字段名为实际的数据库列名。
     *
     * @param table 表定义
     * @param inputName 用户输入的字段名（任意格式）
     * @return 实际的数据库列名，未找到返回 inputName
     */
    public String resolveColumnName(Table table, String inputName) {
        if (table == null || inputName == null || inputName.isEmpty()) {
            return inputName;
        }

        List<Column> columns = table.getColumns();
        if (columns == null || columns.isEmpty()) {
            return inputName;
        }

        // 1. 精确匹配
        Column exactMatch = findExactMatch(columns, inputName);
        if (exactMatch != null) {
            return exactMatch.getName();
        }

        // 2. snake_case 转换后匹配
        Column match = findSnakeCaseMatch(columns, inputName);
        if (match != null) return match.getName();

        // 3. camelCase 转换后匹配
        match = findCamelCaseMatch(columns, inputName);
        if (match != null) return match.getName();

        // 4. PascalCase 转换后匹配
        match = findPascalCaseMatch(columns, inputName);
        if (match != null) return match.getName();

        // 5. kebab-case 转换后匹配
        match = findKebabCaseMatch(columns, inputName);
        if (match != null) return match.getName();

        // 6. formerNames 匹配
        match = findFormerNamesMatch(columns, inputName);
        if (match != null) return match.getName();

        // 未找到，返回原输入
        return inputName;
    }

    /**
     * 检查列是否存在。
     */
    public boolean hasColumn(Table table, String columnName) {
        Column column = findColumn(table, columnName);
        return column != null;
    }

    /**
     * 查找列定义。
     */
    public Column findColumn(Table table, String columnName) {
        if (table == null || columnName == null || columnName.isEmpty()) {
            return null;
        }

        List<Column> columns = table.getColumns();
        if (columns == null || columns.isEmpty()) {
            return null;
        }

        // 按顺序尝试匹配
        Column exactMatch = findExactMatch(columns, columnName);
        if (exactMatch != null) return exactMatch;

        Column match = findSnakeCaseMatch(columns, columnName);
        if (match != null) return match;

        match = findCamelCaseMatch(columns, columnName);
        if (match != null) return match;

        match = findPascalCaseMatch(columns, columnName);
        if (match != null) return match;

        match = findKebabCaseMatch(columns, columnName);
        if (match != null) return match;

        return findFormerNamesMatch(columns, columnName);
    }

    // ==================== Private Methods ====================

    private Column findExactMatch(List<Column> columns, String name) {
        for (Column column : columns) {
            if (name.equals(column.getName())) return column;
            if (column.getId() != null && name.equals(column.getId())) return column;
        }
        return null;
    }

    private Column findSnakeCaseMatch(List<Column> columns, String name) {
        String snakeCase = StringCaseUtils.toSnakeCase(name);
        return findExactMatch(columns, snakeCase);
    }

    private Column findCamelCaseMatch(List<Column> columns, String name) {
        String camelCase = StringCaseUtils.toCamelCase(name);
        return findExactMatch(columns, camelCase);
    }

    private Column findPascalCaseMatch(List<Column> columns, String name) {
        String pascalCase = StringCaseUtils.toPascalCase(name);
        return findExactMatch(columns, pascalCase);
    }

    private Column findKebabCaseMatch(List<Column> columns, String name) {
        String snakeCase = name.replace("-", "_");
        return findExactMatch(columns, snakeCase);
    }

    private Column findFormerNamesMatch(List<Column> columns, String name) {
        String lowerName = name.toLowerCase();
        for (Column column : columns) {
            List<String> formerNames = column.getFormerNames();
            if (formerNames != null) {
                for (String formerName : formerNames) {
                    if (formerName.equalsIgnoreCase(name)) {
                        return column;
                    }
                }
            }
        }
        return null;
    }
}
```

#### 2. 修改 SchemaLoader.java（加载数据时转换）

在从 JSON/XML/YAML 加载数据时，使用 ColumnNameResolver 转换字段名：

```java
// 在 SchemaLoader.java 中添加数据加载时的字段名转换

private ColumnNameResolver columnNameResolver = new ColumnNameResolver();

/**
 * 加载 Data 时转换字段名。
 */
private Data loadDataWithColumnNameConversion(Object rawData, Table table) {
    Data data = new Data();

    if (rawData instanceof List) {
        List<Object> rawRows = (List<Object>) rawData;
        for (Object rawRow : rawRows) {
            Row row = new Row();

            if (rawRow instanceof Map) {
                Map<String, Object> rawValues = (Map<String, Object>) rawRow;

                // 关键：使用 ColumnNameResolver 转换字段名
                for (Map.Entry<String, Object> entry : rawValues.entrySet()) {
                    String inputName = entry.getKey();
                    Object value = entry.getValue();

                    // 将用户输入的字段名（userId）转换为 Table 定义的字段名（user_id）
                    String actualName = columnNameResolver.resolveColumnName(table, inputName);

                    row.put(actualName, value);
                }
            }

            data.addRows(row);
        }
    }

    return data;
}
```

**效果**：
```json
// 用户数据（JSON）
{
  "users": [
    {
      "userId": 1,
      "userName": "Alice",
      "createdAt": "2024-01-01"
    }
  ]
}

// 加载后 Row 中的字段名
Row: {
  "user_id": 1,
  "user_name": "Alice",
  "created_at": "2024-01-01"
}

// 与 Table 定义完全一致
Table.columns: [
  Column(name="user_id"),
  Column(name="user_name"),
  Column(name="created_at")
]
```

### 改动优先级

| 优先级 | 文件 | 说明 |
|--------|------|------|
| P0 | `ColumnNameResolver.java` | 核心工具类，必须先创建 |
| P0 | `SchemaLoader.java` | 数据加载时转换字段名 |
| P0 | `JustDBResultSet.java` | JDBC Driver 列名映射 |
| P1 | `ColumnNameResolverTest.java` | 单元测试 |


### 向后兼容性

- Row 数据结构不变，仍是 Map<String, Object>
- 内部代码（DataManager、DataValidator 等）无需修改
- 仅在数据加载入口和 JDBC Driver 层做转换


## 边界情况处理

### 1. 字段名冲突

当多个列映射到同一变体名称时，返回第一个匹配的列（按列定义顺序）：

```java
// 例如：user_name 和 userName 都存在于表中
Table table = new Table();
table.setColumns(Arrays.asList(
    new Column("user_name", "VARCHAR"),
    new Column("userName", "VARCHAR")
));

// 解析"username"时，返回第一个匹配的列（user_name）
String actualName = ColumnNameResolver.resolveColumnName(table, "username");
// 返回 "user_name"（按列定义顺序）
```

### 2. formerNames 支持

解析器支持通过 `formerNames` 查找历史名称：

```java
Column column = new Column();
column.setName("user_email");
column.addFormerName("email");
column.addFormerName("email_address");

// 以下都会找到该列
resolver.resolveColumnName(table, "user_email");   // 当前名称
resolver.resolveColumnName(table, "email");          // 历史名称
resolver.resolveColumnName(table, "email_address");   // 历史名称
```

### 3. 未找到列时

如果字段名无法映射到任何列，返回原输入名称：

```java
// 表中只有 user_id, user_name
String result = ColumnNameResolver.resolveColumnName(table, "unknownField");
// 返回 "unknownField"（原输入）
// 调用方可以据此判断字段是否有效
```

## 最佳实践

### 1. 数据格式兼容

在加载数据时自动处理不同命名格式：

```json
// 用户数据（JSON）
{
  "users": [
    {
      "userId": 1,         // camelCase
      "UserName": "Alice",    // PascalCase
      "created-at": "2024-01-01"  // kebab-case
    }
  ]
}

// 加载后 Row 中的字段名（与 Table 定义一致）
Row: {
  "user_id": 1,
  "user_name": "Alice",
  "created_at": "2024-01-01"
}
```


### 2. 内部使用简化

内部代码直接使用 Table 定义的字段名，无需特殊处理：

```java
// DataManager, DataValidator 等内部代码
Table table = justdb.getTable("users");
Row row = data.getRows().get(0);

// 直接使用 Table 定义的字段名
Object userId = row.get("user_id");    // 与 Table.name 一致
Object userName = row.get("user_name"); // 与 Table.name 一致

// 无需关心用户数据原来是什么格式
```

## 相关文档

- [别名系统](./alias-system.md) - Schema 字段的别名系统
- [虚拟列](./virtual-columns.md) - 虚拟列的设计和实现
- [Schema 演进](./schema-evolution.md) - Schema 版本管理
- [StringCaseUtils](../../util/StringCaseUtils.java) - 命名转换工具类
