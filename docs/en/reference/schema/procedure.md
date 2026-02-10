---
icon: code
title: Stored Procedure Definition
order: 11
category:
  - Reference
  - Schema Definition
tag:
  - procedure
  - schema
  - stored-procedure
---

# Stored Procedure Definition

Stored Procedures are precompiled SQL statement sets stored in the database that can be called repeatedly. They are used to encapsulate complex business logic, improve performance, and reduce network transmission.

## Basic Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | String | No | Unique identifier, used for reference |
| `name` | String | Yes | Procedure name |
| `parameters` | List<Parameter> | No | Parameter list |
| `content` | String | Yes | Procedure content |
| `returnType` | String | No | Return value type |
| `comment` | String | No | Procedure comment |
| `dbms` | List<String> | No | Applicable database list |

## Parameter Definition

### Parameter Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | String | Parameter name |
| `type` | String | Parameter type |
| `mode` | ParameterMode | Parameter mode (IN/OUT/INOUT) |
| `defaultValue` | String | Default value |

### Parameter Modes

| Mode | Description |
|------|-------------|
| `IN` | Input parameter (default) |
| `OUT` | Output parameter |
| `INOUT` | Input/output parameter |

## Basic Examples

### Simple Stored Procedure

```yaml
Procedure:
  - name: sp_get_user_by_id
    comment: Get user information by ID
    parameters:
      - name: p_user_id
        type: BIGINT
        mode: IN
    content: |
      SELECT *
      FROM users
      WHERE id = p_user_id;
```

### Stored Procedure with Output Parameter

```yaml
Procedure:
  - name: sp_create_user
    comment: Create user and return new user ID
    parameters:
      - name: p_username
        type: VARCHAR(50)
        mode: IN
      - name: p_email
        type: VARCHAR(100)
        mode: IN
      - name: p_user_id
        type: BIGINT
        mode: OUT
    content: |
      INSERT INTO users (username, email, created_at, updated_at)
      VALUES (p_username, p_email, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

      SET p_user_id = LAST_INSERT_ID();
```

### Stored Procedure with Multiple Parameters

```yaml
Procedure:
  - name: sp_update_user_status
    comment: Update user status
    parameters:
      - name: p_user_id
        type: BIGINT
        mode: IN
      - name: p_status
        type: VARCHAR(20)
        mode: IN
      - name: p_result
        type: INT
        mode: OUT
    content: |
      UPDATE users
      SET status = p_status,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = p_user_id;

      SET p_result = ROW_COUNT();
```

## Common Stored Procedure Scenarios

### Data Validation and Processing

```yaml
Procedure:
  - name: sp_process_order
    comment: Process order
    parameters:
      - name: p_order_id
        type: BIGINT
        mode: IN
      - name: p_result
        type: VARCHAR(100)
        mode: OUT
    content: |
      DECLARE v_status VARCHAR(20);
      DECLARE v_user_id BIGINT;

      -- Get order information
      SELECT status, user_id INTO v_status, v_user_id
      FROM orders
      WHERE id = p_order_id;

      -- Validate order status
      IF v_status IS NULL THEN
        SET p_result = 'Order not found';
      ELSEIF v_status != 'pending' THEN
        SET p_result = 'Order already processed';
      ELSE
        -- Process order
        UPDATE orders
        SET status = 'processing',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_order_id;

        SET p_result = 'Order processed successfully';
      END IF;
```

### Batch Operations

```yaml
Procedure:
  - name: sp_bulk_update_status
    comment: Batch update status
    parameters:
      - name: p_status
        type: VARCHAR(20)
        mode: IN
      - name: p_old_status
        type: VARCHAR(20)
        mode: IN
      - name: p_affected_rows
        type: INT
        mode: OUT
    content: |
      UPDATE orders
      SET status = p_status,
          updated_at = CURRENT_TIMESTAMP
      WHERE status = p_old_status
        AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY);

      SET p_affected_rows = ROW_COUNT();
```

### Report Generation

```yaml
Procedure:
  - name: sp_generate_daily_report
    comment: Generate daily report
    parameters:
      - name: p_report_date
        type: DATE
        mode: IN
    content: |
      -- Create temporary table to store results
      CREATE TEMPORARY TABLE temp_daily_report AS
      SELECT
        u.id AS user_id,
        u.username,
        COUNT(DISTINCT o.id) AS order_count,
        COALESCE(SUM(o.total_amount), 0) AS total_amount
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
          AND DATE(o.created_at) = p_report_date
      GROUP BY u.id, u.username;

      -- Return results
      SELECT * FROM temp_daily_report;

      -- Clean up temporary table
      DROP TEMPORARY TABLE IF EXISTS temp_daily_report;
```

