---
icon: lock
title: 约束定义
order: 5
category:
  - 参考文档
  - Schema 定义
tag:
  - constraint
  - schema
  - integrity
---

# 约束定义 (Constraint)

约束（Constraint）用于保证数据库中数据的完整性和一致性。JustDB 支持主键约束、外键约束、唯一约束、检查约束等多种约束类型。

## 基本属性

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | String | 否 | 唯一标识符，用于引用 |
| `name` | String | 是 | 约束名称 |
| `tableName` | String | 是* | 所属表名（*全局约束时必填） |
| `type` | ConstraintType | 是 | 约束类型 |
| `columns` | List<String> | 是 | 约束列 |
| `referencedTable` | String | 否 | 外键引用表 |
| `referencedColumn` | String | 否 | 外键引用列 |
| `checkExpression` | String | 否 | 检查约束表达式 |
| `comment` | String | 否 | 约束注释 |
| `dbms` | List<String> | 否 | 适用数据库列表 |

## 约束类型

### PRIMARY_KEY（主键约束）

主键约束用于唯一标识表中的每一行记录：

```yaml
# 方式一：在列定义中指定
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true

# 方式二：使用约束定义
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

### FOREIGN_KEY（外键约束）

外键约束用于维护表之间的引用关系：

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
        comment: 用户外键
```

#### 外键约束选项

```yaml
Constraint:
  - name: fk_orders_user_id
    type: FOREIGN_KEY
    referencedTable: users
    referencedColumn: id
    columns: [user_id]
    onDelete: CASCADE    # 删除时的行为
    onUpdate: RESTRICT   # 更新时的行为
```

| 行为 | 说明 |
|------|------|
| `CASCADE` | 级联操作（删除/更新父记录时同时处理子记录） |
| `RESTRICT` | 拒绝操作（默认） |
| `SET NULL` | 设置为 NULL |
| `NO ACTION` | 不采取行动 |
| `SET DEFAULT` | 设置为默认值 |

### UNIQUE（唯一约束）

唯一约束确保列中的所有值都是唯一的：

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

或者使用唯一索引：

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

### CHECK（检查约束）

检查约束用于确保列值满足指定条件：

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
      # 价格必须大于零
      - name: chk_products_price_positive
        type: CHECK
        checkExpression: price > 0

      # 数量不能为负数
      - name: chk_products_quantity_non_negative
        type: CHECK
        checkExpression: quantity >= 0

      # 状态必须是有效值
      - name: chk_products_status_valid
        type: CHECK
        checkExpression: status IN ('active', 'inactive', 'deleted')
```

### NOT_NULL（非空约束）

非空约束确保列不接受 NULL 值：

```yaml
Table:
  - name: users
    Column:
      - name: username
        type: VARCHAR(50)
        nullable: false  # 非空约束
```

## 表级约束定义

约束通常在表级别定义：

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
      # 外键约束
      - name: fk_orders_user_id
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [user_id]
        onDelete: RESTRICT
        onUpdate: CASCADE

      # 唯一约束
      - name: uk_orders_order_no
        type: UNIQUE
        columns: [order_no]

      # 检查约束
      - name: chk_orders_status
        type: CHECK
        checkExpression: status IN ('pending', 'processing', 'completed', 'cancelled')

      - name: chk_orders_amount_positive
        type: CHECK
        checkExpression: total_amount >= 0
```

## 全局约束定义

也可以在 Justdb 根节点定义全局约束：

```yaml
Constraint:
  - name: fk_orders_user_id
    tableName: orders
    type: FOREIGN_KEY
    referencedTable: users
    referencedColumn: id
    columns: [user_id]
```

## 复合约束

### 复合主键

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
        comment: 订单明细复合主键
```

### 复合唯一约束

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
        comment: 用户角色唯一约束
```

### 复合外键

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

## 级联操作

### CASCADE（级联删除/更新）

```yaml
Constraint:
  - name: fk_order_items_order
    type: FOREIGN_KEY
    referencedTable: orders
    referencedColumn: id
    columns: [order_id]
    onDelete: CASCADE  # 删除订单时同时删除订单明细
    onUpdate: CASCADE
```

### SET NULL（设置为 NULL）

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
        onDelete: SET NULL  # 删除用户时文章的 author_id 设为 NULL
```

### RESTRICT（拒绝操作）

```yaml
Constraint:
  - name: fk_orders_user
    type: FOREIGN_KEY
    referencedTable: users
    referencedColumn: id
    columns: [user_id]
    onDelete: RESTRICT  # 有订单存在时拒绝删除用户
    onUpdate: RESTRICT
```

## 检查约束示例

### 年龄范围检查

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

### 金额检查

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

### 日期检查

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

### 枚举值检查

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

## 数据库特定约束

### MySQL 约束

```yaml
Table:
  - name: users
    Constraint:
      - name: chk_users_email_format
        type: CHECK
        checkExpression: email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
        dbms: [mysql]
