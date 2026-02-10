---
icon: file-code
title: Schema Definition Details
order: 6
---

# Schema Definition Details

Deep dive into JustDB's schema definition syntax and features.

## Overview

JustDB Schema is a declarative database structure definition language supporting multiple formats (XML, JSON, YAML, TOML, Properties).

## Basic Structure

### Schema Root Element

```yaml
id: definition-example-en                    # Schema unique identifier
namespace: com.example       # Java namespace (optional)
version: 1.0.0              # Version number (optional)
```

### XML Format

```xml
<Justdb id="myapp" namespace="com.example" version="1.0.0">
  <!-- Table definitions -->
</Justdb>
```

### JSON Format

```json
{
  "id": "myapp",
  "namespace": "com.example",
  "version": "1.0.0"
}
```

## Table Definition

### Basic Syntax

```yaml
Table:
  - name: users
    comment: Users table
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
      - name: username
        type: VARCHAR(50)
        nullable: false
        comment: Username
```

### Table Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | String | Table name (required) |
| `comment` | String | Table comment |
| `formerNames` | List | List of former names for rename detection |
| `engine` | String | Storage engine (MySQL) |
| `charset` | String | Character set |
| `collation` | String | Collation |

### XML Format Table Definition

```xml
<Table name="users" comment="Users table">
  <Column name="id" type="BIGINT" primaryKey="true"/>
  <Column name="username" type="VARCHAR(50)" nullable="false"/>
</Table>
```

## Column Definition

### Basic Syntax

```yaml
Column:
  - name: id
    type: BIGINT
    primaryKey: true
    autoIncrement: true
    comment: Primary key ID
```

### Column Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | String | Column name (required) |
| `type` | String | Data type (required) |
| `nullable` | Boolean | Whether nullable |
| `defaultValue` | String | Default value |
| `primaryKey` | Boolean | Whether primary key |
| `autoIncrement` | Boolean | Whether auto-increment |
| `unique` | Boolean | Whether unique |
| `comment` | String | Column comment |
| `formerNames` | List | List of former names |

### Data Types

JustDB supports standard SQL data types, automatically converting for target databases:

| Type | Description |
|------|-------------|
| `BIGINT` | 64-bit integer |
| `INTEGER` / `INT` | 32-bit integer |
| `SMALLINT` | 16-bit integer |
| `TINYINT` | 8-bit integer |
| `VARCHAR(n)` | Variable-length string |
| `CHAR(n)` | Fixed-length string |
| `TEXT` | Long text |
| `DECIMAL(p,s)` | Exact numeric |
| `DATE` | Date |
| `DATETIME` / `TIMESTAMP` | Date-time |
| `BOOLEAN` / `BOOL` | Boolean value |

## Index Definition

### Basic Syntax

```yaml
Index:
  - name: idx_username
    columns: [username]
    unique: true
    comment: Unique index on username
```

### Index Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | String | Index name (required) |
| `columns` | List | Index columns (required) |
| `unique` | Boolean | Whether unique index |
| `type` | String | Index type (BTREE, HASH) |
| `comment` | String | Index comment |

### Composite Index

```yaml
Index:
  - name: idx_user_email
    columns: [user_id, email]
    unique: true
```

## Constraint Definition

### Primary Key Constraint

```yaml
Column:
  - name: id
    type: BIGINT
    primaryKey: true
```

### Foreign Key Constraint

```yaml
Constraint:
  - name: fk_orders_user
    type: FOREIGN_KEY
    foreignKey: user_id
    referencedTable: users
    referencedColumn: id
    onDelete: CASCADE
    onUpdate: RESTRICT
```

### Unique Constraint

```yaml
Constraint:
  - name: uk_email
    type: UNIQUE
    columns: [email]
```

### Check Constraint

```yaml
Constraint:
  - name: ck_age
    type: CHECK
    check: "age >= 18"
```

## View Definition

### Basic Syntax

```yaml
View:
  - name: user_orders
    comment: User orders view
    query: |
      SELECT u.username, o.order_date, o.total
      FROM users u
      JOIN orders o ON u.id = o.user_id
```

### View Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | String | View name (required) |
| `query` | String | SQL query (required) |
| `comment` | String | View comment |

## Sequence Definition

```yaml
Sequence:
  - name: seq_user_id
    startWith: 1000
    incrementBy: 1
    minValue: 1000
    maxValue: 999999
    cache: 20
```

## Trigger Definition

```yaml
Trigger:
  - name: trg_update_timestamp
    table: users
    timing: BEFORE
    event: UPDATE
    body: |
      NEW.updated_at = CURRENT_TIMESTAMP
```

## Reference System

### Reference Global Columns

```yaml
# Define global columns
Column:
  - id: global_id
    name: id
    type: BIGINT
    primaryKey: true
    autoIncrement: true

# Reference in tables
Table:
  - name: users
    Column:
      - referenceId: global_id
      - name: name  # Optional: override name
```

