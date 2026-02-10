---
icon: table-headers
title: View Definition
order: 8
category:
  - Reference
  - Schema Definition
tag:
  - view
  - schema
  - database
---

# View Definition

View is a virtual table based on the result set of a SQL query. JustDB provides complete View definition support, including lifecycle hooks for automated SQL generation.

## View Properties

### Core Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | View name |
| `id` | String | No | View ID, used for reference |
| `comment` | String | No | View comment |
| `query` | String | Yes | View definition query (SQL) |
| `columns` | List<ViewColumn&gt;> | No | View column definitions |
| `selectType` | SelectType | No | View type |
| `changeType` | ChangeType | No | Change type |
| `formerNames` | List&lt;String&gt; | No | Old name list |
| `beforeCreates` | List<ConditionalSqlScript&gt;> | No | SQL to execute before creation |
| `afterCreates` | List<ConditionalSqlScript&gt;> | No | SQL to execute after creation |
| `beforeDrops` | List<ConditionalSqlScript&gt;> | No | SQL to execute before dropping |
| `afterDrops` | List<ConditionalSqlScript&gt;> | No | SQL to execute after dropping |
| `beforeAlters` | List<ConditionalSqlScript&gt;> | No | SQL to execute before modification |
| `afterAlters` | List<ConditionalSqlScript&gt;> | No | SQL to execute after modification |

### ViewColumn Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | Column name |
| `alias` | String | No | Column alias |
| `type` | String | No | Column type |
| `comment` | String | No | Column comment |

## View Types

JustDB supports multiple view types through `SelectType`:

### 1. Standard View

```yaml
View:
  - name: user_orders
    comment: User order view
    query: |
      SELECT u.id, u.username, COUNT(o.id) as order_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.username
```

### 2. Materialized View

```yaml
View:
  - name: product_summary
    comment: Product summary materialized view
    selectType: MATERIALIZED
    query: |
      SELECT
        p.id,
        p.name,
        SUM(od.quantity) as total_sold,
        SUM(od.quantity * od.price) as total_revenue
      FROM products p
      LEFT JOIN order_details od ON p.id = od.product_id
      GROUP BY p.id, p.name
```

### 3. Join View

```yaml
View:
  - name: customer_details
    comment: Customer details view
    query: |
      SELECT
        c.id,
        c.name,
        c.email,
        a.address,
        a.city,
        a.postal_code
      FROM customers c
      LEFT JOIN addresses a ON c.id = a.customer_id
```

### 4. Aggregate View

```yaml
View:
  - name: sales_by_month
    comment: Monthly sales statistics
    query: |
      SELECT
        DATE_FORMAT(order_date, '%Y-%m') as month,
        COUNT(*) as total_orders,
        SUM(total_amount) as total_sales,
        AVG(total_amount) as avg_order_value
      FROM orders
      GROUP BY DATE_FORMAT(order_date, '%Y-%m')
```

### 5. Filter View

```yaml
View:
  - name: active_users
    comment: Active user view
    query: |
      SELECT *
      FROM users
      WHERE status = 'active'
        AND last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)
```

### 6. Security View

```yaml
View:
  - name: user_public_info
    comment: User public information view
    query: |
      SELECT
        id,
        username,
        avatar_url,
        created_at
      FROM users
      -- Excludes sensitive fields: email, phone, password
```

## Lifecycle Hooks

View lifecycle hooks allow executing custom SQL at different stages of view operations.

### beforeCreates - Before Creation

```yaml
View:
  - name: customer_view
    query: |
      SELECT * FROM customers WHERE status = 'active'
    beforeCreates:
      - sql: |
          CREATE TABLE IF NOT EXISTS customers (
            id BIGINT PRIMARY KEY,
            name VARCHAR(100),
            status VARCHAR(20)
          )
        dbms: mysql
```

### afterCreates - After Creation

```yaml
View:
  - name: order_statistics
    query: |
      SELECT user_id, COUNT(*) as order_count
      FROM orders
      GROUP BY user_id
    afterCreates:
      - sql: |
          GRANT SELECT ON order_statistics TO report_user
        dbms: postgresql
```

### beforeDrops - Before Dropping

```yaml
View:
  - name: temp_report_view
    query: SELECT * FROM large_table WHERE created_at > '2024-01-01'
    beforeDrops:
      - sql: |
          -- Export data before dropping
          COPY temp_report_view TO '/backup/temp_report.csv' WITH CSV
        dbms: postgresql
```

### afterDrops - After Dropping