```

### PostgreSQL 约束

```yaml
Table:
  - name: users
    Constraint:
      - name: chk_users_email_format
        type: CHECK
        checkExpression: email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        dbms: [postgresql]
```

## 完整示例

### 电商系统约束定义

```yaml
Table:
  # 用户表
  - name: users
    comment: 用户表
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
      # 用户名唯一
      - name: uk_users_username
        type: UNIQUE
        columns: [username]

      # 邮箱唯一
      - name: uk_users_email
        type: UNIQUE
        columns: [email]

      # 年龄范围
      - name: chk_users_age_range
        type: CHECK
        checkExpression: age >= 0 AND age <= 150

      # 状态枚举
      - name: chk_users_status_enum
        type: CHECK
        checkExpression: status IN ('active', 'inactive', 'suspended', 'deleted')

  # 订单表
  - name: orders
    comment: 订单表
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
      # 外键：用户
      - name: fk_orders_user_id
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [user_id]
        onDelete: RESTRICT
        onUpdate: CASCADE

      # 订单号唯一
      - name: uk_orders_order_no
        type: UNIQUE
        columns: [order_no]

      # 金额非负
      - name: chk_orders_amount_positive
        type: CHECK
        checkExpression: total_amount >= 0

      # 折扣范围
      - name: chk_orders_discount_range
        type: CHECK
        checkExpression: discount >= 0 AND discount <= 100

      # 状态枚举
      - name: chk_orders_status_enum
        type: CHECK
        checkExpression: status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')

  # 订单明细表
  - name: order_items
    comment: 订单明细表
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
      # 复合主键
      - name: pk_order_items
        type: PRIMARY_KEY
        columns: [order_id, product_id]

      # 外键：订单
      - name: fk_order_items_order
        type: FOREIGN_KEY
        referencedTable: orders
        referencedColumn: id
        columns: [order_id]
        onDelete: CASCADE
        onUpdate: CASCADE

      # 数量检查
      - name: chk_order_items_quantity_positive
        type: CHECK
        checkExpression: quantity > 0

      # 价格检查
      - name: chk_order_items_price_positive
        type: CHECK
        checkExpression: price > 0

  # 文章表
  - name: articles
    comment: 文章表
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
      # 外键：作者
      - name: fk_articles_author
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [author_id]
        onDelete: SET NULL

      # 日期逻辑
      - name: chk_articles_publish_date_future
        type: CHECK
        checkExpression: publish_date <= CURRENT_DATE
```

## 最佳实践

### 1. 约束命名规范

```yaml
# 推荐的命名规范
Constraint:
  - name: pk_{table}              # 主键
  - name: fk_{table}_{column}     # 外键
  - name: uk_{table}_{column}     # 唯一约束
  - name: chk_{table}_{purpose}   # 检查约束

# 示例
Constraint:
  - name: pk_users
  - name: fk_orders_user_id
  - name: uk_users_email
  - name: chk_users_age_range
```

### 2. 合理使用外键

```yaml
# 好的设计：适当的外键约束
Constraint:
  - name: fk_orders_user
    type: FOREIGN_KEY
    referencedTable: users
    referencedColumn: id
    columns: [user_id]
    onDelete: RESTRICT  # 保护数据完整性

# 避免过度使用：影响性能
# 考虑在应用层实现某些约束
```

### 3. 索引与约束

```yaml
# 唯一约束自动创建索引
Constraint:
  - name: uk_users_email
    type: UNIQUE
    columns: [email]

# 外键列应该有索引
Index:
  - name: idx_orders_user_id
    columns: [user_id]  # 提高外键查询性能
```

### 4. 检查约束 vs 应用层验证

```yaml
# 检查约束：关键业务规则
Constraint:
  - name: chk_orders_status
    type: CHECK
    checkExpression: status IN ('pending', 'processing', 'completed')

# 应用层验证：复杂的业务逻辑
# 如：订单金额必须等于明细之和
```

## 常见问题

### 如何修改外键约束？

首先删除旧约束，然后创建新约束：

```yaml
# 使用钩子实现
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
        onDelete: CASCADE  # 新的约束行为
```

### 如何实现软删除？

使用列和检查约束：

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

### 如何实现条件唯一约束？

使用部分索引：

```yaml
Table:
  - name: email_verifications
    Column:
      - name: email
        type: VARCHAR(100)
      - name: is_verified
        type: BOOLEAN

    # PostgreSQL 部分唯一索引
    afterCreates:
      - dbms: postgresql
        content: |
          CREATE UNIQUE INDEX uk_email_verifications_email
          ON email_verifications(email)
          WHERE is_verified = true;
```

## 相关文档

- [表定义](./table.md)
- [列定义](./column.md)
- [索引定义](./index.md)
