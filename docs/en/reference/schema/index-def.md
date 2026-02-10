---
icon: list-tree
title: Index Definition
order: 12
category:
  - Reference
  - Schema Definition
tag:
  - index
  - schema
  - performance
---

# Index Definition

Indexes are database objects used to improve database query performance. JustDB supports declarative index definition, automatically generating index creation and deletion statements for different databases.

## Basic Syntax

```xml
<Justdb>
  <Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="email" type="VARCHAR(255)" notNull="true"/>
    <Column name="username" type="VARCHAR(50)"/>
    <Column name="created_at" type="TIMESTAMP"/>

    <!-- Regular index -->
    <Index name="idx_email" columns="email"/>

    <!-- Multi-column index -->
    <Index name="idx_username_email" columns="username, email"/>

    <!-- Unique index -->
    <Index name="idx_unique_username" columns="username" unique="true"/>
  </Table>
</Justdb>
```

## Index Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | Index name |
| `columns` | String | Yes | Index columns, comma-separated for multiple columns |
| `unique` | Boolean | No | Whether it's a unique index, default false |
| `type` | String | No | Index type (e.g., BTREE, HASH) |
| `comment` | String | No | Index comment |

## Index Types

### Regular Index

```xml
<Index name="idx_user_email" columns="email"/>
```

### Unique Index

```xml
<Index name="idx_unique_email" columns="email" unique="true"/>
```

### Composite Index

```xml
<Index name="idx_name_age" columns="last_name, first_name, age"/>
```

### Full-text Index (MySQL)

```xml
<Index name="idx_fulltext_content" columns="content" type="FULLTEXT"/>
```

## Database Differences

JustDB automatically handles index syntax differences across different databases:

### MySQL

```sql
CREATE INDEX idx_email ON users (email);
CREATE UNIQUE INDEX idx_unique_email ON users (email);
CREATE FULLTEXT INDEX idx_content ON articles (content);
```

### PostgreSQL

```sql
CREATE INDEX idx_email ON users (email);
CREATE UNIQUE INDEX idx_unique_email ON users (email);
CREATE INDEX idx_content_gin ON articles USING gin (to_tsvector('english', content));
```

### SQL Server

```sql
CREATE INDEX idx_email ON users (email);
CREATE UNIQUE INDEX idx_unique_email ON users (email);
```

## Naming Convention

Recommend using `idx_` prefix:
- Regular index: `idx_{table}_{column}` (e.g., `idx_users_email`)
- Unique index: `uk_{table}_{column}` (e.g., `uk_users_email`)
- Full-text index: `ft_{table}_{column}` (e.g., `ft_articles_content`)

## Migration Behavior

### Creating Index

```xml
<!-- Old version -->
<Table name="users">
  <Column name="email" type="VARCHAR(255)"/>
</Table>

<!-- New version: Add index -->
<Table name="users">
  <Column name="email" type="VARCHAR(255)"/>
  <Index name="idx_email" columns="email"/>
</Table>
```

Generated migration SQL:
```sql
CREATE INDEX idx_email ON users (email);
```

### Dropping Index

Removing the `<Index>` element from the Schema definition generates a drop statement:
```sql
DROP INDEX idx_email ON users;
```

### Modifying Index

Modifying index properties (e.g., changing from regular to unique) drops and recreates:
```sql
DROP INDEX idx_email ON users;
CREATE UNIQUE INDEX idx_email ON users (email);
```

## Best Practices

1. **Create indexes for frequently queried columns**: Columns in WHERE, JOIN, ORDER BY clauses
2. **Avoid over-indexing**: Each index adds write operation overhead
3. **Choose appropriate index column order**: Place high-selectivity columns first
4. **Use covering indexes**: Include all columns needed by the query to avoid table lookups
5. **Maintain indexes regularly**: Rebuild fragmented indexes

## Index Types by Database

### MySQL Index Types

```yaml
Index:
  # B-tree index (default)
  - name: idx_email
    columns: email
    type: BTREE

  # Hash index (Memory engine only)
  - name: idx_hash_username
    columns: username
    type: HASH

  # Full-text index
  - name: ft_article_content
    columns: content
    type: FULLTEXT

  # Spatial index
  - name: idx_location
    columns: location
    type: SPATIAL
```

