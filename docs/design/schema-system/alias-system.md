---
title: 别名系统
icon: code
order: 3
category: 设计文档
tags:
  - schema
  - alias
  - compatibility
---

# 别名系统

## 概述

JustDB Schema 的别名系统通过 `@JsonAlias` 注解支持多种命名格式。

> **格式不是限制用户的工具，格式是用户方便之门**

别名系统让不同背景的用户都能方便使用：向后兼容旧版本、向 AI 开放多种格式、向人类提供熟悉的命名习惯。

## 设计目标

1. **向后兼容**: 支持旧版本的字段名，保护用户投资
2. **向 AI 兼容**: 任何 AI、盲写，都能兼容
3. **向人类兼容**: 不同编程背景的开发者都能用熟悉的格式
4. **规范输出**: 统一使用规范命名（camelCase 复数形式）
5. **SQL 标准**: 优先使用 SQL 标准术语

## 核心命名约定

| 约定 | 说明 | 示例 |
|------|------|------|
| **camelCase** | 字段名使用驼峰命名 | `referenceId`, `formerNames` |
| **复数形式** | 集合类型使用复数 | `tables`, `columns`, `indexes` |
| **SQL 术语** | 使用 SQL 标准术语 | `beforeDrops`, `afterAlters` |
| **完整单词** | 避免缩写（除常见缩写） | `primaryKey` (非 `pk`) |

## 命名格式变体

支持以下命名格式的别名：

| 格式 | 示例 |
|------|------|
| camelCase | `referenceId`, `tableScopes` |
| PascalCase | `ReferenceId`, `TableScopes` |
| kebab-case | `reference-id`, `table-scopes` |
| snake_case | `reference_id`, `table_scopes` |

## 核心字段别名映射

### referenceId 别名

组件复用的核心字段。

```java
@JsonProperty("referenceId")
@JsonAlias({"refId", "ref-id", "ref_id"})
protected String referenceId;
```

**支持的输入格式**：
- `referenceId` (canonical)
- `refId`
- `ref-id`
- `ref_id`

**使用示例**：

```xml
<!-- 定义全局列模板 -->
<Column id="global_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>

<!-- 在表中引用 -->
<Table name="users">
    <!-- 可以使用任意别名格式 -->
    <Column id="col_users_id" refId="global_id" name="id"/>
</Table>
```

### formerNames 别名

用于追踪 Schema 演进，记录对象的重命名历史。

```java
@JsonProperty("formerNames")
@JsonAlias({"oldNames", "oldName", "formerName", "former_names", "old_names",
              "previousNames", "previousName", "previous_names", "old-names"})
protected List&lt;String&gt; formerNames;
```

**支持的输入格式**：
- `formerNames` (canonical)
- `oldNames`
- `oldName`
- `formerName`
- `previousNames`
- `previousName`
- 以及多种变体

**使用示例**：

```xml
<!-- 记录表名变更历史 -->
<Table name="users">
    <formerNames>
        <oldName>user</oldName>
    </formerNames>
</Table>
```

生成的迁移 SQL：
```sql
ALTER TABLE user RENAME TO users;
```

### tableScopes 别名

表范围过滤器，用于过滤要处理的表。

```java
@JsonProperty("tableScopes")
@JsonAlias({"tableScope", "tableFilters", "includeTablePatterns", "includeTables"})
private TableScopes tableScopes;
```

**支持的输入格式**：
- `tableScopes` (canonical)
- `tableScope`
- `tableFilters`
- `includeTablePatterns`
- `includeTables`

**使用示例**：

```yaml
# 可以使用任意格式
tableScope:
  includeTables: ["users*", "orders*"]
  excludeTables: ["*_temp"]

# 或规范格式
tableScopes:
  includes: ["users*", "orders*"]
  excludes: ["*_temp"]
```

### 生命周期钩子别名

采用 SQL 标准操作术语，支持多种别名。

```java
@JsonProperty("beforeDrops")
@JsonAlias({"BeforeDrops", "BeforeDrop", "beforeDrop", "BeforeRemoves", "BeforeRemoves",
              "beforeRemoves", "beforeRemove", "before-drop", "before-drops",
              "Before-Drop", "Before-Drops", "before_drops", "Before-Remove",
              "onBeforeDrop", "onDrop"})
protected List<ConditionalSqlScript&gt;> beforeDrops;
```

**生命周期钩子命名**：

| 操作 | 钩子前缀 | 说明 |
|------|---------|------|
| CREATE | `beforeCreates`, `afterCreates` | 创建对象 |
| DROP | `beforeDrops`, `afterDrops` | 删除对象 |
| ALTER | `beforeAlters`, `afterAlters` | 修改对象 |
| ADD | `beforeAdds`, `afterAdds` | 添加子对象（列、索引等） |

**支持的别名**：
- `beforeRemoves` / `afterRemoves` → `beforeDrops` / `afterDrops`
- `beforeModifies` / `afterModifies` → `beforeAlters` / `afterAlters`

## 序列化行为

### 输入解析

支持所有别名格式，系统会自动识别并转换。

```json
{
  "tableScope": {
    "includeTables": ["users*"],
    "excludeTables": ["*_temp"]
  }
}
```

### 内部对象

转换为规范名称（camelCase 复数形式）。

```json
{
  "tableScopes": {
    "includes": ["users*"],
    "excludes": ["*_temp"]
  }
}
```

### 输出序列化

仅输出规范名称（camelCase 复数形式）。

```json
{
  "tableScopes": {
    "includes": ["users*"],
    "excludes": ["*_temp"]
  }
}
```

## 字段命名规范对照表

| 旧字段名 | 新字段名 | 变更原因 |
|---------|---------|---------|
| `refId` | `referenceId` | P0-1: 提高可读性 |
| `oldNames` | `formerNames` | P1-1: 更语义化 |
| `foreignTable` | `referencedTable` | 使用 SQL 标准术语 |
| `defaultValueComputed` | 统一到 `defaultValue` | R1: 简化字段 |

## 实现原理

### @JsonAlias 注解

```java
@JsonAlias({"refId", "ref-id", "ref_id"})
protected String referenceId;
```

Jackson 在反序列化时会按以下顺序尝试：
1. 首先尝试规范名称 `referenceId`
2. 如果不存在，依次尝试别名列表中的名称
3. 找到第一个匹配的值使用

### @JsonProperty 注解

```java
@JsonProperty("referenceId")
protected String referenceId;
```

指定序列化时使用的字段名，确保输出使用规范名称。

## 最佳实践

### 1. 新字段命名

创建新字段时，应遵循以下规则：
- 使用 camelCase
- 集合类型使用复数形式
- 优先使用 SQL 标准术语
- 提供合理的别名支持

```java
@JsonProperty("referencedTable")
@JsonAlias({"foreignTable", "referenced-table", "referenced_table"})
private String referencedTable;
```

### 2. 废弃字段处理

不删除旧字段，而是：
1. 添加 `@Deprecated` 注解
2. 在 `@JsonAlias` 中保留旧字段名
3. 文档中说明推荐使用新字段名

```java
@JsonProperty("newFieldName")
@JsonAlias({"oldFieldName", "old-field-name", "old_field_name"})
@Deprecated
private String newFieldName;
```

### 3. 文档更新

- 在 Schema 文档中标注规范字段名
- 在迁移指南中说明字段名变更
- 提供自动化迁移工具

## 相关文档

- [Schema 系统概述](./overview.md)
- [类型层次结构](./type-hierarchy.md)
- [Schema 演进](./schema-evolution.md)
