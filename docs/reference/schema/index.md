---
icon: lookup
title: 索引定义
order: 4
category:
  - 参考文档
  - Schema 定义
tag:
  - index
  - schema
  - performance
---

# 索引定义 (Index)

索引（Index）用于提高数据库查询性能。JustDB 支持多种索引类型，包括普通索引、唯一索引、全文索引等。

## 基本属性

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | String | 否 | 唯一标识符，用于引用 |
| `name` | String | 是 | 索引名称 |
| `tableName` | String | 是* | 所属表名（*全局索引时必填） |
| `columns` | List<String> | 是 | 索引列 |
| `unique` | Boolean | 否 | 是否唯一索引（默认 false） |
| `type` | String | 否 | 索引类型 |
| `comment` | String | 否 | 索引注释 |
| `dbms` | List<String> | 否 | 适用数据库列表 |

## 索引类型

### BTREE 索引（默认）

最常用的索引类型，适合大多数场景：

```yaml
Index:
  - name: idx_users_email
    tableName: users
    columns: [email]
    type: BTREE
```

### HASH 索引

适合等值查询：

```yaml
Index:
  - name: idx_users_status_hash
    tableName: users
    columns: [status]
    type: HASH
```

### FULLTEXT 索引

用于全文搜索：

```yaml
Index:
  - name: idx_articles_content_fulltext
    tableName: articles
    columns: [title, content]
    type: FULLTEXT
```

### SPATIAL 索引

用于地理数据：

```yaml
Index:
  - name: idx_locations_position
    tableName: locations
    columns: [position]
    type: SPATIAL
```

## 唯一索引

确保列值的唯一性：

```yaml
Index:
  - name: idx_users_username
    tableName: users
    columns: [username]
    unique: true
    comment: 用户名唯一索引

  - name: idx_users_email
    tableName: users
    columns: [email]
    unique: true
    comment: 邮箱唯一索引
```

## 复合索引

在多个列上创建索引：

```yaml
Index:
  - name: idx_orders_user_id_status
    tableName: orders
    columns: [user_id, status, created_at]
    comment: 用户订单查询索引
```

### 复合索引顺序

复合索引的列顺序很重要，遵循最左前缀原则：

```yaml
# 好的设计：按照查询频率和选择性排序
Index:
  - name: idx_orders_user_status_created
    tableName: orders
    columns: [user_id, status, created_at]
    # 可用于：
    # - WHERE user_id = ?
    # - WHERE user_id = ? AND status = ?
    # - WHERE user_id = ? AND status = ? AND created_at = ?
```

## 表级索引定义

索引通常在表级别定义：

```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
      - name: email
        type: VARCHAR(100)
      - name: status
        type: VARCHAR(20)

    Index:
      - name: idx_users_username
        columns: [username]
        unique: true

      - name: idx_users_email
        columns: [email]
        unique: true

      - name: idx_users_status
        columns: [status]

      - name: idx_users_status_created
        columns: [status, created_at]
```

## 全局索引定义

也可以在 Justdb 根节点定义全局索引：

```yaml
Index:
  - name: idx_users_email
    tableName: users
    columns: [email]
    unique: true
```

## 部分索引

使用条件创建部分索引（数据库特定）：

```yaml
Index:
  - name: idx_orders_active
    tableName: orders
    columns: [user_id, created_at]
    dbms: [postgresql]
    comment: 活跃订单索引
    # PostgreSQL 部分索引需要通过扩展属性或钩子实现
```

通过钩子实现：

```yaml
Table:
  - name: orders
    afterCreates:
      - dbms: postgresql
        content: |
          CREATE INDEX CONCURRENTLY idx_orders_active
          ON orders(user_id, created_at)
          WHERE status = 'active';
```

## 覆盖索引

创建包含所有查询列的索引：

```yaml
Table:
  - name: products
    Column:
      - name: id
      - name: name
      - name: price
      - name: category_id
      - name: stock

    Index:
      # 覆盖索引：包含查询所需的所有列
      - name: idx_products_category_price_stock
        columns: [category_id, price, stock, name]
        comment: 商品查询覆盖索引
```

## 函数索引

在表达式上创建索引：

```yaml
Table:
  - name: users
    afterCreates:
      - dbms: mysql
        content: |
          CREATE INDEX idx_users_email_lower
          ON users((LOWER(email)));

      - dbms: postgresql
        content: |
          CREATE INDEX idx_users_email_lower
          ON users(LOWER(email));
```

## 数据库特定索引

### MySQL 索引

```yaml
Table:
  - name: articles
    Index:
      # 全文索引
      - name: idx_articles_fulltext
        columns: [title, content]
        type: FULLTEXT
        dbms: [mysql]

      # 联合索引
      - name: idx_articles_author_created
        columns: [author_id, created_at]
        dbms: [mysql]
```

### PostgreSQL 索引

```yaml
Table:
  - name: users
    afterCreates:
      # 并发创建索引
      - content: |
          CREATE INDEX CONCURRENTLY idx_users_email
          ON users(email);

      # 表达式索引
      - content: |
          CREATE INDEX CONCURRENTLY idx_users_username_lower
          ON users(LOWER(username));

      # 部分索引
      - content: |
          CREATE INDEX CONCURRENTLY idx_users_active
          ON users(created_at)
          WHERE is_active = true;
```

## 性能优化建议

### 1. 选择性高的列优先

```yaml
# 好的设计：高选择性列在前
Index:
  - name: idx_orders_user_status
    tableName: orders
    columns: [user_id, status]  # user_id 选择性更高
```

### 2. 避免过度索引

