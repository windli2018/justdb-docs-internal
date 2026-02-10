---
icon: code
title: 自定义模板
order: 3
category:
  - 插件开发
  - 开发指南
tag:
  - 模板
  - handlebars
  - SQL生成
---

# 自定义模板

模板是 JustDB SQL 生成的核心。通过自定义模板，你可以控制 SQL 的生成方式，适配特定数据库或实现自定义逻辑。

## 模板引擎

JustDB 使用 [Handlebars](https://handlebarsjs.com/) 作为模板引擎：

- **简洁语法**: `{{variable}}` 和 `{{#block}}...{{/block}}`
- **逻辑分离**: 业务逻辑在辅助函数中
- **可继承**: 模板可以引用其他模板

## 模板结构

### 基本模板

```xml
<template id="create-table" name="create-table" type="SQL" category="db">
    <content>CREATE TABLE {{name}} (
        {{#each columns}}
        {{name}} {{type}}{{#unless @last}},{{/unless}}
        {{/each}}
    );</content>
</template>
```

### 模板属性

| 属性 | 必需 | 说明 |
|------|------|------|
| id | 是 | 模板唯一标识 |
| name | 是 | 模板名称 |
| type | 是 | 模板类型（SQL/CODE） |
| category | 是 | 模板分类（db/client/server） |
| description | 否 | 模板描述 |
| injectBefore | 否 | 在指定模板前注入 |
| injectAfter | 否 | 在指定模板后注入 |
| injectReplace | 否 | 替换指定模板 |

## 模板命名约定

### Verb-First 命名

模板名称使用"动词-对象"格式：

| 操作 | 模板名称 |
|------|----------|
| 创建表 | create-table |
| 删除表 | drop-table |
| 修改表 | alter-table |
| 添加列 | add-column |
| 删除列 | drop-column |
| 重命名列 | rename-column |

### Lineage 模板

共享 SQL 语法的数据库使用 Lineage 模板：

```
{operation}-{object}-{lineage}-lineage
```

例如：
- `create-table-mysql-lineage` - MySQL 系列共享
- `create-table-postgres-lineage` - PostgreSQL 系列共享

## 模板查找优先级

模板查找按以下优先级（从高到低）：

1. **精确匹配**: `{name}-{category}-{type}-{dialect}`
   - 例如: `create-table-db-mysql`
2. **类型匹配**: `{name}-{category}-{type}`
   - 例如: `create-table-db`
3. **分类匹配**: `{name}-{category}`
   - 例如: `create-table-db`
4. **全局匹配**: `{name}`
   - 例如: `create-table`

## Handlebars 语法

### 变量输出

```handlebars
<!-- 直接输出 -->
{{tableName}}

<!-- 带默认值 -->
{{tableName || 'default_table'}}

<!-- HTML 转义（通常不需要）-->
{{{rawSQL}}}
```

### 条件块

```handlebars
{{#if condition}}
  <!-- 条件为真 -->
{{else}}
  <!-- 条件为假 -->
{{/if}}

{{#unless condition}}
  <!-- 条件为假 -->
{{/unless}}
```

### 循环

```handlebars
{{#each columns}}
  Column: {{name}}
  {{#unless @last}},{{/unless}}  <!-- 非最后一项添加逗号 -->
{{/each}}

<!-- 使用 @index 获取索引 -->
{{#each items}}
  Index: {{@index}}
  Value: {{this}}
{{/each}}
```

### 模板引用

```handlebars
<!-- 引用其他模板 -->
{{> table-name}}

<!-- 传递上下文 -->
{{> column-spec column=this}}

<!-- 使用父上下文 -->
{{> table-name ..}}
```

## 根上下文变量

模板可以访问以下根变量：

| 变量 | 类型 | 说明 |
|------|------|------|
| @root.dbType | String | 数据库类型 |
| @root.idempotent | Boolean | 幂等模式（IF NOT EXISTS） |
| @root.safeDrop | Boolean | 安全删除模式 |
| @root.justdbManager | JustdbManager | JustDB 管理器实例 |

### 使用示例

```handlebars
CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{name}} (
    ...
);
```

## 模板继承

### 引用 Lineage 模板

```xml
<!-- 定义 Lineage 模板 -->
<template id="create-table-mysql-lineage" type="SQL" category="db">
    <content>CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{name}} (...)</content>
</template>

<!-- 在 MySQL 插件中引用 -->
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
    <templates>
        <template id="create-table" type="SQL" category="db">
            <content>{{> create-table-mysql-lineage}}</content>
        </template>
    </templates>
</plugin>
```

### 模板覆盖

子插件可以覆盖父插件的模板：

```xml
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
    <!-- 覆盖父插件的 create-table 模板 -->
    <templates>
        <template id="create-table" type="SQL" category="db">
            <content>
                <!-- 自定义实现 -->
            </content>
        </template>
    </templates>
</plugin>
```

## 模板注入

### injectAfter

在指定模板后注入内容：

```xml
<template id="custom-table-options" type="SQL" category="db"
         injectAfter="create-table">
    <content> ENGINE=InnoDB DEFAULT CHARSET=utf8mb4</content>
</template>
```

生成结果：
```sql
CREATE TABLE users (...) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### injectBefore

在指定模板前注入内容：

```xml
<template id="before-drop" type="SQL" category="db"
         injectBefore="drop-table">
    <content>-- Warning: Dropping table</content>
</template>
```

### injectReplace

完全替换模板：

```xml
<template id="my-drop" type="SQL" category="db"
         injectReplace="drop-table">
    <content>DROP TABLE IF EXISTS {{name}} CASCADE;</content>
</template>
```

## 完整示例

### CREATE TABLE 模板

```xml
<template id="create-table-mysql-lineage" name="create-table-mysql-lineage"
         type="SQL" category="db">
    <content>
CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name}} (
{{> columns}}
{{#if this.indexes}}
{{> indexes}}
{{/if}}
){{> table-options}};
    </content>
</template>
```

### 子模板定义

```xml
<!-- 表名（含 schema）-->
<template id="table-name" type="SQL" category="db">
    <content>{{#if schema}}{{schema}}.{{/if}}{{name}}</content>
</template>

<!-- 列定义 -->
<template id="columns" type="SQL" category="db">
    <content>{{#each columns}}
{{#unless virtual}}
  {{name}} {{type}}{{#if primaryKey}} PRIMARY KEY{{/if}}{{#if autoIncrement}} AUTO_INCREMENT{{/if}}{{#unless @last}},{{/unless}}
{{/unless}}
{{/each}}</content>
</template>

<!-- 表选项 -->
<template id="table-options" type="SQL" category="db">
    <content>{{#if engine}} ENGINE={{engine}}{{/if}}{{#if charset}} DEFAULT CHARSET={{charset}}{{/if}}</content>
</template>
```

## 测试模板

### 单元测试

```java
@Test
void testCreateTableTemplate() {
    TemplateExecutor executor = new TemplateExecutor(justdbManager);

    Table table = new Table();
    table.setName("users");
    table.setSchema("myapp");

    TemplateRootContext context = TemplateRootContext.builder()
        .justdbManager(justdbManager)
        .dbType("mysql")
        .idempotent(true)
        .put("table", table)
        .build();

    String sql = executor.execute("create-table", context);

    assertTrue(sql.contains("CREATE TABLE IF NOT EXISTS"));
    assertTrue(sql.contains("myapp.users"));
}
```

## 下一步

- [模板辅助函数](./template-helpers.md) - 编写自定义辅助函数
- [数据库适配器开发](./database-adapter.md) - 数据库适配器
- [插件开发概述](./README.md) - 返回插件开发概述
