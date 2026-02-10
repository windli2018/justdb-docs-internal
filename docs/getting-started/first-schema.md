---
date: 2024-01-01
icon: file-code
title: 创建第一个 Schema
order: 4
category:
  - 快速开始
  - schema
tag:
  - schema
  - 定义
  - 语法
---

# 第一个 Schema

学习如何定义你的第一个 JustDB Schema。本教程将逐步介绍 Schema 定义的各个方面。

## Schema 基本结构

### 最简单的 Schema

::: code-tabs
@tab YAML
```yaml
# minimal.yaml
namespace: com.example
Table:
  - name: users
    Column:
      - name: id
        type: INT
        primaryKey: true
```

@tab XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb namespace="com.example">
    <Table name="users">
        <Column name="id" type="INT" primaryKey="true"/>
    </Table>
</Justdb>
```

@tab JSON
```json
{
  "namespace": "com.example",
  "Table": [
    {
      "name": "users",
      "Column": [
        {
          "name": "id",
          "type": "INT",
          "primaryKey": true
        }
      ]
    }
  ]
}
```

@tab SQL
```sql
-- minimal.sql
CREATE TABLE users (
    id INT PRIMARY KEY
);
```

@tab TOML
```toml
namespace = "com.example"

[[Table]]
name = "users"

[[Table.Column]]
name = "id"
type = "INT"
primaryKey = true
```
:::

### 完整的 Schema 结构

```yaml
# complete.yaml
namespace: com.example             # 命名空间
catalog: myapp                     # 数据库目录（可选）

# 表定义
Table:
  - id: users                      # 表 ID（用于引用）
    name: users                    # 表名
    comment: 用户表                # 表注释
    engine: InnoDB                 # MySQL 特定属性
    charset: utf8mb4               # 字符集

    # 列定义
    Column:
      - name: id                   # 列名
        type: BIGINT               # 数据类型
        primaryKey: true           # 主键
        autoIncrement: true        # 自增
        comment: 用户ID

      - name: username
        type: VARCHAR(50)
        nullable: false            # 非空
        comment: 用户名

      - name: email
        type: VARCHAR(100)
        comment: 邮箱

      - name: status
        type: VARCHAR(20)
        defaultValue: active       # 默认值
        comment: 状态

      - name: created_at
        type: TIMESTAMP
        nullable: false
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: 创建时间

    # 索引定义
    Index:
      - name: idx_username
        columns: [username]
        unique: true               # 唯一索引
        comment: 用户名唯一索引

      - name: idx_email
        columns: [email]
        unique: true

    # 约束定义
    Constraint:
      - name: chk_status
        type: CHECK
        check: "status IN ('active', 'inactive', 'suspended')"
```

## 数据类型

### 常用数据类型

```yaml
Table:
  - name: examples
    Column:
      # 整数类型
      - name: col_tinyint
        type: TINYINT
      - name: col_smallint
        type: SMALLINT
      - name: col_int
        type: INT
      - name: col_bigint
        type: BIGINT

      # 浮点类型
      - name: col_float
        type: FLOAT
      - name: col_double
        type: DOUBLE
      - name: col_decimal
        type: DECIMAL(10, 2)

      # 字符串类型
      - name: col_char
        type: CHAR(10)
      - name: col_varchar
        type: VARCHAR(255)
      - name: col_text
        type: TEXT

      # 日期时间类型
      - name: col_date
        type: DATE
      - name: col_time
        type: TIME
      - name: col_datetime
        type: DATETIME
      - name: col_timestamp
        type: TIMESTAMP

      # 二进制类型
      - name: col_blob
        type: BLOB
      - name: col_binary
        type: BINARY(16)

      # 布尔类型
      - name: col_boolean
        type: BOOLEAN
```

### 类型映射

JustDB 自动处理不同数据库的类型映射：

| JustDB 类型 | MySQL | PostgreSQL | Oracle |
|:---|:---|:---|:---|
| `BIGINT` | `BIGINT` | `BIGINT` | `NUMBER(19)` |
| `VARCHAR(n)` | `VARCHAR(n)` | `VARCHAR(n)` | `VARCHAR2(n)` |
| `TIMESTAMP` | `TIMESTAMP` | `TIMESTAMP` | `TIMESTAMP` |
| `BOOLEAN` | `TINYINT(1)` | `BOOLEAN` | `NUMBER(1)` |

## 列属性

### 主键

::: code-tabs
@tab YAML
```yaml
Column:
  - name: id
    type: BIGINT
    primaryKey: true
    autoIncrement: true