```yaml
# 不推荐：太多索引影响写入性能
Table:
  - name: users
    Index:
      - name: idx_users_id
        columns: [id]  # 主键已有索引，重复

      - name: idx_users_username
        columns: [username]

      - name: idx_users_email
        columns: [email]

      # ... 太多索引
```

### 3. 覆盖常用查询

```yaml
# 创建覆盖索引减少回表
Index:
  - name: idx_orders_list
    tableName: orders
    columns: [user_id, status, created_at, id]
    # 覆盖查询：SELECT id FROM orders WHERE user_id = ? AND status = ?
```

### 4. 监控索引使用情况

定期检查索引使用情况，删除未使用的索引。

## 完整示例

### 电商系统索引定义

```yaml
Table:
  # 用户表
  - name: users
    comment: 用户表
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
      - name: email
        type: VARCHAR(100)
      - name: phone
        type: VARCHAR(20)
      - name: status
        type: VARCHAR(20)
      - name: created_at
        type: TIMESTAMP

    Index:
      # 唯一索引
      - name: idx_users_username
        columns: [username]
        unique: true
        comment: 用户名唯一索引

      - name: idx_users_email
        columns: [email]
        unique: true
        comment: 邮箱唯一索引

      - name: idx_users_phone
        columns: [phone]
        unique: true
        comment: 手机号唯一索引

      # 单列索引
      - name: idx_users_status
        columns: [status]
        comment: 状态索引

      - name: idx_users_created_at
        columns: [created_at]
        comment: 创建时间索引

      # 复合索引
      - name: idx_users_status_created
        columns: [status, created_at]
        comment: 状态和创建时间复合索引

  # 商品表
  - name: products
    comment: 商品表
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: name
        type: VARCHAR(200)
      - name: price
        type: DECIMAL(10,2)
      - name: category_id
        type: BIGINT
      - name: brand_id
        type: BIGINT
      - name: status
        type: VARCHAR(20)
      - name: created_at
        type: TIMESTAMP

    Index:
      # 分类查询
      - name: idx_products_category
        columns: [category_id, status, created_at]
        comment: 分类商品索引

      # 品牌查询
      - name: idx_products_brand
        columns: [brand_id, status]
        comment: 品牌商品索引

      # 价格查询
      - name: idx_products_price
        columns: [price, status]
        comment: 价格范围索引

  # 订单表
  - name: orders
    comment: 订单表
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
      - name: created_at
        type: TIMESTAMP
      - name: updated_at
        type: TIMESTAMP

    Index:
      # 用户订单查询
      - name: idx_orders_user_status_created
        columns: [user_id, status, created_at]
        comment: 用户订单查询索引

      # 订单号唯一索引
      - name: idx_orders_order_no
        columns: [order_no]
        unique: true
        comment: 订单号唯一索引

      # 状态查询
      - name: idx_orders_status_created
        columns: [status, created_at]
        comment: 订单状态查询索引

  # 文章表
  - name: articles
    comment: 文章表
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: title
        type: VARCHAR(200)
      - name: content
        type: TEXT
      - name: author_id
        type: BIGINT
      - name: status
        type: VARCHAR(20)
      - name: created_at
        type: TIMESTAMP

    Index:
      # 作者文章查询
      - name: idx_articles_author_created
        columns: [author_id, created_at]
        comment: 作者文章索引

      # 全文搜索
      - name: idx_articles_fulltext
        columns: [title, content]
        type: FULLTEXT
        dbms: [mysql]
        comment: 全文搜索索引

      # 状态查询
      - name: idx_articles_status_created
        columns: [status, created_at]
        comment: 文章状态索引
```

## 最佳实践

### 1. 索引命名规范

```yaml
# 推荐的命名规范
Index:
  - name: idx_{table}_{column}      # 单列索引
  - name: idx_{table}_{col1}_{col2} # 复合索引
  - name: uk_{table}_{column}       # 唯一索引
  - name: ft_{table}_{column}       # 全文索引

# 示例
Index:
  - name: idx_users_email
  - name: idx_orders_user_status
  - name: uk_users_username
  - name: ft_articles_content
```

### 2. 合理使用复合索引

```yaml
# 好的设计：按照查询模式设计
Index:
  - name: idx_orders_user_status_created
    columns: [user_id, status, created_at]
    # 支持：
    # - WHERE user_id = ?
    # - WHERE user_id = ? AND status = ?
    # - WHERE user_id = ? AND status = ? ORDER BY created_at
```

### 3. 避免在低选择性列上创建索引

```yaml
# 不推荐：性别列选择性低
Index:
  - name: idx_users_gender
    columns: [gender]  # 只有男/女两个值，索引效果差

# 推荐：结合其他高选择性列
Index:
  - name: idx_users_gender_created
    columns: [gender, created_at]
```

### 4. 定期维护索引

- 监控索引使用情况
- 删除未使用的索引
- 重建碎片化的索引

## 常见问题

### 如何创建不区分大小写的索引？

使用函数索引：

```yaml
Table:
  - name: users
    afterCreates:
      - content: |
          CREATE INDEX idx_users_email_lower
          ON users(LOWER(email));
```

### 如何优化 LIKE 查询？

```yaml
# 前缀匹配可以使用索引
Index:
  - name: idx_users_username
    columns: [username]

# 支持：WHERE username LIKE 'john%'
# 不支持：WHERE username LIKE '%john'
```

### 如何创建降序索引？

```yaml
Table:
  - name: orders
    afterCreates:
      - content: |
          CREATE INDEX idx_orders_created_desc
          ON orders(created_at DESC);
```

## 相关文档

- [表定义](./table.md)
- [列定义](./column.md)
- [约束定义](./constraint.md)
