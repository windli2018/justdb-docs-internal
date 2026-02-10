---
icon: bolt
title: 触发器定义
order: 8
category:
  - 参考文档
  - Schema 定义
tag:
  - trigger
  - schema
  - automation
---

# 触发器定义 (Trigger)

触发器（Trigger）是数据库中在特定事件发生时自动执行的存储程序。触发器用于在数据插入、更新或删除前后自动执行业务逻辑。

## 基本属性

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | String | 否 | 唯一标识符，用于引用 |
| `name` | String | 是 | 触发器名称 |
| `tableName` | String | 是 | 触发器所属的表 |
| `event` | TriggerEvent | 是 | 触发事件 |
| `timing` | TriggerTiming | 是 | 触发时机 |
| `content` | String | 是 | 触发器内容 |
| `comment` | String | 否 | 触发器注释 |
| `dbms` | List<String> | 否 | 适用数据库列表 |

## 触发事件

| 事件 | 说明 |
|------|------|
| `INSERT` | 插入数据时触发 |
| `UPDATE` | 更新数据时触发 |
| `DELETE` | 删除数据时触发 |

## 触发时机

| 时机 | 说明 |
|------|------|
| `BEFORE` | 在操作执行前触发 |
| `AFTER` | 在操作执行后触发 |
| `INSTEAD OF` | 替代操作执行（视图触发器） |

## 基本示例

### BEFORE INSERT 触发器

在插入数据前自动设置默认值：

```yaml
Trigger:
  - name: trg_users_before_insert
    tableName: users
    event: INSERT
    timing: BEFORE
    comment: 用户创建前设置时间戳
    content: |
      SET NEW.created_at = CURRENT_TIMESTAMP;
      SET NEW.updated_at = CURRENT_TIMESTAMP;
```

生成的 SQL（MySQL）：
```sql
CREATE TRIGGER trg_users_before_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  SET NEW.created_at = CURRENT_TIMESTAMP;
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END;
```

### AFTER UPDATE 触发器

在更新数据后记录审计日志：

```yaml
Trigger:
  - name: trg_users_after_update
    tableName: users
    event: UPDATE
    timing: AFTER
    comment: 用户更新后记录审计日志
    content: |
      INSERT INTO user_audit_log (user_id, action, changed_at, changed_by)
      VALUES (NEW.id, 'UPDATE', CURRENT_TIMESTAMP, CURRENT_USER());
```

### BEFORE DELETE 触发器

在删除数据前进行检查：

```yaml
Trigger:
  - name: trg_users_before_delete
    tableName: users
    event: DELETE
    timing: BEFORE
    comment: 删除用户前检查是否有订单
    content: |
      IF EXISTS (SELECT 1 FROM orders WHERE user_id = OLD.id AND status != 'cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete user with active orders';
      END IF;
```

## 常见触发器场景

### 自动更新时间戳

```yaml
Trigger:
  - name: trg_users_before_update
    tableName: users
    event: UPDATE
    timing: BEFORE
    content: |
      SET NEW.updated_at = CURRENT_TIMESTAMP;
```

### 软删除

```yaml
Trigger:
  - name: trg_users_before_delete
    tableName: users
    event: DELETE
    timing: BEFORE
    content: |
      -- 不真正删除，而是标记为已删除
      SET NEW.is_deleted = TRUE;
      SET NEW.deleted_at = CURRENT_TIMESTAMP;
      -- 取消删除操作
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Use soft delete instead';
```

### 数据验证

```yaml
Trigger:
  - name: trg_orders_before_insert
    tableName: orders
    event: INSERT
    timing: BEFORE
    content: |
      -- 验证订单金额
      IF NEW.total_amount <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Order amount must be positive';
      END IF;

      -- 验证用户状态
      IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.user_id AND status = 'active') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User must be active to create order';
      END IF;
```

### 审计日志