### Reference Global Tables

```yaml
# Define global table
Table:
  - id: base_user_table
    name: users
    Column: [...]

# Extend table
Table:
  - id: user_profile
    referenceId: base_user_table
    Column:
      - name: avatar_url
        type: VARCHAR(255)
```

## Lifecycle Hooks

### Define in Schema

```yaml
Table:
  - name: users
    beforeCreates:
      - sql: |
          CREATE TABLE audit_log (
            action VARCHAR(50),
            timestamp TIMESTAMP
          );
    afterCreates:
      - dbms: mysql
        sql: |
          ALTER TABLE users AUTO_INCREMENT = 1000
```

### Hook Types

| Hook | Description |
|------|-------------|
| `beforeCreates` | Execute before creation |
| `afterCreates` | Execute after creation |
| `beforeAlters` | Execute before alteration |
| `afterAlters` | Execute after alteration |
| `beforeDrops` | Execute before drop |
| `afterDrops` | Execute after drop |

## Conditional Execution

### Database-Specific Code

```yaml
afterCreates:
  - dbms: mysql
    sql: |
      ALTER TABLE users ENGINE=InnoDB
  - dbms: postgresql
    sql: |
      CREATE INDEX CONCURRENTLY idx_username ON users(username)
```

### Schema State Conditions

```yaml
afterAlters:
  - condition: "{{oldValue.size < newValue.size}}"
    sql: |
      -- Expansion operation
      ALTER TABLE [...] ALLOCATE EXTRA STORAGE
```

## Multi-File Schema

### Main File

```yaml
# schema.yaml
id: definition-example-en
includes:
  - path: tables/users.yaml
  - path: tables/orders.yaml
```

### Included Files

```yaml
# tables/users.yaml
Table:
  - name: users
    Column: [...]
```

### Absolute Path Reference

```yaml
includes:
  - path: /opt/schema/common-tables.yaml
```

### URL Reference

```yaml
includes:
  - url: https://example.com/schemas/common.yaml
```

## Comments and Documentation

### Single-Line Comments

```yaml
# This is a comment
Table:
  - name: users
```

### Multi-Line Comments (XML)

```xml
<!--
  Users table definition
  Contains basic user information
-->
<Table name="users">
  ...
</Table>
```

## Best Practices

### 1. Naming Conventions

```yaml
# Table names: lowercase, underscore separated
Table:
  - name: user_profiles  # Recommended
  - name: UserProfiles   # Avoid

# Column names: lowercase, underscore separated
Column:
  - name: created_at  # Recommended
  - name: createdAt   # Avoid

# Index names: idx_ prefix
Index:
  - name: idx_username  # Recommended

# Constraint names: descriptive prefix
Constraint:
  - name: fk_orders_user    # Foreign key
  - name: uk_email           # Unique
  - name: ck_age_positive    # Check
```

### 2. Use Comments

```yaml
Table:
  - name: users
    comment: User information table  # Always add comments
    Column:
      - name: status
        type: VARCHAR(20)
        comment: User status: active, inactive, suspended  # Document enum values
```

### 3. Modularization

```yaml
# Main file only contains structure
id: definition-example-en
includes:
  - tables/*.yaml
  - views/*.yaml
  - constraints/*.yaml
```

### 4. Track Changes with formerNames

```yaml
Table:
  - name: users
    formerNames: [user]  # Record renames
```

## Complete Example

```yaml
---
id: definition-example-en
version: 1.0.0
namespace: com.example

# Global column definitions
Column:
  - id: global_id
    name: id
    type: BIGINT
    primaryKey: true
    autoIncrement: true
    comment: Primary key ID

  - id: global_timestamps
    Column:
      - name: created_at
        type: TIMESTAMP
        defaultValue: CURRENT_TIMESTAMP
      - name: updated_at
        type: TIMESTAMP

# Table definitions
Table:
  - name: users
    comment: Users table
    Column:
      - referenceId: global_id
      - name: username
        type: VARCHAR(50)
        nullable: false
        unique: true
      - referenceId: global_timestamps

    Index:
      - name: idx_username
        columns: [username]

    Constraint:
      - name: uk_username
        type: UNIQUE
        columns: [username]

  - name: orders
    comment: Orders table
    formerNames: [order]
    Column:
      - referenceId: global_id
      - name: user_id
        type: BIGINT
        nullable: false
      - name: total_amount
        type: DECIMAL(10,2)
        defaultValue: "0.00"

    Constraint:
      - name: fk_orders_user
        type: FOREIGN_KEY
        foreignKey: user_id
        referencedTable: users
        referencedColumn: id
        onDelete: CASCADE
```

## Related Documents

- **[Schema Structure Design](/reference/schema/)** - Schema structure detailed reference
- **[Template System](/design/template-system/)** - SQL generation templates
- **[Migration Basics](/getting-started/migration-basics.html)** - Migration mechanism
