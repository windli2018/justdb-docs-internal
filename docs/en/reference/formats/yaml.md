---
icon: file-certificate
title: YAML Format
order: 12
category:
  - Reference
  - Format Support
tag:
  - yaml
  - format
---

# YAML Format

YAML (YAML Ain't Markup Language) is JustDB's recommended Schema definition format. It provides the best readability and editing experience.

## Format Specification

### File Extension

- `.yaml` (recommended)
- `.yml`

### Basic Structure

```yaml
# JustDB root node
id: yaml-format
namespace: com.example

# Schema objects
Table:
  - name: users
    comment: User table
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```

## Syntax Features

### Comments

YAML supports line comments:

```yaml
# This is a comment
Table:
  - name: users
    # comment: User table  # Commented out configuration
    Column:
      - name: id  # Primary key
        type: BIGINT
```

### Multi-line Strings

Use `|` to preserve newlines:

```yaml
View:
  - name: active_users
    content: |
      SELECT *
      FROM users
      WHERE status = 'active'
```

Use `>` to fold newlines:

```yaml
Procedure:
  - name: sp_create_user
    content: >
      INSERT INTO users (username, email)
      VALUES (p_username, p_email);
```

### Quotes and Escaping

```yaml
Table:
  # No quotes needed
  - name: users
    type: VARCHAR

  # Quotes needed (contains special characters)
  - name: "user-name"
    comment: "User's name"

  # Multi-line string
  content: 'SELECT * FROM "users"'
```

## Data Type Mapping

### Basic Types

| YAML Type | Java Type | Example |
|-----------|----------|---------|
| String | String | `name: users` |
| Integer | Integer, Long | `port: 3306` |
| Float | Double | `rate: 0.5` |
| Boolean | Boolean | `nullable: false` |
| List | List | `dbms: [mysql, postgresql]` |
| null | null | `defaultValue: null` |

### Time Types

```yaml
Column:
  - name: created_at
    type: TIMESTAMP
    defaultValueComputed: CURRENT_TIMESTAMP
```

## Complete Examples

### Simple Schema

```yaml
id: yaml-format
namespace: com.example

Table:
  - name: users
    comment: User table
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true

      - name: username
        type: VARCHAR(50)
        nullable: false

      - name: email
        type: VARCHAR(100)

      - name: created_at
        type: TIMESTAMP
        nullable: false
        defaultValueComputed: CURRENT_TIMESTAMP

    Index:
      - name: idx_users_username
        columns: [username]
        unique: true
```

### Complex Schema

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
    comment: Primary key ID

  - id: global_created_at
    name: created_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP
    comment: Creation time

  - id: global_updated_at
    name: updated_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP
    comment: Update time

# User table
Table:
  - id: table_users
    name: users
    comment: User table
    expectedRecordCount: 1000000
    expectedGrowthRate: 10000

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

      - name: status
        type: VARCHAR(20)
        defaultValue: 'active'
        comment: Status

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
        comment: Unique username index

      - name: idx_users_email
        columns: [email]
        unique: true
        comment: Unique email index

# Order table
  - id: table_orders
    name: orders
    comment: Order table
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

      - id: col_orders_created_at
        referenceId: global_created_at
        name: created_at

      - id: col_orders_updated_at
        referenceId: global_updated_at
        name: updated_at

    Constraint:
      - name: fk_orders_user_id
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [user_id]
        onDelete: RESTRICT

    Index:
      - name: idx_orders_user_id
        columns: [user_id]

      - name: idx_orders_order_no
        columns: [order_no]
        unique: true

# View definition
View:
  - name: active_users
    comment: Active users view
    content: |
      SELECT
        u.id,
        u.username,
        u.email,
        COUNT(o.id) AS order_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.status = 'active'
      GROUP BY u.id, u.username, u.email

# Trigger definition (via hooks)
Table:
  - name: products
    comment: Products table
    afterCreates:
      - dbms: [mysql, mariadb]
        content: |
          CREATE TRIGGER trg_products_before_insert
          BEFORE INSERT ON products
          FOR EACH ROW
          SET NEW.created_at = NOW();
```

## Best Practices

### 1. Use Consistent Indentation

```yaml
# Recommended: Use 2-space indentation
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT

# Not recommended: Mix tabs
```

### 2. Add Comments

```yaml
# Global primary key definition
Column:
  - id: global_id
    name: id
    type: BIGINT
    primaryKey: true  # Primary key
    autoIncrement: true  # Auto increment
```

### 3. Use List Syntax

```yaml
# Recommended: List syntax
Column:
  - name: id
  - name: username
  - name: email

# Not recommended: Flow syntax (hard to read)
Column: [name: id, name: username, name: email]
```

### 4. Use | for Multi-line Strings

```yaml
# Recommended: Use | to preserve format
View:
  - name: user_statistics
    content: |
      SELECT
        u.id,
        u.username,
        COUNT(o.id) AS order_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.username
```

### 5. Quote Usage

```yaml
# No quotes needed
name: users
type: VARCHAR

# Quotes needed
comment: "User's email"
content: 'SELECT * FROM "users"'
defaultValue: 'active'
```

## Alias Support

YAML supports all field aliases:

```yaml
Table:
  - name: users
    # All of these are valid:
    Column:         # Canonical name
    # columns:      # Alias
    # Columns:      # Alias
      - name: id
        type: BIGINT
        # All of these are valid:
        primaryKey: true    # Canonical name
        # primary_key: true # Alias
        # pk: true          # Alias
        # primary-key: true # Alias
```

## Multi-Document Support

YAML supports defining multiple documents in one file:

```yaml
# Document 1: Base Schema
---------------------------
id: yaml-format
namespace: com.example
Table:
  - name: users

# Document 2: Extension Schema
---------------------------
id: yaml-format-extensions
namespace: com.example
Table:
  - name: orders
```

## Advanced Features

### Anchors and Aliases

```yaml
# Define anchor
defaults: &default_timestamp
  type: TIMESTAMP
  nullable: false
  defaultValueComputed: CURRENT_TIMESTAMP

# Use alias
Column:
  - name: created_at
    <<: *default_timestamp

  - name: updated_at
    <<: *default_timestamp
```

### Inheritance and Overriding

```yaml
# Base template
base_table: &base_table
  Column:
    - name: id
      type: BIGINT
      primaryKey: true

# Use and extend
Table:
  - <<: *base_table
    name: users
    Column:
      - name: username
        type: VARCHAR(50)
```

## Related Documentation

- [JSON Format](./json.md)
- [XML Format](./xml.md)
- [Format Support Overview](./README.md)
