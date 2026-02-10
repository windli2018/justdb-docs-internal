---
title: Schema System Overview
icon: database
order: 1
category: Design
tags:
  - schema
  - architecture
  - design
---

# Schema System Overview

## Document Overview

JustDB Schema is a declarative framework for describing database structures, supporting multiple database types (MySQL, PostgreSQL, Oracle, H2, etc.) and providing a unified DSL (Domain Specific Language) to define tables, views, indexes, constraints, and other database objects.

**Version**: 1.0
**Last Updated**: 2026-02-09
**Maintainer**: Wind Li

## Core Features

- **Database Agnostic**: Same Schema can generate DDL for multiple databases
- **Declarative Definition**: Describe "what" rather than "how"
- **Inheritance and Reuse**: Support `referenceId` for component reuse
- **Lifecycle Management**: Complete before/after hook support
- **Conditional Execution**: Database-specific conditional SQL execution
- **Evolution Tracking**: Built-in Schema change tracking mechanism

## Supported Database Objects

| Object Type | Description | Status |
|-------------|-------------|--------|
| Database | Database definition | ✓ |
| Table | Table definition | ✓ |
| Column | Column definition | ✓ |
| View | View definition | ✓ |
| Index | Index definition | ✓ |
| Constraint | Constraint definition | ✓ |
| Trigger | Trigger definition | ✓ |
| Sequence | Sequence definition | ✓ |
| Procedure | Stored procedure definition | ✓ |
| Query | Named query definition | ✓ |
| Data | Data export definition | ✓ |

## Design Philosophy

### Core Principles

#### 1. Simplicity
- Prefer the most concise expression
- Avoid redundant configuration options
- Provide reasonable defaults

#### 2. Consistency
- Unified naming conventions
- Unified type system
- Unified lifecycle hook naming

#### 3. Extensibility
- Support dynamic attributes via `UnknownValues` base class
- Support database-specific extensions via plugin system
- Open inheritance hierarchy

#### 4. Broad Compatibility
- Support multiple naming formats via `@JsonAlias`: backward compatible, AI compatible, human compatible
- Formats are doors to convenience, not limitations
- Provide smooth migration paths

## Type Hierarchy

```
Item (base item)
├── UnknownValues (dynamic extension mechanism)
├── SchemaSense (context holder)
├── QueryAble (lifecycle hooks)
│   ├── Table (table)
│   ├── View (view)
│   └── Query (query)
├── Column (column)
├── Index (index)
├── Constraint (constraint)
├── Trigger (trigger)
├── Sequence (sequence)
└── Procedure (stored procedure)

Justdb (Schema root node)
└── SchemaSense
```

## Schema Root Structure

```
Justdb (namespace)
├── Database[]        - Database definitions
├── Import[]          - Pre-imports
├── Property[]        - Schema properties
├── Column[]          - Global column definitions
├── Table[]           - Table definitions
├── View[]            - View definitions
├── Query[]           - Query definitions
├── Index[]           - Global index definitions
├── Constraint[]      - Global constraint definitions
├── Trigger[]         - Trigger definitions
├── Sequence[]        - Sequence definitions
├── Procedure[]       - Stored procedure definitions
├── Data[]            - Data export definitions
├── Include[]         - Post-imports
├── Report[]          - Migration reports
├── tableScopes       - Table scope filters
└── databaseScopes    - Database scope filters
```

## Core Subsystems

### 1. Type Hierarchy System

For detailed type hierarchy, see: [Type Hierarchy](./type-hierarchy.md)

### 2. Alias System

Support multiple naming format aliases while maintaining backward compatibility. See: [Alias System](./alias-system.md)

### 3. Schema Evolution

Schema evolution tracking via `referenceId` and `formerNames`. See: [Schema Evolution](./schema-evolution.md)

### 4. Extension Point System

Dynamic extensions via `UnknownValues` and plugin system. See: [Extension Point System](./extension-points.md)

### 5. Lifecycle Hooks

Complete DDL lifecycle hooks allowing custom SQL execution before/after operations.

