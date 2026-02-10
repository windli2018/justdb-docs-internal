---
date: 2024-01-01
icon: file-code
title: Create Your First Schema
order: 4
category:
  - Quick Start
  - schema
tag:
  - schema
  - definition
  - syntax
---

# Create Your First Schema

Learn how to define your first JustDB Schema. This tutorial will introduce all aspects of Schema definition step by step.

## Schema Basic Structure

### Minimal Schema

```yaml
# minimal.yaml
namespace: com.example
Table:
  - name: users
    Column:
      - name: id
        type: INT
        primaryKey: true
```

### Complete Schema Structure

```yaml
# complete.yaml
namespace: com.example             # Namespace
catalog: myapp                     # Database catalog (optional)

# Table definition
Table:
  - id: users                      # Table ID (for reference)
    name: users                    # Table name
    comment: User Table            # Table comment
    engine: InnoDB                 # MySQL specific property
    charset: utf8mb4               # Character set

    # Column definition
    Column:
      - name: id                   # Column name
        type: BIGINT               # Data type
        primaryKey: true           # Primary key
        autoIncrement: true        # Auto increment
        comment: User ID

      - name: username
        type: VARCHAR(50)
        nullable: false            # Not null
        comment: Username

      - name: email
        type: VARCHAR(100)
        comment: Email address

      - name: status
        type: VARCHAR(20)
        defaultValue: active       # Default value
        comment: Status

      - name: created_at
        type: TIMESTAMP
        nullable: false
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: Creation time

    # Index definition
    Index:
      - name: idx_username
        columns: [username]
        unique: true               # Unique index
        comment: Unique index on username

      - name: idx_email
        columns: [email]
        unique: true

    # Constraint definition
    Constraint:
      - name: chk_status
        type: CHECK
        check: "status IN ('active', 'inactive', 'suspended')"
```

## Data Types

### Common Data Types

```yaml
Table:
  - name: examples
    Column:
      # Integer types
      - name: col_tinyint
        type: TINYINT
      - name: col_smallint
        type: SMALLINT
      - name: col_int
        type: INT
      - name: col_bigint
        type: BIGINT

      # Floating point types
      - name: col_float
        type: FLOAT
      - name: col_double
        type: DOUBLE
      - name: col_decimal
        type: DECIMAL(10, 2)

      # String types
      - name: col_char
        type: CHAR(10)
      - name: col_varchar
        type: VARCHAR(255)
      - name: col_text
        type: TEXT

      # Date time types
      - name: col_date
        type: DATE
      - name: col_time
        type: TIME
      - name: col_datetime
        type: DATETIME
      - name: col_timestamp
        type: TIMESTAMP

      # Binary types
      - name: col_blob
        type: BLOB
      - name: col_binary
        type: BINARY(16)

      # Boolean type
      - name: col_boolean
        type: BOOLEAN
```

### Type Mapping

JustDB automatically handles type mapping for different databases:

| JustDB Type | MySQL | PostgreSQL | Oracle |
|:---|:---|:---|:---|
| `BIGINT` | `BIGINT` | `BIGINT` | `NUMBER(19)` |
| `VARCHAR(n)` | `VARCHAR(n)` | `VARCHAR(n)` | `VARCHAR2(n)` |
| `TIMESTAMP` | `TIMESTAMP` | `TIMESTAMP` | `TIMESTAMP` |
| `BOOLEAN` | `TINYINT(1)` | `BOOLEAN` | `NUMBER(1)` |

## Column Properties

### Primary Key

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
  - name: username
    type: VARCHAR(50)
    nullable: false
```

### Default Values

```yaml
Column:
  # Fixed default value
  - name: status
    type: VARCHAR(20)
    defaultValue: active

  # Computed default value
  - name: created_at
    type: TIMESTAMP
    defaultValueComputed: CURRENT_TIMESTAMP

  # Using function
  - name: uuid
    type: CHAR(36)
    defaultValueComputed: UUID()
```

### Unique Constraint

```yaml
Column:
  - name: email
    type: VARCHAR(100)
    unique: true
```

### Comments

```yaml
Column:
  - name: id
    type: BIGINT
    comment: User ID, primary key auto-increment
```

## Indexes

### Regular Index

```yaml
Index:
  - name: idx_username
    columns: [username]
    comment: Index on username
```

### Unique Index

```yaml
Index:
  - name: idx_email
    columns: [email]
    unique: true
```

### Composite Index

```yaml
Index:
  - name: idx_user_status
    columns: [user_id, status]
    comment: Composite index on user status
```

### Index Options

```yaml
Index:
  - name: idx_created
    columns: [created_at]
    type: BTREE           # Index type
    comment: Index on creation time
