---
title: Handlebars 模板语法
icon: code
order: 2
category: 设计文档
tags:
  - template
  - handlebars
  - syntax
---

# Handlebars 模板语法

## 概述

JustDB 模板系统基于 Handlebars 模板引擎，提供丰富的语法支持动态 SQL 生成。

## 基础语法

### 变量输出

```handlebars
{{variable}}
{{table.name}}
{{column.type}}
```

### 注释

```handlebars
{{!-- 这是注释，不会出现在输出中 --}}
```

### HTML 转义

```handlebars
{{&variable}}  <!-- 不转义 -->
{{{variable}}} <!-- 不转义 -->
```

## 条件渲染

### if 条件

```handlebars
{{#if condition}}
  <!-- 条件为真时渲染 -->
{{/if}}
```

### if-else 条件

```handlebars
{{#if condition}}
  <!-- 条件为真时渲染 -->
{{else}}
  <!-- 条件为假时渲染 -->
{{/if}}
```

### unless 条件（取反）

```handlebars
{{#unless condition}}
  <!-- 条件为假时渲染 -->
{{/unless}}
```

### 实际示例

```handlebars
<!-- 幂等模式 -->
CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name}} (
    {{> columns}}
);

<!-- 条件渲染列属性 -->
{{#if column.nullable}}
    NULL
{{else}}
    NOT NULL
{{/if}}

<!-- 默认值 -->
{{#if column.defaultValue}}
    DEFAULT {{column.defaultValue}}
{{/if}}
```

## 循环渲染

### each 循环

```handlebars
{{#each items}}
  {{this}}
{{/each}}
```

### 带索引的循环

```handlebars
{{#each columns}}
  {{@index}}: {{this.name}}
{{/each}}
```

### 嵌套循环

```handlebars
{{#each tables}}
  -- Table: {{this.name}}
  {{#each this.columns}}
    -- Column: {{this.name}}
  {{/each}}
{{/each}}
```

### 实际示例

```handlebars
<!-- 生成列定义 -->
{{#each columns}}
    {{> column-spec}}{{#unless @last}},{{/unless}}
{{/each}}

<!-- 输出：
id BIGINT PRIMARY KEY,
username VARCHAR(50) NOT NULL,
email VARCHAR(100) NOT NULL
-->
```

## 循环辅助变量

| 变量 | 说明 |
|------|------|
| `@index` | 当前索引（从 0 开始） |
| `@first` | 是否第一个元素 |
| `@last` | 是否最后一个元素 |
| `@key` | 当前键名（对象迭代时） |

### 使用示例

```handlebars
{{#each columns}}
    {{@index}}: {{this.name}}
    {{#if @first}}
        -- 第一个列
    {{/if}}
    {{#if @last}}
        -- 最后一个列
    {{/if}}
{{/each}}
```

## 上下文访问

### 当前上下文

```handlebars
{{this.name}}
{{this.type}}
```

### 根上下文

```handlebars
{{@root.dbType}}
{{@root.idempotent}}
{{@root.safeDrop}}
```

### 父上下文

```handlebars
{{> table-name ..}}  <!-- 使用父上下文 -->
```

### 路径访问

```handlebars
{{table.name}}
{{table.columns.[0].name}}
{{this.@root.idempotent}}
```

## 自定义 Helper

### 注册 Helper

```java
TemplateHelper helper = new TemplateHelper();
helper.setName("eq");
helper.setFunction("org.verydb.justdb.template.helper.EqualityHelper.eq");

pluginManager.registerHelper(helper);
```

### 使用 Helper

```handlebars
{{#if (eq this.type "VARCHAR")}}
    VARCHAR
{{else}}
    {{this.type}}
{{/if}}
```

### 常用内置 Helper

| Helper | 说明 | 示例 |
|--------|------|------|
| `eq` | 等于 | `{{#if (eq a b)}}` |
| `ne` | 不等于 | `{{#if (ne a b)}}` |
| `gt` | 大于 | `{{#if (gt a b)}}` |
| `lt` | 小于 | `{{#if (lt a b)}}` |
| `and` | 逻辑与 | `{{#if (and a b)}}` |
| `or` | 逻辑或 | `{{#if (or a b)}}` |
| `not` | 逻辑非 | `{{#if (not a)}}` |

## 模板引用

### 基础引用

```handlebars
{{> template-name}}
```

### 传递上下文

```handlebars
{{> template-name context}}
```

### 传递参数

```handlebars
{{> table-name table=@root.newtable}}
```

## 实际应用示例

### CREATE TABLE 模板

```handlebars
CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name}} (
{{#each columns}}
    {{> column-spec}}{{#unless @last}},{{/unless}}
{{/each}}
{{#if indexes}}
    ,
{{#each indexes}}
    {{> index-spec}}{{#unless @last}},{{/unless}}
{{/each}}
{{/if}}
){{#if this.engine}} ENGINE={{this.engine}}{{/if}}{{#if this.charset}} CHARSET={{this.charset}}{{/if}};
```

### ALTER TABLE 模板

```handlebars
ALTER TABLE {{> table-name ..}}
{{#if this.newName}}
    RENAME TO {{> table-name this}}
{{else}}
    {{#each columns}}
        {{#if this.added}}
            ADD COLUMN {{> column-spec this}},
        {{/if}}
        {{#if this.modified}}
            MODIFY COLUMN {{> column-spec this}},
        {{/if}}
        {{#if this.dropped}}
            DROP COLUMN {{> name-spec this.name}},
        {{/if}}
    {{/each}}
{{/if}};
```

### DROP TABLE 模板

```handlebars
{{#if @root.safeDrop}}
    {{> rename-table}}
{{else}}
    DROP TABLE {{#if @root.idempotent}}IF EXISTS {{/if}}{{> table-name}};
{{/if}}
```

## 最佳实践

### 1. 使用模板引用

```handlebars
<!-- 好的做法：使用模板引用 -->
{{> table-name}}

<!-- 避免：重复代码 -->
`{{this.schema}}`.`{{this.name}}`
```

### 2. 保持模板简洁

```handlebars
<!-- 好的做法：分解为小模板 -->
{{> column-spec}}
{{> index-spec}}
{{> constraint-spec}}

<!-- 避免：单个大模板 -->
CREATE TABLE (...) ... (大量代码)
```

### 3. 使用条件渲染

```handlebars
<!-- 好的做法：条件渲染 -->
{{#if @root.idempotent}}IF NOT EXISTS {{/if}}

<!-- 避免：多个模板 -->
<!-- create-table-idempotent 和 create-table-normal -->
```

### 4. 注释说明

```handlebars
{{!-- MySQL 使用 AUTO_INCREMENT --}}
{{#if (eq @root.dbType "mysql")}}
    AUTO_INCREMENT
{{/if}}
```

## 相关文档

- [模板系统概述](./overview.md)
- [模板继承机制](./template-inheritance.md)
- [血统模板系统](./lineage-templates.md)