### PostgreSQL Index Types

```yaml
Index:
  # B-tree index (default)
  - name: idx_email
    columns: email
    type: BTREE

  # Hash index
  - name: idx_hash_username
    columns: username
    type: HASH

  # GIN index (for array/jsonb)
  - name: idx_tags
    columns: tags
    type: GIN

  # GiST index (for geometric/full-text)
  - name: idx_location
    columns: location
    type: GIST
```

### SQL Server Index Types

```yaml
Index:
  # Clustered index
  - name: PK_users_id
    columns: id
    type: CLUSTERED

  # Non-clustered index (default)
  - name: idx_email
    columns: email
    type: NONCLUSTERED

  # Columnstore index
  - name: idx_columnstore
    columns: column1, column2
    type: COLUMNSTORE
```

## Advanced Index Features

### Partial Index (PostgreSQL)

```yaml
Index:
  - name: idx_active_users
    columns: created_at
    comment: Index only for active users
    # PostgreSQL partial index using WHERE clause
    # Use lifecycle hook for custom WHERE
```

### Expression Index (PostgreSQL)

```yaml
Index:
  - name: idx_lower_email
    columns: LOWER(email)
    comment: Case-insensitive email index
    # Use lifecycle hook for expression index
```

### Covering Index (MySQL/PostgreSQL)

```yaml
Index:
  - name: idx_users_covering
    columns: "username, email, status"
    comment: Covering index for common queries
```

## Complete Examples

### E-commerce System Indexes

```yaml
Table:
  - name: users
    comment: User table
    Index:
      # Primary index on email (for login)
      - name: idx_users_email
        columns: email
        unique: true

      # Status filter index
      - name: idx_users_status
        columns: status, created_at

      # Username search index
      - name: idx_users_username
        columns: username

  - name: orders
    comment: Order table
    Index:
      # User order lookup
      - name: idx_orders_user_id
        columns: user_id, created_at

      # Order number lookup
      - name: idx_orders_order_no
        columns: order_no
        unique: true

      # Status filter
      - name: idx_orders_status
        columns: status, created_at

      # Date range query
      - name: idx_orders_created_at
        columns: created_at

  - name: products
    comment: Product table
    Index:
      # Product search
      - name: idx_products_name
        columns: name

      # Category filter
      - name: idx_products_category
        columns: category_id, status

      # Price range query
      - name: idx_products_price
        columns: price, status

  - name: order_items
    comment: Order item table
    Index:
      # Order items lookup
      - name: idx_order_items_order_id
        columns: order_id

      # Product sales lookup
      - name: idx_order_items_product_id
        columns: product_id

  - name: articles
    comment: Article table
    Index:
      # MySQL full-text search
      - name: ft_articles_title_content
        columns: title, content
        type: FULLTEXT
```

## Performance Considerations

### When to Create Indexes

```yaml
# Good: Index columns used in WHERE clause
Index:
  - name: idx_users_email
    columns: email

# Good: Index columns used in JOIN
Index:
  - name: idx_orders_user_id
    columns: user_id

# Good: Index columns used in ORDER BY
Index:
  - name: idx_orders_created_at
    columns: created_at

# Good: Composite index for multi-column queries
Index:
  - name: idx_orders_user_status
    columns: user_id, status, created_at
```

### When to Avoid Indexes

```yaml
# Avoid: Indexes on frequently updated columns
# Small tables (< 1000 rows)
# Low-selectivity columns (many duplicate values)
# Columns mostly used for display
```

## Index Maintenance

### Rebuild Indexes

Use lifecycle hooks for index maintenance:

```yaml
Table:
  - name: users
    afterCreates:
      - dbms: [postgresql]
        content: |
          -- Rebuild index concurrently
          REINDEX INDEX CONCURRENTLY idx_users_email;

      - dbms: [mysql]
        content: |
          -- Analyze table for query optimizer
          ANALYZE TABLE users;
```

## Related Documentation

- [Table Definition](./table.md)
- [Column Definition](./column.md)
- [Constraint Definition](./constraint.md)
- [Database Support](../databases/README.md)
