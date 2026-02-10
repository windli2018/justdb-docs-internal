---
icon: columns
title: Column Definition
order: 3
category:
  - Reference
  - Schema Definition
tag:
  - column
  - schema
---

# Column Definition

Column (Column) is the basic building block of a table, defining data type, constraints, default values, and other properties.

## Basic Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | String | No | Unique identifier for reference |
| `name` | String | Yes | Column name |
| `referenceId` | String | No | Reference to another column's id |
| `formerNames` | List\<String\> | No | List of former names for rename tracking |
| `type` | String | Yes | Data type |
| `nullable` | Boolean | No | Whether nullable (default true) |
| `defaultValue` | String | No | Default value |
| `defaultValueComputed` | String | No | Computed default value (e.g., function) |
| `autoIncrement` | Boolean | No | Whether auto-increment (default false) |
| `sequence` | String | No | Associated sequence name |
| `primaryKey` | Boolean | No | Whether primary key (default false) |
| `primaryKeyName` | String | No | Primary key constraint name |
| `comment` | String | No | Database comment |
| `remark` | String | No | JustDB remark |
| `dbms` | List\<String\> | No | Applicable database list |

## Data Types

### String Types

| Type | Description | Example |
|------|-------------|---------|
| `CHAR(n)` | Fixed-length string | `CHAR(10)` |
| `VARCHAR(n)` | Variable-length string | `VARCHAR(255)` |
| `TEXT` | Long text | `TEXT` |
| `LONGTEXT` | Extra long text | `LONGTEXT` |
| `CLOB` | Character large object | `CLOB` |

```yaml
Column:
  - name: username
    type: VARCHAR(50)
    nullable: false

  - name: bio
    type: TEXT
    comment: User biography

  - name: code
    type: CHAR(10)
    nullable: false
```

### Numeric Types

| Type | Description | Example |
|------|-------------|---------|
| `TINYINT` | Tiny integer | `TINYINT` |
| `SMALLINT` | Small integer | `SMALLINT` |
| `INT` / `INTEGER` | Integer | `INT` |
| `BIGINT` | Big integer | `BIGINT` |
| `DECIMAL(p,s)` | Exact decimal | `DECIMAL(10,2)` |
| `FLOAT` | Single-precision float | `FLOAT` |
| `DOUBLE` | Double-precision float | `DOUBLE` |

```yaml
Column:
  - name: age
    type: INT
    comment: Age

  - name: balance
    type: DECIMAL(10,2)
    defaultValue: 0.00
    comment: Account balance

  - name: rating
    type: DOUBLE
    defaultValue: 0.0
    comment: Rating score
```

### Date/Time Types

| Type | Description | Example |
|------|-------------|---------|
| `DATE` | Date | `DATE` |
| `TIME` | Time | `TIME` |
| `DATETIME` | Date-time | `DATETIME` |
| `TIMESTAMP` | Timestamp | `TIMESTAMP` |
| `YEAR` | Year | `YEAR` |

```yaml
Column:
  - name: birth_date
    type: DATE
    comment: Date of birth

  - name: created_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP
    comment: Creation timestamp

  - name: updated_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP
    comment: Update timestamp
```

### Boolean Types

| Type | Description | Example |
|------|-------------|---------|
| `BOOLEAN` / `BOOL` | Boolean value | `BOOLEAN` |
| `BIT` | Bit | `BIT(1)` |

```yaml
Column:
  - name: is_active
    type: BOOLEAN
    defaultValue: true
    comment: Whether active

  - name: is_deleted
    type: BOOLEAN
    defaultValue: false
    comment: Whether deleted
```

### Binary Types

| Type | Description | Example |
|------|-------------|---------|
| `BINARY(n)` | Fixed-length binary | `BINARY(16)` |
| `VARBINARY(n)` | Variable-length binary | `VARBINARY(255)` |
| `BLOB` | Binary large object | `BLOB` |

