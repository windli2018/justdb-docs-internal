---
title: 模板继承机制
icon: sitemap
order: 3
category: 设计文档
tags:
  - template
  - inheritance
  - plugin
---

# 模板继承机制

## 概述

JustDB 模板系统支持多层级继承和覆盖，允许插件在任意层级覆盖模板，实现灵活的模板定制。

## 继承层次

### 三层继承结构

```
sql-standard-root (基础层)
    ├── 血统模板（lineage templates）
    └── 通用模板

mysql/postgresql/etc. (方言层)
    └── 引用或覆盖基础层模板

custom-plugin (扩展层)
    └── 覆盖方言层模板
```

### 继承示例

```xml
&lt;!-- 1. sql-standard-root 定义血统模板 --&gt;
&lt;plugin id="sql-standard-root"&gt;
    &lt;templates&gt;
        &lt;template id="create-table-mysql-lineage" type="SQL" category="db"&gt;
            &lt;content&gt;
                CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name}} (
                    {{> columns}}
                );
            &lt;/content&gt;
        &lt;/template&gt;
    &lt;/templates&gt;
&lt;/plugin&gt;

&lt;!-- 2. mysql plugin 引用血统模板 --&gt;
&lt;plugin id="mysql" dialect="mysql" ref-id="sql-standard-root"&gt;
    &lt;templates&gt;
        &lt;template id="create-table" type="SQL" category="db"&gt;
            &lt;content&gt;{{> create-table-mysql-lineage}}&lt;/content&gt;
        &lt;/template&gt;
    &lt;/templates&gt;
&lt;/plugin&gt;

&lt;!-- 3. custom-plugin 覆盖 mysql 模板 --&gt;
&lt;plugin id="custom-mysql" dialect="mysql" ref-id="mysql"&gt;
    &lt;templates&gt;
        &lt;template id="create-table" type="SQL" category="db"&gt;
            &lt;content&gt;
                -- 自定义 CREATE TABLE 逻辑
                CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name}} (
                    {{> columns}}
                ) ENGINE=InnoDB;
            &lt;/content&gt;
        &lt;/template&gt;
    &lt;/templates&gt;
&lt;/plugin&gt;
```

## 模板覆盖规则

### 覆盖策略

| 覆盖层级 | 说明 | 示例 |
|---------|------|------|
| 主入口层 | 覆盖条件路由逻辑 | `drop-table` |
| 操作层 | 覆盖具体操作实现 | `drop-table-raw` |
| 中间层 | 添加自定义逻辑 | `drop-table-mysql` |
| 血统层 | 定义共享语法 | `drop-table-mysql-lineage` |

### 覆盖示例

```xml
&lt;!-- 策略1：覆盖主入口，添加自定义路由逻辑 --&gt;
&lt;template id="drop-table"&gt;
  &lt;content&gt;
    {{#if @root.customLogic}}
        -- 自定义逻辑
        {{> custom-drop-table}}
    {{else if @root.safeDrop}}
        {{> rename-table}}
    {{else}}
        {{> drop-table-raw}}
    {{/if}}
  &lt;/content&gt;
&lt;/template&gt;

&lt;!-- 策略2：覆盖操作层，提供特定实现 --&gt;
&lt;template id="rename-table"&gt;
  &lt;content&gt;
    -- MySQL 特定优化版 RENAME
    RENAME TABLE {{> table-name ..}} TO {{> table-name-safe}};
  &lt;/content&gt;
&lt;/template&gt;

&lt;!-- 策略3：完全不覆盖，使用血统模板 --&gt;
&lt;!-- MySQL plugin 不定义 drop-table，自动使用 sql-standard-root 的条件路由 --&gt;
```

## 插件引用 (ref-id)

### ref-id 机制

```xml
&lt;plugin id="mysql" dialect="mysql" ref-id="sql-standard-root"&gt;
    &lt;!-- 继承 sql-standard-root 的所有模板 --&gt;
&lt;/plugin&gt;
```

### 继承行为

- 子插件可以访问父插件的所有模板
- 子插件可以覆盖父插件的模板
- 未覆盖的模板自动使用父插件定义

### 多级继承

```xml
&lt;plugin id="base-plugin"&gt;
    &lt;!-- 基础模板 --&gt;
&lt;/plugin&gt;

&lt;plugin id="mysql-base" ref-id="base-plugin"&gt;
    &lt;!-- MySQL 通用模板 --&gt;
&lt;/plugin&gt;

&lt;plugin id="mysql-8.0" ref-id="mysql-base"&gt;
    &lt;!-- MySQL 8.0 特定模板 --&gt;
&lt;/plugin&gt;
```

## 模板注入

### injectBefore

在指定模板之前注入：

```xml
&lt;template id="custom-create-table" injectBefore="create-table"&gt;
    &lt;content&gt;
        -- 在 CREATE TABLE 之前执行的 SQL
        SET @sql_mode = 'STRICT_TRANS_TABLES';
    &lt;/content&gt;
&lt;/template&gt;
```

