---
title: Virtual Column Design
icon: table
---

# Virtual Column Design

**Version**: 2.1
**Date**: 2026-02-10
**Author**: JustDB Team
**Status**: Implemented

---------------------------

## Table of Contents

1. [Overview](#1-overview)
2. [Core Concepts](#2-core-concepts)
3. [Architecture](#3-architecture)
4. [Implementation Details](#4-implementation-details)
5. [Use Cases](#5-use-cases)
6. [Examples](#6-examples)

---------------------------

## 1. Overview

### 1.1 Problem Background

Relationship tables (like user_roles) storing pure IDs are hard to maintain:

```xml
<!-- Current approach: storing numeric IDs only -->
<Data table="user_roles">
    <Row user_id="1" role_id="5"/>
    <Row user_id="1" role_id="8"/>
    <Row user_id="2" role_id="5"/>
</Data>
```

**Pain points**:
1. Not intuitive (who is user_id=1? what is role_id=5?)
2. Schema data is hard to maintain and review manually
3. Export/import requires manual ID relationship maintenance
4. IDs may change during data migration

### 1.2 Solution

Virtual Column supports using readable identifiers to maintain relationship table data:

```xml
<!-- Using virtual columns: readable identifiers -->
<Table name="user_roles">
    <Column name="user_id" type="BIGINT" nullable="false"/>
    <Column name="role_id" type="BIGINT" nullable="false"/>

    <!-- Virtual columns: map readable identifiers to IDs -->
    <Column name="username" virtual="true" from="users.username" on="user_id"/>
    <Column name="rolename" virtual="true" from="roles.rolename" on="role_id"/>
</Table>

<Data table="user_roles">
    <!-- Use virtual column names directly -->
    <Row username="alice" rolename="admin"/>
    <Row username="alice" rolename="editor"/>
    <Row username="bob" rolename="viewer"/>
</Data>
```

---------------------------

## 2. Core Concepts

### 2.1 Virtual Column Definition

Virtual columns are special columns in Table definitions used to convert readable identifiers to actual IDs during data import.

#### Attribute Reference

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | String | ✓ | - | Virtual column name (readable identifier, e.g., username) |
| `virtual` | Boolean | ✓ | false | Mark as virtual column |
| `from` | String | ✓ | - | Source: table.field (e.g., users.username) |
| `on` | String | ✓ | - | Target column in current table (e.g., user_id) |
| `preferColumn` | Boolean | ✗ | false | Support pre-populated data resolution |
| `type` | String | ✗ | - | Column type (optional) |

#### Examples

```xml
<!-- Full format -->
<Column name="username" virtual="true" from="users.username" on="user_id"/>

<!-- Simplified format (omit table name) -->
<Column name="username" virtual="true" from="username" on="user_id"/>

<!-- With preferColumn -->
<Column name="username"
        type="VARCHAR(255)"
        virtual="true"
        preferColumn="true"
        from="users.username"
        on="user_id"/>
```

### 2.2 Attribute Combination Effects

| type | virtual | preferColumn | In DDL | Pre-Populated | Runtime Query |
|------|---------|-------------|--------|---------------|---------------|
| ✅ | false | false | ✅ | ❌ | ❌ |
| ✅ | false | true | ✅ | ✅ | ❌ |
| ✅ | true | false | ❌ | ❌ | ✅ |
| ✅ | true | true | ❌ | ✅ | ✅ |
| ❌ | true | false | ❌ | ❌ | ✅ |
| ❌ | true | true | ❌ | ✅ | ✅ |

### 2.3 Design Decisions

1. **Unified Type System**: Virtual columns inherit from `Column` class, reusing existing type system
2. **Automatic DDL Filtering**: Skip `virtual=true` columns when generating CREATE TABLE
3. **Data Import Resolution**: Only execute reference resolution during Data deployment
4. **Naming Convention**: Follow JustDB camelCase convention
5. **Alias Support**: Use `@JsonAlias` to support multiple naming formats

### 2.4 Virtual vs Physical Columns

| Feature | Physical Column | Virtual Column |
|---------|----------------|----------------|
| Generate DDL | ✓ | ✗ |
| Store Data | ✓ | ✗ |
| Data Import Usage | ✓ | ✓ |
| Definition Location | Column list | Column list |
| Purpose | Actual storage | Reference resolution |

---------------------------

## 3. Architecture

### 3.1 Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Schema Deployer                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Data Processor                          │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │         Virtual Column Resolver                │  │   │
│  │  │  1. Get virtual columns from Table             │  │   │
│  │  │  2. Match Row fields with virtual columns      │  │   │
│  │  │  3. Execute lookup queries                     │  │   │
│  │  │  4. Replace virtual fields with actual IDs     │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              SQL Executor                           │   │
│  │  Execute INSERT with resolved IDs                   │  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         ↓                           ↓
    ┌─────────┐                 ┌──────────┐
    │ Target  │                 │  Target  │
    │  users  │                 │  roles   │
    │ table   │                 │  table   │
    └─────────┘                 └──────────┘
```

### 3.2 Resolution Flow

```
1. Schema Loading
   ↓
   Table with virtual columns loaded
   ↓
2. Data Deployment
   ↓
   VirtualColumnResolver.resolve(data, table, connection)
   ↓
   For each Row:
     a. Find matching virtual columns
     b. Extract virtual field values
     c. Execute lookup query per virtual column
     d. Build resolved Row with actual IDs
   ↓
3. Execute INSERT
   ↓
   Insert with resolved IDs (virtual fields removed)
```

### 3.3 SQL Template Design

Following JustDB's template system design:

```xml
<!-- Template: virtual-column-lookup -->
<!-- Purpose: Look up ID by readable identifier -->
<template id="virtual-column-lookup" type="SQL" category="data">
    SELECT {{targetTable}}.{{idField}}
    FROM {{targetTable}}
    WHERE {{targetTable}}.{{keyField}} = '{{{value}}}'
</template>
```

**Template variables**:
- `{{targetTable}}`: Target table name
- `{{keyField}}`: Match field name
- `{{idField}}`: ID field name to return
- `{{{value}}}`: Readable identifier value (triple braces for escaping)

---------------------------

## 4. Implementation Details

### 4.1 Column Class Extension

Virtual column related fields in `org.verydb.justdb.schema.Column`:

```java
/**
 * Mark as virtual column (not physical, for reference resolution only).
 */
@JsonProperty("virtual")
@JsonAlias({"virtual", "isVirtual", "virtualColumn"})
private Boolean virtual = false;

/**
 * Source reference: table.field or just field name.
 * Examples: "users.username", "username"
 */
@JsonProperty("from")
@JsonAlias({"from", "source", "ref", "reference", "lookup"})
private String from;

/**
 * Target column in current table to populate with resolved ID.
 */
@JsonProperty("on")
@JsonAlias({"on", "to", "targetColumn", "targetField"})
private String on;

/**
 * Support pre-populated data resolution (data export/import friendly).
 */
@JsonProperty("preferColumn")
@JsonAlias({"preferColumn", "prefer", "resolve"})
private Boolean preferColumn = false;
```

### 4.2 DDL Generation Handling

Virtual columns are automatically filtered during DDL generation:

```xml
<!-- Template update: column-spec -->
<template id="column-spec" type="SQL" category="column">
    {{#unless virtual}}
    {{name}} {{type}}{{#if nullable}} nullable{{/if}}{{#if defaultValue}} DEFAULT {{{defaultValue}}}{{/if}}
    {{/unless}}
</template>
```

Or use Java-side filtering (more flexible):

```java
// In DBGenerator or Table processing
List<Column> physicalColumns = table.getColumns().stream()
    .filter(c -> c.getVirtual() == null || !c.getVirtual())
    .collect(Collectors.toList());
```

### 4.3 Computed Column Generation Strategy

Control DDL generation through `--computed-column` parameter:

| Option | Description | When DB Supports | When DB Doesn't Support |
|--------|-------------|------------------|------------------------|
| `auto` (default) | Generate when supported | Generate computed column | Don't generate (runtime resolution) |
| `always` | Always generate | Generate computed column | Generate physical column |
| `never` | Never generate | Don't generate (runtime resolution) | Don't generate |

#### MySQL 8.0+ (computedColumn="auto")

```sql
CREATE TABLE user_roles (
    user_id BIGINT,
    username VARCHAR(255) AS (SELECT username FROM users WHERE users.id = user_id) STORED
);
```

#### MySQL 5.7 (computedColumn="auto")

```sql
CREATE TABLE user_roles (
    user_id BIGINT
);
-- username not included, resolved at runtime
```

### 4.4 noMigrate Environment-Specific Columns

Mark column values as environment-specific, not supporting cross-environment migration:

```xml
<Column name="user_id" type="BIGINT" noMigrate="true"/>
<Column name="username" type="VARCHAR(50)" preferColumn="true" from="users.username" on="user_id"/>
```

**Behavior Rules**:

| Scenario | Behavior |
|----------|----------|
| Only preferColumn provided | Resolve to ID, insert into database |
| Only noMigrate column value | Use that value directly |
| Both provided | **Prefer preferColumn** |

---------------------------

## 5. Use Cases

### 5.1 Use Case 1: Pre-Populated Data Readability

```xml
<Data table="user_roles">
    <!-- Use readable values instead of IDs -->
    <Row username="alice" rolename="admin"/>
    <Row username="bob" rolename="viewer"/>
</Data>
```

### 5.2 Use Case 2: Runtime Queries

```sql
-- Query virtual column (auto-resolved)
SELECT username, rolename FROM user_roles;
-- Returns: alice, admin

-- Mixed query
SELECT user_id, username FROM user_roles;
-- Returns: 1, alice
```

### 5.3 Use Case 3: INSERT Auto-Resolution

```sql
-- Insert readable value, auto-convert to ID
INSERT INTO user_roles (username) VALUES ('alice');
-- Converts to: INSERT INTO user_roles (user_id) VALUES (1);
```

### 5.4 Use Case 4: UPDATE Bidirectional Sync

```sql
-- Update virtual column, sync physical column
UPDATE user_roles SET username='bob' WHERE id=1;
-- Converts to: UPDATE user_roles SET user_id=2 WHERE id=1;
```

---------------------------

## 6. Examples

### 6.1 User-Role Relationship

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="user-role-demo" namespace="org.example">

    <!-- Users table -->
    <Table id="users" name="users">
        <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
        <Column name="username" type="VARCHAR(50)" nullable="false"/>
        <Column name="email" type="VARCHAR(100)"/>
    </Table>

    <!-- Roles table -->
    <Table id="roles" name="roles">
        <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
        <Column name="rolename" type="VARCHAR(50)" nullable="false"/>
        <Column name="description" type="VARCHAR(200)"/>
    </Table>

    <!-- User-role relationship table -->
    <Table id="user_roles" name="user_roles">
        <!-- Physical columns -->
        <Column name="user_id" type="BIGINT" nullable="false"/>
        <Column name="role_id" type="BIGINT" nullable="false"/>

        <!-- Virtual columns: for data import -->
        <Column name="username" virtual="true" from="users.username" on="user_id"/>
        <Column name="rolename" virtual="true" from="roles.rolename" on="role_id"/>
    </Table>

    <!-- User data -->
    <Data table="users" dataExportStrategy="ALL_DATA">
        <Row username="alice" email="alice@example.com"/>
        <Row username="bob" email="bob@example.com"/>
    </Data>

    <!-- Role data -->
    <Data table="roles" dataExportStrategy="ALL_DATA">
        <Row rolename="admin" description="Administrator"/>
        <Row rolename="editor" description="Editor"/>
        <Row rolename="viewer" description="Viewer"/>
    </Data>

    <!-- User-role relationship data - using virtual column names -->
    <Data table="user_roles" dataExportStrategy="ALL_DATA">
        <Row username="alice" rolename="admin"/>
        <Row username="alice" rolename="editor"/>
        <Row username="bob" rolename="viewer"/>
    </Data>

</Justdb>
```

**Generated DDL** (virtual columns excluded):
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100)
);

CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rolename VARCHAR(50) NOT NULL,
    description VARCHAR(200)
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL
);
```

### 6.2 Category Hierarchy Relationship

```xml
<Table name="categories">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="category_name" type="VARCHAR(100)" nullable="false"/>
    <Column name="parent_id" type="BIGINT"/>

    <!-- Self-referencing virtual column -->
    <Column name="parent_name" virtual="true" from="categories.category_name" on="parent_id"/>
</Table>

<Data table="categories" dataExportStrategy="ALL_DATA">
    <Row category_name="Electronics"/>
    <Row category_name="Computers" parent_name="Electronics"/>
    <Row category_name="Laptops" parent_name="Computers"/>
</Data>
```

### 6.3 Simplified Format (Omit Table Name)

If foreign key constraints are defined, you can omit the table name in `from`:

```xml
<Table name="user_roles">
    <Column name="user_id" type="BIGINT" nullable="false"/>
    <Column name="role_id" type="BIGINT" nullable="false"/>

    <!-- Simplified format: from specifies field name only -->
    <Column name="username" virtual="true" from="username" on="user_id"/>
    <Column name="rolename" virtual="true" from="rolename" on="role_id"/>

    <!-- Foreign key constraints help infer target table -->
    <Constraint name="fk_user" type="FOREIGN_KEY" referencedTable="users" referencedColumn="id">
        user_id
    </Constraint>
    <Constraint name="fk_role" type="FOREIGN_KEY" referencedTable="roles" referencedColumn="id">
        role_id
    </Constraint>
</Table>
```

### 6.4 Multiple Virtual Columns

```xml
<Table name="user_roles">
    <Column name="user_id" type="BIGINT"/>
    <Column name="role_id" type="BIGINT"/>
    <Column name="username" virtual="true" from="users.username" on="user_id"/>
    <Column name="rolename" virtual="true" from="roles.rolename" on="role_id"/>
</Table>
```

### 6.5 Cascading References

```xml
<Table name="orders">
    <Column name="user_id" type="BIGINT"/>
    <Column name="username" virtual="true" from="users.username" on="user_id"/>
    <Column name="company_name" virtual="true" from="companies.name" on="user_id"/>
</Table>
```

### 6.6 Dual Storage

```xml
<Table name="user_roles">
    <!-- Both columns stored -->
    <Column name="user_id" type="BIGINT"/>
    <Column name="username" type="VARCHAR(50)" preferColumn="true" from="users.username" on="user_id"/>
</Table>

<Data table="user_roles">
    <!-- After insert, both columns have values -->
    <Row username="alice"/>
    <!-- Result: user_id=1, username='alice' -->
</Data>
```

---------------------------

## Appendix

### A. Design Advantages

1. **Unified Type System**: Virtual columns inherit from Column, no new type needed
2. **Clear Visibility**: See all columns directly in Table definition
3. **Clear Semantics**: `virtual="true"` explicitly marks virtual columns
4. **Automatic Filtering**: DDL generation automatically skips virtual columns
5. **Reusable**: Define once, use in all Data nodes

### B. Design Principles Followed

1. **No Hardcoded Dialects**: Use template system for DDL generation
2. **Backward Compatible**: Existing schemas require no changes
3. **Naming Convention**: Follow camelCase, SQL terminology
4. **Alias Support**: Use @JsonAlias for multiple naming formats

### C. Extensibility Considerations

1. **Composite Virtual Columns**: Support `from="table1.field1,table2.field2"`
2. **Virtual Computed Columns**: Support expressions `from="CONCAT(first_name, ' ', last_name)"`
3. **Caching Mechanism**: Cache common lookup results
4. **Batch Lookup**: Query multiple identifiers in one query

### D. Reference Links

- [Column Reference](../../reference/schema/column.md)
- [Cheatsheet: Virtual Column](../../cheatsheet/virtual-column.md)
- [Pre-Populated Data](../../reference/data/)
