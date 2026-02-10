---
icon: file-binary
title: Properties Format
order: 16
category:
  - Reference
  - Format Support
tag:
  - properties
  - format
---

# Properties Format

Properties format is a simple key-value pair configuration format suitable for simple Schema definition scenarios.

## Format Specification

### File Extension

- `.properties`

### Basic Structure

```properties
# JustDB Configuration
id=myapp
namespace=com.example

# Table definition
table.users.name=users
table.users.comment=User table
```

## Syntax Features

### Key-Value Pairs

```properties
id=myapp
namespace=com.example
```

### Comments

```properties
# This is a comment
table.users.name=users
```

### Escape Characters

```properties
content=SELECT * FROM \"users\"
path=C:\\Users\\config
```

### Multi-line Values

```properties
# Use \ to connect multiple lines
content=SELECT * \
FROM users \
WHERE status = 'active'
```

## Naming Conventions

### Dot Hierarchy Structure

```properties
# Table-level properties
table.users.name=users
table.users.comment=User table
table.users.expectedRecordCount=1000000

# Column-level properties
table.users.column.id.name=id
table.users.column.id.type=BIGINT
table.users.column.id.primaryKey=true

# Index-level properties
table.users.index.idx_users_username.name=idx_users_username
table.users.index.idx_users_username.columns=username
table.users.index.idx_users_username.unique=true
```

## Complete Example

```properties
# ============================================================================
# JustDB Schema Configuration
# ============================================================================
id=ecommerce
namespace=com.example.ecommerce

# ----------------------------------------------------------------------------
# Global Column Definitions
# ----------------------------------------------------------------------------
column.global_id.name=id
column.global_id.type=BIGINT
column.global_id.primaryKey=true
column.global_id.autoIncrement=true
column.global_id.comment=Primary key ID

column.global_created_at.name=created_at
column.global_created_at.type=TIMESTAMP
column.global_created_at.nullable=false
column.global_created_at.defaultValueComputed=CURRENT_TIMESTAMP
column.global_created_at.comment=Creation time

# ----------------------------------------------------------------------------
# Users Table
# ----------------------------------------------------------------------------
table.users.id=table_users
table.users.name=users
table.users.comment=User table
table.users.expectedRecordCount=1000000
table.users.expectedGrowthRate=10000

# Users table - Column definitions
table.users.column.col_users_id.referenceId=global_id
table.users.column.col_users_id.name=id

table.users.column.username.name=username
table.users.column.username.type=VARCHAR(50)
table.users.column.username.nullable=false
table.users.column.username.comment=Username

table.users.column.email.name=email
table.users.column.email.type=VARCHAR(100)
table.users.column.email.comment=Email

table.users.column.col_users_created_at.referenceId=global_created_at
table.users.column.col_users_created_at.name=created_at

# Users table - Index definitions
table.users.index.idx_users_username.name=idx_users_username
table.users.index.idx_users_username.columns=username
table.users.index.idx_users_username.unique=true
table.users.index.idx_users_username.comment=Username unique index

table.users.index.idx_users_email.name=idx_users_email
table.users.index.idx_users_email.columns=email
table.users.index.idx_users_email.unique=true
table.users.index.idx_users_email.comment=Email unique index

# ----------------------------------------------------------------------------
# Orders Table
# ----------------------------------------------------------------------------
table.orders.id=table_orders
table.orders.name=orders
table.orders.comment=Orders table

# Orders table - Column definitions
table.orders.column.col_orders_id.referenceId=global_id
table.orders.column.col_orders_id.name=id

table.orders.column.user_id.name=user_id
table.orders.column.user_id.type=BIGINT
table.orders.column.user_id.nullable=false
table.orders.column.user_id.comment=User ID

table.orders.column.order_no.name=order_no
table.orders.column.order_no.type=VARCHAR(50)
table.orders.column.order_no.nullable=false
table.orders.column.order_no.comment=Order number

table.orders.column.status.name=status
table.orders.column.status.type=VARCHAR(20)
table.orders.column.status.defaultValue=pending
table.orders.column.status.comment=Order status

# Orders table - Constraint definitions
table.orders.constraint.fk_orders_user_id.name=fk_orders_user_id
table.orders.constraint.fk_orders_user_id.type=FOREIGN_KEY
table.orders.constraint.fk_orders_user_id.referencedTable=users
table.orders.constraint.fk_orders_user_id.referencedColumn=id
table.orders.constraint.fk_orders_user_id.columns=user_id
table.orders.constraint.fk_orders_user_id.onDelete=RESTRICT
table.orders.constraint.fk_orders_user_id.comment=User foreign key

# Orders table - Index definitions
table.orders.index.idx_orders_user_id.name=idx_orders_user_id
table.orders.index.idx_orders_user_id.columns=user_id
table.orders.index.idx_orders_user_id.comment=User ID index

table.orders.index.idx_orders_order_no.name=idx_orders_order_no
table.orders.index.idx_orders_order_no.columns=order_no
table.orders.index.idx_orders_order_no.unique=true
table.orders.index.idx_orders_order_no.comment=Order number unique index
```

## Best Practices

### 1. Use Meaningful Key Names

```properties
# Recommended
table.users.name=users
table.users.column.id.type=BIGINT

# Not recommended
t1.n=users
t1.c1.t=BIGINT
```

### 2. Add Grouping Comments

```properties
# ============================================================================
# Users Table Definition
# ============================================================================
table.users.name=users
table.users.comment=User table
```

### 3. Use Escaping for Special Characters

```properties
# Values containing special characters need escaping
content=SELECT * FROM \"users\"
path=C:\\Users\\config
```

### 4. Maintain Consistent Alignment

```properties
# Recommended: align equals signs
table.users.name=users
table.users.comment=User table
table.users.expectedRecordCount=1000000
```

## Limitations

Properties format has the following limitations:

1. **No Complex Nesting**: Requires dot hierarchy structure
2. **Complex Array Handling**: Requires indexing or comma separation
3. **Unfriendly Multi-line Strings**: Requires backslash concatenation

## Applicable Scenarios

Properties format is suitable for the following scenarios:

- Simple configuration files
- Traditional Java application configuration
- Simple configurations that need manual editing

For complex Schema definitions, YAML or JSON formats are recommended.

## Related Documentation

- [YAML Format](./yaml.md)
- [TOML Format](./toml.md)
- [Format Support Overview](./README.md)
