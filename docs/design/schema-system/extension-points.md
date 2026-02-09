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
    private Map<String, Object> unknownValues = new HashMap<>();

    public Object get(String key) {
        return unknownValues.get(key);
    }

    public void set(String key, Object value) {
        unknownValues.put(key, value);
    }

    public Map<String, Object> getUnknownValues() {
        return unknownValues;
    }
}
```

### 使用示例

```xml
<!-- MySQL 表使用 engine 属性（存储在 UnknownValues） -->
<Table name="users" engine="InnoDB" row_format="COMPRESSED" charset="utf8mb4">
    <columns>...</columns>
</Table>

<!-- PostgreSQL 表使用 tablespace 属性 -->
<Table name="users" tablespace="user_space">
    <columns>...</columns>
</Table>
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
    private List<ExtensionAttribute> attributes; // 属性列表
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
<JustdbPlugin id="mysql-plugin" dialect="mysql">
    <extensionPoints>
        <!-- MySQL 表扩展点 -->
        <ExtensionPoint name="mysql-table" target="table" type="standard">
            <attributes>
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
            </attributes>
        </ExtensionPoint>

        <!-- MySQL 列扩展点 -->
        <ExtensionPoint name="mysql-column" target="column" type="standard">
            <attributes>
                <ExtensionAttribute name="unsigned" type="boolean"
                                  defaultValue="false"
                                  description="无符号"/>
                <ExtensionAttribute name="zerofill" type="boolean"
                                  defaultValue="false"
                                  description="零填充"/>
            </attributes>
        </ExtensionPoint>
    </extensionPoints>
</JustdbPlugin>
```

### 使用扩展点

```xml
<!-- 使用定义的扩展点属性 -->
<Table name="users" engine="MyISAM" charset="utf8" row_format="DYNAMIC">
    <columns>
        <Column name="id" type="BIGINT" primaryKey="true" unsigned="true"/>
        <Column name="username" type="VARCHAR(50)" nullable="false"/>
    </columns>
</Table>
```

## 扩展点注册表

### ExtensionPointRegistry

```java
public class ExtensionPointRegistry {
    private Map<String, ExtensionPoint> extensionPoints = new HashMap<>();

    public void register(ExtensionPoint extensionPoint) {
        extensionPoints.put(extensionPoint.getName(), extensionPoint);
    }

    public ExtensionPoint get(String name) {
        return extensionPoints.get(name);
    }

    public List<ExtensionPoint> getByTarget(String target) {
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
<JustdbPlugin id="sql-standard-root">
    <extensionPoints>
        <!-- 标准扩展点定义 -->
    </extensionPoints>
</JustdbPlugin>

<JustdbPlugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
    <extensionPoints>
        <!-- MySQL 特定扩展点 -->
    </extensionPoints>
</JustdbPlugin>
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
    <columns>...</columns>
</Table>
```

### 2. PostgreSQL 表级扩展

```xml
<Table name="users"
       tablespace="user_tablespace"
       with_oids="false"
       autovacuum_enabled="true"
       fillfactor="90">
    <columns>...</columns>
</Table>
```

### 3. Oracle 表级扩展

```xml
<Table name="users"
       tablespace="USERS"
       logging="yes"
       compress="yes"
       parallel="4">
    <columns>...</columns>
</Table>
```

### 4. 列级扩展

```xml
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="username" type="VARCHAR(50)" nullable="false" charset="utf8mb4"/>
    <Column name="balance" type="DECIMAL(10,2)" unsigned="true"/>
</Table>
```

### 5. 分区扩展

```xml
<Table name="orders" partition_by="RANGE" partition_expression="created_at">
    <Partition name="p_2023" values="LESS THAN ('2024-01-01')"/>
    <Partition name="p_2024" values="LESS THAN ('2025-01-01')"/>
    <columns>...</columns>
</Table>
```

## 扩展点验证

### 自动验证

```java
public class ExtensionPointValidator {
    public void validate(Item item, List<ExtensionPoint> extensionPoints) {
        Map<String, Object> unknownValues = item.getUnknownValues();

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
<!-- MySQL 表创建模板 -->
<template id="create-table" type="SQL" category="db">
    <content>
CREATE TABLE {{> table-name}} (
    {{> columns}}
){{#if this.engine}} ENGINE={{this.engine}}{{/if}}
{{#if this.charset}} CHARSET={{this.charset}}{{/if}}
{{#if this.collation}} COLLATE={{this.collation}}{{/if}}
{{#if this.row_format}} ROW_FORMAT={{this.row_format}}{{/if}};
    </content>
</template>
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
<!-- 好的做法：明确定义扩展点 -->
<ExtensionPoint name="mysql-table" target="table">
    <attributes>
        <ExtensionAttribute name="engine" type="String" defaultValue="InnoDB"/>
    </attributes>
</ExtensionPoint>

<!-- 避免：未定义直接使用 -->
<Table name="users" custom_attr="value"/>
```

### 2. 提供默认值

```xml
<ExtensionAttribute name="engine" type="String" defaultValue="InnoDB"/>
```

### 3. 添加文档说明

```xml
<ExtensionAttribute name="engine" type="String" defaultValue="InnoDB"
                  description="MySQL 存储引擎: InnoDB, MyISAM, Memory 等"/>
```

### 4. 类型安全

```xml
<ExtensionAttribute name="parallel" type="Integer" description="并行度"/>
<ExtensionAttribute name="logging" type="Boolean" defaultValue="true"/>
```

## 相关文档

- [Schema 系统概述](./overview.md)
- [插件系统](../../development/plugin-development/README.md)
- [模板系统设计](../template-system/README.md)
