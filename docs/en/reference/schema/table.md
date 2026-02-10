---
icon: table
title: Table Definition
order: 2
category:
  - Reference
  - Schema Definition
tag:
  - table
  - schema
---

# Table Definition

Table is the core object in a database, used for storing and managing data. JustDB's table definition supports rich attribute configuration, inheritance mechanisms, and lifecycle hooks.

## Basic Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | String | No | Unique identifier for reference |
| `name` | String | Yes | Table name |
| `referenceId` | String | No | Reference to another table's id |
| `formerNames` | List<String> | No | List of former names for rename tracking |
| `comment` | String | No | Database comment (written to database) |
| `remark` | String | No | JustDB remark (not written to database) |
| `author` | String | No | Author information |
| `version` | String | No | Version information |
| `dbms` | List<String> | No | Applicable database list |

## Basic Examples

### Simple Table Definition

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

      - name: email
        type: VARCHAR(100)
        comment: Email
```

### Using referenceId to Reuse Table Definition

```yaml
# Base table template
Table:
  - id: base_table
    name: base
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: created_at
        type: TIMESTAMP
        defaultValueComputed: CURRENT_TIMESTAMP

# Inherit from base table
  - name: users
    referenceId: base_table  # Inherit base table definition
    Column:
      - name: username
        type: VARCHAR(50)
```

## Child Objects

### Column

Define table column structure. See [Column Definition](./column.md).

```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
```

### Index

Define table indexes. See [Index Definition](https://justdb.org/reference/schema/index-def.md).

```yaml
Table:
  - name: users
    Index:
      - name: idx_users_email
        columns: [email]
        unique: true
```

### Constraint

Define table constraints. See [Constraint Definition](./constraint.md).

```yaml
Table:
  - name: orders
    Constraint:
      - name: fk_orders_user_id
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [user_id]
```

### Sequence

Associate sequence objects.

```yaml
Table:
  - name: users
    sequences: [seq_user_id]
    Column:
      - name: id
        type: BIGINT
        sequence: seq_user_id
```

## Lifecycle Hooks

Tables support complete lifecycle hooks, allowing custom SQL execution before and after DDL operations.

### beforeCreates / afterCreates

Execute SQL before and after table creation.

```yaml
Table:
  - name: users
    beforeCreates:
      - content: |
          -- Execute before creating table
          CREATE TABLE IF NOT EXISTS users_backup LIKE users;

    afterCreates:
      - dbms: postgresql
        content: |
          -- PostgreSQL specific
          CREATE INDEX CONCURRENTLY idx_users_created_at
          ON users(created_at);

      - dbms: mysql
        content: |
          -- MySQL specific
          CREATE INDEX idx_users_created_at
          ON users(created_at);
```

### beforeDrops / afterDrops

Execute SQL before and after dropping tables.

```yaml
Table:
  - name: users
    beforeDrops:
      - content: |
          -- Backup before drop
          CREATE TABLE users_backup AS SELECT * FROM users;

    afterDrops:
      - content: |
          -- Cleanup after drop
          DROP TABLE IF EXISTS users_backup;
```

### beforeAlters / afterAlters

Execute SQL before and after altering tables.

```yaml
Table:
  - name: users
    beforeAlters:
      - content: |
          -- Lock table before alter
          LOCK TABLES users WRITE;

    afterAlters:
      - content: |
          -- Unlock after alter
          UNLOCK TABLES;
```

### beforeAdds / afterAdds

Execute SQL before and after adding child objects (columns, indexes, etc.).

```yaml
Table:
  - name: users
    afterAdds:
      - content: |
          -- Update data after adding column
          UPDATE users SET status = 'active' WHERE status IS NULL;
```

## Performance Optimization Properties

JustDB supports performance-related metadata for tables:

```yaml
Table:
  - name: users
    expectedRecordCount: 1000000
    expectedGrowthRate: 10000
    expectedRecordSize: 512
    isPrimaryQueryTable: true
    queryFrequencyLevel: 5
```

| Property | Type | Description |
|----------|------|-------------|
| `expectedRecordCount` | Long | Expected record count |
| `expectedGrowthRate` | Long | Expected growth rate (records/month) |
| `expectedRecordSize` | Integer | Expected record size (bytes) |
| `isPrimaryQueryTable` | Boolean | Whether primary query table |
| `queryFrequencyLevel` | Integer | Query frequency level (1-5) |
| `indexStrategy` | String | Recommended index strategy |
| `partitionStrategy` | String | Recommended sharding strategy |

## Inheritance Configuration

Tables support inheritance mechanism, allowing inheritance of column and index definitions from other tables.

### Using Inheritance

```yaml
Table:
  - id: base_entity
    name: base
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: created_at
        type: TIMESTAMP
      - name: updated_at
        type: TIMESTAMP

  - name: users
    inheritance:
      extends: base_entity
    Column:
      - name: username
        type: VARCHAR(50)
