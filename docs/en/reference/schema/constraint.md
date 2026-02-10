---
icon: lock
title: Constraint Definition
order: 5
category:
  - Reference
  - Schema Definition
tag:
  - constraint
  - schema
  - integrity
---

# Constraint Definition

Constraints are used to ensure data integrity and consistency in the database. JustDB supports primary key constraints, foreign key constraints, unique constraints, check constraints, and more.

## Basic Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | String | No | Unique identifier for reference |
| `name` | String | Yes | Constraint name |
| `tableName` | String | Yes* | Owner table name (*required for global constraints) |
| `type` | ConstraintType | Yes | Constraint type |
| `columns` | List&lt;String&gt; | Yes | Constraint columns |
| `referencedTable` | String | No | Foreign key referenced table |
| `referencedColumn` | String | No | Foreign key referenced column |
| `checkExpression` | String | No | Check constraint expression |
| `comment` | String | No | Constraint comment |
| `dbms` | List&lt;String&gt; | No | Applicable database list |

## Constraint Types

### PRIMARY_KEY (Primary Key Constraint)

Primary key constraint uniquely identifies each row in a table:

```yaml
# Method 1: Specify in column definition
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true

# Method 2: Use constraint definition
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
    Constraint:
      - name: pk_users
        type: PRIMARY_KEY
        columns: [id]
```

### FOREIGN_KEY (Foreign Key Constraint)

Foreign key constraint maintains referential relationships between tables:

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
      - name: fk_orders_user_id
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [user_id]
        comment: User foreign key
```

#### Foreign Key Constraint Options

```yaml
Constraint:
  - name: fk_orders_user_id
    type: FOREIGN_KEY
    referencedTable: users
    referencedColumn: id
    columns: [user_id]
    onDelete: CASCADE    # Behavior on delete
    onUpdate: RESTRICT   # Behavior on update
```

| Behavior | Description |
|----------|-------------|
| `CASCADE` | Cascade operation (delete/update child records when parent is deleted/updated) |
| `RESTRICT` | Reject operation (default) |
| `SET NULL` | Set to NULL |
| `NO ACTION` | Take no action |
| `SET DEFAULT` | Set to default value |

### UNIQUE (Unique Constraint)

Unique constraint ensures all values in a column are unique:

```yaml
Table:
  - name: users
    Column:
      - name: username
        type: VARCHAR(50)
      - name: email
        type: VARCHAR(100)

    Constraint:
      - name: uk_users_username
        type: UNIQUE
        columns: [username]

      - name: uk_users_email
        type: UNIQUE
        columns: [email]
```

Or use unique index:

```yaml
Table:
  - name: users
    Index:
      - name: uk_users_username
        columns: [username]
        unique: true

      - name: uk_users_email
        columns: [email]
        unique: true
```

### CHECK (Check Constraint)

Check constraint ensures column values meet specified conditions:

```yaml
Table:
  - name: products
    Column:
      - name: price
        type: DECIMAL(10,2)
      - name: quantity
        type: INT
      - name: status
        type: VARCHAR(20)

    Constraint:
      # Price must be positive
      - name: chk_products_price_positive
        type: CHECK
        checkExpression: price > 0

      # Quantity cannot be negative
      - name: chk_products_quantity_non_negative
        type: CHECK
        checkExpression: quantity >= 0

      # Status must be valid value
      - name: chk_products_status_valid
        type: CHECK
        checkExpression: status IN ('active', 'inactive', 'deleted')
```

### NOT_NULL (Not Null Constraint)

Not null constraint ensures column does not accept NULL values:

```yaml
Table:
  - name: users
    Column:
      - name: username
        type: VARCHAR(50)
        nullable: false  # Not null constraint
```

## Table-Level Constraint Definition

Constraints are typically defined at the table level:

```yaml
Table:
  - name: orders
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: user_id
        type: BIGINT
      - name: order_no
        type: VARCHAR(50)
      - name: status
        type: VARCHAR(20)
      - name: total_amount
        type: DECIMAL(10,2)

    Constraint:
      # Foreign key constraint
      - name: fk_orders_user_id
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [user_id]
        onDelete: RESTRICT
        onUpdate: CASCADE

      # Unique constraint
      - name: uk_orders_order_no
        type: UNIQUE
        columns: [order_no]

      # Check constraint
      - name: chk_orders_status
        type: CHECK
        checkExpression: status IN ('pending', 'processing', 'completed', 'cancelled')

      - name: chk_orders_amount_positive
        type: CHECK
        checkExpression: total_amount >= 0
```

## Global Constraint Definition

You can also define global constraints at the Justdb root node:

```yaml
Constraint:
  - name: fk_orders_user_id
    tableName: orders
    type: FOREIGN_KEY
    referencedTable: users
    referencedColumn: id
    columns: [user_id]
