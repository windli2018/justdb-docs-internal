---
title: 扩展点系统
icon: puzzle-piece
order: 5
category: 设计文档
tags:
  - schema
  - extension
  - plugin
---

# 扩展点系统

## 概述

JustDB 的扩展点系统允许为 Schema 对象添加自定义属性，支持数据库特定的扩展和自定义配置。通过 `UnknownValues` 基类和 `ExtensionPoint` 机制，实现灵活的动态属性支持。

## UnknownValues 基类

### 设计原理

所有 Schema 对象都继承自 `Item`，`Item` 继承自 `UnknownValues`，因此所有对象都天然支持动态属性。

```java
public class UnknownValues {
    private Map&lt;String, Object&gt; unknownValues = new HashMap&lt;&gt;();

    public Object get(String key) {
        return unknownValues.get(key);
    }

    public void set(String key, Object value) {
        unknownValues.put(key, value);
    }

    public Map&lt;String, Object&gt; getUnknownValues() {
        return unknownValues;
    }
}
```

### 使用示例

```xml
&lt;!-- MySQL 表使用 engine 属性（存储在 UnknownValues） --&gt;
&lt;Table name="users" engine="InnoDB" row_format="COMPRESSED" charset="utf8mb4"&gt;
    &lt;columns&gt;...&lt;/columns&gt;
&lt;/Table&gt;

&lt;!-- PostgreSQL 表使用 tablespace 属性 --&gt;
&lt;Table name="users" tablespace="user_space"&gt;
    &lt;columns&gt;...&lt;/columns&gt;
&lt;/Table&gt;
```

### 序列化支持

动态属性会自动序列化到 JSON/XML：

```json
{
  "name": "users",
  "engine": "InnoDB",
  "row_format": "COMPRESSED",
  "charset": "utf8mb4"
}
```

## ExtensionPoint 机制

### 设计目标

- **类型安全**：定义扩展属性的类型和默认值
- **验证支持**：验证属性值是否符合要求
- **文档化**：为扩展属性提供文档说明
- **IDE 支持**：通过定义提供代码补全

### ExtensionPoint 结构

```java
public class ExtensionPoint {
    private String name;                      // 扩展点名称
    private String target;                    // 目标对象类型 (table, column, index 等)
    private String type;                      // 类型: standard 或 custom
    private String customClass;               // 自定义类型类名
    private List&lt;ExtensionAttribute&gt; attributes; // 属性列表
}

public class ExtensionAttribute {
    private String name;                      // 属性名
    private String type;                      // 属性类型
    private String defaultValue;              // 默认值
    private boolean required;                 // 是否必填
    private String description;               // 属性描述
}
```

### 在插件中定义扩展点

```xml
&lt;JustdbPlugin id="mysql-plugin" dialect="mysql"&gt;
    &lt;extensionPoints&gt;
        &lt;!-- MySQL 表扩展点 --&gt;
        &lt;ExtensionPoint name="mysql-table" target="table" type="standard"&gt;
            &lt;attributes&gt;
                <ExtensionAttribute name="engine" type="String"
                                  defaultValue="InnoDB"
                                  description="存储引擎"/>
                <ExtensionAttribute name="charset" type="String"
                                  defaultValue="utf8mb4"
                                  description="字符集"/>
                <ExtensionAttribute name="collation" type="String"
                                  defaultValue="utf8mb4_unicode_ci"
                                  description="排序规则"/>
                <ExtensionAttribute name="row_format" type="String"
                                  description="行格式"/>
            &lt;/attributes&gt;
        &lt;/ExtensionPoint&gt;

        &lt;!-- MySQL 列扩展点 --&gt;
        &lt;ExtensionPoint name="mysql-column" target="column" type="standard"&gt;
            &lt;attributes&gt;
                <ExtensionAttribute name="unsigned" type="boolean"
                                  defaultValue="false"
                                  description="无符号"/>
                <ExtensionAttribute name="zerofill" type="boolean"
                                  defaultValue="false"
                                  description="零填充"/>
            &lt;/attributes&gt;
        &lt;/ExtensionPoint&gt;
    &lt;/extensionPoints&gt;
&lt;/JustdbPlugin&gt;
```

### 使用扩展点

```xml
&lt;!-- 使用定义的扩展点属性 --&gt;
&lt;Table name="users" engine="MyISAM" charset="utf8" row_format="DYNAMIC"&gt;
    &lt;columns&gt;
        &lt;Column name="id" type="BIGINT" primaryKey="true" unsigned="true"/&gt;
        &lt;Column name="username" type="VARCHAR(50)" nullable="false"/&gt;
    &lt;/columns&gt;
&lt;/Table&gt;
```

## 扩展点注册表

### ExtensionPointRegistry

```java
public class ExtensionPointRegistry {
    private Map&lt;String, ExtensionPoint&gt; extensionPoints = new HashMap&lt;&gt;();

    public void register(ExtensionPoint extensionPoint) {
        extensionPoints.put(extensionPoint.getName(), extensionPoint);
    }

    public ExtensionPoint get(String name) {
        return extensionPoints.get(name);
    }

    public List&lt;ExtensionPoint&gt; getByTarget(String target) {
        return extensionPoints.values().stream()
            .filter(ep -> ep.getTarget().equals(target))
            .collect(Collectors.toList());
    }

    public void validate(Object schemaObject) {
        // 验证扩展属性
    }
}
```

### 自动发现

插件系统会自动加载 `default-plugins.xml` 中定义的扩展点：