| Hook | Execution Timing | Object Level |
|------|-----------------|--------------|
| `beforeCreates` | Before CREATE TABLE/VIEW/INDEX | Table/View/Index |
| `afterCreates` | After CREATE TABLE/VIEW/INDEX | Table/View/Index |
| `beforeDrops` | Before DROP TABLE/VIEW/INDEX | Table/View/Index |
| `afterDrops` | After DROP TABLE/VIEW/INDEX | Table/View/Index |
| `beforeAlters` | Before ALTER TABLE/VIEW/COLUMN | Table/View/Column |
| `afterAlters` | After ALTER TABLE/VIEW/COLUMN | Table/View/Column |
| `beforeAdds` | Before ADD COLUMN/INDEX/CONSTRAINT | Table/View |
| `afterAdds` | After ADD COLUMN/INDEX/CONSTRAINT | Table/View |

## Complete Schema Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="ecommerce-schema" namespace="com.example.ecommerce">

    <!-- Global column definitions -->
    <Column id="global_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column id="global_created_at" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
    <Column id="global_updated_at" name="updated_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>

    <!-- Users table -->
    <Table id="table_users" name="users" comment="Users table">
        <Column id="col_users_id" referenceId="global_id" name="id"/>
        <Column id="col_users_username" name="username" type="VARCHAR(50)" nullable="false"/>
        <Column id="col_users_email" name="email" type="VARCHAR(100)" nullable="false"/>
        <Column id="col_users_created_at" referenceId="global_created_at" name="created_at"/>
        <Column id="col_users_updated_at" referenceId="global_updated_at" name="updated_at"/>

        <!-- Unique indexes -->
        <Index id="idx_users_username" name="idx_users_username" unique="true" columns="username"/>
        <Index id="idx_users_email" name="idx_users_email" unique="true" columns="email"/>

        <!-- PostgreSQL-specific create index hook -->
        <afterCreates>
            <ConditionalSqlScript dbms="postgresql">
                CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);
            </ConditionalSqlScript>
        </afterCreates>
    </Table>

    <!-- Orders table -->
    <Table id="table_orders" name="orders" comment="Orders table">
        <Column id="col_orders_id" referenceId="global_id" name="id"/>
        <Column id="col_orders_user_id" name="user_id" type="BIGINT" nullable="false"/>
        <Column id="col_orders_status" name="status" type="VARCHAR(20)" defaultValue="'pending'"/>
        <Column id="col_orders_total_amount" name="total_amount" type="DECIMAL(10,2)" defaultValue="0.00"/>
        <Column id="col_orders_created_at" referenceId="global_created_at" name="created_at"/>
        <Column id="col_orders_updated_at" referenceId="global_updated_at" name="updated_at"/>

        <!-- Foreign key constraint -->
        <Constraint id="fk_orders_user_id" name="fk_orders_user_id" type="FOREIGN_KEY"
                    referencedTable="users" referencedColumn="id">
            user_id
        </Constraint>

        <!-- Status index -->
        <Index id="idx_orders_status" name="idx_orders_status" columns="status"/>
    </Table>

    <!-- Data export definition -->
    <Data id="data_users" name="users" table="users" dataExportStrategy="PARTIAL_DATA"
          maxExportRecords="1000" exportOrderField="created_at" exportOrderAsc="false">
        <dataFilterCondition>status = 'active'</dataFilterCondition>
    </Data>

    <!-- Table scope filters -->
    <tableScopes>
        <includes>users*, orders*</includes>
        <excludes>*_temp, *_bak</excludes>
    </tableScopes>

</Justdb>
```

## Related Documents

- [Type Hierarchy](./type-hierarchy.md) - Detailed type hierarchy description
- [Alias System](./alias-system.md) - Field naming and alias support
- [Schema Evolution](./schema-evolution.md) - Schema change tracking mechanism
- [Extension Point System](./extension-points.md) - Dynamic extension mechanism
- [Template System Design](../template-system/overview.md) - SQL generation template system