```yaml
Column:
  - name: avatar
    type: BLOB
    comment: User avatar

  - name: file_data
    type: LONGBLOB
    comment: File data
```

### JSON Types

| Type | Description | Example |
|------|-------------|---------|
| `JSON` | JSON data | `JSON` |
| `JSONB` | Binary JSON (PostgreSQL) | `JSONB` |

```yaml
Column:
  - name: metadata
    type: JSON
    comment: Metadata

  - name: settings
    type: JSONB
    dbms: [postgresql]
    comment: Settings (PostgreSQL)
```

## Constraints

### Primary Key Constraint

```yaml
Column:
  - name: id
    type: BIGINT
    primaryKey: true
    autoIncrement: true
```

### Not Null Constraint

```yaml
Column:
  - name: email
    type: VARCHAR(100)
    nullable: false
```

### Unique Constraint

Column-level unique constraint implemented via index:

```yaml
Table:
  - name: users
    Column:
      - name: email
        type: VARCHAR(100)
    Index:
      - name: idx_users_email
        columns: [email]
        unique: true
```

### Check Constraint

```yaml
Column:
  - name: age
    type: INT
    check: age >= 0 AND age <= 150
```

## Default Values

### Static Default Values

```yaml
Column:
  - name: status
    type: VARCHAR(20)
    defaultValue: 'active'

  - name: count
    type: INT
    defaultValue: 0

  - name: price
    type: DECIMAL(10,2)
    defaultValue: 0.00
```

### Computed Default Values

```yaml
Column:
  - name: created_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP

  - name: updated_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

### NULL Default Value

```yaml
Column:
  - name: deleted_at
    type: TIMESTAMP
    defaultValue: null
    comment: Deletion timestamp
```

## Auto-Increment and Sequences

### Auto-Increment Column

```yaml
Column:
  - name: id
    type: BIGINT
    primaryKey: true
    autoIncrement: true
```

Different databases generate SQL:
- **MySQL**: `id BIGINT AUTO_INCREMENT PRIMARY KEY`
- **PostgreSQL**: `id BIGSERIAL PRIMARY KEY`
- **Oracle**: `id NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY PRIMARY KEY`

### Using Sequence

```yaml
Sequence:
  - name: seq_user_id
    startWith: 1
    incrementBy: 1

Column:
  - name: id
    type: BIGINT
    primaryKey: true
    sequence: seq_user_id
```

## Inheritance and Override

### Using referenceId for Inheritance

```yaml
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

# Reference in tables
Table:
  - name: users
    Column:
      - id: col_users_id
        referenceId: global_id
        name: id

      - name: username
        type: VARCHAR(50)

      - id: col_users_created_at
        referenceId: global_created_at
        name: created_at
```

### Override Parent Definition

```yaml
Column:
  - id: global_status
    name: status
    type: VARCHAR(20)
    defaultValue: 'pending'

Table:
  - name: users
    Column:
      - referenceId: global_status
        name: status
        isOverride: true
        defaultValue: 'active'  # Override default value
```

## Column Rename

Track column renames using `formerNames`:

```yaml
Table:
  - name: users
    Column:
      - name: user_name
        formerNames: [username]
        type: VARCHAR(50)
        nullable: false
```

Generated migration SQL:
```sql
ALTER TABLE users CHANGE COLUMN username user_name VARCHAR(50) NOT NULL;
```

## Database-Specific Configuration

### MySQL-Specific Configuration

```yaml
Column:
  - name: data
    type: VARCHAR(255)
    characterSet: utf8mb4
    collation: utf8mb4_unicode_ci
```

### PostgreSQL-Specific Configuration

```yaml
Column:
  - name: id
    type: BIGINT
    primaryKey: true
    dbms: [postgresql]

  - name: settings
    type: JSONB
    dbms: [postgresql]
```

## Lifecycle Hooks

Columns support lifecycle hooks:

```yaml
Table:
  - name: users
    Column:
      - name: email
        type: VARCHAR(100)
        afterAlters:
          - content: |
              UPDATE users SET email = LOWER(email) WHERE email IS NOT NULL