```yaml
View:
  - name: cache_view
    query: SELECT * FROM expensive_calculation
    afterDrops:
      - sql: |
          -- Clean up related cache
          DELETE FROM cache_entries WHERE view_name = 'cache_view'
        dbms: mysql
```

### beforeAlters - Before Modification

```yaml
View:
  - name: sales_report
    query: SELECT * FROM orders
    beforeAlters:
      - sql: |
          -- Backup dependent objects before modifying view
          CREATE TABLE IF NOT EXISTS sales_report_backup AS
          SELECT * FROM sales_report
        dbms: mysql
```

### afterAlters - After Modification

```yaml
View:
  - name: analytics_view
    query: |
      SELECT * FROM analytics_data
    afterAlters:
      - sql: |
          -- Refresh materialized view after modification
          REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_view
        dbms: postgresql
```

## Format Examples

### XML Format

```xml
<Justdb xmlns="http://www.justdb.ai/schema">
    <View name="user_orders" comment="User order view">
        <query><![CDATA[
            SELECT u.id, u.username, COUNT(o.id) as order_count
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            GROUP BY u.id, u.username
        ]]></query>
    </View>

    <View name="active_users" comment="Active user view">
        <query><![CDATA[
            SELECT * FROM users WHERE status = 'active'
        ]]></query>
        <beforeCreates>
            <ConditionalSqlScript dbms="mysql">
                <sql><![CDATA[
                    CREATE TABLE IF NOT EXISTS users (
                        id BIGINT PRIMARY KEY,
                        status VARCHAR(20)
                    )
                ]]></sql>
            </ConditionalSqlScript>
        </beforeCreates>
    </View>
</Justdb>
```

### YAML Format

```yaml
View:
  - name: user_orders
    comment: User order view
    query: |
      SELECT u.id, u.username, COUNT(o.id) as order_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.username

  - name: active_users
    comment: Active user view
    query: |
      SELECT * FROM users WHERE status = 'active'
    beforeCreates:
      - sql: |
          CREATE TABLE IF NOT EXISTS users (
            id BIGINT PRIMARY KEY,
            status VARCHAR(20)
          )
        dbms: mysql
```

### JSON Format

```json
{
  "View": [
    {
      "name": "user_orders",
      "comment": "User order view",
      "query": "SELECT u.id, u.username, COUNT(o.id) as order_count\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nGROUP BY u.id, u.username"
    },
    {
      "name": "active_users",
      "comment": "Active user view",
      "query": "SELECT * FROM users WHERE status = 'active'",
      "beforeCreates": [
        {
          "sql": "CREATE TABLE IF NOT EXISTS users (\n  id BIGINT PRIMARY KEY,\n  status VARCHAR(20)\n)",
          "dbms": "mysql"
        }
      ]
    }
  ]
}
```

## Database-Specific Support

### MySQL

```yaml
View:
  - name: customer_summary
    comment: Customer summary view
    query: |
      SELECT
        c.id,
        c.name,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      GROUP BY c.id, c.name
    algorithm: MERGE  # Algorithm: MERGE, TEMPTABLE, UNDEFINED
    sqlSecurity: DEFINER  # Security: DEFINER, INVOKER
```

### PostgreSQL

```yaml
View:
  - name: product_sales
    comment: Product sales view
    query: |
      SELECT
        p.id,
        p.name,
        COALESCE(SUM(od.quantity), 0) as total_sold
      FROM products p
      LEFT JOIN order_details od ON p.id = od.product_id
      GROUP BY p.id, p.name
    withCheckOption: true  # WITH CHECK OPTION
    securityBarrier: true  # Security barrier
```

### Materialized View (PostgreSQL)

```yaml
View:
  - name: daily_sales_summary
    comment: Daily sales summary materialized view
    selectType: MATERIALIZED
    query: |
      SELECT
        DATE(order_date) as sale_date,
        COUNT(*) as order_count,
        SUM(total_amount) as total_sales
      FROM orders
      GROUP BY DATE(order_date)
    afterCreates:
      - sql: |
          CREATE UNIQUE INDEX ON daily_sales_summary (sale_date)
        dbms: postgresql
```

### Oracle

```yaml
View:
  - name: employee_details
    comment: Employee details view
    query: |
      SELECT
        e.employee_id,
        e.first_name,
        e.last_name,
        d.department_name
      FROM employees e
      JOIN departments d ON e.department_id = d.department_id
    force: false  # FORCE option (create even with compilation errors)
    readOnly: true  # READ ONLY
```

### SQL Server