```yaml
Trigger:
  - name: trg_orders_after_update
    tableName: orders
    event: UPDATE
    timing: AFTER
    content: |
      INSERT INTO order_audit_log (
        order_id,
        old_status,
        new_status,
        changed_at,
        changed_by
      ) VALUES (
        NEW.id,
        OLD.status,
        NEW.status,
        CURRENT_TIMESTAMP,
        CURRENT_USER()
      );
```

### 级联更新

```yaml
Trigger:
  - name: trg_users_after_update
    tableName: users
    event: UPDATE
    timing: AFTER
    content: |
      -- 用户状态变更时更新相关订单
      IF NEW.status != OLD.status THEN
        UPDATE orders
        SET user_status = NEW.status
        WHERE user_id = NEW.id;
      END IF;
```

## 数据库特定触发器

### MySQL 触发器

```yaml
Trigger:
  - name: trg_users_before_insert
    tableName: users
    dbms: [mysql]
    event: INSERT
    timing: BEFORE
    content: |
      SET NEW.created_at = NOW();
      SET NEW.updated_at = NOW();
```

### PostgreSQL 触发器

PostgreSQL 触发器需要函数：

```yaml
Trigger:
  - name: trg_users_before_insert
    tableName: users
    dbms: [postgresql]
    event: INSERT
    timing: BEFORE
    # PostgreSQL 触发器函数需要通过钩子创建
```

使用钩子创建 PostgreSQL 触发器：

```yaml
Table:
  - name: users
    afterCreates:
      - dbms: postgresql
        content: |
          -- 创建触发器函数
          CREATE OR REPLACE FUNCTION trg_users_before_insert_func()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.created_at := CURRENT_TIMESTAMP;
            NEW.updated_at := CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          -- 创建触发器
          CREATE TRIGGER trg_users_before_insert
          BEFORE INSERT ON users
          FOR EACH ROW
          EXECUTE FUNCTION trg_users_before_insert_func();
```

### Oracle 触发器

```yaml
Trigger:
  - name: trg_users_before_insert
    tableName: users
    dbms: [oracle]
    event: INSERT
    timing: BEFORE
    content: |
      BEGIN
        :NEW.created_at := SYSTIMESTAMP;
        :NEW.updated_at := SYSTIMESTAMP;
      END;
```

## 触发器重命名

使用 `formerNames` 追踪触发器重命名：

```yaml
Trigger:
  - name: trg_users_before_insert
    formerNames: [bi_users, before_insert_users]
    tableName: users
    event: INSERT
    timing: BEFORE
    content: |
      SET NEW.created_at = CURRENT_TIMESTAMP;
```

## 完整示例

### 电商系统触发器定义

