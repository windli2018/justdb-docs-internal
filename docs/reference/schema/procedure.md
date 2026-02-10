---
icon: code
title: 存储过程定义
order: 9
category:
  - 参考文档
  - Schema 定义
tag:
  - procedure
  - schema
  - stored-procedure
---

# 存储过程定义 (Procedure)

存储过程（Procedure）是预编译的 SQL 语句集合，存储在数据库中可以重复调用。存储过程用于封装复杂的业务逻辑，提高性能并减少网络传输。

## 基本属性

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | String | 否 | 唯一标识符，用于引用 |
| `name` | String | 是 | 存储过程名称 |
| `parameters` | List<Parameter&gt;> | 否 | 参数列表 |
| `content` | String | 是 | 存储过程内容 |
| `returnType` | String | 否 | 返回值类型 |
| `comment` | String | 否 | 存储过程注释 |
| `dbms` | List&lt;String&gt; | 否 | 适用数据库列表 |

## 参数定义

### 参数属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | String | 参数名称 |
| `type` | String | 参数类型 |
| `mode` | ParameterMode | 参数模式（IN/OUT/INOUT） |
| `defaultValue` | String | 默认值 |

### 参数模式

| 模式 | 说明 |
|------|------|
| `IN` | 输入参数（默认） |
| `OUT` | 输出参数 |
| `INOUT` | 输入输出参数 |

## 基本示例

### 简单存储过程

```yaml
Procedure:
  - name: sp_get_user_by_id
    comment: 根据ID获取用户信息
    parameters:
      - name: p_user_id
        type: BIGINT
        mode: IN
    content: |
      SELECT *
      FROM users
      WHERE id = p_user_id;
```

### 带输出参数的存储过程

```yaml
Procedure:
  - name: sp_create_user
    comment: 创建用户并返回新用户ID
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

### 带多个参数的存储过程

```yaml
Procedure:
  - name: sp_update_user_status
    comment: 更新用户状态
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

## 常见存储过程场景

### 数据验证和处理

```yaml
Procedure:
  - name: sp_process_order
    comment: 处理订单
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

      -- 获取订单信息
      SELECT status, user_id INTO v_status, v_user_id
      FROM orders
      WHERE id = p_order_id;

      -- 验证订单状态
      IF v_status IS NULL THEN
        SET p_result = 'Order not found';
      ELSEIF v_status != 'pending' THEN
        SET p_result = 'Order already processed';
      ELSE
        -- 处理订单
        UPDATE orders
        SET status = 'processing',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_order_id;

        SET p_result = 'Order processed successfully';
      END IF;
```

### 批量操作

```yaml
Procedure:
  - name: sp_bulk_update_status
    comment: 批量更新状态
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

### 报表生成

```yaml
Procedure:
  - name: sp_generate_daily_report
    comment: 生成日报表
    parameters:
      - name: p_report_date
        type: DATE
        mode: IN
    content: |
      -- 创建临时表存储结果
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

      -- 返回结果
      SELECT * FROM temp_daily_report;

      -- 清理临时表
      DROP TEMPORARY TABLE IF EXISTS temp_daily_report;
```

### 数据清理

```yaml
Procedure:
  - name: sp_cleanup_old_data
    comment: 清理旧数据
    parameters:
      - name: p_days_to_keep
        type: INT
        mode: IN
      - name: p_deleted_count
        type: INT
        mode: OUT
    content: |
      -- 清理旧的软删除数据
      DELETE FROM users
      WHERE is_deleted = TRUE
        AND deleted_at < DATE_SUB(CURRENT_DATE, INTERVAL p_days_to_keep DAY);

      SET p_deleted_count = ROW_COUNT();

      -- 清理旧的日志
      DELETE FROM audit_log
      WHERE created_at < DATE_SUB(CURRENT_DATE, INTERVAL p_days_to_keep DAY);

      SET p_deleted_count = p_deleted_count + ROW_COUNT();
```

## 数据库特定存储过程

### MySQL 存储过程

```yaml
Procedure:
  - name: sp_get_user_orders
    dbms: [mysql]
    comment: 获取用户订单
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

### PostgreSQL 存储过程（函数）

PostgreSQL 使用函数而不是存储过程：

```yaml
Procedure:
  - name: get_user_orders
    dbms: [postgresql]
    comment: 获取用户订单
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

### Oracle 存储过程

```yaml
Procedure:
  - name: sp_create_user
    dbms: [oracle]
    comment: 创建用户
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

## 存储过程重命名

使用 `formerNames` 追踪存储过程重命名：

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

## 完整示例

### 电商系统存储过程定义

