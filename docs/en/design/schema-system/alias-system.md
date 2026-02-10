---
title: Alias System
icon: code
order: 3
category: Design
tags:
  - schema
  - alias
  - compatibility
---

# Alias System

## Overview

JustDB Schema's alias system supports multiple naming formats via `@JsonAlias` annotations.

> **Formats Are Not Tools to Limit Users, Formats Are Doors to User Convenience**

The alias system makes it convenient for users from different backgrounds: backward compatibility with old versions, AI-friendly with multiple formats, human-friendly with familiar naming conventions.

## Design Goals

1. **Backward Compatibility**: Support legacy field names, protect user investment
2. **AI Compatibility**: Any AI, blind writing, all compatible
3. **Human Compatibility**: Developers with different programming backgrounds can use familiar formats
4. **Canonical Output**: Use unified canonical naming (camelCase, plural form)
5. **SQL Standards**: Prefer SQL standard terminology

## Core Naming Conventions

| Convention | Description | Example |
|------------|-------------|---------|
| **camelCase** | Field names use camelCase | `referenceId`, `formerNames` |
| **Plural Form** | Collection types use plural | `tables`, `columns`, `indexes` |
| **SQL Terminology** | Use SQL standard terms | `beforeDrops`, `afterAlters` |
| **Full Words** | Avoid abbreviations (except common ones) | `primaryKey` (not `pk`) |

## Naming Format Variants

Supports aliases for the following naming formats:

| Format | Example |
|--------|---------|
| camelCase | `referenceId`, `tableScopes` |
| PascalCase | `ReferenceId`, `TableScopes` |
| kebab-case | `reference-id`, `table-scopes` |
| snake_case | `reference_id`, `table_scopes` |

## Core Field Alias Mappings

### referenceId Aliases

Core field for component reuse.

```java
@JsonProperty("referenceId")
@JsonAlias({"refId", "ref-id", "ref_id"})
protected String referenceId;
```

**Supported input formats**:
- `referenceId` (canonical)
- `refId`
- `ref-id`
- `ref_id`

**Usage example**:

```xml
<!-- Define global column template -->
<Column id="global_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>

<!-- Reference in table -->
<Table name="users">
    <!-- Can use any alias format -->
    <Column id="col_users_id" refId="global_id" name="id"/>
</Table>
```

### formerNames Aliases

For tracking Schema evolution, recording object rename history.

```java
@JsonProperty("formerNames")
@JsonAlias({"oldNames", "oldName", "formerName", "former_names", "old_names",
              "previousNames", "previousName", "previous_names", "old-names"})
protected List&lt;String&gt; formerNames;
```

**Supported input formats**:
- `formerNames` (canonical)
- `oldNames`
- `oldName`
- `formerName`
- `previousNames`
- `previousName`
- And various other variants

**Usage example**:

```xml
<!-- Record table name change history -->
<Table name="users">
    <formerNames>
        <oldName>user</oldName>
    </formerNames>
</Table>
```

Generated migration SQL:
```sql
ALTER TABLE user RENAME TO users;
```

### tableScopes Aliases

Table scope filter for filtering tables to process.

```java
@JsonProperty("tableScopes")
@JsonAlias({"tableScope", "tableFilters", "includeTablePatterns", "includeTables"})
private TableScopes tableScopes;
```

**Supported input formats**:
- `tableScopes` (canonical)
- `tableScope`
- `tableFilters`
- `includeTablePatterns`
- `includeTables`

**Usage example**:

```yaml
# Can use any format
tableScope:
  includeTables: ["users*", "orders*"]
  excludeTables: ["*_temp"]

# Or canonical format
tableScopes:
  includes: ["users*", "orders*"]
  excludes: ["*_temp"]
```

### Lifecycle Hook Aliases

Adopt SQL standard operation terminology, supporting multiple aliases.

```java
@JsonProperty("beforeDrops")
@JsonAlias({"BeforeDrops", "BeforeDrop", "beforeDrop", "BeforeRemoves", "BeforeRemoves",
              "beforeRemoves", "beforeRemove", "before-drop", "before-drops",
              "Before-Drop", "Before-Drops", "before_drops", "Before-Remove",
              "onBeforeDrop", "onDrop"})
protected List<ConditionalSqlScript&gt;> beforeDrops;
```

**Lifecycle hook naming**:

| Operation | Hook Prefix | Description |
|-----------|-------------|-------------|
| CREATE | `beforeCreates`, `afterCreates` | Create objects |
| DROP | `beforeDrops`, `afterDrops` | Drop objects |
| ALTER | `beforeAlters`, `afterAlters` | Alter objects |
| ADD | `beforeAdds`, `afterAdds` | Add sub-objects (columns, indexes, etc.) |

**Supported aliases**:
- `beforeRemoves` / `afterRemoves` → `beforeDrops` / `afterDrops`
- `beforeModifies` / `afterModifies` → `beforeAlters` / `afterAlters`

## Serialization Behavior

### Input Parsing

Supports all alias formats, system automatically recognizes and converts.

```json
{
  "tableScope": {
    "includeTables": ["users*"],
    "excludeTables": ["*_temp"]
  }
}
```

### Internal Object

Converts to canonical name (camelCase plural form).

```json
{
  "tableScopes": {
    "includes": ["users*"],
    "excludes": ["*_temp"]
  }
}
```

### Output Serialization

Only outputs canonical name (camelCase plural form).

```json
{
  "tableScopes": {
    "includes": ["users*"],
    "excludes": ["*_temp"]
  }
}
```

## Field Naming Convention Mapping

| Old Field Name | New Field Name | Change Reason |
|----------------|----------------|---------------|
| `refId` | `referenceId` | P0-1: Improve readability |
| `oldNames` | `formerNames` | P1-1: More semantic |
| `foreignTable` | `referencedTable` | Use SQL standard terminology |
| `defaultValueComputed` | Unified to `defaultValue` | R1: Simplify fields |

## Implementation Principles

### @JsonAlias Annotation

```java
@JsonAlias({"refId", "ref-id", "ref_id"})
protected String referenceId;
```

Jackson tries the following order during deserialization:
1. First try canonical name `referenceId`
2. If not exists, try names in alias list in order
3. Use the first matching value found

### @JsonProperty Annotation

```java
@JsonProperty("referenceId")
protected String referenceId;
```

Specifies the field name to use during serialization, ensuring output uses canonical naming.

## Best Practices

### 1. New Field Naming

When creating new fields, follow these rules:
- Use camelCase
- Use plural form for collection types
- Prefer SQL standard terminology
- Provide reasonable alias support

```java
@JsonProperty("referencedTable")
@JsonAlias({"foreignTable", "referenced-table", "referenced_table"})
private String referencedTable;
```

### 2. Deprecated Field Handling

Don't delete old fields, instead:
1. Add `@Deprecated` annotation
2. Keep old field names in `@JsonAlias`
3. Document in docs that new field name is recommended

```java
@JsonProperty("newFieldName")
@JsonAlias({"oldFieldName", "old-field-name", "old_field_name"})
@Deprecated
private String newFieldName;
```

### 3. Documentation Updates

- Mark canonical field names in Schema documentation
- Explain field name changes in migration guides
- Provide automated migration tools

## Related Documents

- [Schema System Overview](./overview.md)
- [Type Hierarchy](./type-hierarchy.md)
- [Schema Evolution](./schema-evolution.md)
