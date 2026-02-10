---
icon: table
title: 表定义
order: 2
category:
  - 参考文档
  - Schema 定义
tag:
  - table
  - schema
---

# 表定义 (Table)

表（Table）是数据库中最核心的对象，用于存储和管理数据。JustDB 的表定义支持丰富的属性配置、继承机制和生命周期钩子。

## 基本属性

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | String | 否 | 唯一标识符，用于引用 |
| `name` | String | 是 | 表名 |
| `referenceId` | String | 否 | 引用其他表的 id |
| `formerNames` | List<String> | 否 | 曾用名列表，用于追踪重命名 |
| `comment` | String | 否 | 数据库注释（会写入数据库） |
| `remark` | String | 否 | JustDB 备注（不写入数据库） |
| `author` | String | 否 | 作者信息 |
| `version` | String | 否 | 版本信息 |
| `dbms` | List<String> | 否 | 适用数据库列表 |

## 基本示例

### 简单表定义

```yaml
Table:
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
        comment: 用户名

      - name: email
        type: VARCHAR(100)
        comment: 邮箱
```

### 使用 referenceId 复用表定义

```yaml
# 基础表模板
Table:
  - id: base_table
    name: base
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: created_at
        type: TIMESTAMP
        defaultValueComputed: CURRENT_TIMESTAMP

# 继承基础表
  - name: users
    referenceId: base_table  # 继承基础表定义
    Column:
      - name: username
        type: VARCHAR(50)
```

## 子对象

### Column（列）

定义表的列结构。详见 [列定义](./column.md)。

```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
```

### Index（索引）

定义表的索引。详见 [索引定义](./index-def.md)。

```yaml
Table:
  - name: users
    Index:
      - name: idx_users_email
        columns: [email]
        unique: true
```

### Constraint（约束）

定义表的约束。详见 [约束定义](./constraint.md)。

```yaml
Table:
  - name: orders
    Constraint:
      - name: fk_orders_user_id
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [user_id]
```

### Sequence（序列）

关联序列对象。

```yaml
Table:
  - name: users
    sequences: [seq_user_id]
    Column:
      - name: id
        type: BIGINT
        sequence: seq_user_id
```

## 生命周期钩子

表支持完整的生命周期钩子，允许在 DDL 操作前后执行自定义 SQL。

### beforeCreates / afterCreates

在创建表前后执行 SQL。

```yaml
Table:
  - name: users
    beforeCreates:
      - content: |
          -- 在创建表前执行
          CREATE TABLE IF NOT EXISTS users_backup LIKE users;

    afterCreates:
      - dbms: postgresql
        content: |
          -- PostgreSQL 专用
          CREATE INDEX CONCURRENTLY idx_users_created_at
          ON users(created_at);

      - dbms: mysql
        content: |
          -- MySQL 专用
          CREATE INDEX idx_users_created_at
          ON users(created_at);
```

### beforeDrops / afterDrops

在删除表前后执行 SQL。

```yaml
Table:
  - name: users
    beforeDrops:
      - content: |
          -- 删除前备份
          CREATE TABLE users_backup AS SELECT * FROM users;

    afterDrops:
      - content: |
          -- 删除后清理
          DROP TABLE IF EXISTS users_backup;
```

### beforeAlters / afterAlters

在修改表前后执行 SQL。

```yaml
Table:
  - name: users
    beforeAlters:
      - content: |
          -- 修改前锁定表
          LOCK TABLES users WRITE;

    afterAlters:
      - content: |
          -- 修改后解锁
          UNLOCK TABLES;
```

### beforeAdds / afterAdds

在添加子对象（列、索引等）前后执行 SQL。

```yaml
Table:
  - name: users
    afterAdds:
      - content: |
          -- 添加列后更新数据
          UPDATE users SET status = 'active' WHERE status IS NULL;
```

## 性能优化属性

JustDB 支持为表添加性能优化相关的元数据：

```yaml
Table:
  - name: users
    expectedRecordCount: 1000000
    expectedGrowthRate: 10000
    expectedRecordSize: 512
    isPrimaryQueryTable: true
    queryFrequencyLevel: 5
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `expectedRecordCount` | Long | 预期记录数 |
| `expectedGrowthRate` | Long | 预期增长率（条/月） |
| `expectedRecordSize` | Integer | 预期记录大小（字节） |
| `isPrimaryQueryTable` | Boolean | 是否主查询表 |
| `queryFrequencyLevel` | Integer | 查询频率级别（1-5） |
| `indexStrategy` | String | 推荐索引策略 |
| `partitionStrategy` | String | 推荐分片策略 |

## 继承配置

表支持继承机制，可以从其他表继承列和索引定义。

### 使用 Inheritance

```yaml
Table:
  - id: base_entity
    name: base
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: created_at
        type: TIMESTAMP
      - name: updated_at
        type: TIMESTAMP

  - name: users
    inheritance:
      extends: base_entity
    Column:
      - name: username
        type: VARCHAR(50)
```

## 分片配置

### 使用 Sharding

```yaml
Table:
  - name: orders
    sharding:
      strategy: HASH
      shardingKey: user_id
      shardingCount: 16
