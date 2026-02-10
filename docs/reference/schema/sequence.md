---
icon: sort-numeric-up
title: 序列定义
order: 7
category:
  - 参考文档
  - Schema 定义
tag:
  - sequence
  - schema
  - auto-increment
---

# 序列定义 (Sequence)

序列（Sequence）是数据库中用于生成唯一数值的对象。序列通常用于自增主键，提供比 `AUTO_INCREMENT` 更灵活的控制。

## 基本属性

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | String | 否 | 唯一标识符，用于引用 |
| `name` | String | 是 | 序列名称 |
| `startWith` | Long | 否 | 起始值（默认 1） |
| `incrementBy` | Long | 否 | 增量（默认 1） |
| `minValue` | Long | 否 | 最小值 |
| `maxValue` | Long | 否 | 最大值 |
| `cycle` | Boolean | 否 | 是否循环（默认 false） |
| `cache` | Integer | 否 | 缓存大小 |
| `comment` | String | 否 | 序列注释 |
| `dbms` | List&lt;String&gt; | 否 | 适用数据库列表 |

## 基本示例

### 简单序列

```yaml
Sequence:
  - name: seq_user_id
    comment: 用户ID序列
    startWith: 1
    incrementBy: 1
```

生成的 SQL：
- **PostgreSQL**: `CREATE SEQUENCE seq_user_id START WITH 1 INCREMENT BY 1`
- **Oracle**: `CREATE SEQUENCE seq_user_id START WITH 1 INCREMENT BY 1`
- **H2**: `CREATE SEQUENCE seq_user_id START WITH 1 INCREMENT BY 1`

### 高级序列配置

```yaml
Sequence:
  - name: seq_order_id
    comment: 订单ID序列
    startWith: 1000
    incrementBy: 1
    minValue: 1000
    maxValue: 999999999
    cycle: false
    cache: 20
```

## 在列中使用序列

### 方式一：通过列属性引用

```yaml
Sequence:
  - name: seq_user_id
    startWith: 1
    incrementBy: 1

Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        sequence: seq_user_id
        comment: 用户ID
```

### 方式二：通过默认值引用

```yaml
Sequence:
  - name: seq_user_id
    startWith: 1
    incrementBy: 1

Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        defaultValueComputed: nextval('seq_user_id')
        comment: 用户ID
```

## 序列属性详解

### startWith（起始值）

设置序列的起始值：

```yaml
Sequence:
  - name: seq_user_id
    startWith: 1000  # 从 1000 开始
    incrementBy: 1
```

### incrementBy（增量）

设置每次增长的步长：

```yaml
Sequence:
  - name: seq_order_id
    startWith: 1
    incrementBy: 2  # 每次增加 2：1, 3, 5, 7, ...
```

### minValue / maxValue（范围限制）

设置序列的最小值和最大值：

```yaml
Sequence:
  - name: seq_code
    startWith: 1000
    incrementBy: 1
    minValue: 1000      # 最小值
    maxValue: 9999      # 最大值
    cycle: true         # 达到最大值后循环
```

### cycle（循环）

达到最大值后是否循环到最小值：

```yaml
Sequence:
  - name: seq_yearly
    startWith: 1
    incrementBy: 1
    maxValue: 365
    cycle: true  # 到 365 后回到 1
```

### cache（缓存）

设置缓存大小以提高性能：

```yaml
Sequence:
  - name: seq_high_traffic
    startWith: 1
    incrementBy: 1
    cache: 100  # 缓存 100 个值
```

## 数据库特定序列

### PostgreSQL 序列

PostgreSQL 对序列的支持最好：

```yaml
Sequence:
  - name: seq_user_id
    dbms: [postgresql]
    startWith: 1
    incrementBy: 1
    minValue: 1
    maxValue: 9223372036854775807
    cycle: false
    cache: 1

Table:
  - name: users
    dbms: [postgresql]
    Column:
      - name: id
        type: BIGINT
        defaultValueComputed: nextval('seq_user_id')
        primaryKey: true
```

### Oracle 序列

```yaml
Sequence:
  - name: seq_user_id
    dbms: [oracle]
    startWith: 1
    incrementBy: 1
    minValue: 1
    maxValue: 999999999999999999999999999
    cycle: false
    cache: 20
```

### H2 序列

```yaml
Sequence:
  - name: seq_user_id
    dbms: [h2]
    startWith: 1
    incrementBy: 1
    cache: 10
```

### MySQL 顺序

MySQL 不支持原生的 SEQUENCE 对象，使用 AUTO_INCREMENT 或表模拟：

```yaml
# MySQL 使用 AUTO_INCREMENT
Table:
  - name: users
    dbms: [mysql]
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true

# 或使用表模拟序列
Table:
  - name: sequences
    dbms: [mysql]
    Column:
      - name: name
        type: VARCHAR(50)
        primaryKey: true
      - name: next_val
        type: BIGINT
    comment: 序列表
```

## 序列重命名

使用 `formerNames` 追踪序列重命名：

```yaml
Sequence:
  - name: seq_user_id
    formerNames: [user_id_seq]
    startWith: 1
    incrementBy: 1
```

## 完整示例

### 电商系统序列定义