```

## Composite Constraints

### Composite Primary Key

```yaml
Table:
  - name: order_items
    Column:
      - name: order_id
        type: BIGINT
      - name: product_id
        type: BIGINT
      - name: quantity
        type: INT

    Constraint:
      - name: pk_order_items
        type: PRIMARY_KEY
        columns: [order_id, product_id]
        comment: Order item composite primary key
```

### Composite Unique Constraint

```yaml
Table:
  - name: user_roles
    Column:
      - name: user_id
        type: BIGINT
      - name: role_id
        type: BIGINT

    Constraint:
      - name: uk_user_roles_user_role
        type: UNIQUE
        columns: [user_id, role_id]
        comment: User role unique constraint
```

### Composite Foreign Key

```yaml
Table:
  - name: order_items
    Column:
      - name: order_id
        type: BIGINT
      - name: product_id
        type: BIGINT

    Constraint:
      - name: fk_order_items_product
        type: FOREIGN_KEY
        referencedTable: products
        referencedColumn: [category_id, product_id]
        columns: [category_id, product_id]
```

## Cascade Operations

### CASCADE (Cascade Delete/Update)

```yaml
Constraint:
  - name: fk_order_items_order
    type: FOREIGN_KEY
    referencedTable: orders
    referencedColumn: id
    columns: [order_id]
    onDelete: CASCADE  # Delete order items when order is deleted
    onUpdate: CASCADE
```

### SET NULL (Set to NULL)

```yaml
Table:
  - name: posts
    Column:
      - name: author_id
        type: BIGINT

    Constraint:
      - name: fk_posts_author
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [author_id]
        onDelete: SET NULL  # Set post's author_id to NULL when user is deleted
```

### RESTRICT (Reject Operation)

```yaml
Constraint:
  - name: fk_orders_user
    type: FOREIGN_KEY
    referencedTable: users
    referencedColumn: id
    columns: [user_id]
    onDelete: RESTRICT  # Reject deleting user when orders exist
    onUpdate: RESTRICT
```

## Check Constraint Examples

### Age Range Check

```yaml
Table:
  - name: users
    Column:
      - name: age
        type: INT

    Constraint:
      - name: chk_users_age_range
        type: CHECK
        checkExpression: age >= 0 AND age <= 150
```

### Amount Check

```yaml
Table:
  - name: orders
    Column:
      - name: discount
        type: DECIMAL(5,2)
      - name: total_amount
        type: DECIMAL(10,2)

    Constraint:
      - name: chk_orders_discount_range
        type: CHECK
        checkExpression: discount >= 0 AND discount <= 100

      - name: chk_orders_amount_positive
        type: CHECK
        checkExpression: total_amount >= 0
```

### Date Check

```yaml
Table:
  - name: events
    Column:
      - name: start_date
        type: DATE
      - name: end_date
        type: DATE

    Constraint:
      - name: chk_events_date_order
        type: CHECK
        checkExpression: end_date >= start_date
```

### Enum Value Check

```yaml
Table:
  - name: orders
    Column:
      - name: status
        type: VARCHAR(20)

    Constraint:
      - name: chk_orders_status_enum
        type: CHECK
        checkExpression: status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')
```

## Database-Specific Constraints

### MySQL Constraints

```yaml
Table:
  - name: users
    Constraint:
      - name: chk_users_email_format
        type: CHECK
        checkExpression: email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
        dbms: [mysql]
```

### PostgreSQL Constraints

```yaml
Table:
  - name: users
    Constraint:
      - name: chk_users_email_format
        type: CHECK
        checkExpression: email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        dbms: [postgresql]
