---
icon: file-text
title: Markdown Format
order: 19
category:
  - Reference
  - Format Support
tag:
  - markdown
  - format
  - documentation
---

# Markdown Format

JustDB supports extracting Schema definitions from Markdown documents, suitable for documentation-first development approach.

## Format Specification

### File Extensions

- `.md`
- `.markdown`

### Basic Structure

```markdown
# Database Design Document

## Users Table (users)

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | User ID |
| username | VARCHAR(50) | NOT NULL | Username |
| email | VARCHAR(100) | | Email |
```

## Syntax Features

### Table Definitions

```markdown
## Users Table (users)

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | User ID |
| username | VARCHAR(50) | NOT NULL | Username |
| email | VARCHAR(100) | | Email |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
```

### Index Definitions

```markdown
### Indexes

- **idx_users_username**: UNIQUE(username) - Username unique index
- **idx_users_email**: UNIQUE(email) - Email unique index
```

### Constraint Definitions

```markdown
### Constraints

- **fk_orders_user_id**: FOREIGN KEY (user_id) REFERENCES users(id) - User foreign key
```

## Complete Example

```markdown
# E-commerce System Database Design

## Users Table (users)

User information table, storing basic user information.

### Column Definitions

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | User ID |
| username | VARCHAR(50) | NOT NULL | Username |
| email | VARCHAR(100) | | Email |
| password_hash | VARCHAR(255) | NOT NULL | Password hash |
| status | VARCHAR(20) | DEFAULT 'active' | Status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Update time |

### Indexes

- **pk_users**: PRIMARY KEY(id)
- **idx_users_username**: UNIQUE(username) - Username unique index
- **idx_users_email**: UNIQUE(email) - Email unique index
- **idx_users_status**: (status) - Status index

## Orders Table (orders)

Order information table, storing user order information.

### Column Definitions

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Order ID |
| user_id | BIGINT | NOT NULL, FOREIGN KEY → users(id) | User ID |
| order_no | VARCHAR(50) | NOT NULL, UNIQUE | Order number |
| status | VARCHAR(20) | DEFAULT 'pending' | Order status |
| total_amount | DECIMAL(10,2) | DEFAULT 0.00 | Order total |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Update time |

### Constraints

- **fk_orders_user_id**: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT - User foreign key

### Indexes

- **idx_orders_user_id**: (user_id) - User ID index
- **idx_orders_order_no**: UNIQUE(order_no) - Order number unique index
- **idx_orders_status**: (status) - Status index

## Products Table (products)

Product information table, storing basic product information.

### Column Definitions

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Product ID |
| name | VARCHAR(200) | NOT NULL | Product name |
| price | DECIMAL(10,2) | NOT NULL | Product price |
| stock | INT | DEFAULT 0 | Stock quantity |
| category_id | BIGINT | | Category ID |
| status | VARCHAR(20) | DEFAULT 'active' | Status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |

### Indexes

- **idx_products_category**: (category_id) - Category index
- **idx_products_price**: (price) - Price index
```

## Extracting Schema

```bash
# Extract Schema from Markdown
justdb md2schema database-design.md > schema.yaml

# Specify output format
justdb md2schema database-design.md -f yaml -o schema.yaml
justdb md2schema database-design.md -f json -o schema.json
```

## Best Practices

### 1. Use Clear Heading Structure

```markdown
# Database Design

## Users Table (users)
### Column Definitions
### Indexes
### Constraints
```

### 2. Use Standard Table Format

```markdown
| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY | User ID |
```

### 3. Add Explanatory Comments

```markdown
## Users Table (users)

User information table, storing basic user information.
```

### 4. Maintain Consistent Naming

```markdown
# Use consistent table and column naming
users (User table)
orders (Order table)
```

## Advantages

- **Documentation First**: Design is documentation
- **Team Collaboration Friendly**: Easy to review and discuss
- **Version Control Friendly**: Clear diff comparisons
- **High Readability**: Human-friendly format

## Related Documentation

- [YAML Format](./yaml.md)
- [Format Support Overview](./README.md)