```

## 表范围过滤

使用 `tableScopes` 过滤要操作的表：

```yaml
# 在 Justdb 根节点定义
tableScopes:
  includes:
    - users*
    - orders*
  excludes:
    - *_temp
    - *_bak
```

## 数据库特定配置

通过 `dbms` 属性限制表的适用数据库：

```yaml
Table:
  - name: users
    dbms: [mysql, postgresql]  # 仅适用于 MySQL 和 PostgreSQL
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```

## 完整示例

### 电商系统表定义

```yaml
id: ecommerce
namespace: com.example.ecommerce

# 全局列定义
Column:
  - id: global_id
    name: id
    type: BIGINT
    primaryKey: true
    autoIncrement: true

  - id: global_created_at
    name: created_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP
    comment: 创建时间

  - id: global_updated_at
    name: updated_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    comment: 更新时间

# 用户表
Table:
  - id: table_users
    name: users
    comment: 用户表
    expectedRecordCount: 1000000
    expectedGrowthRate: 10000
    isPrimaryQueryTable: true
    queryFrequencyLevel: 5

    Column:
      - id: col_users_id
        referenceId: global_id
        name: id

      - name: username
        type: VARCHAR(50)
        nullable: false
        comment: 用户名

      - name: email
        type: VARCHAR(100)
        comment: 邮箱

      - name: password_hash
        type: VARCHAR(255)
        nullable: false
        comment: 密码哈希

      - name: status
        type: VARCHAR(20)
        defaultValue: 'active'
        comment: 用户状态

      - id: col_users_created_at
        referenceId: global_created_at
        name: created_at

      - id: col_users_updated_at
        referenceId: global_updated_at
        name: updated_at

    Index:
      - name: idx_users_username
        columns: [username]
        unique: true
        comment: 用户名唯一索引

      - name: idx_users_email
        columns: [email]
        unique: true
        comment: 邮箱唯一索引

      - name: idx_users_status
        columns: [status]
        comment: 状态索引

    afterCreates:
      - dbms: postgresql
        content: |
          CREATE INDEX CONCURRENTLY idx_users_created_at
          ON users(created_at);

      - dbms: mysql
        content: |
          CREATE INDEX idx_users_created_at
          ON users(created_at);

# 订单表
  - id: table_orders
    name: orders
    comment: 订单表
    expectedRecordCount: 5000000
    expectedGrowthRate: 50000

    Column:
      - id: col_orders_id
        referenceId: global_id
        name: id

      - name: user_id
        type: BIGINT
        nullable: false
        comment: 用户ID

      - name: order_no
        type: VARCHAR(50)
        nullable: false
        comment: 订单号

      - name: total_amount
        type: DECIMAL(10,2)
        defaultValue: 0.00
        comment: 订单总额

      - name: status
        type: VARCHAR(20)
        defaultValue: 'pending'
        comment: 订单状态

      - id: col_orders_created_at
        referenceId: global_created_at
        name: created_at

      - id: col_orders_updated_at
        referenceId: global_updated_at
        name: updated_at

    Constraint:
      - id: fk_orders_user_id
        name: fk_orders_user_id
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [user_id]

    Index:
      - name: idx_orders_user_id
        columns: [user_id]
        comment: 用户ID索引

      - name: idx_orders_order_no
        columns: [order_no]
        unique: true
        comment: 订单号唯一索引

      - name: idx_orders_status
        columns: [status]
        comment: 状态索引

# 商品表
  - id: table_products
    name: products
    comment: 商品表
    expectedRecordCount: 100000
    expectedGrowthRate: 1000

    Column:
      - id: col_products_id
        referenceId: global_id
        name: id

      - name: name
        type: VARCHAR(200)
        nullable: false
        comment: 商品名称

      - name: price
        type: DECIMAL(10,2)
        nullable: false
        comment: 商品价格

      - name: stock
        type: INT
        defaultValue: 0
        comment: 库存数量

      - name: category_id
        type: BIGINT
        comment: 分类ID

      - id: col_products_created_at
        referenceId: global_created_at
        name: created_at

    Index:
      - name: idx_products_category_id
        columns: [category_id]
        comment: 分类索引

      - name: idx_products_price
        columns: [price]
        comment: 价格索引
```

## 常见问题

### 如何创建临时表？

使用数据库特定的扩展属性：

```yaml
Table:
  - name: temp_users
    temporary: true  # MySQL
    # 或
    dbms: postgresql
    pg_temp: true
```

### 如何创建分区表？

使用扩展属性：

```yaml
Table:
  - name: orders
    partitionBy: RANGE (created_at)
    partitions:
      - name: p_2023
        values: '2023-01-01'
      - name: p_2024
        values: '2024-01-01'
```

### 如何创建内存表？

```yaml
Table:
  - name: cache_data
    engine: MEMORY  # MySQL
```

## 相关文档

- [列定义](./column.md)
- [索引定义](./index-def.md)
- [约束定义](./constraint.md)
- [生命周期钩子](./lifecycle-hooks.md)
- [格式支持 - YAML](../formats/yaml.md)