### Data Cleanup

```yaml
Procedure:
  - name: sp_cleanup_old_data
    comment: Clean up old data
    parameters:
      - name: p_days_to_keep
        type: INT
        mode: IN
      - name: p_deleted_count
        type: INT
        mode: OUT
    content: |
      -- Clean up old soft-deleted data
      DELETE FROM users
      WHERE is_deleted = TRUE
        AND deleted_at < DATE_SUB(CURRENT_DATE, INTERVAL p_days_to_keep DAY);

      SET p_deleted_count = ROW_COUNT();

      -- Clean up old logs
      DELETE FROM audit_log
      WHERE created_at < DATE_SUB(CURRENT_DATE, INTERVAL p_days_to_keep DAY);

      SET p_deleted_count = p_deleted_count + ROW_COUNT();
```

## Database-Specific Stored Procedures

### MySQL Stored Procedures

```yaml
Procedure:
  - name: sp_get_user_orders
    dbms: [mysql]
    comment: Get user orders
    parameters:
      - name: p_user_id
        type: BIGINT
        mode: IN
    content: |
      SELECT
        o.id,
        o.order_no,
        o.status,
        o.total_amount,
        o.created_at
      FROM orders o
      WHERE o.user_id = p_user_id
      ORDER BY o.created_at DESC;
```

### PostgreSQL Stored Procedures (Functions)

PostgreSQL uses functions instead of stored procedures:

```yaml
Procedure:
  - name: get_user_orders
    dbms: [postgresql]
    comment: Get user orders
    parameters:
      - name: p_user_id
        type: BIGINT
        mode: IN
    returnType: TABLE
    content: |
      RETURNS TABLE (
        order_id BIGINT,
        order_no VARCHAR,
        status VARCHAR,
        total_amount DECIMAL,
        created_at TIMESTAMP
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT
          o.id,
          o.order_no,
          o.status,
          o.total_amount,
          o.created_at
        FROM orders o
        WHERE o.user_id = p_user_id
        ORDER BY o.created_at DESC;
      END;
      $$ LANGUAGE plpgsql;
```

### Oracle Stored Procedures

```yaml
Procedure:
  - name: sp_create_user
    dbms: [oracle]
    comment: Create user
    parameters:
      - name: p_username
        type: VARCHAR2
        mode: IN
      - name: p_email
        type: VARCHAR2
        mode: IN
      - name: p_user_id
        type: NUMBER
        mode: OUT
    content: |
      BEGIN
        INSERT INTO users (username, email, created_at, updated_at)
        VALUES (p_username, p_email, SYSTIMESTAMP, SYSTIMESTAMP)
        RETURNING id INTO p_user_id;

        COMMIT;
      EXCEPTION
        WHEN OTHERS THEN
          ROLLBACK;
          RAISE;
      END;
```

## Stored Procedure Renaming

Use `formerNames` to track stored procedure renames:

```yaml
Procedure:
  - name: sp_get_user_by_id
    formerNames: [get_user, fetch_user]
    parameters:
      - name: p_user_id
        type: BIGINT
        mode: IN
    content: |
      SELECT * FROM users WHERE id = p_user_id;
```

## Complete Examples

### E-commerce System Stored Procedure Definitions