```

## Foreign Key Relationships

### Define Foreign Key

```yaml
Table:
  - name: orders
    Column:
      - name: id
        type: BIGINT
        primaryKey: true

      - name: user_id
        type: BIGINT
        nullable: false

    Constraint:
      - name: fk_orders_user
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        foreignKey: user_id
        onDelete: CASCADE     # Cascade on delete
        onUpdate: RESTRICT    # Restrict on update
```

### One-to-Many Relationship

```yaml
# User table
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true

# Order table (many)
Table:
  - name: orders
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: user_id
        type: BIGINT
    Constraint:
      - type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        foreignKey: user_id
```

### Many-to-Many Relationship

```yaml
# Student table
Table:
  - name: students
    Column:
      - name: id
        type: BIGINT
        primaryKey: true

# Course table
Table:
  - name: courses
    Column:
      - name: id
        type: BIGINT
        primaryKey: true

# Association table
Table:
  - name: student_courses
    Column:
      - name: student_id
        type: BIGINT
      - name: course_id
        type: BIGINT
    Constraint:
      - type: FOREIGN_KEY
        referencedTable: students
        referencedColumn: id
        foreignKey: student_id
      - type: FOREIGN_KEY
        referencedTable: courses
        referencedColumn: id
        foreignKey: course_id
    Index:
      - name: idx_student_course
        columns: [student_id, course_id]
        unique: true
```

## Schema Inheritance

### Using referenceId

```yaml
# Define reusable columns
Column:
  - id: global_id
    name: id
    type: BIGINT
    primaryKey: true
    autoIncrement: true

  - id: global_timestamp
    name: created_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP

# Reference defined columns
Table:
  - name: users
    Column:
      - referenceId: global_id    # Reference global_id
      - name: username
        type: VARCHAR(50)
      - referenceId: global_timestamp  # Reference global_timestamp
```

## Schema Organization

### Multi-File Organization

```
justdb/
├── core.yaml           # Core tables
├── user.yaml           # User related tables
├── order.yaml          # Order related tables
└── product.yaml        # Product related tables
```

### Schema Import

```yaml
# core.yaml
id: core
namespace: com.example.core
Table:
  - name: users
    Column: [...]

# user.yaml
import: [core]  # Import core schema
id: user
namespace: com.example.user
Table:
  - name: user_profiles
    Column: [...]
```

## Multi-Database Support

### Database-Specific Properties

```yaml
Table:
  - name: users
    # MySQL specific
    engine: InnoDB
    row_format: COMPRESSED

    # PostgreSQL specific
    tablespace: users_space

    # Oracle specific
    compress: YES

    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```

### Conditional Configuration

```yaml
Table:
  - name: users
    beforeCreates:
      - dbms: mysql
        sql: "SET sql_mode='STRICT_TRANS_TABLES'"
      - dbms: postgresql
        sql: "SET timezone='UTC'"
```

## Best Practices

### 1. Naming Conventions

```yaml
# Good practices
Table:
  - name: users           # Table name in lowercase plural
    Column:
      - name: user_id     # Foreign key naming: table_name_id
        type: BIGINT
      - name: created_at  # Timestamps use _at suffix
        type: TIMESTAMP

# Avoid
Table:
  - name: User            # Avoid uppercase
    Column:
      - name: userId      # Avoid camelCase
```

### 2. Complete Comments

```yaml
Table:
  - name: orders
    comment: Order table, stores all order information
    Column:
      - name: order_no
        type: VARCHAR(50)
        comment: Order number, format: YYYYMMDD + sequence
      - name: total_amount
        type: DECIMAL(10, 2)
        comment: Order total amount (in cents)
```

### 3. Use Indexes Wisely

```yaml
Table:
  - name: orders
    Index:
      # Create index for frequently queried fields
      - name: idx_user_id
        columns: [user_id]

      # Create unique index for unique fields
      - name: idx_order_no
        columns: [order_no]
        unique: true

      # Composite index - note the order
      - name: idx_user_status
        columns: [user_id, status]
```

### 4. Use Aliases for Old Format Support

```yaml
Column:
  # All these formats are supported
  - name: id
    ref-id: global_id       # kebab-case
    referencedTable: users  # Canonical format (camelCase)
    ref_id: global_id       # snake_case
```

## Next Steps

<VPCard
  title="Migration Basics"
  desc="Learn how to perform Schema migration"
  link="/en/getting-started/migration-basics.html"
/>

<VPCard
  title="Spring Boot Integration"
  desc="Use JustDB in Spring Boot"
  link="/en/getting-started/spring-boot-integration.html"
/>

<VPCard
  title="Common Tasks"
  desc="View common database operation examples"
  link="/en/getting-started/common-tasks.html"
/>
