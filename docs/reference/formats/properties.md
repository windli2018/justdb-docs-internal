---
icon: file-binary
title: Properties 格式
order: 16
category:
  - 参考文档
  - 格式支持
tag:
  - properties
  - format
---

# Properties 格式

Properties 格式是一种简单的键值对配置格式，适合简单的 Schema 定义场景。

## 格式规范

### 文件扩展名

- `.properties`

### 基本结构

```properties
# JustDB 配置
id=myapp
namespace=com.example

# 表定义
table.users.name=users
table.users.comment=用户表
```

## 语法特性

### 键值对

```properties
id=myapp
namespace=com.example
```

### 注释

```properties
# 这是注释
table.users.name=users
```

### 转义字符

```properties
content=SELECT * FROM \"users\"
path=C:\\Users\\config
```

### 多行值

```properties
# 使用 \ 连接多行
content=SELECT * \
FROM users \
WHERE status = 'active'
```

## 命名约定

### 点分层结构

```properties
# 表级属性
table.users.name=users
table.users.comment=用户表
table.users.expectedRecordCount=1000000

# 列级属性
table.users.column.id.name=id
table.users.column.id.type=BIGINT
table.users.column.id.primaryKey=true

# 索引级属性
table.users.index.idx_users_username.name=idx_users_username
table.users.index.idx_users_username.columns=username
table.users.index.idx_users_username.unique=true
```

## 完整示例

```properties
# ============================================================================
# JustDB Schema 配置
# ============================================================================
id=ecommerce
namespace=com.example.ecommerce

# ----------------------------------------------------------------------------
# 全局列定义
# ----------------------------------------------------------------------------
column.global_id.name=id
column.global_id.type=BIGINT
column.global_id.primaryKey=true
column.global_id.autoIncrement=true
column.global_id.comment=主键ID

column.global_created_at.name=created_at
column.global_created_at.type=TIMESTAMP
column.global_created_at.nullable=false
column.global_created_at.defaultValueComputed=CURRENT_TIMESTAMP
column.global_created_at.comment=创建时间

# ----------------------------------------------------------------------------
# 用户表
# ----------------------------------------------------------------------------
table.users.id=table_users
table.users.name=users
table.users.comment=用户表
table.users.expectedRecordCount=1000000
table.users.expectedGrowthRate=10000

# 用户表 - 列定义
table.users.column.col_users_id.referenceId=global_id
table.users.column.col_users_id.name=id

table.users.column.username.name=username
table.users.column.username.type=VARCHAR(50)
table.users.column.username.nullable=false
table.users.column.username.comment=用户名

table.users.column.email.name=email
table.users.column.email.type=VARCHAR(100)
table.users.column.email.comment=邮箱

table.users.column.col_users_created_at.referenceId=global_created_at
table.users.column.col_users_created_at.name=created_at

# 用户表 - 索引定义
table.users.index.idx_users_username.name=idx_users_username
table.users.index.idx_users_username.columns=username
table.users.index.idx_users_username.unique=true
table.users.index.idx_users_username.comment=用户名唯一索引

table.users.index.idx_users_email.name=idx_users_email
table.users.index.idx_users_email.columns=email
table.users.index.idx_users_email.unique=true
table.users.index.idx_users_email.comment=邮箱唯一索引

# ----------------------------------------------------------------------------
# 订单表
# ----------------------------------------------------------------------------
table.orders.id=table_orders
table.orders.name=orders
table.orders.comment=订单表

# 订单表 - 列定义
table.orders.column.col_orders_id.referenceId=global_id
table.orders.column.col_orders_id.name=id

table.orders.column.user_id.name=user_id
table.orders.column.user_id.type=BIGINT
table.orders.column.user_id.nullable=false
table.orders.column.user_id.comment=用户ID

table.orders.column.order_no.name=order_no
table.orders.column.order_no.type=VARCHAR(50)
table.orders.column.order_no.nullable=false
table.orders.column.order_no.comment=订单号

table.orders.column.status.name=status
table.orders.column.status.type=VARCHAR(20)
table.orders.column.status.defaultValue=pending
table.orders.column.status.comment=订单状态

# 订单表 - 约束定义
table.orders.constraint.fk_orders_user_id.name=fk_orders_user_id
table.orders.constraint.fk_orders_user_id.type=FOREIGN_KEY
table.orders.constraint.fk_orders_user_id.referencedTable=users
table.orders.constraint.fk_orders_user_id.referencedColumn=id
table.orders.constraint.fk_orders_user_id.columns=user_id
table.orders.constraint.fk_orders_user_id.onDelete=RESTRICT
table.orders.constraint.fk_orders_user_id.comment=用户外键

# 订单表 - 索引定义
table.orders.index.idx_orders_user_id.name=idx_orders_user_id
table.orders.index.idx_orders_user_id.columns=user_id
table.orders.index.idx_orders_user_id.comment=用户ID索引

table.orders.index.idx_orders_order_no.name=idx_orders_order_no
table.orders.index.idx_orders_order_no.columns=order_no
table.orders.index.idx_orders_order_no.unique=true
table.orders.index.idx_orders_order_no.comment=订单号唯一索引
```

## 最佳实践

### 1. 使用有意义的键名

```properties
# 推荐
table.users.name=users
table.users.column.id.type=BIGINT

# 不推荐
t1.n=users
t1.c1.t=BIGINT
```

### 2. 添加分组注释

```properties
# ============================================================================
# 用户表定义
# ============================================================================
table.users.name=users
table.users.comment=用户表
```

### 3. 使用转义处理特殊字符

```properties
# 包含特殊字符的值需要转义
content=SELECT * FROM \"users\"
path=C:\\Users\\config
```

### 4. 保持一致的缩进

```properties
# 推荐：对齐等号
table.users.name=users
table.users.comment=用户表
table.users.expectedRecordCount=1000000
```

## 限制

Properties 格式有以下限制：

1. **不支持复杂嵌套**：需要使用点分层结构
2. **数组处理复杂**：需要使用索引或逗号分隔
3. **多行字符串不友好**：需要使用反斜杠连接

## 适用场景

Properties 格式适合以下场景：

- 简单的配置文件
- Java 应用的传统配置
- 需要人工编辑的简单配置

对于复杂的 Schema 定义，建议使用 YAML 或 JSON 格式。

## 相关文档

- [YAML 格式](./yaml.md)
- [TOML 格式](./toml.md)
- [格式支持概述](./README.md)