```yaml
Procedure:
  # User-related stored procedures
  - name: sp_create_user
    comment: Create user
    parameters:
      - name: p_username
        type: VARCHAR(50)
        mode: IN
      - name: p_email
        type: VARCHAR(100)
        mode: IN
      - name: p_password_hash
        type: VARCHAR(255)
        mode: IN
      - name: p_user_id
        type: BIGINT
        mode: OUT
    content: |
      INSERT INTO users (username, email, password_hash, status, created_at, updated_at)
      VALUES (p_username, p_email, p_password_hash, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

      SET p_user_id = LAST_INSERT_ID();

  - name: sp_update_user_status
    comment: Update user status
    parameters:
      - name: p_user_id
        type: BIGINT
        mode: IN
      - name: p_status
        type: VARCHAR(20)
        mode: IN
      - name: p_result
        type: INT
        mode: OUT
    content: |
      UPDATE users
      SET status = p_status,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = p_user_id;

      SET p_result = ROW_COUNT();

  - name: sp_get_user_statistics
    comment: Get user statistics
    parameters:
      - name: p_user_id
        type: BIGINT
        mode: IN
    content: |
      SELECT
        u.id AS user_id,
        u.username,
        u.email,
        COUNT(DISTINCT o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent,
        MAX(o.created_at) AS last_order_date,
        u.created_at AS member_since
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.id = p_user_id
      GROUP BY u.id, u.username, u.email, u.created_at;

  # Order-related stored procedures
  - name: sp_create_order
    comment: Create order
    parameters:
      - name: p_user_id
        type: BIGINT
        mode: IN
      - name: p_order_no
        type: VARCHAR(50)
        mode: IN
      - name: p_total_amount
        type: DECIMAL(10,2)
        mode: IN
      - name: p_order_id
        type: BIGINT
        mode: OUT
      - name: p_result
        type: VARCHAR(100)
        mode: OUT
    content: |
      DECLARE v_user_status VARCHAR(20);

      -- Check user status
      SELECT status INTO v_user_status
      FROM users
      WHERE id = p_user_id;

      IF v_user_status IS NULL THEN
        SET p_result = 'User not found';
      ELSEIF v_user_status != 'active' THEN
        SET p_result = 'User is not active';
      ELSE
        -- Create order
        INSERT INTO orders (user_id, order_no, total_amount, status, created_at, updated_at)
        VALUES (p_user_id, p_order_no, p_total_amount, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

        SET p_order_id = LAST_INSERT_ID();
        SET p_result = 'Order created successfully';
      END IF;

  - name: sp_update_order_status
    comment: Update order status
    parameters:
      - name: p_order_id
        type: BIGINT
        mode: IN
      - name: p_status
        type: VARCHAR(20)
        mode: IN
      - name: p_result
        type: VARCHAR(100)
        mode: OUT
    content: |
      DECLARE v_current_status VARCHAR(20);

      -- Get current status
      SELECT status INTO v_current_status
      FROM orders
      WHERE id = p_order_id;

      IF v_current_status IS NULL THEN
        SET p_result = 'Order not found';
      ELSEIF v_current_status = 'completed' THEN
        SET p_result = 'Cannot update completed order';
      ELSE
        -- Update status
        UPDATE orders
        SET status = p_status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_order_id;

        SET p_result = 'Order status updated';
      END IF;

  - name: sp_cancel_order
    comment: Cancel order
    parameters:
      - name: p_order_id
        type: BIGINT
        mode: IN
      - name: p_result
        type: VARCHAR(100)
        mode: OUT
    content: |
      DECLARE v_status VARCHAR(20);

      -- Get order status
      SELECT status INTO v_status
      FROM orders
      WHERE id = p_order_id;

      IF v_status IS NULL THEN
        SET p_result = 'Order not found';
      ELSEIF v_status IN ('shipped', 'completed') THEN
        SET p_result = 'Cannot cancel shipped or completed order';
      ELSE
        -- Cancel order
        UPDATE orders
        SET status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_order_id;

        -- Restore inventory
        UPDATE order_items oi
        INNER JOIN products p ON oi.product_id = p.id
        SET p.stock = p.stock + oi.quantity
        WHERE oi.order_id = p_order_id;

        SET p_result = 'Order cancelled';
      END IF;

  # Product-related stored procedures
  - name: sp_update_product_stock
    comment: Update product stock
    parameters:
      - name: p_product_id
        type: BIGINT
        mode: IN
      - name: p_quantity_change
        type: INT
        mode: IN
      - name: p_new_stock
        type: INT
        mode: OUT
    content: |
      UPDATE products
      SET stock = stock + p_quantity_change,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = p_product_id;

      SELECT stock INTO p_new_stock
      FROM products
      WHERE id = p_product_id;

  - name: sp_check_low_stock
    comment: Check low stock products
    content: |
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.stock,
        p.low_stock_threshold,
        (p.low_stock_threshold - p.stock) AS stock_needed
      FROM products p
      WHERE p.stock <= p.low_stock_threshold
        AND p.status = 'active'
      ORDER BY p.stock ASC;

  # Report-related stored procedures
  - name: sp_daily_sales_report
    comment: Generate daily sales report
    parameters:
      - name: p_report_date
        type: DATE
        mode: IN
    content: |
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        c.name AS category_name,
        COUNT(DISTINCT o.id) AS order_count,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.quantity * oi.price) AS total_revenue,
        AVG(oi.price) AS avg_price
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
          AND DATE(o.created_at) = p_report_date
          AND o.status = 'completed'
      GROUP BY p.id, p.name, c.name
      HAVING total_sold > 0
      ORDER BY total_revenue DESC;

  - name: sp_user_activity_report
    comment: User activity report
    parameters:
      - name: p_start_date
        type: DATE
        mode: IN
      - name: p_end_date
        type: DATE
        mode: IN
    content: |
      SELECT
        u.id AS user_id,
        u.username,
        u.email,
        COUNT(DISTINCT o.id) AS order_count,
        COALESCE(SUM(o.total_amount), 0) AS total_spent,
        MAX(o.created_at) AS last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
          AND o.created_at BETWEEN p_start_date AND p_end_date
          AND o.status = 'completed'
      GROUP BY u.id, u.username, u.email
      ORDER BY total_spent DESC;
```

