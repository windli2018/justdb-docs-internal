---
icon: eye
title: 视图定义
order: 6
category:
  - 参考文档
  - Schema 定义
tag:
  - view
  - schema
  - query
---

# 视图定义 (View)

视图（View）是虚拟表，基于 SQL 查询结果创建。视图不存储数据，而是在查询时动态生成数据。视图用于简化复杂查询、提供数据安全访问层和抽象数据结构。

## 基本属性

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | String | 否 | 唯一标识符，用于引用 |
| `name` | String | 是 | 视图名称 |
| `referenceId` | String | 否 | 引用其他视图的 id |
| `formerNames` | List<String> | 否 | 曾用名列表 |
| `content` | String | 是 | 视图定义的 SQL 查询 |
| `comment` | String | 否 | 视图注释 |
| `remark` | String | 否 | JustDB 备注 |
| `dbms` | List<String> | 否 | 适用数据库列表 |

## 基本示例

### 简单视图

```yaml
View:
  - name: active_users
    comment: 活跃用户视图
    content: |
      SELECT
        id,
        username,
        email,
        created_at
      FROM users
      WHERE status = 'active'
```

生成的 SQL：
```sql
CREATE VIEW active_users AS
SELECT
  id,
  username,
  email,
  created_at
FROM users
WHERE status = 'active';
```

### 复杂视图

```yaml
View:
  - name: user_order_summary
    comment: 用户订单汇总视图
    content: |
      SELECT
        u.id AS user_id,
        u.username,
        u.email,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent,
        MAX(o.created_at) AS last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.username, u.email
```

## 视图类型

### 连接视图

连接多个表的视图：

```yaml
View:
  - name: order_details
    comment: 订单详情视图
    content: |
      SELECT
        o.id AS order_id,
        o.order_no,
        o.status AS order_status,
        o.total_amount,
        u.username,
        u.email AS user_email,
        p.name AS product_name,
        oi.quantity,
        oi.price AS unit_price
      FROM orders o
      INNER JOIN users u ON o.user_id = u.id
      INNER JOIN order_items oi ON o.id = oi.order_id
      INNER JOIN products p ON oi.product_id = p.id
```

### 聚合视图

包含聚合函数的视图：

```yaml
View:
  - name: sales_report
    comment: 销售报表视图
    content: |
      SELECT
        DATE(created_at) AS sale_date,
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_sales,
        AVG(total_amount) AS average_order_value
      FROM orders
      WHERE status = 'completed'
      GROUP BY DATE(created_at)
```

### 过滤视图

提供数据过滤的视图：

```yaml
View:
  - name: recent_orders
    comment: 最近订单视图
    content: |
      SELECT *
      FROM orders
      WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
        AND status IN ('pending', 'processing', 'shipped')
```

### 安全视图

限制数据访问的视图：

```yaml
View:
  - name: public_user_info
    comment: 公开用户信息视图
    content: |
      SELECT
        id,
        username,
        created_at
      FROM users
      WHERE status = 'active'
```

## 视图重命名

使用 `formerNames` 追踪视图重命名：

```yaml
View:
  - name: active_users
    formerNames: [active_users_v1]
    content: |
      SELECT id, username, email
      FROM users
      WHERE status = 'active'
```

## 数据库特定视图

### MySQL 视图

```yaml
View:
  - name: user_statistics
    dbms: [mysql]
    content: |
      SELECT
        u.id,
        u.username,
        COUNT(DISTINCT o.id) AS order_count,
        SUM(o.total_amount) AS total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.username
```

### PostgreSQL 视图

```yaml
View:
  - name: user_statistics
    dbms: [postgresql]
    content: |
      SELECT
        u.id,
        u.username,
        COUNT(DISTINCT o.id) AS order_count,
        COALESCE(SUM(o.total_amount), 0) AS total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.username
```

### 物化视图（PostgreSQL）

```yaml
View:
  - name: order_summary_materialized
    dbms: [postgresql]
    comment: 订单汇总物化视图
    # 物化视图需要通过钩子创建
```

使用钩子创建物化视图：

