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
<!-- 1. sql-standard-root 定义血统模板 -->
<plugin id="sql-standard-root">
    <templates>
        <template id="create-table-mysql-lineage" type="SQL" category="db">
            <content>
                CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name-spec}} (
                    {{> columns}}
                );
            </content>
        </template>
    </templates>
</plugin>

<!-- 2. mysql plugin 引用血统模板 -->
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
    <templates>
        <template id="create-table" type="SQL" category="db">
            <content>{{> create-table-mysql-lineage}}</content>
        </template>
    </templates>
</plugin>

<!-- 3. custom-plugin 覆盖 mysql 模板 -->
<plugin id="custom-mysql" dialect="mysql" ref-id="mysql">
    <templates>
        <template id="create-table" type="SQL" category="db">
            <content>
                -- 自定义 CREATE TABLE 逻辑
                CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name-spec}} (
                    {{> columns}}
                ) ENGINE=InnoDB;
            </content>
        </template>
    </templates>
</plugin>
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
<!-- 策略1：覆盖主入口，添加自定义路由逻辑 -->
<template id="drop-table">
  <content>
    {{#if @root.customLogic}}
        -- 自定义逻辑
        {{> custom-drop-table}}
    {{else if @root.safeDrop}}
        {{> rename-table}}
    {{else}}
        {{> drop-table-raw}}
    {{/if}}
  </content>
</template>

<!-- 策略2：覆盖操作层，提供特定实现 -->
<template id="rename-table">
  <content>
    -- MySQL 特定优化版 RENAME
    RENAME TABLE {{> table-name-spec ..}} TO {{> table-name-spec-safe}};
  </content>
</template>

<!-- 策略3：完全不覆盖，使用血统模板 -->
<!-- MySQL plugin 不定义 drop-table，自动使用 sql-standard-root 的条件路由 -->
```

## 插件引用 (ref-id)

### ref-id 机制

```xml
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
    <!-- 继承 sql-standard-root 的所有模板 -->
</plugin>
```

### 继承行为

- 子插件可以访问父插件的所有模板
- 子插件可以覆盖父插件的模板
- 未覆盖的模板自动使用父插件定义

### 多级继承

```xml
<plugin id="base-plugin">
    <!-- 基础模板 -->
</plugin>

<plugin id="mysql-base" ref-id="base-plugin">
    <!-- MySQL 通用模板 -->
</plugin>

<plugin id="mysql-8.0" ref-id="mysql-base">
    <!-- MySQL 8.0 特定模板 -->
</plugin>
```

## 模板注入

### injectBefore

在指定模板之前注入：

```xml
<template id="custom-create-table" injectBefore="create-table">
    <content>
        -- 在 CREATE TABLE 之前执行的 SQL
        SET @sql_mode = 'STRICT_TRANS_TABLES';
    </content>
</template>
```

### injectAfter

在指定模板之后注入：

```xml
<template id="custom-index" injectAfter="create-table">
    <content>
        -- 在 CREATE TABLE 之后创建索引
        CREATE INDEX idx_users_email ON users(email);
    </content>
</template>
```

### injectReplace

替换指定模板：

```xml
<template id="custom-drop" injectReplace="drop-table">
    <content>
        -- 自定义 DROP TABLE 逻辑
        DROP TABLE IF EXISTS {{> table-name-spec}} CASCADE;
    </content>
</template>
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
<!-- PostgreSQL 需要 AFTER COLUMN 语法 -->
<template id="add-column" dialect="postgresql">
    <content>
        ALTER TABLE {{> table-name-spec ..}}
        ADD COLUMN {{> column-spec this}};
    </content>
</template>
```

### 场景 2：覆盖通用逻辑

```xml
<!-- Oracle 不支持 IF EXISTS -->
<template id="drop-table" dialect="oracle">
    <content>
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
    </content>
</template>
```

### 场景 3：添加性能优化

```xml
<!-- MySQL 8.0 使用 RENAME INDEX 优化 -->
<template id="rename-index" dialect="mysql">
    <content>
        {{#if (version @root.dbType '>=8.0')}}
            RENAME INDEX {{this.oldName}} TO {{this.newName}};
        {{else}}
            -- 旧版本使用 DROP + CREATE
            DROP INDEX {{this.oldName}};
            CREATE INDEX {{this.newName}} ON {{> table-name-spec ..}}({{this.columns}});
        {{/if}}
    </content>
</template>
```

## 最佳实践

### 1. 优先使用血统模板

```xml
<!-- 好的做法：使用血统模板 -->
<template id="create-table">
    <content>{{> create-table-mysql-lineage}}</content>
</template>

<!-- 避免：每个插件都重复定义 -->
<template id="create-table">
    <content>CREATE TABLE ...</content>
</template>
```

### 2. 只覆盖差异部分

```xml
<!-- 好的做法：只覆盖需要修改的部分 -->
<template id="modify-column" dialect="mysql">
    <content>ALTER TABLE ... MODIFY COLUMN ...;</content>
</template>

<!-- 避免：重新定义整个模板 -->
```

### 3. 保持模板层次清晰

```xml
<!-- 好的做法：清晰的层次结构 -->
sql-standard-root (血统模板)
  └── mysql (方言模板)
      └── custom-mysql (扩展模板)

<!-- 避免：扁平结构，所有模板都在同一层级 -->
```

### 4. 使用模板引用

```xml
<!-- 好的做法：引用共享模板 -->
{{> table-name-spec}}
{{> column-spec}}
{{> index-spec}}

<!-- 避免：在每个模板中重复定义 -->
```

## 相关文档

- [模板系统概述](./overview.md)
- [Handlebars 模板语法](./handlebars-templates.md)
- [血统模板系统](./lineage-templates.md)