```

## Complete Example

### User Table Column Definition

```yaml
Table:
  - name: users
    comment: Users table
    Column:
      # Primary key
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
        comment: User ID

      # Username
      - name: username
        type: VARCHAR(50)
        nullable: false
        comment: Username

      # Email
      - name: email
        type: VARCHAR(100)
        comment: Email address

      # Password hash
      - name: password_hash
        type: VARCHAR(255)
        nullable: false
        comment: Password hash

      # Phone number
      - name: phone
        type: VARCHAR(20)
        comment: Phone number

      # Status
      - name: status
        type: VARCHAR(20)
        defaultValue: 'active'
        nullable: false
        comment: User status

      # Whether active
      - name: is_active
        type: BOOLEAN
        defaultValue: true
        comment: Whether active

      # Whether deleted
      - name: is_deleted
        type: BOOLEAN
        defaultValue: false
        comment: Whether deleted

      # Creation timestamp
      - name: created_at
        type: TIMESTAMP
        nullable: false
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: Creation timestamp

      # Update timestamp
      - name: updated_at
        type: TIMESTAMP
        nullable: false
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: Update timestamp

      # Deletion timestamp
      - name: deleted_at
        type: TIMESTAMP
        defaultValue: null
        comment: Deletion timestamp

      # Last login timestamp
      - name: last_login_at
        type: TIMESTAMP
        defaultValue: null
        comment: Last login timestamp

      # Metadata
      - name: metadata
        type: JSON
        comment: Metadata

      # Remark
      - name: remark
        type: TEXT
        comment: Remark
```

## Best Practices

### 1. Naming Conventions

- Use lowercase letters and underscores for column names
- Use descriptive names, avoid abbreviations
- Use `is_` prefix for boolean columns

```yaml
# Recommended
Column:
  - name: is_active
  - name: created_at
  - name: user_id

# Not recommended
Column:
  - name: active
  - name: createtime
  - name: uid
```

### 2. String Lengths

Set appropriate length based on actual requirements:

```yaml
Column:
  - name: country_code
    type: CHAR(2)  # Fixed length

  - name: username
    type: VARCHAR(50)  # Variable length

  - name: description
    type: TEXT  # Long text
```

### 3. Timestamp Fields

Always use `TIMESTAMP` type and set default values:

```yaml
Column:
  - name: created_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP

  - name: updated_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP
```

### 4. Soft Delete

Use soft delete instead of physical delete:

```yaml
Column:
  - name: is_deleted
    type: BOOLEAN
    defaultValue: false

  - name: deleted_at
    type: TIMESTAMP
    defaultValue: null
```

### 5. Amount Fields

Use `DECIMAL` type for storing amounts:

```yaml
Column:
  - name: amount
    type: DECIMAL(10,2)  # 10 digits, 2 decimal places
```

## Common Questions

### How to add enum type?

Use check constraint:

```yaml
Column:
  - name: status
    type: VARCHAR(20)
    nullable: false
    defaultValue: 'pending'
    comment: Status

# Add check constraint at table level
Table:
  - name: orders
    Column:
      - name: status
    Constraint:
      - name: chk_orders_status
        type: CHECK
        checkExpression: status IN ('pending', 'processing', 'completed', 'cancelled')
```

### How to store IP address?

```yaml
Column:
  - name: ip_address
    type: VARCHAR(45)  # IPv6 max 45 characters
    comment: IP address

  # Or store as integer (IPv4)
  - name: ip_int
    type: BIGINT
    comment: IP address (integer form)
```

### How to store UUID?

```yaml
Column:
  - name: uuid
    type: CHAR(36)  # UUID standard format
    comment: UUID

  # Or use binary
  - name: uuid_binary
    type: BINARY(16)
    comment: UUID (binary)
```

## Related Documents

- [Table Definition](./table.md)
- [Constraint Definition](./constraint.md)
- [Format Reference](../formats/)