```yaml
Trigger:
  # 用户表触发器
  - name: trg_users_before_insert
    tableName: users
    event: INSERT
    timing: BEFORE
    comment: 用户创建前设置时间戳
    content: |
      SET NEW.created_at = CURRENT_TIMESTAMP;
      SET NEW.updated_at = CURRENT_TIMESTAMP;
      IF NEW.status IS NULL THEN
        SET NEW.status = 'active';
      END IF;

  - name: trg_users_before_update
    tableName: users
    event: UPDATE
    timing: BEFORE
    comment: 用户更新前更新时间戳
    content: |
      SET NEW.updated_at = CURRENT_TIMESTAMP;

  - name: trg_users_after_update
    tableName: users
    event: UPDATE
    timing: AFTER
    comment: 用户状态变更时记录日志
    content: |
      IF NEW.status != OLD.status THEN
        INSERT INTO user_status_log (user_id, old_status, new_status, changed_at)
        VALUES (NEW.id, OLD.status, NEW.status, CURRENT_TIMESTAMP);
      END IF;

  # 订单表触发器
  - name: trg_orders_before_insert
    tableName: orders
    event: INSERT
    timing: BEFORE
    comment: 订单创建前的验证和设置
    content: |
      -- 设置时间戳
      SET NEW.created_at = CURRENT_TIMESTAMP;
      SET NEW.updated_at = CURRENT_TIMESTAMP;

      -- 验证金额
      IF NEW.total_amount <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Order amount must be positive';
      END IF;

      -- 验证用户状态
      IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = NEW.user_id AND status = 'active'
      ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User must be active to create order';
      END IF;

      -- 设置默认状态
      IF NEW.status IS NULL THEN
        SET NEW.status = 'pending';
      END IF;

  - name: trg_orders_after_insert
    tableName: orders
    event: INSERT
    timing: AFTER
    comment: 订单创建后更新库存
    content: |
      -- 更新商品库存（需要从订单明细获取）
      -- 这里简化处理
      INSERT INTO order_events (order_id, event_type, occurred_at)
      VALUES (NEW.id, 'created', CURRENT_TIMESTAMP);

  - name: trg_orders_before_update
    tableName: orders
    event: UPDATE
    timing: BEFORE
    comment: 订单更新前的验证
    content: |
      SET NEW.updated_at = CURRENT_TIMESTAMP;

      -- 状态转换验证
      IF NEW.status != OLD.status THEN
        -- 不允许从已完成状态变更为其他状态
        IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Cannot change status from completed';
        END IF;

        -- 取消订单时检查
        IF NEW.status = 'cancelled' AND OLD.status IN ('processing', 'shipped') THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Cannot cancel order in current status';
        END IF;
      END IF;

  - name: trg_orders_after_update
    tableName: orders
    event: UPDATE
    timing: AFTER
    comment: 订单状态变更后记录事件
    content: |
      IF NEW.status != OLD.status THEN
        INSERT INTO order_status_history (
          order_id,
          old_status,
          new_status,
          changed_at,
          changed_by
        ) VALUES (
          NEW.id,
          OLD.status,
          NEW.status,
          CURRENT_TIMESTAMP,
          CURRENT_USER()
        );
      END IF;

  # 商品表触发器
  - name: trg_products_before_insert
    tableName: products
    event: INSERT
    timing: BEFORE
    comment: 商品创建前设置默认值
    content: |
      IF NEW.stock IS NULL THEN
        SET NEW.stock = 0;
      END IF;
      IF NEW.low_stock_threshold IS NULL THEN
        SET NEW.low_stock_threshold = 10;
      END IF;
      IF NEW.status IS NULL THEN
        SET NEW.status = 'active';
      END IF;

  - name: trg_products_after_update
    tableName: products
    event: UPDATE
    timing: AFTER
    comment: 库存低于阈值时发送警报
    content: |
      IF NEW.stock <= NEW.low_stock_threshold AND NEW.stock != OLD.stock THEN
        INSERT INTO low_stock_alerts (
          product_id,
          stock_level,
          threshold,
          alerted_at
        ) VALUES (
          NEW.id,
          NEW.stock,
          NEW.low_stock_threshold,
          CURRENT_TIMESTAMP
        );
      END IF;

  # 文章表触发器
  - name: trg_articles_before_insert
    tableName: articles
    event: INSERT
    timing: BEFORE
    comment: 文章创建前设置时间戳和状态
    content: |
      SET NEW.created_at = CURRENT_TIMESTAMP;
      SET NEW.updated_at = CURRENT_TIMESTAMP;
      IF NEW.status IS NULL THEN
        SET NEW.status = 'draft';
      END IF;
      IF NEW.view_count IS NULL THEN
        SET NEW.view_count = 0;
      END IF;

  - name: trg_articles_after_update
    tableName: articles
    event: UPDATE
    timing: AFTER
    comment: 文章发布时记录
    content: |
      IF NEW.status = 'published' AND OLD.status != 'published' THEN
        INSERT INTO article_publish_log (
          article_id,
          author_id,
          published_at
        ) VALUES (
          NEW.id,
          NEW.author_id,
          CURRENT_TIMESTAMP
        );
      END IF;
```

