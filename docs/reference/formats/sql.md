---
icon: database
title: SQL 格式
order: 18
category:
  - 参考文档
  - 格式支持
tag:
  - sql
  - format
  - reverse-engineering
---

# SQL 格式

JustDB 支持从现有数据库的 DDL 语句中提取 Schema 定义（逆向工程）。

## 逆向工程

### 从数据库提取 Schema

```bash
# 从 MySQL 数据库提取
justdb db2schema \
  --url jdbc:mysql://localhost:3306/myapp \
  --user root \
  --password secret \
  --output schema.yaml

# 从 PostgreSQL 数据库提取
justdb db2schema \
  --url jdbc:postgresql://localhost:5432/myapp \
  --user postgres \
  --password secret \
  --output schema.yaml
```

### 从 SQL 文件提取

```bash
# 从 SQL 文件提取
justdb sql2schema schema.sql > schema.yaml
```

## 支持的 SQL 语句

### CREATE TABLE

```sql
-- 输入 SQL
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 输出 YAML
Table:
  - name: users
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
        defaultValueComputed: CURRENT_TIMESTAMP
```

### CREATE INDEX

```sql
-- 输入 SQL
CREATE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- 输出 YAML
Index:
  - name: idx_users_email
    tableName: users
    columns: [email]
  - name: idx_users_username
    tableName: users
    columns: [username]
    unique: true
```

### ALTER TABLE

```sql
-- 输入 SQL
ALTER TABLE orders ADD CONSTRAINT fk_orders_user_id
FOREIGN KEY (user_id) REFERENCES users(id);

-- 输出 YAML
Constraint:
  - name: fk_orders_user_id
    type: FOREIGN_KEY
    tableName: orders
    referencedTable: users
    referencedColumn: id
    columns: [user_id]
```

## 完整示例

### 输入 SQL 文件

```sql
-- 用户表
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  username VARCHAR(50) NOT NULL COMMENT '用户名',
  email VARCHAR(100) COMMENT '邮箱',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT '用户表';

-- 用户名唯一索引
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- 邮箱唯一索引
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- 订单表
CREATE TABLE orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  order_no VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id)
) COMMENT '订单表';

-- 订单号唯一索引
CREATE UNIQUE INDEX idx_orders_order_no ON orders(order_no);
```

### 输出 YAML Schema

```yaml
Table:
  - name: users
    comment: 用户表
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
        comment: 用户ID
      - name: username
        type: VARCHAR(50)
        nullable: false
        comment: 用户名
      - name: email
        type: VARCHAR(100)
        comment: 邮箱
      - name: created_at
        type: TIMESTAMP
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: 创建时间
      - name: updated_at
        type: TIMESTAMP
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: 更新时间
    Index:
      - name: idx_users_username
        columns: [username]
        unique: true
      - name: idx_users_email
        columns: [email]
        unique: true

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
        defaultValue: pending
      - name: total_amount
        type: DECIMAL(10,2)
        defaultValue: 0.00
      - name: created_at
        type: TIMESTAMP
        defaultValueComputed: CURRENT_TIMESTAMP
      - name: updated_at
        type: TIMESTAMP
        defaultValueComputed: CURRENT_TIMESTAMP
    Constraint:
      - name: fk_orders_user_id
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [user_id]
    Index:
      - name: idx_orders_order_no
        columns: [order_no]
        unique: true
```

## 数据库特定支持

### MySQL

```sql
-- MySQL 特定语法
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### PostgreSQL

```sql
-- PostgreSQL 特定语法
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

### Oracle

```sql
-- Oracle 特定语法
CREATE TABLE users (
  id NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY PRIMARY KEY,
  username VARCHAR2(50) NOT NULL,
  email VARCHAR2(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 命令行工具

```bash
# 从数据库提取
justdb db2schema \
  --url jdbc:mysql://localhost:3306/myapp \
  --user root \
  --password secret \
  --output schema.yaml \
  --format yaml

# 指定表
justdb db2schema \
  --url jdbc:mysql://localhost:3306/myapp \
  --user root \
  --password secret \
  --tables users,orders \
  --output schema.yaml

# 包含数据
justdb db2schema \
  --url jdbc:mysql://localhost:3306/myapp \
  --user root \
  --password secret \
  --include-data \
  --output schema.yaml
```

## 最佳实践

### 1. 定期提取 Schema

```bash
# 使用脚本定期提取
#!/bin/bash
justdb db2schema \
  --url jdbc:mysql://localhost:3306/myapp \
  --user root \
  --password $DB_PASSWORD \
  --output justdb/schema-$(date +%Y%m%d).yaml
```

### 2. 版本控制

```bash
# 提取并提交到版本控制
justdb db2schema ... > schema.yaml
git add schema.yaml
git commit -m "Update schema from database"
```

### 3. 对比变更

```bash
# 对比数据库和文件差异
justdb diff \
  --database jdbc:mysql://localhost:3306/myapp \
  --file schema.yaml
```

## 相关文档

- [YAML 格式](./yaml.md)
- [格式支持概述](./README.md)