```

## Complete Example

### E-commerce System Constraint Definition

```yaml
Table:
  # Users table
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
      - name: email
        type: VARCHAR(100)
      - name: age
        type: INT
      - name: status
        type: VARCHAR(20)
        defaultValue: 'active'

    Constraint:
      # Username unique
      - name: uk_users_username
        type: UNIQUE
        columns: [username]

      # Email unique
      - name: uk_users_email
        type: UNIQUE
        columns: [email]

      # Age range
      - name: chk_users_age_range
        type: CHECK
        checkExpression: age >= 0 AND age <= 150

      # Status enum
      - name: chk_users_status_enum
        type: CHECK
        checkExpression: status IN ('active', 'inactive', 'suspended', 'deleted')

  # Orders table
  - name: orders
    comment: Orders table
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
      - name: user_id
        type: BIGINT
        nullable: false
      - name: order_no
        type: VARCHAR(50)
        nullable: false
      - name: status
        type: VARCHAR(20)
        defaultValue: 'pending'
      - name: total_amount
        type: DECIMAL(10,2)
        defaultValue: 0.00
      - name: discount
        type: DECIMAL(5,2)
        defaultValue: 0.00

    Constraint:
      # Foreign key: user
      - name: fk_orders_user_id
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [user_id]
        onDelete: RESTRICT
        onUpdate: CASCADE

      # Order number unique
      - name: uk_orders_order_no
        type: UNIQUE
        columns: [order_no]

      # Amount non-negative
      - name: chk_orders_amount_positive
        type: CHECK
        checkExpression: total_amount >= 0

      # Discount range
      - name: chk_orders_discount_range
        type: CHECK
        checkExpression: discount >= 0 AND discount <= 100

      # Status enum
      - name: chk_orders_status_enum
        type: CHECK
        checkExpression: status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')

  # Order items table
  - name: order_items
    comment: Order items table
    Column:
      - name: order_id
        type: BIGINT
        nullable: false
      - name: product_id
        type: BIGINT
        nullable: false
      - name: quantity
        type: INT
        nullable: false
      - name: price
        type: DECIMAL(10,2)
        nullable: false

    Constraint:
      # Composite primary key
      - name: pk_order_items
        type: PRIMARY_KEY
        columns: [order_id, product_id]

      # Foreign key: order
      - name: fk_order_items_order
        type: FOREIGN_KEY
        referencedTable: orders
        referencedColumn: id
        columns: [order_id]
        onDelete: CASCADE
        onUpdate: CASCADE

      # Quantity check
      - name: chk_order_items_quantity_positive
        type: CHECK
        checkExpression: quantity > 0

      # Price check
      - name: chk_order_items_price_positive
        type: CHECK
        checkExpression: price > 0

  # Articles table
  - name: articles
    comment: Articles table
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
      - name: author_id
        type: BIGINT
        nullable: false
      - name: title
        type: VARCHAR(200)
        nullable: false
      - name: content
        type: TEXT
      - name: publish_date
        type: DATE

    Constraint:
      # Foreign key: author
      - name: fk_articles_author
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [author_id]
        onDelete: SET NULL

      # Date logic
      - name: chk_articles_publish_date_future
        type: CHECK
        checkExpression: publish_date <= CURRENT_DATE
```

## Best Practices

### 1. Constraint Naming Conventions

```yaml
# Recommended naming conventions
Constraint:
  - name: pk_{table}              # Primary key
  - name: fk_{table}_{column}     # Foreign key
  - name: uk_{table}_{column}     # Unique constraint
  - name: chk_{table}_{purpose}   # Check constraint

# Examples
Constraint:
  - name: pk_users
  - name: fk_orders_user_id
  - name: uk_users_email
  - name: chk_users_age_range
```

### 2. Proper Use of Foreign Keys

```yaml
# Good design: Appropriate foreign key constraints
Constraint:
  - name: fk_orders_user
    type: FOREIGN_KEY
    referencedTable: users
    referencedColumn: id
    columns: [user_id]
    onDelete: RESTRICT  # Protect data integrity

# Avoid overuse: Affects performance
# Consider implementing certain constraints at application layer
```

### 3. Indexes and Constraints

```yaml
# Unique constraint automatically creates index
Constraint:
  - name: uk_users_email
    type: UNIQUE
    columns: [email]

# Foreign key columns should have indexes
Index:
  - name: idx_orders_user_id
    columns: [user_id]  # Improve foreign key query performance
```

### 4. Check Constraints vs Application Layer Validation

```yaml
# Check constraint: Critical business rules
Constraint:
  - name: chk_orders_status
    type: CHECK
    checkExpression: status IN ('pending', 'processing', 'completed')

# Application layer validation: Complex business logic
# Such as: Order amount must equal sum of line items
```

## Common Questions

### How to modify foreign key constraints?

First drop the old constraint, then create the new one:

```yaml
# Implement using hooks
Table:
  - name: orders
    beforeAlters:
      - content: |
          ALTER TABLE orders DROP FOREIGN KEY fk_orders_user_id;

    Constraint:
      - name: fk_orders_user_id
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [user_id]
        onDelete: CASCADE  # New constraint behavior
```

### How to implement soft delete?

Use columns and check constraints:

```yaml
Table:
  - name: users
    Column:
      - name: is_deleted
        type: BOOLEAN
        defaultValue: false
      - name: deleted_at
        type: TIMESTAMP
        defaultValue: null

    Constraint:
      - name: chk_users_deleted_consistency
        type: CHECK
        checkExpression: (is_deleted = false AND deleted_at IS NULL) OR
                        (is_deleted = true AND deleted_at IS NOT NULL)
```

### How to implement conditional unique constraint?

Use partial index:

```yaml
Table:
  - name: email_verifications
    Column:
      - name: email
        type: VARCHAR(100)
      - name: is_verified
        type: BOOLEAN

    # PostgreSQL partial unique index
    afterCreates:
      - dbms: postgresql
        content: |
          CREATE UNIQUE INDEX uk_email_verifications_email
          ON email_verifications(email)
          WHERE is_verified = true;
```

## Related Documents

- [Table Definition](./table.md)
- [Column Definition](./column.md)