## Advanced Usage

### Transaction Handling

```yaml
Procedure:
  - name: sp_transfer_order
    comment: Transfer order ownership
    parameters:
      - name: p_order_id
        type: BIGINT
        mode: IN
      - name: p_new_user_id
        type: BIGINT
        mode: IN
      - name: p_result
        type: VARCHAR(100)
        mode: OUT
    content: |
      DECLARE EXIT HANDLER FOR SQLEXCEPTION
      BEGIN
        ROLLBACK;
        SET p_result = 'Error transferring order';
      END;

      START TRANSACTION;

      -- Verify new user exists
      IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_new_user_id AND status = 'active') THEN
        SET p_result = 'New user not found or inactive';
        ROLLBACK;
      ELSE
        -- Update order owner
        UPDATE orders
        SET user_id = p_new_user_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_order_id;

        COMMIT;
        SET p_result = 'Order transferred successfully';
      END IF;
```

### Error Handling

```yaml
Procedure:
  - name: sp_safe_division
    comment: Safe division
    parameters:
      - name: p_dividend
        type: DECIMAL(10,2)
        mode: IN
      - name: p_divisor
        type: DECIMAL(10,2)
        mode: IN
      - name: p_result
        type: DECIMAL(10,2)
        mode: OUT
      - name: p_error_message
        type: VARCHAR(255)
        mode: OUT
    content: |
      BEGIN
        DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
        BEGIN
          SET p_result = 0;
          SET p_error_message = 'Division by zero or error';
        END;

        IF p_divisor = 0 THEN
          SET p_result = 0;
          SET p_error_message = 'Division by zero';
        ELSE
          SET p_result = p_dividend / p_divisor;
          SET p_error_message = NULL;
        END IF;
      END;
```

## Best Practices

### 1. Stored Procedure Naming Convention

```yaml
# Recommended naming convention
Procedure:
  - name: sp_{verb}_{entity}     # Standard naming
  - name: sp_{entity}_{action}  # Action naming

# Examples
Procedure:
  - name: sp_create_user
  - name: sp_get_user_orders
  - name: sp_update_order_status
```

### 2. Parameter Naming Convention

```yaml
# Use prefix to distinguish parameters
Procedure:
  - name: sp_update_user
    parameters:
      - name: p_user_id     # p_ prefix indicates parameter
        type: BIGINT
        mode: IN
      - name: p_username
        type: VARCHAR(50)
        mode: IN
```

### 3. Add Comments and Documentation

```yaml
Procedure:
  - name: sp_process_order
    comment: |
      Process order:
      1. Validate order status
      2. Check user status
      3. Update order status
      4. Log processing
    parameters:
      - name: p_order_id
        type: BIGINT
        mode: IN
    content: |
      -- Implementation logic
```

### 4. Error Handling

```yaml
Procedure:
  - name: sp_safe_operation
    content: |
      DECLARE EXIT HANDLER FOR SQLEXCEPTION
      BEGIN
        -- Error handling
        ROLLBACK;
        -- Log error
      END;

      -- Main logic
```

## Common Questions

### Stored Procedure vs Function?

| Stored Procedure | Function |
|------------------|----------|
| Can execute DML operations | Usually only returns values |
| Can have multiple output parameters | Returns single value |
| Cannot be used directly in SELECT | Can be used in SELECT |
| For complex business logic | For calculations and conversions |

### How to Debug Stored Procedures?

Use temporary tables or log records:

```yaml
Procedure:
  - name: sp_debug_example
    content: |
      -- Log debug information
      INSERT INTO debug_log (message, created_at)
      VALUES ('Debug point 1', CURRENT_TIMESTAMP);

      -- Main logic
```

### How to Optimize Stored Procedure Performance?

1. Reduce network round trips (batch operations)
2. Use appropriate indexes
3. Avoid cursors (use set operations)
4. Optimize SQL queries

## Related Documentation

- [Table Definition](./table.md)
- [Trigger Definition](./trigger.md)
- [Lifecycle Hooks](./lifecycle-hooks.md)