```

@tab XML
```xml
<Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
```

@tab JSON
```json
{
  "Column": [
    {
      "name": "id",
      "type": "BIGINT",
      "primaryKey": true,
      "autoIncrement": true
    }
  ]
}
```

@tab SQL
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT
);
```

@tab TOML
```toml
[[Column]]
name = "id"
type = "BIGINT"
primaryKey = true
autoIncrement = true
```
:::

### 非空约束

::: code-tabs
@tab YAML
```yaml
Column:
  - name: username
    type: VARCHAR(50)
    nullable: false
```

@tab XML
```xml
<Column name="username" type="VARCHAR(50)" nullable="false"/>
```

@tab JSON
```json
{
  "Column": [
    {
      "name": "username",
      "type": "VARCHAR(50)",
      "nullable": false
    }
  ]
}
```

@tab SQL
```sql
CREATE TABLE users (
    username VARCHAR(50) NOT NULL
);
```

@tab TOML
```toml
[[Column]]
name = "username"
type = "VARCHAR(50)"
nullable = false
```
:::

### 默认值

::: code-tabs
@tab YAML
```yaml
Column:
  # 固定默认值
  - name: status
    type: VARCHAR(20)
    defaultValue: active

  # 计算默认值
  - name: created_at
    type: TIMESTAMP
    defaultValueComputed: CURRENT_TIMESTAMP

  # 使用函数
  - name: uuid
    type: CHAR(36)
    defaultValueComputed: UUID()
```

@tab XML
```xml
<Column name="status" type="VARCHAR(20)" defaultValue="active"/>
<Column name="created_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP"/>
<Column name="uuid" type="CHAR(36)" defaultValueComputed="UUID()"/>
```

@tab JSON
```json
{
  "Column": [
    {
      "name": "status",
      "type": "VARCHAR(20)",
      "defaultValue": "active"
    },
    {
      "name": "created_at",
      "type": "TIMESTAMP",
      "defaultValueComputed": "CURRENT_TIMESTAMP"
    },
    {
      "name": "uuid",
      "type": "CHAR(36)",
      "defaultValueComputed": "UUID()"
    }
  ]
}
```

@tab SQL
```sql
CREATE TABLE users (
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uuid CHAR(36) DEFAULT UUID()
);
```

@tab TOML
```toml
[[Column]]
name = "status"
type = "VARCHAR(20)"
defaultValue = "active"

[[Column]]
name = "created_at"
type = "TIMESTAMP"
defaultValueComputed = "CURRENT_TIMESTAMP"

[[Column]]
name = "uuid"
type = "CHAR(36)"
defaultValueComputed = "UUID()"
```
:::

### 唯一约束

::: code-tabs
@tab YAML
```yaml
Column:
  - name: email
    type: VARCHAR(100)
    unique: true
```

@tab XML
```xml
<Column name="email" type="VARCHAR(100)" unique="true"/>
```

@tab JSON
```json
{
  "Column": [
    {
      "name": "email",
      "type": "VARCHAR(100)",
      "unique": true
    }
  ]
}
```

@tab SQL
```sql
CREATE TABLE users (
    email VARCHAR(100) UNIQUE
);
```

@tab TOML
```toml
[[Column]]
name = "email"
type = "VARCHAR(100)"
unique = true
```
:::

### 注释

```yaml
Column:
  - name: id
    type: BIGINT
    comment: 用户ID，主键自增
```

## 索引

### 普通索引

::: code-tabs
@tab YAML
```yaml
Index:
  - name: idx_username
    columns: [username]
    comment: 用户名索引
```

@tab XML
```xml
<Index name="idx_username" comment="用户名索引">
    <IndexColumn name="username"/>
</Index>
```

@tab JSON
```json
{
  "Index": [
    {
      "name": "idx_username",
      "columns": ["username"],
      "comment": "用户名索引"
    }
  ]
}
```

@tab SQL
```sql
CREATE INDEX idx_username ON users (username);
```

@tab TOML
```toml
[[Index]]
name = "idx_username"
columns = ["username"]
comment = "用户名索引"
```
:::

### 唯一索引

::: code-tabs
@tab YAML
```yaml
Index:
  - name: idx_email
    columns: [email]
    unique: true
```

@tab XML
```xml
<Index name="idx_email" unique="true">
    <IndexColumn name="email"/>
</Index>
```