## 高级用法

### 条件触发器

只在特定条件下执行：

```yaml
Trigger:
  - name: trg_orders_conditional_update
    tableName: orders
    event: UPDATE
    timing: BEFORE
    content: |
      -- 只在状态变更时更新时间戳
      IF NEW.status != OLD.status THEN
        SET NEW.status_changed_at = CURRENT_TIMESTAMP;
      END IF;
```

### 多事件触发器

为多个事件创建触发器：

```yaml
# MySQL 不支持多事件触发器，需要为每个事件创建
Trigger:
  - name: trg_users_before_insert
    tableName: users
    event: INSERT
    timing: BEFORE
    content: |
      SET NEW.created_at = CURRENT_TIMESTAMP;

  - name: trg_users_before_update
    tableName: users
    event: UPDATE
    timing: BEFORE
    content: |
      SET NEW.updated_at = CURRENT_TIMESTAMP;
```

### 视图触发器（INSTEAD OF）

```yaml
Trigger:
  - name: trg_active_users_insert
    tableName: active_users
    event: INSERT
    timing: INSTEAD OF
    comment: 视图插入触发器
    content: |
      -- 插入到基础表
      INSERT INTO users (username, email, status)
      VALUES (NEW.username, NEW.email, 'active');
```

## 最佳实践

### 1. 触发器命名规范

```yaml
# 推荐的命名规范
Trigger:
  - name: trg_{table}_{timing}_{event}  # 标准触发器
  - name: trg_{table}_{purpose}         # 功能触发器

# 示例
Trigger:
  - name: trg_users_before_insert
  - name: trg_orders_after_update
  - name: trg_products_check_stock
```

### 2. 保持触发器简单

```yaml
# 好的设计：简单的触发器
Trigger:
  - name: trg_users_before_insert
    content: |
      SET NEW.created_at = CURRENT_TIMESTAMP;

# 避免：复杂的业务逻辑
# 应该在应用层处理复杂逻辑
```

### 3. 避免递归触发器

```yaml
# 避免：触发器修改同一张表
Trigger:
  - name: trg_users_after_update
    tableName: users
    event: UPDATE
    timing: AFTER
    content: |
      UPDATE users SET ...  # 可能导致无限递归

# 推荐：使用状态标志或应用层逻辑
```

### 4. 文档化触发器行为

```yaml
Trigger:
  - name: trg_orders_before_update
    comment: |
      订单更新前验证：
      1. 状态转换规则
      2. 金额不能为负
      3. 完成的订单不能修改
    content: |
      -- 验证逻辑
```

## 常见问题

### 触发器会影响性能吗？

是的，触发器会增加操作开销。谨慎使用触发器，只在必要时使用。

### 如何调试触发器？

使用日志表或临时表记录触发器执行：

```yaml
Trigger:
  - name: trg_debug_orders_insert
    tableName: orders
    event: INSERT
    timing: AFTER
    content: |
      INSERT INTO debug_log (message, created_at)
      VALUES (CONCAT('Order created: ', NEW.id), CURRENT_TIMESTAMP);
```

### 如何禁用触发器？

使用数据库特定的命令：

```sql
-- MySQL
DISABLE TRIGGER trg_users_before_insert ON users;

-- PostgreSQL
ALTER TABLE users DISABLE TRIGGER trg_users_before_insert;

-- Oracle
ALTER TRIGGER trg_users_before_insert DISABLE;
```

### 触发器 vs 应用层逻辑？

| 触发器 | 应用层逻辑 |
|--------|-----------|
| 数据库层面保证 | 更灵活 |
| 不容易被绕过 | 易于测试和维护 |
| 难以调试 | 更容易理解和修改 |
| 适合关键业务规则 | 适合复杂业务逻辑 |

## 相关文档

- [表定义](./table.md)
- [存储过程定义](./procedure.md)
- [生命周期钩子](./lifecycle-hooks.md)