```xml
&lt;JustdbPlugin id="sql-standard-root"&gt;
    &lt;extensionPoints&gt;
        &lt;!-- 标准扩展点定义 --&gt;
    &lt;/extensionPoints&gt;
&lt;/JustdbPlugin&gt;

&lt;JustdbPlugin id="mysql" dialect="mysql" ref-id="sql-standard-root"&gt;
    &lt;extensionPoints&gt;
        &lt;!-- MySQL 特定扩展点 --&gt;
    &lt;/extensionPoints&gt;
&lt;/JustdbPlugin&gt;
```

## 常见扩展场景

### 1. MySQL 表级扩展

```xml
<Table name="users"
       engine="InnoDB"
       charset="utf8mb4"
       collation="utf8mb4_unicode_ci"
       row_format="COMPRESSED"
       key_block_size="8">
    &lt;columns&gt;...&lt;/columns&gt;
&lt;/Table&gt;
```

### 2. PostgreSQL 表级扩展

```xml
<Table name="users"
       tablespace="user_tablespace"
       with_oids="false"
       autovacuum_enabled="true"
       fillfactor="90">
    &lt;columns&gt;...&lt;/columns&gt;
&lt;/Table&gt;
```

### 3. Oracle 表级扩展

```xml
<Table name="users"
       tablespace="USERS"
       logging="yes"
       compress="yes"
       parallel="4">
    &lt;columns&gt;...&lt;/columns&gt;
&lt;/Table&gt;
```

### 4. 列级扩展

```xml
&lt;Table name="users"&gt;
    &lt;Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/&gt;
    &lt;Column name="username" type="VARCHAR(50)" nullable="false" charset="utf8mb4"/&gt;
    &lt;Column name="balance" type="DECIMAL(10,2)" unsigned="true"/&gt;
&lt;/Table&gt;
```

### 5. 分区扩展

```xml
&lt;Table name="orders" partition_by="RANGE" partition_expression="created_at"&gt;
    &lt;Partition name="p_2023" values="LESS THAN ('2024-01-01')"/&gt;
    &lt;Partition name="p_2024" values="LESS THAN ('2025-01-01')"/&gt;
    &lt;columns&gt;...&lt;/columns&gt;
&lt;/Table&gt;
```

## 扩展点验证

### 自动验证

```java
public class ExtensionPointValidator {
    public void validate(Item item, List&lt;ExtensionPoint&gt; extensionPoints) {
        Map&lt;String, Object&gt; unknownValues = item.getUnknownValues();

        for (ExtensionPoint ep : extensionPoints) {
            if (ep.getTarget().equals(item.getClass().getSimpleName())) {
                for (ExtensionAttribute attr : ep.getAttributes()) {
                    Object value = unknownValues.get(attr.getName());

                    // 检查必填属性
                    if (attr.isRequired() && value == null) {
                        throw new ValidationException(
                            "Required attribute '" + attr.getName() + "' is missing"
                        );
                    }

                    // 检查类型
                    if (value != null && !isValidType(value, attr.getType())) {
                        throw new ValidationException(
                            "Attribute '" + attr.getName() + "' has invalid type"
                        );
                    }
                }
            }
        }
    }
}
```

### 错误处理

```java
try {
    SchemaLoader.load("schema.yaml");
} catch (ValidationException e) {
    System.err.println("Validation error: " + e.getMessage());
    // Required attribute 'engine' is missing for table 'users'
}
```

## 模板中使用扩展属性

### 访问扩展属性

```handlebars
&lt;!-- MySQL 表创建模板 --&gt;
&lt;template id="create-table" type="SQL" category="db"&gt;
    &lt;content&gt;
CREATE TABLE {{> table-name}} (
    {{> columns}}
){{#if this.engine}} ENGINE={{this.engine}}{{/if}}
{{#if this.charset}} CHARSET={{this.charset}}{{/if}}
{{#if this.collation}} COLLATE={{this.collation}}{{/if}}
{{#if this.row_format}} ROW_FORMAT={{this.row_format}}{{/if}};
    &lt;/content&gt;
&lt;/template&gt;
```

### 条件渲染

```handlebars
{{#if (eq this.engine 'InnoDB')}}
-- InnoDB 特定配置
{{/if}}

{{#if (eq this.engine 'MyISAM')}}
-- MyISAM 特定配置
{{/if}}
```

## 最佳实践

### 1. 定义明确的扩展点

```xml
&lt;!-- 好的做法：明确定义扩展点 --&gt;
&lt;ExtensionPoint name="mysql-table" target="table"&gt;
    &lt;attributes&gt;
        &lt;ExtensionAttribute name="engine" type="String" defaultValue="InnoDB"/&gt;
    &lt;/attributes&gt;
&lt;/ExtensionPoint&gt;

&lt;!-- 避免：未定义直接使用 --&gt;
&lt;Table name="users" custom_attr="value"/&gt;
```

### 2. 提供默认值

```xml
&lt;ExtensionAttribute name="engine" type="String" defaultValue="InnoDB"/&gt;
```

### 3. 添加文档说明

```xml
<ExtensionAttribute name="engine" type="String" defaultValue="InnoDB"
                  description="MySQL 存储引擎: InnoDB, MyISAM, Memory 等"/>
```

### 4. 类型安全

```xml
&lt;ExtensionAttribute name="parallel" type="Integer" description="并行度"/&gt;
&lt;ExtensionAttribute name="logging" type="Boolean" defaultValue="true"/&gt;
```

## 相关文档

- [Schema 系统概述](./overview.md)
- [插件系统](../../development/plugin-development/README.md)
- [模板系统设计](../template-system/README.md)
