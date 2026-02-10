---
title: Reference System Design
icon: link
---

# Reference System Design

**Version**: 1.0
**Date**: 2026-02-10
**Author**: JustDB Team
**Status**: Implemented

---------------------------

## Table of Contents

1. [Overview](#1-overview)
2. [Core Concepts](#2-core-concepts)
3. [Reference Syntax](#3-reference-syntax)
4. [Attribute Merge Rules](#4-attribute-merge-rules)
5. [Scope Rules](#5-scope-rules)
6. [Use Cases](#6-use-cases)
7. [Best Practices](#7-best-practices)

---------------------------

## 1. Overview

### 1.1 Design Goals

The Reference System allows defining reusable components in Schema, implementing component inheritance and reuse through `referenceId`.

**Problems solved**:
1. Eliminate duplicate definitions (e.g., every table defining id column)
2. Unify standard column definitions (e.g., consistent timestamp column format)
3. Support component inheritance and override
4. Improve Schema maintainability

### 1.2 Basic Example

```xml
<!-- Define reusable column templates -->
<Column id="global_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
<Column id="global_timestamp" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>

<!-- Reference global columns -->
<Table name="users">
    <Column referenceId="global_id" name="id"/>
    <Column name="username" type="VARCHAR(50)"/>
    <Column referenceId="global_timestamp" name="created_at"/>
</Table>
```

---------------------------

## 2. Core Concepts

### 2.1 Reference Types

| Type | Description | Example |
|------|-------------|---------|
| **Column Reference** | Reuse column definitions | `<Column referenceId="global_id"/>` |
| **Constraint Reference** | Reuse constraint definitions | `<Constraint referenceId="fk_user"/>` |
| **Index Reference** | Reuse index definitions | `<Index referenceId="idx_created"/>` |
| **Table Fragment Reference** | Reuse column groups from tables | `<Column referenceId="audit_columns.created_at"/>` |

### 2.2 Supported Elements

All Schema elements with `id` attribute support references:

```xml
<!-- Column reference -->
<Column id="pk_id" name="id" type="BIGINT" primaryKey="true"/>
<Column referenceId="pk_id"/>

<!-- Constraint reference -->
<Constraint id="fk_user" type="FOREIGN_KEY">
    <referencedTable>users</referencedTable>
</Constraint>
<Constraint referenceId="fk_user"/>

<!-- Index reference -->
<Index id="idx_created" name="idx_created_at">
    <column>created_at</column>
</Index>
<Index referenceId="idx_created"/>
```

### 2.3 Definition Locations

#### Global Definition

```xml
<Justdb>
    <!-- Global definition, all tables can reference -->
    <Column id="global_pk" name="id" type="BIGINT" primaryKey="true"/>

    <Table name="users">
        <Column referenceId="global_pk"/>
    </Table>

    <Table name="orders">
        <Column referenceId="global_pk"/>
    </Table>
</Justdb>
```

#### Local Definition

```xml
<Table name="users">
    <!-- Only visible within users table -->
    <Column id="local_col" name="status" type="VARCHAR(20)"/>
    <Column referenceId="local_col" name="user_status"/>
</Table>
```

---------------------------

## 3. Reference Syntax

### 3.1 Basic Reference

```xml
<!-- Full reference -->
<Column referenceId="global_id"/>

<!-- Override name -->
<Column referenceId="global_id" name="user_id"/>

<!-- Override multiple attributes -->
<Column referenceId="global_id" name="user_id" autoIncrement="false"/>
```

### 3.2 Namespace Reference

#### Dot Notation

```xml
<!-- Use dot notation to reference namespaced elements -->
<Column referenceId="common.pk_id"/>
<Column referenceId="common.ts_created"/>

<!-- Reference columns in abstract table -->
<Column referenceId="audit_columns.created_at"/>
<Column referenceId="audit_columns.updated_at"/>
```

#### XML Namespace

```xml
<!-- Use xmlns prefix -->
<Column referenceId="pk_id" xmlns="common"/>
```

### 3.3 Table Fragment Reference

Reference columns from abstract tables:

```xml
<!-- Define audit column group (abstract table doesn't generate DDL) -->
<Table id="audit_columns" abstract="true">
    <Column name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
    <Column name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"/>
    <Column name="created_by" type="BIGINT"/>
    <Column name="updated_by" type="BIGINT"/>
</Table>

<!-- Reference audit columns -->
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>
    <!-- Include audit columns -->
    <Column referenceId="audit_columns.created_at"/>
    <Column referenceId="audit_columns.updated_at"/>
</Table>
```

---------------------------

## 4. Attribute Merge Rules

### 4.1 Merge Priority

| Reference Attribute | Local Attribute | Merge Result |
|---------------------|----------------|--------------|
| Not set | Not set | Use reference definition |
| Not set | Set | **Use local attribute** |
| Set | Not set | Use reference attribute |
| Set | Set | **Use local attribute** |

**Rule**: Local attributes have higher priority

### 4.2 Column Reference Example

```xml
<!-- Definition -->
<Column id="username" name="username" type="VARCHAR(50)" nullable="false" comment="User login name"/>

<!-- Full reference -->
<Column referenceId="username"/>
<!-- Result: name=username, type=VARCHAR(50), nullable=false, comment="User login name" -->

<!-- Override name -->
<Column referenceId="username" name="login_name"/>
<!-- Result: name=login_name, type=VARCHAR(50), nullable=false, comment="User login name" -->

<!-- Override type -->
<Column referenceId="username" type="VARCHAR(100)"/>
<!-- Result: name=username, type=VARCHAR(100), nullable=false, comment="User login name" -->

<!-- Override multiple attributes -->
<Column referenceId="username" name="email" type="VARCHAR(255)" comment="Email address"/>
<!-- Result: name=email, type=VARCHAR(255), nullable=false, comment="Email address" -->
```

### 4.3 Constraint Reference Example

```xml
<!-- Definition -->
<Constraint id="fk_user" type="FOREIGN_KEY">
    <referencedTable>users</referencedTable>
    <referencedColumn>id</referencedColumn>
    <onDelete>CASCADE</onDelete>
</Constraint>

<!-- Reference and specify column -->
<Constraint referenceId="fk_user">
    <column>created_by</column>
</Constraint>

<!-- Override reference behavior -->
<Constraint referenceId="fk_user">
    <column>updated_by</column>
    <onDelete>SET NULL</onDelete>
</Constraint>
```

---------------------------

## 5. Scope Rules

### 5.1 Scope Types

#### Global Scope

```xml
<Justdb>
    <!-- Global definition, all tables can reference -->
    <Column id="global_pk" name="id" type="BIGINT" primaryKey="true"/>

    <Table name="users">
        <Column referenceId="global_pk"/>
    </Table>

    <Table name="orders">
        <Column referenceId="global_pk"/>
    </Table>
</Justdb>
```

#### Table Scope

```xml
<Justdb>
    <Table name="users">
        <!-- Only visible within users table -->
        <Column id="local_col" name="status" type="VARCHAR(20)"/>
        <Column referenceId="local_col" name="user_status"/>
    </Table>

    <Table name="orders">
        <!-- Error: cannot reference local_col from users table -->
        <Column referenceId="local_col"/>  <!-- Error: reference not found -->
    </Table>
</Justdb>
```

### 5.2 Reference Resolution Order

1. **Search in current table**: First look in current table's definitions
2. **Global search**: If not found in current table, search in global definitions
3. **Namespace search**: When using dot notation, search in specified namespace

```xml
<Justdb>
    <Column id="global_id" name="id" type="BIGINT"/>

    <Table name="users">
        <Column id="local_id" name="id" type="CHAR(36)"/>
        <!-- Reference current table's definition -->
        <Column referenceId="local_id"/>  <!-- Uses CHAR(36) -->
    </Table>

    <Table name="orders">
        <!-- Reference global definition -->
        <Column referenceId="global_id"/>  <!-- Uses BIGINT -->
    </Table>
</Justdb>
```

### 5.3 Circular Reference Detection

JustDB automatically detects circular references and reports errors:

```xml
<!-- ❌ Error: circular reference -->
<Column id="a" referenceId="b"/>
<Column id="b" referenceId="a"/>
<!-- Error: Circular reference detected -->

<!-- ✅ Correct: no circular reference -->
<Column id="base" name="id" type="BIGINT"/>
<Column id="extended" referenceId="base" name="user_id"/>
```

---------------------------

## 6. Use Cases

### 6.1 Use Case 1: Primary Key Reuse

```xml
<!-- Define standard primary keys -->
<Column id="pk_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
<Column id="pk_uuid" name="id" type="CHAR(36)" primaryKey="true"/>

<!-- Use auto-increment ID -->
<Table name="users">
    <Column referenceId="pk_id"/>
    <Column name="username" type="VARCHAR(50)"/>
</Table>

<!-- Use UUID -->
<Table name="products">
    <Column referenceId="pk_uuid"/>
    <Column name="name" type="VARCHAR(100)"/>
</Table>
```

### 6.2 Use Case 2: Timestamp Columns

```xml
<!-- Define standard timestamps -->
<Column id="ts_created" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
<Column id="ts_updated" name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"/>
<Column id="ts_deleted" name="deleted_at" type="TIMESTAMP"/>

<!-- Apply to all tables -->
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>
    <Column referenceId="ts_created"/>
    <Column referenceId="ts_updated"/>
    <Column referenceId="ts_deleted"/>
</Table>
```

### 6.3 Use Case 3: Constraint Templates

```xml
<!-- Define standard constraints -->
<Constraint id="fk_user" type="FOREIGN_KEY">
    <referencedTable>users</referencedTable>
    <referencedColumn>id</referencedColumn>
    <onDelete>CASCADE</onDelete>
</Constraint>

<Constraint id="uk_email" type="UNIQUE">
    <column>email</column>
</Constraint>

<!-- Use constraint templates -->
<Table name="orders">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="user_id" type="BIGINT"/>
    <Column name="email" type="VARCHAR(100)"/>

    <Constraint referenceId="fk_user">
        <column>user_id</column>
    </Constraint>
    <Constraint referenceId="uk_email"/>
</Table>
```

### 6.4 Use Case 4: Index Templates

```xml
<!-- Define standard indexes -->
<Index id="idx_created" name="idx_created_at">
    <column>created_at</column>
</Index>

<Index id="idx_search" name="idx_search">
    <column>name</column>
    <column>status</column>
</Index>

<!-- Use index templates -->
<Table name="products">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="name" type="VARCHAR(100)"/>
    <Column name="status" type="VARCHAR(20)"/>
    <Column name="created_at" type="TIMESTAMP"/>

    <Index referenceId="idx_created"/>
    <Index referenceId="idx_search"/>
</Table>
```

### 6.5 Use Case 5: Layered Definitions

```xml
<!-- Layer 1: Base types -->
<Column id="base.int" type="INT"/>
<Column id="base.varchar50" type="VARCHAR(50)"/>
<Column id="base.timestamp" type="TIMESTAMP"/>

<!-- Layer 2: Business columns -->
<Column id="common.username" referenceId="base.varchar50" nullable="false"/>
<Column id="common.email" referenceId="base.varchar50"/>
<Column id="common.created_at" referenceId="base.timestamp" defaultValue="CURRENT_TIMESTAMP"/>

<!-- Layer 3: Table-specific -->
<Column id="users.username" referenceId="common.username"/>

<!-- Use -->
<Table name="users">
    <Column referenceId="users.username"/>
</Table>
```

---------------------------

## 7. Best Practices

### 7.1 Naming Conventions

#### Use Prefixes to Distinguish Types

```xml
<!-- Recommended naming prefixes -->
<Column id="pk_id"/>           <!-- Primary Key -->
<Column id="fk_user"/>         <!-- Foreign Key -->
<Column id="uk_email"/>        <!-- Unique Key -->
<Column id="idx_created"/>     <!-- Index -->
<Column id="chk_status"/>      <!-- Check -->
```

#### Use Module Prefixes

```xml
<!-- Modular naming -->
<Column id="auth.username"/>        <!-- Auth module -->
<Column id="common.created_at"/>    <!-- Common module -->
<Column id="user.profile_picture"/> <!-- User module -->
```

### 7.2 Organization Structure

#### Group by Purpose

```xml
<Justdb>
    <!-- Group 1: Base types -->
    <Column id="type.int" type="INT"/>
    <Column id="type.varchar50" type="VARCHAR(50)"/>
    <Column id="type.timestamp" type="TIMESTAMP"/>

    <!-- Group 2: Standard columns -->
    <Column id="std.id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column id="std.created_at" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
    <Column id="std.updated_at" name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"/>

    <!-- Group 3: Business columns -->
    <Column id="biz.username" name="username" type="VARCHAR(50)" nullable="false"/>
    <Column id="biz.email" name="email" type="VARCHAR(100)"/>
</Justdb>
```

#### Use Abstract Tables to Organize Related Columns

```xml
<!-- Define abstract table (doesn't generate DDL) -->
<Table id="audit_table" abstract="true">
    <Column name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
    <Column name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"/>
    <Column name="created_by" type="BIGINT"/>
    <Column name="updated_by" type="BIGINT"/>
</Table>

<!-- Extend abstract table -->
<Table name="users" extends="audit_table">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>
</Table>
```

### 7.3 Avoid Excessive Nesting

```xml
<!-- ❌ Not recommended: too deep reference chain -->
<Column id="a" name="id" type="BIGINT"/>
<Column id="b" referenceId="a"/>
<Column id="c" referenceId="b"/>
<Column id="d" referenceId="c"/>
<Column referenceId="d"/>  <!-- Hard to trace -->

<!-- ✅ Recommended: max 3 levels -->
<Column id="base_id" name="id" type="BIGINT"/>
<Column id="user_id" referenceId="base_id" name="user_id"/>
<Column referenceId="user_id"/>
```

### 7.4 Document References

```xml
<!-- Add comments for common references -->
<!--
  Standard primary key column definitions
-->
<Column id="pk.auto_int_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"
        comment="Auto-increment ID"/>
<Column id="pk.uuid_id" name="id" type="CHAR(36)" primaryKey="true"
        comment="UUID primary key"/>

<!--
  Audit columns for tracking record changes
-->
<Column id="audit.created_at" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"
        comment="Record creation time"/>
<Column id="audit.updated_at" name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"
        comment="Record update time"/>
```

---------------------------

## Appendix

### A. Reference System Advantages

1. **Eliminate Duplication**: Define once, use multiple times
2. **Unified Standards**: Ensure column definition consistency
3. **Easy Maintenance**: Modify definition, automatically affect all references
4. **Flexibility**: Support attribute override
5. **Type Safety**: Validate reference validity at compile time

### B. Design Principles

1. **DRY Principle**: Don't Repeat Yourself
2. **Single Responsibility**: Each reference definition handles one component
3. **Clear Naming**: Use descriptive id names
4. **Moderate Abstraction**: Avoid over-abstraction that makes things hard to understand

### C. Comparison with Other Features

| Feature | Reference System | Abstract Table Inheritance | Template System |
|---------|-----------------|---------------------------|-----------------|
| Scope | Element-level | Table-level | SQL-level |
| Reuse Granularity | Single element | Multiple elements | SQL fragments |
| Override Support | ✓ | ✓ | ✓ |
| Namespace | ✓ | ✗ | ✗ |

### D. Reference Links

- [Cheatsheet: Reference System](../../cheatsheet/reference-system.md)
- [Column Reference](../../reference/schema/column.md)
- [Schema Definition](../../reference/schema/)