```

## Sharding Configuration

### Using Sharding

```yaml
Table:
  - name: orders
    sharding:
      strategy: HASH
      shardingKey: user_id
      shardingCount: 16
```

## Table Scope Filtering

Use `tableScopes` to filter tables to operate on:

```yaml
# Define at Justdb root node
tableScopes:
  includes:
    - users*
    - orders*
  excludes:
    - *_temp
    - *_bak
```

## Database-Specific Configuration

Limit table's applicable databases using `dbms` attribute:

```yaml
Table:
  - name: users
    dbms: [mysql, postgresql]  # Only for MySQL and PostgreSQL
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```

## Complete Example

### E-commerce System Table Definition

```yaml
id: ecommerce
namespace: com.example.ecommerce

# Global column definitions
Column:
  - id: global_id
    name: id
    type: BIGINT
    primaryKey: true
    autoIncrement: true

  - id: global_created_at
    name: created_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP
    comment: Creation timestamp

  - id: global_updated_at
    name: updated_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    comment: Update timestamp

# Users table
Table:
  - id: table_users
    name: users
    comment: Users table
    expectedRecordCount: 1000000
    expectedGrowthRate: 10000
    isPrimaryQueryTable: true
    queryFrequencyLevel: 5

    Column:
      - id: col_users_id
        referenceId: global_id
        name: id

      - name: username
        type: VARCHAR(50)
        nullable: false
        comment: Username

      - name: email
        type: VARCHAR(100)
        comment: Email

      - name: password_hash
        type: VARCHAR(255)
        nullable: false
        comment: Password hash

      - name: status
        type: VARCHAR(20)
        defaultValue: 'active'
        comment: User status

      - id: col_users_created_at
        referenceId: global_created_at
        name: created_at

      - id: col_users_updated_at
        referenceId: global_updated_at
        name: updated_at

    Index:
      - name: idx_users_username
        columns: [username]
        unique: true
        comment: Username unique index

      - name: idx_users_email
        columns: [email]
        unique: true
        comment: Email unique index

      - name: idx_users_status
        columns: [status]
        comment: Status index

    afterCreates:
      - dbms: postgresql
        content: |
          CREATE INDEX CONCURRENTLY idx_users_created_at
          ON users(created_at);

      - dbms: mysql
        content: |
          CREATE INDEX idx_users_created_at
          ON users(created_at);

# Orders table
  - id: table_orders
    name: orders
    comment: Orders table
    expectedRecordCount: 5000000
    expectedGrowthRate: 50000

    Column:
      - id: col_orders_id
        referenceId: global_id
        name: id

      - name: user_id
        type: BIGINT
        nullable: false
        comment: User ID

      - name: order_no
        type: VARCHAR(50)
        nullable: false
        comment: Order number

      - name: total_amount
        type: DECIMAL(10,2)
        defaultValue: 0.00
        comment: Order total amount

      - name: status
        type: VARCHAR(20)
        defaultValue: 'pending'
        comment: Order status

      - id: col_orders_created_at
        referenceId: global_created_at
        name: created_at

      - id: col_orders_updated_at
        referenceId: global_updated_at
        name: updated_at

    Constraint:
      - id: fk_orders_user_id
        name: fk_orders_user_id
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [user_id]

    Index:
      - name: idx_orders_user_id
        columns: [user_id]
        comment: User ID index

      - name: idx_orders_order_no
        columns: [order_no]
        unique: true
        comment: Order number unique index

      - name: idx_orders_status
        columns: [status]
        comment: Status index

# Products table
  - id: table_products
    name: products
    comment: Products table
    expectedRecordCount: 100000
    expectedGrowthRate: 1000

    Column:
      - id: col_products_id
        referenceId: global_id
        name: id

      - name: name
        type: VARCHAR(200)
        nullable: false
        comment: Product name

      - name: price
        type: DECIMAL(10,2)
        nullable: false
        comment: Product price

      - name: stock
        type: INT
        defaultValue: 0
        comment: Stock quantity

      - name: category_id
        type: BIGINT
        comment: Category ID

      - id: col_products_created_at
        referenceId: global_created_at
        name: created_at

    Index:
      - name: idx_products_category_id
        columns: [category_id]
        comment: Category index

      - name: idx_products_price
        columns: [price]
        comment: Price index
```

## Common Questions

### How to create temporary tables?

Use database-specific extension attributes:

```yaml
Table:
  - name: temp_users
    temporary: true  # MySQL
    # Or
    dbms: postgresql
    pg_temp: true
```

### How to create partitioned tables?

Use extension attributes:

```yaml
Table:
  - name: orders
    partitionBy: RANGE (created_at)
    partitions:
      - name: p_2023
        values: '2023-01-01'
      - name: p_2024
        values: '2024-01-01'
```

### How to create memory tables?

```yaml
Table:
  - name: cache_data
    engine: MEMORY  # MySQL
```

## Related Documents

- [Column Definition](./column.md)
- [Constraint Definition](./constraint.md)
- [Format Reference](../formats/)