```yaml
View:
  - name: sales_report
    comment: Sales report view
    query: |
      SELECT
        p.product_name,
        SUM(od.quantity) as total_quantity,
        SUM(od.quantity * od.unit_price) as total_revenue
      FROM products p
      JOIN order_details od ON p.product_id = od.product_id
      GROUP BY p.product_name
    binding: SCHEMA  # SCHEMABINDING: enforce schema binding
    encryption: true  # ENCRYPTION: encrypt view definition
```

### SQLite

```yaml
View:
  - name: user_profile
    comment: User profile view
    query: |
      SELECT
        u.id,
        u.username,
        u.email,
        p.avatar_url,
        p.bio
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
    # SQLite does not support materialized views or advanced options
```

## Best Practices

### 1. Use Views to Simplify Complex Queries

```yaml
# Complex query encapsulated in view
View:
  - name: customer_lifetime_value
    query: |
      SELECT
        c.customer_id,
        c.name,
        SUM(o.total_amount) as lifetime_value,
        COUNT(o.id) as total_orders,
        MIN(o.order_date) as first_order_date,
        MAX(o.order_date) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.customer_id = o.customer_id
      GROUP BY c.customer_id, c.name

# Application uses simple query
# SELECT * FROM customer_lifetime_value WHERE lifetime_value > 1000
```

### 2. Use Materialized Views for Performance

```yaml
View:
  - name: monthly_revenue
    selectType: MATERIALIZED
    query: |
      SELECT
        DATE_TRUNC('month', order_date) as month,
        SUM(total_amount) as revenue
      FROM orders
      GROUP BY DATE_TRUNC('month', order_date)
    afterCreates:
      - sql: |
          CREATE UNIQUE INDEX idx_month ON monthly_revenue (month)
        dbms: postgresql
    # Refresh strategy can be defined in lifecycle hooks
```

### 3. Use Security Views to Control Access

```yaml
View:
  - name: user_public_profile
    query: |
      SELECT
        id,
        username,
        display_name,
        avatar_url,
        bio
      FROM users
      -- Excludes: email, password_hash, phone, etc.
```

### 4. Document View Purpose with Comments

```yaml
View:
  - name: order_fulfillment_status
    comment: |
      View for order fulfillment team.
      Shows orders that need processing, filtering completed orders.
      Updated: 2024-01-15
    query: |
      SELECT
        o.order_id,
        o.order_date,
        c.customer_name,
        s.status_name,
        o.total_amount
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN order_status s ON o.status_id = s.status_id
      WHERE s.status_name NOT IN ('Delivered', 'Cancelled')
```

### 5. Use Lifecycle Hooks for View Dependencies

```yaml
View:
  - name: analytics_report
    query: |
      SELECT * FROM analytics_data WHERE created_at > '2024-01-01'
    beforeCreates:
      - sql: |
          -- Ensure base table exists
          CREATE TABLE IF NOT EXISTS analytics_data (
            id BIGINT PRIMARY KEY,
            created_at TIMESTAMP
          )
        dbms: mysql
    afterCreates:
      - sql: |
          -- Grant permissions to analytics team
          GRANT SELECT ON analytics_report TO analytics_role
        dbms: postgresql
```

## Complete Examples

### E-commerce Customer View

```yaml
View:
  - name: customer_summary
    comment: Customer summary view for dashboard
    query: |
      SELECT
        c.id as customer_id,
        c.name as customer_name,
        c.email,
        c.status,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.order_date) as last_order_date,
        DATEDIFF(NOW(), MAX(o.order_date)) as days_since_last_order
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      GROUP BY c.id, c.name, c.email, c.status
```

### Inventory Status View

```yaml
View:
  - name: inventory_status
    comment: Inventory status view
    query: |
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.category,
        s.quantity as stock_quantity,
        s.quantity - COALESCE(reserved.reserved_qty, 0) as available_quantity,
        CASE
          WHEN s.quantity = 0 THEN 'Out of Stock'
          WHEN s.quantity - COALESCE(reserved.reserved_qty, 0) <= 10 THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status
      FROM products p
      JOIN stock s ON p.id = s.product_id
      LEFT JOIN (
        SELECT product_id, SUM(quantity) as reserved_qty
        FROM reserved_stock
        GROUP BY product_id
      ) reserved ON p.id = reserved.product_id
```

## Related Documentation

- [Table Definition](./table.md)
- [Lifecycle Hooks](./lifecycle-hooks.md)
- [Schema Loader](../api/schema-loader.md)
- [Database Support](../databases/README.md)