@tab JSON
```json
{
  "Index": [
    {
      "name": "idx_email",
      "columns": ["email"],
      "unique": true
    }
  ]
}
```

@tab SQL
```sql
CREATE UNIQUE INDEX idx_email ON users (email);
```

@tab TOML
```toml
[[Index]]
name = "idx_email"
columns = ["email"]
unique = true
```
:::

### 复合索引

::: code-tabs
@tab YAML
```yaml
Index:
  - name: idx_user_status
    columns: [user_id, status]
    comment: 用户状态复合索引
```

@tab XML
```xml
<Index name="idx_user_status" comment="用户状态复合索引">
    <IndexColumn name="user_id"/>
    <IndexColumn name="status"/>
</Index>
```

@tab JSON
```json
{
  "Index": [
    {
      "name": "idx_user_status",
      "columns": ["user_id", "status"],
      "comment": "用户状态复合索引"
    }
  ]
}
```

@tab SQL
```sql
CREATE INDEX idx_user_status ON users (user_id, status);
```

@tab TOML
```toml
[[Index]]
name = "idx_user_status"
columns = ["user_id", "status"]
comment = "用户状态复合索引"
```
:::

### 索引选项

```yaml
Index:
  - name: idx_created
    columns: [created_at]
    type: BTREE           # 索引类型
    comment: 创建时间索引
```

## 外键关系

### 定义外键

::: code-tabs
@tab YAML
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
      - name: fk_orders_user
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        foreignKey: user_id
        onDelete: CASCADE     # 删除级联
        onUpdate: RESTRICT    # 更新限制
```

@tab XML
```xml
<Table name="orders">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="user_id" type="BIGINT" nullable="false"/>
    <Constraint name="fk_orders_user" type="FOREIGN_KEY"
                referencedTable="users" referencedColumn="id"
                foreignKey="user_id" onDelete="CASCADE" onUpdate="RESTRICT"/>
</Table>
```

@tab JSON
```json
{
  "Table": [
    {
      "name": "orders",
      "Column": [
        {
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true
        },
        {
          "name": "user_id",
          "type": "BIGINT",
          "nullable": false
        }
      ],
      "Constraint": [
        {
          "name": "fk_orders_user",
          "type": "FOREIGN_KEY",
          "referencedTable": "users",
          "referencedColumn": "id",
          "foreignKey": "user_id",
          "onDelete": "CASCADE",
          "onUpdate": "RESTRICT"
        }
      ]
    }
  ]
}
```

@tab SQL
```sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT
);
```

@tab TOML
```toml
[[Table]]
name = "orders"

