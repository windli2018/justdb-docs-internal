---
icon: table
title: Schema Reference
order: 1
---

# Schema Reference

Complete reference for JustDB schema definitions.

## Overview

JustDB schemas define database structure in a declarative format. The same schema can be deployed to multiple databases.

## Schema Object

The root object containing all schema definitions.

```yaml
namespace: com.example       # Java package namespace
description: My Application  # Optional description
Table: [...]                  # Tables
View: [...]                  # Views
Sequence: [...]              # Sequences
```

## Table

Defines a database table.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | String | No | Unique identifier for reference |
| `name` | String | Yes | Table name |
| `comment` | String | No | Table comment |
| `Column` | Array | Yes | Column definitions |
| `Index` | Array | No | Index definitions |
| `Constraint` | Array | No | Constraint definitions |
| `formerNames` | Array | No | Previous table names |
| `beforeCreates` | Array | No | SQL to execute before CREATE |
| `afterCreates` | Array | No | SQL to execute after CREATE |
| `beforeDrops` | Array | No | SQL to execute before DROP |
| `afterDrops` | Array | No | SQL to execute after DROP |
| `beforeAlters` | Array | No | SQL to execute before ALTER |
| `afterAlters` | Array | No | SQL to execute after ALTER |

### Example

```yaml
Table:
  - id: users_table
    name: users
    comment: User accounts
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
        comment: Primary key
    Index:
      - name: idx_username
        columns: [username]
        unique: true
```

## Column

Defines a table column.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | Column name |
| `type` | String | Yes | Data type |
| `nullable` | Boolean | No | Allows NULL (default: true) |
| `primaryKey` | Boolean | No | Is primary key |
| `autoIncrement` | Boolean | No | Auto-increment |
| `unique` | Boolean | No | Unique constraint |
| `defaultValue` | String | No | Default value |
| `defaultValueComputed` | String | No | Computed default (e.g., CURRENT_TIMESTAMP) |
| `comment` | String | No | Column comment |
| `formerNames` | Array | No | Previous column names |
| `onDelete` | String | No | ON DELETE action (for foreign keys) |
| `onUpdate` | String | No | ON UPDATE action |
| `referencedTable` | String | No | Referenced table (foreign key) |
| `referencedColumn` | String | No | Referenced column (foreign key) |

### Data Types

Common types (database-specific variations exist):

| Type | Description |
|------|-------------|
| `BIGINT` | 64-bit integer |
| `INTEGER` | 32-bit integer |
| `SMALLINT` | 16-bit integer |
| `TINYINT` | 8-bit integer |
| `DECIMAL(p,s)` | Fixed-point decimal |
| `VARCHAR(n)` | Variable-length string |
| `CHAR(n)` | Fixed-length string |
| `TEXT` | Long text |
| `CLOB` | Character large object |
| `BLOB` | Binary large object |
| `BOOLEAN` | True/false |
| `DATE` | Date (year, month, day) |
| `TIMESTAMP` | Date and time |
| `BINARY` | Binary data |

### Example

```yaml
Column:
  - name: email
    type: VARCHAR(255)
    nullable: false
    unique: true
    comment: User email address

  - name: created_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP

  - name: balance
    type: DECIMAL(10,2)
    defaultValue: "0.00"
```

## Index

Defines a table index.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | Index name |
| `columns` | Array | Yes | Indexed columns |
| `unique` | Boolean | No | Unique index |
| `type` | String | No | Index type (BTREE, HASH, etc.) |
| `comment` | String | No | Index comment |

### Example

```yaml
Index:
  - name: idx_email
    columns: [email]
    unique: true
    type: BTREE
    comment: Unique email index

  - name: idx_name_email
    columns: [last_name, first_name]
```

## Constraint

Defines a table constraint.

### Types

- `PRIMARY_KEY` - Primary key constraint
- `FOREIGN_KEY` - Foreign key constraint
- `UNIQUE` - Unique constraint
- `CHECK` - Check constraint

### Foreign Key Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | Constraint name |
| `type` | String | Yes | Constraint type (FOREIGN_KEY) |
| `referencedTable` | String | Yes | Referenced table |
| `referencedColumn` | String | Yes | Referenced column |
| `foreignKey` | String | Yes | Local column |
| `onDelete` | String | No | ON DELETE action |
| `onUpdate` | String | No | ON UPDATE action |

### Actions

- `CASCADE` - Propagate changes
- `SET NULL` - Set to NULL
- `SET DEFAULT` - Set to default value
- `RESTRICT` - Prevent action
- `NO ACTION` - No action (default)

### Example

```yaml
Constraint:
  - name: fk_order_user
    type: FOREIGN_KEY
    foreignKey: user_id
    referencedTable: users
    referencedColumn: id
    onDelete: CASCADE
    onUpdate: RESTRICT
```

## View

Defines a database view.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | View name |
| `query` | String | Yes | SELECT statement |
| `comment` | String | No | View comment |

### Example

```yaml
View:
  - name: active_users
    query: |
      SELECT id, username, email
      FROM users
      WHERE status = 'active'
    comment: Active user accounts
```

## Sequence

Defines a database sequence (PostgreSQL, Oracle).

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | Sequence name |
| `startWith` | Long | No | Starting value |
| `incrementBy` | Long | No | Increment amount |
| `minValue` | Long | No | Minimum value |
| `maxValue` | Long | No | Maximum value |
| `cycle` | Boolean | No | Cycle when max/min reached |

### Example

```yaml
Sequence:
  - name: user_id_seq
    startWith: 1000
    incrementBy: 1
    minValue: 1000
    maxValue: 999999999
    cycle: false
```

## Schema Evolution

### Renaming Objects

Use `formerNames` to track renames:

```yaml
Table:
  - name: users
    formerNames: [user]  # Renamed from 'user' to 'users'
```

JustDB generates:
```sql
ALTER TABLE user RENAME TO users;
```

### Column Aliases

Support multiple input naming conventions:

```yaml
Column:
  # All these work when loading:
  - name: userId        # Canonical (camelCase)
  - name: user_id       # Snake case (via alias)
  - name: user-id       # Kebab case (via alias)
```

## Next Steps

- **[Getting Started](/getting-started/)** - Quick start guide
- **[Migration](/reference/migration/)** - Schema migration
- **[Formats](/reference/formats/)** - Supported formats
