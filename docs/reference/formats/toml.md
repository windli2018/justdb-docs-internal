---
icon: file-settings
title: TOML 格式
order: 15
category:
  - 参考文档
  - 格式支持
tag:
  - toml
  - format
---

# TOML 格式

TOML（Tom's Obvious Minimal Language）是一种简洁的配置文件格式，适合应用配置场景。

## 格式规范

### 文件扩展名

- `.toml`

### 基本结构

```toml
id = "myapp"
namespace = "com.example"

[[Table]]
name = "users"
comment = "用户表"

[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true
```

## 语法特性

### 键值对

```toml
id = "myapp"
namespace = "com.example"
port = 8080
enabled = true
```

### 表（Table）

```toml[Table]
name = "users"
comment = "用户表"
```

### 表数组（Array of Tables）

```toml
[[Table.Column]]
name = "id"
type = "BIGINT"

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"
```

### 内联表

```toml
[metadata]
key = "value"
```

### 数组

```toml
dbms = ["mysql", "postgresql"]

[[Index]]
name = "idx_users_username"
columns = ["username", "email"]
unique = true
```

### 多行字符串

```toml
content = """
SELECT *
FROM users
WHERE status = 'active'
"""
```

## 完整示例

```toml
id = "ecommerce"
namespace = "com.example.ecommerce"

# 全局列定义
[[Column]]
id = "global_id"
name = "id"
type = "BIGINT"
primaryKey = true
autoIncrement = true

[[Column]]
id = "global_created_at"
name = "created_at"
type = "TIMESTAMP"
nullable = false
defaultValueComputed = "CURRENT_TIMESTAMP"

# 用户表
[[Table]]
id = "table_users"
name = "users"
comment = "用户表"
expectedRecordCount = 1000000
expectedGrowthRate = 10000

[[Table.Column]]
id = "col_users_id"
referenceId = "global_id"
name = "id"

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"
nullable = false

[[Table.Column]]
name = "email"
type = "VARCHAR(100)"

[[Table.Index]]
name = "idx_users_username"
columns = ["username"]
unique = true

# 订单表
[[Table]]
id = "table_orders"
name = "orders"
comment = "订单表"

[[Table.Column]]
name = "user_id"
type = "BIGINT"
nullable = false

[[Table.Constraint]]
name = "fk_orders_user_id"
type = "FOREIGN_KEY"
referencedTable = "users"
referencedColumn = "id"
columns = ["user_id"]
```

## 最佳实践

### 1. 使用表数组

```toml
# 推荐：使用表数组
[[Table.Column]]
name = "id"
type = "BIGINT"

# 不推荐：混合使用
```

### 2. 添加注释

```toml
# 用户表定义
[[Table]]
name = "users"
comment = "用户表"
```

### 3. 使用一致的格式

```toml
# 推荐：键值对对齐
id        = "myapp"
namespace = "com.example"
```

## 相关文档

- [YAML 格式](./yaml.md)
- [格式支持概述](./README.md)
