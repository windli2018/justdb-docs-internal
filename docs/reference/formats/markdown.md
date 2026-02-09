---
icon: file-text
title: Markdown 格式
order: 19
category:
  - 参考文档
  - 格式支持
tag:
  - markdown
  - format
  - documentation
---

# Markdown 格式

JustDB 支持从 Markdown 文档中提取 Schema 定义，适合文档化优先的开发方式。

## 格式规范

### 文件扩展名

- `.md`
- `.markdown`

### 基本结构

```markdown
# 数据库设计文档

## 用户表 (users)

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 用户ID |
| username | VARCHAR(50) | NOT NULL | 用户名 |
| email | VARCHAR(100) | | 邮箱 |
```

## 语法特性

### 表格定义

```markdown
## 用户表 (users)

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 用户ID |
| username | VARCHAR(50) | NOT NULL | 用户名 |
| email | VARCHAR(100) | | 邮箱 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
```

### 索引定义

```markdown
### 索引

- **idx_users_username**: UNIQUE(username) - 用户名唯一索引
- **idx_users_email**: UNIQUE(email) - 邮箱唯一索引
```

### 约束定义

```markdown
### 约束

- **fk_orders_user_id**: FOREIGN KEY (user_id) REFERENCES users(id) - 用户外键
```

## 完整示例

```markdown
# 电商系统数据库设计

## 用户表 (users)

用户信息表，存储网站用户的基本信息。

### 列定义

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 用户ID |
| username | VARCHAR(50) | NOT NULL | 用户名 |
| email | VARCHAR(100) | | 邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希 |
| status | VARCHAR(20) | DEFAULT 'active' | 状态 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 索引

- **pk_users**: PRIMARY KEY(id)
- **idx_users_username**: UNIQUE(username) - 用户名唯一索引
- **idx_users_email**: UNIQUE(email) - 邮箱唯一索引
- **idx_users_status**: (status) - 状态索引

## 订单表 (orders)

订单信息表，存储用户的订单信息。

### 列定义

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 订单ID |
| user_id | BIGINT | NOT NULL, FOREIGN KEY → users(id) | 用户ID |
| order_no | VARCHAR(50) | NOT NULL, UNIQUE | 订单号 |
| status | VARCHAR(20) | DEFAULT 'pending' | 订单状态 |
| total_amount | DECIMAL(10,2) | DEFAULT 0.00 | 订单总额 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 约束

- **fk_orders_user_id**: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT - 用户外键

### 索引

- **idx_orders_user_id**: (user_id) - 用户ID索引
- **idx_orders_order_no**: UNIQUE(order_no) - 订单号唯一索引
- **idx_orders_status**: (status) - 状态索引

## 商品表 (products)

商品信息表，存储商品的基本信息。

### 列定义

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 商品ID |
| name | VARCHAR(200) | NOT NULL | 商品名称 |
| price | DECIMAL(10,2) | NOT NULL | 商品价格 |
| stock | INT | DEFAULT 0 | 库存数量 |
| category_id | BIGINT | | 分类ID |
| status | VARCHAR(20) | DEFAULT 'active' | 状态 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 索引

- **idx_products_category**: (category_id) - 分类索引
- **idx_products_price**: (price) - 价格索引
```

## 提取 Schema

```bash
# 从 Markdown 提取 Schema
justdb md2schema database-design.md > schema.yaml

# 指定输出格式
justdb md2schema database-design.md -f yaml -o schema.yaml
justdb md2schema database-design.md -f json -o schema.json
```

## 最佳实践

### 1. 使用清晰的标题结构

```markdown
# 数据库设计

## 用户表 (users)
### 列定义
### 索引
### 约束
```

### 2. 使用标准表格格式

```markdown
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT | PRIMARY KEY | 用户ID |
```

### 3. 添加注释说明

```markdown
## 用户表 (users)

用户信息表，存储网站用户的基本信息。
```

### 4. 保持一致的命名

```markdown
# 使用一致的表名和列名命名
users (用户表)
orders (订单表)
```

## 优势

- **文档化优先**：设计即文档
- **团队协作友好**：易于审查和讨论
- **版本控制友好**：清晰的差异对比
- **可读性强**：人类友好的格式

## 相关文档

- [YAML 格式](./yaml.md)
- [格式支持概述](./README.md)
