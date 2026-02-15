---
title: Extension Point System
icon: puzzle-piece
order: 5
category: Design
tags:
  - schema
  - extension
  - plugin
---

# Extension Point System

## Overview

JustDB's extension point system allows adding custom attributes to Schema objects, supporting database-specific extensions and custom configurations. Through the `UnknownValues` base class and `ExtensionPoint` mechanism, flexible dynamic attribute support is achieved.

## UnknownValues Base Class

### Design Principle

All Schema objects inherit from `Item`, and `Item` inherits from `UnknownValues`, so all objects natively support dynamic attributes.

```java
public class UnknownValues {
    private Map&lt;String, , Object> unknownValues = new HashMap<>();

    public Object get(String key) {
        return unknownValues.get(key);
    }

    public void set(String key, Object value) {
        unknownValues.put(key, value);
    }

    public Map&lt;String, , Object> getUnknownValues() {
        return unknownValues;
    }
}
```

### Usage Example

```xml
<!-- MySQL table using engine attribute (stored in UnknownValues) -->
<Table name="users" engine="InnoDB" row_format="COMPRESSED" charset="utf8mb4">
    <columns>...</columns>
</Table>

<!-- PostgreSQL table using tablespace attribute -->
<Table name="users" tablespace="user_space">
    <columns>...</columns>
</Table>
```

### Serialization Support

Dynamic attributes are automatically serialized to JSON/XML:

```json
{
  "name": "users",
  "engine": "InnoDB",
  "row_format": "COMPRESSED",
  "charset": "utf8mb4"
}
```

## ExtensionPoint Mechanism

### Design Goals

- **Type Safety**: Define types and default values for extension attributes
- **Validation Support**: Validate attribute values meet requirements
- **Documentation**: Provide documentation for extension attributes
- **IDE Support**: Provide code completion through definitions

### ExtensionPoint Structure

```java
public class ExtensionPoint {
    private String name;                      // Extension point name
    private String target;                    // Target object type (table, column, index, etc.)
    private String type;                      // Type: standard or custom
    private String customClass;               // Custom type class name
    private List<ExtensionAttribute&gt;> attributes; // Attribute list
}

public class ExtensionAttribute {
    private String name;                      // Attribute name
    private String type;                      // Attribute type
    private String defaultValue;              // Default value
    private boolean required;                 // Whether required
    private String description;               // Attribute description
}
```

### Define Extension Points in Plugins

```xml
<JustdbPlugin id="mysql-plugin" dialect="mysql">
    <extensionPoints>
        <!-- MySQL table extension point -->
        <ExtensionPoint name="mysql-table" target="table" type="standard">
            <attributes>
                <ExtensionAttribute name="engine" type="String"
                                  defaultValue="InnoDB"
                                  description="Storage engine"/>
                <ExtensionAttribute name="charset" type="String"
                                  defaultValue="utf8mb4"
                                  description="Character set"/>
                <ExtensionAttribute name="collation" type="String"
                                  defaultValue="utf8mb4_unicode_ci"
                                  description="Collation"/>
                <ExtensionAttribute name="row_format" type="String"
                                  description="Row format"/>
            </attributes>
        </ExtensionPoint>

        <!-- MySQL column extension point -->
        <ExtensionPoint name="mysql-column" target="column" type="standard">
            <attributes>
                <ExtensionAttribute name="unsigned" type="boolean"
                                  defaultValue="false"
                                  description="Unsigned"/>
                <ExtensionAttribute name="zerofill" type="boolean"
                                  defaultValue="false"
                                  description="Zero fill"/>
            </attributes>
        </ExtensionPoint>
    </extensionPoints>
</JustdbPlugin>
```

### Use Extension Points

```xml
<!-- Use defined extension point attributes -->
<Table name="users" engine="MyISAM" charset="utf8" row_format="DYNAMIC">
    <columns>
        <Column name="id" type="BIGINT" primaryKey="true" unsigned="true"/>
        <Column name="username" type="VARCHAR(50)" nullable="false"/>
    </columns>
</Table>
```

## Extension Point Registry

### ExtensionPointRegistry

```java
public class ExtensionPointRegistry {
    private Map&lt;String, , ExtensionPoint> extensionPoints = new HashMap<>();

    public void register(ExtensionPoint extensionPoint) {
        extensionPoints.put(extensionPoint.getName(), extensionPoint);
    }

    public ExtensionPoint get(String name) {
        return extensionPoints.get(name);
    }

    public List<ExtensionPoint&gt;> getByTarget(String target) {
        return extensionPoints.values().stream()
            .filter(ep -> ep.getTarget().equals(target))
            .collect(Collectors.toList());
    }

    public void validate(Object schemaObject) {
        // Validate extension attributes
    }
}
```

