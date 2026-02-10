---
icon: file-certificate
title: YAML 格式
order: 12
category:
  - 参考文档
  - 格式支持
tag:
  - yaml
  - format
---

# YAML 格式

YAML（YAML Ain't Markup Language）是 JustDB 推荐的 Schema 定义格式。它提供了最佳的可读性和编辑体验。

## 格式规范

### 文件扩展名

- `.yaml`（推荐）
- `.yml`

### 基本结构

```yaml
# JustDB 根节点
id: yaml-format
namespace: com.example

# Schema 对象
Table:
  - name: users
    comment: 用户表
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```

## 语法特性

### 注释

YAML 支持行注释：

```yaml
# 这是注释
Table:
  - name: users
    # comment: 用户表  # 注释掉的配置
    Column:
      - name: id  # 主键
        type: BIGINT
```

### 多行字符串

使用 `|` 保留换行：

```yaml
View:
  - name: active_users
    content: |
      SELECT *
      FROM users
      WHERE status = 'active'
```

使用 `>` 折叠换行：

```yaml
Procedure:
  - name: sp_create_user
    content: >
      INSERT INTO users (username, email)
      VALUES (p_username, p_email);
```

### 引号和转义

```yaml
Table:
  # 不需要引号
  - name: users
    type: VARCHAR

  # 需要引号（包含特殊字符）
  - name: "user-name"
    comment: "User's name"

  # 多行字符串
  content: 'SELECT * FROM "users"'
```

## 数据类型映射

### 基本类型

| YAML 类型 | Java 类型 | 示例 |
|-----------|----------|------|
| 字符串 | String | `name: users` |
| 整数 | Integer, Long | `port: 3306` |
| 浮点数 | Double | `rate: 0.5` |
| 布尔值 | Boolean | `nullable: false` |
| 列表 | List | `dbms: [mysql, postgresql]` |
| null | null | `defaultValue: null` |

### 时间类型

```yaml
Column:
  - name: created_at
    type: TIMESTAMP
    defaultValueComputed: CURRENT_TIMESTAMP
```

## 完整示例

### 简单 Schema

```yaml
id: yaml-format
namespace: com.example

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

      - name: email
        type: VARCHAR(100)

      - name: created_at
        type: TIMESTAMP
        nullable: false
        defaultValueComputed: CURRENT_TIMESTAMP

    Index:
      - name: idx_users_username
        columns: [username]
        unique: true
```

### 复杂 Schema

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
    comment: 主键ID

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
    defaultValueComputed: CURRENT_TIMESTAMP
    comment: 更新时间

# 用户表
Table:
  - id: table_users
    name: users
    comment: 用户表
    expectedRecordCount: 1000000
    expectedGrowthRate: 10000

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
        comment: 状态

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

# 订单表
  - id: table_orders
    name: orders
    comment: 订单表
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

      - name: status
        type: VARCHAR(20)
        defaultValue: 'pending'
        comment: 订单状态

      - name: total_amount
        type: DECIMAL(10,2)
        defaultValue: 0.00
        comment: 订单总额

      - id: col_orders_created_at
        referenceId: global_created_at
        name: created_at

      - id: col_orders_updated_at
        referenceId: global_updated_at
        name: updated_at

    Constraint:
      - name: fk_orders_user_id
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [user_id]
        onDelete: RESTRICT

    Index:
      - name: idx_orders_user_id
        columns: [user_id]

      - name: idx_orders_order_no
        columns: [order_no]
        unique: true

# 视图定义
View:
  - name: active_users
    comment: 活跃用户视图
    content: |
      SELECT
        u.id,
        u.username,
        u.email,
        COUNT(o.id) AS order_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.status = 'active'
      GROUP BY u.id, u.username, u.email

# 触发器定义（通过钩子）
Table:
  - name: products
    comment: 商品表
    afterCreates:
      - dbms: [mysql, mariadb]
        content: |
          CREATE TRIGGER trg_products_before_insert
          BEFORE INSERT ON products
          FOR EACH ROW
          SET NEW.created_at = NOW();
```

## 最佳实践

### 1. 使用一致的缩进

```yaml
# 推荐：使用 2 个空格缩进
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT

# 不推荐：使用 Tab 混用
```

### 2. 添加注释

```yaml
# 全局主键定义
Column:
  - id: global_id
    name: id
    type: BIGINT
    primaryKey: true  # 主键
    autoIncrement: true  # 自增
```

### 3. 使用列表语法

```yaml
# 推荐：列表语法
Column:
  - name: id
  - name: username
  - name: email

# 不推荐：流式语法（难以阅读）
Column: [name: id, name: username, name: email]
```

### 4. 多行字符串使用 |

```yaml
# 推荐：使用 | 保留格式
View:
  - name: user_statistics
    content: |
      SELECT
        u.id,
        u.username,
        COUNT(o.id) AS order_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.username
```

### 5. 引号使用

```yaml
# 不需要引号
name: users
type: VARCHAR

# 需要引号
comment: "User's email"
content: 'SELECT * FROM "users"'
defaultValue: 'active'
```

## 别名支持

YAML 支持所有字段别名：

```yaml
Table:
  - name: users
    # 以下都有效：
    Column:         # 规范名称
    # columns:      # 别名
    # Columns:      # 别名
      - name: id
        type: BIGINT
        # 以下都有效：
        primaryKey: true    # 规范名称
        # primary_key: true # 别名
        # pk: true          # 别名
        # primary-key: true # 别名
```

## 多文档支持

YAML 支持在一个文件中定义多个文档：

```yaml
# 文档 1：基础 Schema
---------------------------
id: yaml-format
namespace: com.example
Table:
  - name: users

# 文档 2：扩展 Schema
---------------------------
id: yaml-format-extensions
namespace: com.example
Table:
  - name: orders
```

## 高级特性

### 锚点和别名

```yaml
# 定义锚点
defaults: &default_timestamp
  type: TIMESTAMP
  nullable: false
  defaultValueComputed: CURRENT_TIMESTAMP

# 使用别名
Column:
  - name: created_at
    <<: *default_timestamp

  - name: updated_at
    <<: *default_timestamp
```

### 继承和覆盖

```yaml
# 基础模板
base_table: &base_table
  Column:
    - name: id
      type: BIGINT
      primaryKey: true

# 使用并扩展
Table:
  - <<: *base_table
    name: users
    Column:
      - name: username
        type: VARCHAR(50)
```

## 相关文档

- [JSON 格式](./json.md)
- [XML 格式](./xml.md)
- [格式支持概述](./README.md)