### injectAfter

在指定模板之后注入：

```xml
&lt;template id="custom-index" injectAfter="create-table"&gt;
    &lt;content&gt;
        -- 在 CREATE TABLE 之后创建索引
        CREATE INDEX idx_users_email ON users(email);
    &lt;/content&gt;
&lt;/template&gt;
```

### injectReplace

替换指定模板：

```xml
&lt;template id="custom-drop" injectReplace="drop-table"&gt;
    &lt;content&gt;
        -- 自定义 DROP TABLE 逻辑
        DROP TABLE IF EXISTS {{> table-name}} CASCADE;
    &lt;/content&gt;
&lt;/template&gt;
```

## 模板查找顺序

### execute() 方法流程

```java
public String execute(String name, TemplateRootContext context) {
    String dbType = context.getDbType();

    // 1. 尝试最精确匹配
    Template template = findTemplate(name, "db", "SQL", dbType);
    if (template != null) return render(template, context);

    // 2. 尝试类型级匹配
    template = findTemplate(name, "db", "SQL", null);
    if (template != null) return render(template, context);

    // 3. 尝试分类匹配
    template = findTemplate(name, "db", null, null);
    if (template != null) return render(template, context);

    // 4. 尝试全局匹配
    template = findTemplate(name, null, null, null);
    if (template != null) return render(template, context);

    throw new TemplateNotFoundException(name);
}
```

### 查找优先级

```
1. (name + category + type + dialect)     ← 最高优先级
2. (name + category + type)
3. (name + category)
4. (name)                                  ← 最低优先级
```

## 实际应用场景

### 场景 1：添加方言特定语法

```xml
&lt;!-- PostgreSQL 需要 AFTER COLUMN 语法 --&gt;
&lt;template id="add-column" dialect="postgresql"&gt;
    &lt;content&gt;
        ALTER TABLE {{> table-name ..}}
        ADD COLUMN {{> column-spec this}};
    &lt;/content&gt;
&lt;/template&gt;
```

### 场景 2：覆盖通用逻辑

```xml
&lt;!-- Oracle 不支持 IF EXISTS --&gt;
&lt;template id="drop-table" dialect="oracle"&gt;
    &lt;content&gt;
        DECLARE
            table_count NUMBER;
        BEGIN
            SELECT COUNT(*) INTO table_count
            FROM user_tables
            WHERE table_name = UPPER('{{this.name}}');

            IF table_count > 0 THEN
                EXECUTE IMMEDIATE 'DROP TABLE {{this.name}}';
            END IF;
        END;
    &lt;/content&gt;
&lt;/template&gt;
```

### 场景 3：添加性能优化

```xml
&lt;!-- MySQL 8.0 使用 RENAME INDEX 优化 --&gt;
&lt;template id="rename-index" dialect="mysql"&gt;
    &lt;content&gt;
        {{#if (version @root.dbType '>=8.0')}}
            RENAME INDEX {{this.oldName}} TO {{this.newName}};
        {{else}}
            -- 旧版本使用 DROP + CREATE
            DROP INDEX {{this.oldName}};
            CREATE INDEX {{this.newName}} ON {{> table-name ..}}({{this.columns}});
        {{/if}}
    &lt;/content&gt;
&lt;/template&gt;
```

## 最佳实践

### 1. 优先使用血统模板

```xml
&lt;!-- 好的做法：使用血统模板 --&gt;
&lt;template id="create-table"&gt;
    &lt;content&gt;{{> create-table-mysql-lineage}}&lt;/content&gt;
&lt;/template&gt;

&lt;!-- 避免：每个插件都重复定义 --&gt;
&lt;template id="create-table"&gt;
    &lt;content&gt;CREATE TABLE ...&lt;/content&gt;
&lt;/template&gt;
```

### 2. 只覆盖差异部分

```xml
&lt;!-- 好的做法：只覆盖需要修改的部分 --&gt;
&lt;template id="modify-column" dialect="mysql"&gt;
    &lt;content&gt;ALTER TABLE ... MODIFY COLUMN ...;&lt;/content&gt;
&lt;/template&gt;

&lt;!-- 避免：重新定义整个模板 --&gt;
```

### 3. 保持模板层次清晰

```xml
&lt;!-- 好的做法：清晰的层次结构 --&gt;
sql-standard-root (血统模板)
  └── mysql (方言模板)
      └── custom-mysql (扩展模板)

&lt;!-- 避免：扁平结构，所有模板都在同一层级 --&gt;
```

### 4. 使用模板引用

```xml
&lt;!-- 好的做法：引用共享模板 --&gt;
{{> table-name}}
{{> column-spec}}
{{> index-spec}}

&lt;!-- 避免：在每个模板中重复定义 --&gt;
```

## 相关文档

- [模板系统概述](./overview.md)
- [Handlebars 模板语法](./handlebars-templates.md)
- [血统模板系统](./lineage-templates.md)