### Auto Discovery

Plugin system automatically loads extension points defined in `default-plugins.xml`:

```xml
<JustdbPlugin id="sql-standard-root">
    <extensionPoints>
        <!-- Standard extension point definitions -->
    </extensionPoints>
</JustdbPlugin>

<JustdbPlugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
    <extensionPoints>
        <!-- MySQL-specific extension points -->
    </extensionPoints>
</JustdbPlugin>
```

## Common Extension Scenarios

### 1. MySQL Table-Level Extensions

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

### 2. PostgreSQL Table-Level Extensions

```xml
<Table name="users"
       tablespace="user_tablespace"
       with_oids="false"
       autovacuum_enabled="true"
       fillfactor="90">
    <columns>...</columns>
</Table>
```

### 3. Oracle Table-Level Extensions

```xml
<Table name="users"
       tablespace="USERS"
       logging="yes"
       compress="yes"
       parallel="4">
    <columns>...</columns>
</Table>
```

### 4. Column-Level Extensions

```xml
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="username" type="VARCHAR(50)" nullable="false" charset="utf8mb4"/>
    <Column name="balance" type="DECIMAL(10,2)" unsigned="true"/>
</Table>
```

### 5. Partition Extensions

```xml
<Table name="orders" partition_by="RANGE" partition_expression="created_at">
    <Partition name="p_2023" values="LESS THAN ('2024-01-01')"/>
    <Partition name="p_2024" values="LESS THAN ('2025-01-01')"/>
    <columns>...</columns>
</Table>
```

## Extension Point Validation

### Auto Validation

```java
public class ExtensionPointValidator {
    public void validate(Item item, List<ExtensionPoint&gt;> extensionPoints) {
        Map&lt;String, , Object> unknownValues = item.getUnknownValues();

        for (ExtensionPoint ep : extensionPoints) {
            if (ep.getTarget().equals(item.getClass().getSimpleName())) {
                for (ExtensionAttribute attr : ep.getAttributes()) {
                    Object value = unknownValues.get(attr.getName());

                    // Check required attributes
                    if (attr.isRequired() && value == null) {
                        throw new ValidationException(
                            "Required attribute '" + attr.getName() + "' is missing"
                        );
                    }

                    // Check type
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

### Error Handling

```java
try {
    SchemaLoader.load("schema.yaml");
} catch (ValidationException e) {
    System.err.println("Validation error: " + e.getMessage());
    // Required attribute 'engine' is missing for table 'users'
}
```

## Using Extension Attributes in Templates

### Access Extension Attributes

```handlebars
<!-- MySQL table creation template -->
<template id="create-table" type="SQL" category="db">
    <content>
CREATE TABLE {{> table-name-spec}} (
    {{> columns}}
){{#if this.engine}} ENGINE={{this.engine}}{{/if}}
{{#if this.charset}} CHARSET={{this.charset}}{{/if}}
{{#if this.collation}} COLLATE={{this.collation}}{{/if}}
{{#if this.row_format}} ROW_FORMAT={{this.row_format}}{{/if}};
    </content>
</template>
```

### Conditional Rendering

```handlebars
{{#if (eq this.engine 'InnoDB')}}
-- InnoDB-specific configuration
{{/if}}

{{#if (eq this.engine 'MyISAM')}}
-- MyISAM-specific configuration
{{/if}}
```

## Best Practices

### 1. Define Clear Extension Points

```xml
<!-- Good practice: explicitly define extension points -->
<ExtensionPoint name="mysql-table" target="table">
    <attributes>
        <ExtensionAttribute name="engine" type="String" defaultValue="InnoDB"/>
    </attributes>
</ExtensionPoint>

<!-- Avoid: use without definition -->
<Table name="users" custom_attr="value"/>
```

### 2. Provide Default Values

```xml
<ExtensionAttribute name="engine" type="String" defaultValue="InnoDB"/>
```

### 3. Add Documentation

```xml
<ExtensionAttribute name="engine" type="String" defaultValue="InnoDB"
                  description="MySQL storage engine: InnoDB, MyISAM, Memory, etc."/>
```

### 4. Type Safety

```xml
<ExtensionAttribute name="parallel" type="Integer" description="Parallel degree"/>
<ExtensionAttribute name="logging" type="Boolean" defaultValue="true"/>
```

## Related Documents

- [Schema System Overview](./overview.md)
- [Plugin System](../../development/plugin-development/README.md)
- [Template System Design](../template-system/README.md)