```yaml
Sequence:
  # 用户ID序列
  - name: seq_user_id
    comment: 用户ID序列
    startWith: 1
    incrementBy: 1
    minValue: 1
    maxValue: 9223372036854775807
    cycle: false
    cache: 20

  # 订单ID序列
  - name: seq_order_id
    comment: 订单ID序列
    startWith: 1000
    incrementBy: 1
    minValue: 1000
    maxValue: 999999999
    cycle: false
    cache: 50

  # 商品ID序列
  - name: seq_product_id
    comment: 商品ID序列
    startWith: 1
    incrementBy: 1
    minValue: 1
    maxValue: 9999999
    cycle: false
    cache: 30

  # 订单号序列（每日重置）
  - name: seq_daily_order_no
    comment: 每日订单号序列
    startWith: 1
    incrementBy: 1
    maxValue: 99999
    cycle: true
    cache: 100

  # 分类ID序列
  - name: seq_category_id
    comment: 分类ID序列
    startWith: 1
    incrementBy: 1
    maxValue: 9999
    cycle: false

  # 优惠券码序列
  - name: seq_coupon_code
    comment: 优惠券码序列
    startWith: 100000
    incrementBy: 1
    maxValue: 999999
    cycle: false
    cache: 10

# 在表中使用序列
Table:
  - name: users
    comment: 用户表
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        sequence: seq_user_id
      - name: username
        type: VARCHAR(50)
      - name: email
        type: VARCHAR(100)

  - name: orders
    comment: 订单表
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        sequence: seq_order_id
      - name: order_no
        type: VARCHAR(20)
        comment: 订单号（格式：日期+序列）
      - name: user_id
        type: BIGINT
      - name: total_amount
        type: DECIMAL(10,2)

  - name: products
    comment: 商品表
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        sequence: seq_product_id
      - name: name
        type: VARCHAR(200)
      - name: price
        type: DECIMAL(10,2)

  - name: categories
    comment: 分类表
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        sequence: seq_category_id
      - name: name
        type: VARCHAR(100)
      - name: parent_id
        type: BIGINT
```

## 高级用法

### 使用序列生成订单号

```yaml
Sequence:
  - name: seq_daily_order_no
    startWith: 1
    maxValue: 99999
    cycle: true
    cache: 100

Table:
  - name: orders
    Column:
      - name: order_no
        type: VARCHAR(20)
        # 通过应用层生成：YYYYMMDD + 序列号
        # 例如：2025020900001
```

### 多数据库序列策略

为不同数据库配置不同的序列策略：

```yaml
# PostgreSQL 和 Oracle 使用序列
Sequence:
  - name: seq_user_id
    dbms: [postgresql, oracle]
    startWith: 1
    incrementBy: 1

Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        sequence: seq_user_id

# MySQL 使用 AUTO_INCREMENT
Table:
  - name: users
    dbms: [mysql]
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
```

### 序列与 AUTO_INCREMENT 对比

| 特性 | SEQUENCE | AUTO_INCREMENT |
|------|----------|----------------|
| 跨表共享 | 支持 | 不支持 |
| 自定义起始值 | 支持 | 有限支持 |
| 负增量 | 支持 | 不支持 |
| 循环 | 支持 | 不支持 |
| 缓存 | 支持 | 有限支持 |
| 数据库支持 | PostgreSQL, Oracle, H2 | MySQL, MariaDB |

## 最佳实践

### 1. 序列命名规范

```yaml
# 推荐的命名规范
Sequence:
  - name: seq_{table}_{column}  # 标准序列
  - name: seq_{purpose}         # 通用序列

# 示例
Sequence:
  - name: seq_users_id
  - name: seq_orders_id
  - name: seq_daily_order_no
```

### 2. 合理设置缓存

```yaml
# 高并发场景：使用较大的缓存
Sequence:
  - name: seq_high_traffic
    cache: 100

# 低并发场景：使用较小的缓存
Sequence:
  - name: seq_low_traffic
    cache: 1
```

### 3. 避免序列回绕

```yaml
# 使用足够大的 maxValue
Sequence:
  - name: seq_order_id
    maxValue: 9223372036854775807  # BIGINT 最大值
    cycle: false  # 不循环，避免数据冲突
```

### 4. 监控序列使用情况

定期检查序列的使用情况，避免耗尽：

```sql
-- PostgreSQL
SELECT * FROM seq_user_id;

-- Oracle
SELECT seq_user_id.CURRVAL FROM dual;
SELECT seq_user_id.NEXTVAL FROM dual;
```

## 常见问题

### 如何重置序列？

使用数据库特定的命令或通过钩子：

```yaml
Table:
  - name: users
    afterCreates:
      - dbms: postgresql
        content: |
          SELECT setval('seq_user_id', 1, false);

      - dbms: oracle
        content: |
          DROP SEQUENCE seq_user_id;
          CREATE SEQUENCE seq_user_id START WITH 1;
```

### 如何设置负增量？

```yaml
Sequence:
  - name: seq_countdown
    startWith: 1000
    incrementBy: -1  # 倒计数：1000, 999, 998, ...
    minValue: 1
    maxValue: 1000
```

### 如何跨表共享序列？

```yaml
Sequence:
  - name: seq_global_id
    startWith: 1
    incrementBy: 1

Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        sequence: seq_global_id
        primaryKey: true

  - name: orders
    Column:
      - name: id
        type: BIGINT
        sequence: seq_global_id
        primaryKey: true
```

### MySQL 如何使用序列？

MySQL 不支持原生序列，有以下替代方案：

1. **使用 AUTO_INCREMENT**（推荐）
2. **使用表模拟序列**
3. **使用应用层序列生成**

## 相关文档

- [表定义](./table.md)
- [列定义](./column.md)
- [触发器定义](./trigger.md)
