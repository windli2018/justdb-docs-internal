---
icon: file-settings
title: TOML Format
order: 15
category:
  - Reference
  - Format Support
tag:
  - toml
  - format
---

# TOML Format

TOML (Tom's Obvious Minimal Language) is a simple configuration file format, suitable for application configuration scenarios.

## Format Specification

### File Extension

- `.toml`

### Basic Structure

```toml
id = "myapp"
namespace = "com.example"

[[Table]]
name = "users"
comment = "User table"

[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true
```

## Syntax Features

### Key-Value Pairs

```toml
id = "myapp"
namespace = "com.example"
port = 8080
enabled = true
```

### Tables

```toml
[Table]
name = "users"
comment = "User table"
```

### Array of Tables

```toml
[[Table.Column]]
name = "id"
type = "BIGINT"

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"
```

### Inline Tables

```toml
[metadata]
key = "value"
```

### Arrays

```toml
dbms = ["mysql", "postgresql"]

[[Index]]
name = "idx_users_username"
columns = ["username", "email"]
unique = true
```

### Multi-line Strings

```toml
content = """
SELECT *
FROM users
WHERE status = 'active'
"""
```

## Complete Examples

```toml
id = "ecommerce"
namespace = "com.example.ecommerce"

# Global column definitions
[[Column]]
id = "global_id"
name = "id"
type = "BIGINT"
primaryKey = true
autoIncrement = true

[[Column]]
id = "global_created_at"
name = "created_at"
type = "TIMESTAMP"
nullable = false
defaultValueComputed = "CURRENT_TIMESTAMP"

# User table
[[Table]]
id = "table_users"
name = "users"
comment = "User table"
expectedRecordCount = 1000000
expectedGrowthRate = 10000

[[Table.Column]]
id = "col_users_id"
referenceId = "global_id"
name = "id"

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"
nullable = false

[[Table.Column]]
name = "email"
type = "VARCHAR(100)"

[[Table.Index]]
name = "idx_users_username"
columns = ["username"]
unique = true

# Order table
[[Table]]
id = "table_orders"
name = "orders"
comment = "Order table"

[[Table.Column]]
name = "user_id"
type = "BIGINT"
nullable = false

[[Table.Constraint]]
name = "fk_orders_user_id"
type = "FOREIGN_KEY"
referencedTable = "users"
referencedColumn = "id"
columns = ["user_id"]
```

## Best Practices

### 1. Use Array of Tables

```toml
# Recommended: Use array of tables
[[Table.Column]]
name = "id"
type = "BIGINT"

# Not recommended: Mix usage
```

### 2. Add Comments

```toml
# User table definition
[[Table]]
name = "users"
comment = "User table"
```

### 3. Use Consistent Formatting

```toml
# Recommended: Align key-value pairs
id        = "myapp"
namespace = "com.example"
```

## Related Documentation

- [YAML Format](./yaml.md)
- [Format Support Overview](./README.md)