```yaml
Procedure:
  # 用户相关存储过程
  - name: sp_create_user
    comment: 创建用户
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
    comment: 更新用户状态
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
    comment: 获取用户统计信息
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

  # 订单相关存储过程
  - name: sp_create_order
    comment: 创建订单
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

      -- 检查用户状态
      SELECT status INTO v_user_status
      FROM users
      WHERE id = p_user_id;

      IF v_user_status IS NULL THEN
        SET p_result = 'User not found';
      ELSEIF v_user_status != 'active' THEN
        SET p_result = 'User is not active';
      ELSE
        -- 创建订单
        INSERT INTO orders (user_id, order_no, total_amount, status, created_at, updated_at)
        VALUES (p_user_id, p_order_no, p_total_amount, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

        SET p_order_id = LAST_INSERT_ID();
        SET p_result = 'Order created successfully';
      END IF;

  - name: sp_update_order_status
    comment: 更新订单状态
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

      -- 获取当前状态
      SELECT status INTO v_current_status
      FROM orders
      WHERE id = p_order_id;

      IF v_current_status IS NULL THEN
        SET p_result = 'Order not found';
      ELSEIF v_current_status = 'completed' THEN
        SET p_result = 'Cannot update completed order';
      ELSE
        -- 更新状态
        UPDATE orders
        SET status = p_status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_order_id;

        SET p_result = 'Order status updated';
      END IF;

  - name: sp_cancel_order
    comment: 取消订单
    parameters:
      - name: p_order_id
        type: BIGINT
        mode: IN
      - name: p_result
        type: VARCHAR(100)
        mode: OUT
    content: |
      DECLARE v_status VARCHAR(20);

      -- 获取订单状态
      SELECT status INTO v_status
      FROM orders
      WHERE id = p_order_id;

      IF v_status IS NULL THEN
        SET p_result = 'Order not found';
      ELSEIF v_status IN ('shipped', 'completed') THEN
        SET p_result = 'Cannot cancel shipped or completed order';
      ELSE
        -- 取消订单
        UPDATE orders
        SET status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_order_id;

        -- 恢复库存
        UPDATE order_items oi
        INNER JOIN products p ON oi.product_id = p.id
        SET p.stock = p.stock + oi.quantity
        WHERE oi.order_id = p_order_id;

        SET p_result = 'Order cancelled';
      END IF;

  # 商品相关存储过程
  - name: sp_update_product_stock
    comment: 更新商品库存
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
    comment: 检查低库存商品
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

  # 报表相关存储过程
  - name: sp_daily_sales_report
    comment: 生成每日销售报表
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
    comment: 用户活跃度报表
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

## 高级用法

### 事务处理

```yaml
Procedure:
  - name: sp_transfer_order
    comment: 转移订单所有权
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

      -- 验证新用户存在
      IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_new_user_id AND status = 'active') THEN
        SET p_result = 'New user not found or inactive';
        ROLLBACK;
      ELSE
        -- 更新订单所有者
        UPDATE orders
        SET user_id = p_new_user_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_order_id;

        COMMIT;
        SET p_result = 'Order transferred successfully';
      END IF;
```

### 错误处理

```yaml
Procedure:
  - name: sp_safe_division
    comment: 安全除法
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

## 最佳实践

### 1. 存储过程命名规范

```yaml
# 推荐的命名规范
Procedure:
  - name: sp_{verb}_{entity}     # 标准命名
  - name: sp_{entity}_{action}  # 动作命名

# 示例
Procedure:
  - name: sp_create_user
  - name: sp_get_user_orders
  - name: sp_update_order_status
```

### 2. 参数命名规范

```yaml
# 使用前缀区分参数
Procedure:
  - name: sp_update_user
    parameters:
      - name: p_user_id     # p_ 前缀表示参数
        type: BIGINT
        mode: IN
      - name: p_username
        type: VARCHAR(50)
        mode: IN
```

### 3. 添加注释和文档

```yaml
Procedure:
  - name: sp_process_order
    comment: |
      处理订单：
      1. 验证订单状态
      2. 检查用户状态
      3. 更新订单状态
      4. 记录处理日志
    parameters:
      - name: p_order_id
        type: BIGINT
        mode: IN
    content: |
      -- 实现逻辑
```

### 4. 错误处理

```yaml
Procedure:
  - name: sp_safe_operation
    content: |
      DECLARE EXIT HANDLER FOR SQLEXCEPTION
      BEGIN
        -- 错误处理
        ROLLBACK;
        -- 记录错误
      END;

      -- 主要逻辑
```

## 常见问题

### 存储过程 vs 函数？

| 存储过程 | 函数 |
|---------|------|
| 可以执行 DML 操作 | 通常只返回值 |
| 可以有多个输出参数 | 返回单个值 |
| 不可以直接在 SELECT 中使用 | 可以在 SELECT 中使用 |
| 用于复杂业务逻辑 | 用于计算和转换 |

### 如何调试存储过程？

使用临时表或日志记录：

```yaml
Procedure:
  - name: sp_debug_example
    content: |
      -- 记录调试信息
      INSERT INTO debug_log (message, created_at)
      VALUES ('Debug point 1', CURRENT_TIMESTAMP);

      -- 主要逻辑
```

### 如何优化存储过程性能？

1. 减少网络往返（批量操作）
2. 使用适当的索引
3. 避免游标（使用集合操作）
4. 优化 SQL 查询

## 相关文档

- [表定义](./table.md)
- [触发器定义](./trigger.md)