```yaml
Table:
  - name: orders
    afterCreates:
      - dbms: postgresql
        content: |
          CREATE MATERIALIZED VIEW order_summary_materialized AS
          SELECT
            user_id,
            COUNT(*) AS order_count,
            SUM(total_amount) AS total_amount
          FROM orders
          GROUP BY user_id
          WITH DATA;

          CREATE INDEX idx_order_summary_user_id
          ON order_summary_materialized(user_id);
```

## 视图生命周期钩子

视图支持生命周期钩子：

```yaml
View:
  - name: active_users
    content: |
      SELECT * FROM users WHERE status = 'active'

    beforeCreates:
      - content: |
          -- 创建前检查基础表是否存在
          SELECT COUNT(*) FROM information_schema.tables
          WHERE table_name = 'users';

    afterCreates:
      - content: |
          -- 创建后设置权限
          GRANT SELECT ON active_users TO app_user;

    beforeDrops:
      - content: |
          -- 删除前撤销权限
          REVOKE ALL ON active_users FROM app_user;
```

## 视图最佳实践

### 1. 视图命名规范

```yaml
# 推荐的命名规范
View:
  - name: v_{purpose}              # 简单视图
  - name: vw_{purpose}             # 标准视图
  - name: mv_{purpose}             # 物化视图
  - name: {entity}_{purpose}       # 实体相关视图

# 示例
View:
  - name: v_active_users
  - name: vw_user_order_summary
  - name: mv_daily_sales
  - name: user_statistics
```

### 2. 选择必要的列

```yaml
# 好的设计：只选择需要的列
View:
  - name: user_summary
    content: |
      SELECT
        id,
        username,
        email,
        status
      FROM users
      WHERE status = 'active'

# 避免：SELECT *
View:
  - name: user_summary
    content: |
      SELECT * FROM users  # 不推荐
```

### 3. 使用明确的列别名

```yaml
View:
  - name: order_report
    content: |
      SELECT
        o.id AS order_id,
        o.order_no,
        u.username,
        u.email AS user_email,
        o.total_amount,
        o.created_at AS order_date
      FROM orders o
      INNER JOIN users u ON o.user_id = u.id
```

### 4. 添加视图注释

```yaml
View:
  - name: daily_sales_report
    comment: |
    每日销售报表视图
    包含订单数量、销售总额、平均订单价值等指标
    数据按日期分组
    content: |
      SELECT
        DATE(created_at) AS sale_date,
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_sales,
        AVG(total_amount) AS avg_order_value
      FROM orders
      WHERE status = 'completed'
      GROUP BY DATE(created_at)
```

## 完整示例

### 电商系统视图定义