[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true

[[Table.Column]]
name = "user_id"
type = "BIGINT"
nullable = false

[[Table.Constraint]]
name = "fk_orders_user"
type = "FOREIGN_KEY"
referencedTable = "users"
referencedColumn = "id"
foreignKey = "user_id"
onDelete = "CASCADE"
onUpdate = "RESTRICT"
```
:::

### 一对多关系

```yaml
# 用户表
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true

# 订单表（多）
Table:
  - name: orders
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: user_id
        type: BIGINT
    Constraint:
      - type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        foreignKey: user_id
```

### 多对多关系

```yaml
# 学生表
Table:
  - name: students
    Column:
      - name: id
        type: BIGINT
        primaryKey: true

# 课程表
Table:
  - name: courses
    Column:
      - name: id
        type: BIGINT
        primaryKey: true

# 关联表
Table:
  - name: student_courses
    Column:
      - name: student_id
        type: BIGINT
      - name: course_id
        type: BIGINT
    Constraint:
      - type: FOREIGN_KEY
        referencedTable: students
        referencedColumn: id
        foreignKey: student_id
      - type: FOREIGN_KEY
        referencedTable: courses
        referencedColumn: id
        foreignKey: course_id
    Index:
      - name: idx_student_course
        columns: [student_id, course_id]
        unique: true
```

## Schema 继承

### 使用 referenceId

::: code-tabs
@tab YAML
```yaml
# 定义可复用的列
Column:
  - id: global_id
    name: id
    type: BIGINT
    primaryKey: true
    autoIncrement: true

  - id: global_timestamp
    name: created_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP

# 引用定义的列
Table:
  - name: users
    Column:
      - referenceId: global_id    # 引用 global_id
      - name: username
        type: VARCHAR(50)
      - referenceId: global_timestamp  # 引用 global_timestamp
```

@tab XML
```xml
<!-- 定义可复用的列 -->
<Column id="global_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
<Column id="global_timestamp" name="created_at" type="TIMESTAMP"
        nullable="false" defaultValueComputed="CURRENT_TIMESTAMP"/>

<!-- 引用定义的列 -->
<Table name="users">
    <Column referenceId="global_id"/>
    <Column name="username" type="VARCHAR(50)"/>
    <Column referenceId="global_timestamp"/>
</Table>
```

@tab JSON
```json
{
  "Column": [
    {
      "id": "global_id",
      "name": "id",
      "type": "BIGINT",
      "primaryKey": true,
      "autoIncrement": true
    },
    {
      "id": "global_timestamp",
      "name": "created_at",
      "type": "TIMESTAMP",
      "nullable": false,
      "defaultValueComputed": "CURRENT_TIMESTAMP"
    }
  ],
  "Table": [
    {
      "name": "users",
      "Column": [
        {
          "referenceId": "global_id"
        },
        {
          "name": "username",
          "type": "VARCHAR(50)"
        },
        {
          "referenceId": "global_timestamp"
        }
      ]
    }
  ]
}
```

@tab TOML
```toml
# 定义可复用的列
[[Column]]
id = "global_id"
name = "id"
type = "BIGINT"
primaryKey = true
autoIncrement = true

[[Column]]
id = "global_timestamp"
name = "created_at"
type = "TIMESTAMP"
nullable = false
defaultValueComputed = "CURRENT_TIMESTAMP"

# 引用定义的列
[[Table]]
name = "users"

[[Table.Column]]
referenceId = "global_id"

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"

[[Table.Column]]
referenceId = "global_timestamp"
```
:::

## Schema 组织

### 多文件组织

```
justdb/
├── core.yaml           # 核心表
├── user.yaml           # 用户相关表
├── order.yaml          # 订单相关表
└── product.yaml        # 商品相关表
```

### Schema 导入

```yaml
# core.yaml
id: core
namespace: com.example.core
Table:
  - name: users
    Column: [...]

# user.yaml
import: [core]  # 导入 core schema
id: user
namespace: com.example.user
Table:
  - name: user_profiles
    Column: [...]
```

## 多数据库支持

### 数据库特定属性

```yaml
Table:
  - name: users
    # MySQL 特定
    engine: InnoDB
    row_format: COMPRESSED

    # PostgreSQL 特定
    tablespace: users_space

    # Oracle 特定
    compress: YES

    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```

### 条件配置

```yaml
Table:
  - name: users
    beforeCreates:
      - dbms: mysql
        sql: "SET sql_mode='STRICT_TRANS_TABLES'"
      - dbms: postgresql
        sql: "SET timezone='UTC'"
```

## 最佳实践

### 1. 命名规范

```yaml
# 好的做法
Table:
  - name: users           # 表名小写复数
    Column:
      - name: user_id     # 外键命名：表名_id
        type: BIGINT
      - name: created_at  # 时间戳使用 _at 后缀
        type: TIMESTAMP

# 避免
Table:
  - name: User            # 避免大写
    Column:
      - name: userId      # 避免驼峰命名
```

### 2. 注释完整

```yaml
Table:
  - name: orders
    comment: 订单表，存储所有订单信息
    Column:
      - name: order_no
        type: VARCHAR(50)
        comment: 订单号，格式：YYYYMMDD + 序号
      - name: total_amount
        type: DECIMAL(10, 2)
        comment: 订单总金额（单位：分）
```

### 3. 合理使用索引

```yaml
Table:
  - name: orders
    Index:
      # 为经常查询的字段创建索引
      - name: idx_user_id
        columns: [user_id]

      # 为唯一字段创建唯一索引
      - name: idx_order_no
        columns: [order_no]
        unique: true

      # 复合索引注意顺序
      - name: idx_user_status
        columns: [user_id, status]
```

### 4. 使用别名支持旧格式

```yaml
Column:
  # 所有这些格式都支持
  - name: id
    ref-id: global_id       # kebab-case
    referencedTable: users  # 规范格式（camelCase）
    ref_id: global_id       # snake_case
```

## 下一步

<VPCard
  title="迁移基础"
  desc="了解如何进行 Schema 迁移"
  link="/getting-started/migration-basics.html"
/>

<VPCard
  title="Spring Boot 集成"
  desc="在 Spring Boot 中使用 JustDB"
  link="/getting-started/spring-boot-integration.html"
/>

<VPCard
  title="常见任务"
  desc="查看常见的数据库操作示例"
  link="/getting-started/common-tasks.html"
/>