```yaml
View:
  # 用户统计视图
  - name: user_statistics
    comment: 用户统计视图
    content: |
      SELECT
        u.id AS user_id,
        u.username,
        u.email,
        u.status,
        u.created_at AS user_created_at,
        COUNT(DISTINCT o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent,
        MAX(o.created_at) AS last_order_date,
        COUNT(DISTINCT CASE WHEN o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
                      THEN o.id END) AS orders_last_30_days
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.username, u.email, u.status, u.created_at

  # 商品销售统计视图
  - name: product_sales
    comment: 商品销售统计视图
    content: |
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.category_id,
        c.name AS category_name,
        p.price,
        p.stock,
        COUNT(oi.order_id) AS order_count,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.quantity * oi.price) AS total_revenue,
        AVG(oi.price) AS avg_selling_price
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      GROUP BY p.id, p.name, p.category_id, c.name, p.price, p.stock

  # 订单汇总视图
  - name: order_summary
    comment: 订单汇总视图
    content: |
      SELECT
        o.id AS order_id,
        o.order_no,
        o.user_id,
        u.username,
        u.email AS user_email,
        o.status,
        o.total_amount,
        o.created_at AS order_date,
        COUNT(oi.product_id) AS item_count,
        SUM(oi.quantity) AS total_quantity
      FROM orders o
      INNER JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, o.order_no, o.user_id, u.username, u.email,
               o.status, o.total_amount, o.created_at

  # 活跃用户视图
  - name: active_users
    comment: 活跃用户视图（最近30天有订单）
    content: |
      SELECT DISTINCT
        u.id,
        u.username,
        u.email,
        MAX(o.created_at) AS last_order_date
      FROM users u
      INNER JOIN orders o ON u.id = o.user_id
      WHERE o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
        AND o.status = 'completed'
      GROUP BY u.id, u.username, u.email

  # 每日销售报表
  - name: daily_sales_report
    comment: 每日销售报表视图
    content: |
      SELECT
        DATE(o.created_at) AS sale_date,
        COUNT(DISTINCT o.id) AS total_orders,
        COUNT(DISTINCT o.user_id) AS unique_customers,
        SUM(o.total_amount) AS total_sales,
        AVG(o.total_amount) AS avg_order_value,
        SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
        SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) AS pending_orders
      FROM orders o
      WHERE o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
      GROUP BY DATE(o.created_at)
      ORDER BY sale_date DESC

  # 库存预警视图
  - name: low_stock_products
    comment: 低库存商品视图
    content: |
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        c.name AS category_name,
        p.stock,
        p.low_stock_threshold,
        CASE
          WHEN p.stock <= 0 THEN 'out_of_stock'
          WHEN p.stock <= p.low_stock_threshold THEN 'low_stock'
          ELSE 'in_stock'
        END AS stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock <= p.low_stock_threshold OR p.stock <= 0
      ORDER BY p.stock ASC

  # 用户订单历史视图
  - name: user_order_history
    comment: 用户订单历史视图
    content: |
      SELECT
        u.id AS user_id,
        u.username,
        u.email,
        o.id AS order_id,
        o.order_no,
        o.status AS order_status,
        o.total_amount,
        o.created_at AS order_date,
        CASE
          WHEN o.status = 'completed' THEN 'success'
          WHEN o.status = 'cancelled' THEN 'cancelled'
          WHEN o.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'overdue'
          ELSE 'active'
        END AS order_category
      FROM users u
      INNER JOIN orders o ON u.id = o.user_id
      ORDER BY u.id, o.created_at DESC

  # 产品分类汇总视图
  - name: category_summary
    comment: 产品分类汇总视图
    content: |
      SELECT
        c.id AS category_id,
        c.name AS category_name,
        COUNT(p.id) AS product_count,
        COUNT(CASE WHEN p.stock > 0 THEN 1 END) AS in_stock_count,
        COUNT(CASE WHEN p.stock <= p.low_stock_threshold THEN 1 END) AS low_stock_count,
        COUNT(CASE WHEN p.stock <= 0 THEN 1 END) AS out_of_stock_count,
        AVG(p.price) AS avg_price,
        MIN(p.price) AS min_price,
        MAX(p.price) AS max_price
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY c.name
```

## 高级用法

### 视图嵌套

视图可以引用其他视图：

```yaml
View:
  # 基础视图
  - name: v_active_users
    content: |
      SELECT * FROM users WHERE status = 'active'

  # 引用基础视图
  - name: v_active_users_with_orders
    content: |
      SELECT
        u.*,
        COUNT(o.id) AS order_count
      FROM v_active_users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
```

### 视图更新策略

某些视图支持更新（有条件限制）：

```yaml
View:
  - name: updatable_users
    comment: 可更新的用户视图
    content: |
      SELECT
        id,
        username,
        email
      FROM users
      WHERE status = 'active'
    # 仅包含基础表的简单列，可更新
```

## 常见问题

### 视图与表有什么区别？

- **表**：实际存储数据
- **视图**：虚拟表，基于查询动态生成数据

### 如何优化视图性能？

1. 只选择必要的列
2. 在底层表上创建适当的索引
3. 考虑使用物化视图（PostgreSQL）
4. 避免在视图中使用复杂计算

### 视图可以更新吗？

简单视图可以更新，复杂视图通常不可更新：

```yaml
# 可更新的视图
View:
  - name: simple_users
    content: |
      SELECT id, username, email FROM users

# 不可更新的视图（包含聚合、GROUP BY 等）
View:
  - name: user_stats
    content: |
      SELECT user_id, COUNT(*) AS order_count
      FROM orders
      GROUP BY user_id
```

## 相关文档

- [表定义](./table.md)
