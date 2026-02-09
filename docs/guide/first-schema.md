---
icon: file-code
title: 第一个 Schema
order: 6
category:
  - 指南
  - Schema
tag:
  - Schema
  - 定义
  - 语法
---

# 第一个 Schema

学习如何定义你的第一个 JustDB Schema。本教程将逐步介绍 Schema 定义的各个方面。

## Schema 是什么

Schema（模式）是对数据库结构的**声明式定义**。你只需描述想要的数据库结构，JustDB 会自动处理创建和变更。

### 声明式 vs 命令式

**传统方式（命令式）**：
```sql
-- 需要手写 SQL
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100)
);

-- 修改时需要手写 ALTER TABLE
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
```

**JustDB 方式（声明式）**：
```yaml
# 只需定义结构
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
      - name: phone        # 直接添加
        type: VARCHAR(20)  # 自动生成 ALTER TABLE
```

## 最简单的 Schema

### 极简示例

```yaml
# minimal.yaml
id: myapp
namespace: com.example
Table:
  - name: users
    Column:
      - name: id
        type: INT
        primaryKey: true
```

**执行部署**：
```bash
justdb migrate minimal.yaml
```

**生成的 SQL**：
```sql
CREATE TABLE users (
  id INT NOT NULL,
  PRIMARY KEY (id)
);
```

## 完整的 Schema 结构

### 结构说明

```yaml
# complete.yaml
id: myapp                          # Schema 唯一标识
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

### 执行部署

```bash
justdb migrate complete.yaml

# 输出：
# [INFO] Loading schema from: complete.yaml
# [INFO] Connecting to database: jdbc:mysql://localhost:3306/myapp
# [INFO] Current database state: empty
# [INFO] Target schema: 1 table(s)
# [INFO] Changes to apply:
# [INFO]   + Create table: users
# [INFO] Generated SQL:
# [INFO]   CREATE TABLE users (
# [INFO]     id BIGINT NOT NULL AUTO_INCREMENT,
# [INFO]     username VARCHAR(50) NOT NULL,
# [INFO]     email VARCHAR(100),
# [INFO]     status VARCHAR(20) DEFAULT 'active',
# [INFO]     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
# [INFO]     PRIMARY KEY (id),
# [INFO]     UNIQUE KEY idx_username (username),
# [INFO]     UNIQUE KEY idx_email (email),
# [INFO]     CONSTRAINT chk_status CHECK (status IN ('active', 'inactive', 'suspended'))
# [INFO]   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
# [INFO] Executing migration...
# [INFO] Migration completed successfully
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

| JustDB 类型 | MySQL | PostgreSQL | Oracle | SQL Server |
|:---|:---|:---|:---|:---|
| `BIGINT` | `BIGINT` | `BIGINT` | `NUMBER(19)` | `BIGINT` |
| `VARCHAR(n)` | `VARCHAR(n)` | `VARCHAR(n)` | `VARCHAR2(n)` | `NVARCHAR(n)` |
| `TIMESTAMP` | `TIMESTAMP` | `TIMESTAMP` | `TIMESTAMP` | `DATETIME2` |
| `BOOLEAN` | `TINYINT(1)` | `BOOLEAN` | `NUMBER(1)` | `BIT` |

## 列属性

### 主键

```yaml
Column:
  - name: id
    type: BIGINT
    primaryKey: true
    autoIncrement: true
```

### 非空约束

```yaml
Column:
  - name: username
    type: VARCHAR(50)
    nullable: false
```

### 默认值

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

### 唯一约束

```yaml
Column:
  - name: email
    type: VARCHAR(100)
    unique: true
```

### 注释

```yaml
Column:
  - name: id
    type: BIGINT
    comment: 用户ID，主键自增
```

## 索引

### 普通索引

```yaml
Index:
  - name: idx_username
    columns: [username]
    comment: 用户名索引
```

### 唯一索引

```yaml
Index:
  - name: idx_email
    columns: [email]
    unique: true
```

### 复合索引

```yaml
Index:
  - name: idx_user_status
    columns: [user_id, status]
    comment: 用户状态复合索引
```

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

## Schema 组件说明

### Schema 根对象

```yaml
id: myapp              # 唯一标识
namespace: com.example # Java 命名空间
catalog: myapp         # 数据库目录（可选）
```

### Table（表）

表定义包含：
- `id` - 表的唯一标识符（用于 referenceId 引用）
- `name` - 表名
- `comment` - 表注释
- 数据库特定属性（如 MySQL 的 engine、charset）

### Column（列）

列定义包含：
- `name` - 列名
- `type` - 数据类型
- `primaryKey` - 是否主键
- `autoIncrement` - 是否自增
- `nullable` - 是否可为空
- `defaultValue` - 默认值
- `defaultValueComputed` - 计算默认值
- `unique` - 是否唯一
- `comment` - 列注释

### Index（索引）

索引定义包含：
- `name` - 索引名
- `columns` - 索引列
- `unique` - 是否唯一索引
- `type` - 索引类型
- `comment` - 索引注释

### Constraint（约束）

约束定义包含：
- `name` - 约束名
- `type` - 约束类型（PRIMARY_KEY, FOREIGN_KEY, UNIQUE, CHECK, NOT_NULL）
- 外键约束的附加属性：
  - `referencedTable` - 引用表
  - `referencedColumn` - 引用列
  - `foreignKey` - 外键列
  - `onDelete` - 删除行为
  - `onUpdate` - 更新行为

## Schema 继承

### 使用 referenceId

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

## 创建第一个 Schema

### 步骤 1：创建文件

```bash
# 创建 Schema 目录
mkdir -p justdb

# 创建 Schema 文件
cat > justdb/users.yaml << EOF
id: myapp
namespace: com.example
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
        nullable: false
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: 创建时间
    Index:
      - name: idx_username
        columns: [username]
        unique: true
      - name: idx_email
        columns: [email]
        unique: true
EOF
```

### 步骤 2：验证 Schema

```bash
# 验证 Schema 语法
justdb validate justdb/users.yaml

# 输出：
# [INFO] Loading schema from: justdb/users.yaml
# [INFO] Schema validation passed
```

### 步骤 3：预览 SQL

```bash
# 预览生成的 SQL
justdb migrate --dry-run

# 输出：
# [INFO] Loading schema from: justdb/
# [INFO] Connecting to database: jdbc:mysql://localhost:3306/myapp
# [INFO] Current database state: empty
# [INFO] Target schema: 1 table(s)
# [INFO] Changes to apply:
# [INFO]   + Create table: users
# [INFO] Generated SQL:
# [INFO]   CREATE TABLE users (
# [INFO]     id BIGINT NOT NULL AUTO_INCREMENT,
# [INFO]     username VARCHAR(50) NOT NULL,
# [INFO]     email VARCHAR(100),
# [INFO]     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
# [INFO]     PRIMARY KEY (id),
# [INFO]     UNIQUE KEY idx_username (username),
# [INFO]     UNIQUE KEY idx_email (email)
# [INFO]   ) COMMENT='用户表';
```

### 步骤 4：执行部署

```bash
# 部署到数据库
justdb migrate

# 输出：
# [INFO] Executing migration...
# [INFO] Migration completed successfully
```

### 步骤 5：验证结果

```sql
mysql> USE myapp;
mysql> SHOW TABLES;
+----------------+
| Tables_in_myapp |
+----------------+
| users           |
+----------------+

mysql> DESC users;
+-------------+--------------+------+-----+---------+----------------+
| Field       | Type         | Null | Key | Default | Extra          |
+-------------+--------------+------+-----+---------+----------------+
| id          | bigint(20)   | NO   | PRI | NULL    | auto_increment |
| username    | varchar(50)  | NO   | UNI | NULL    |                |
| email       | varchar(100) | YES  | UNI | NULL    |                |
| created_at  | timestamp    | NO   |     | CURRENT_TIMESTAMP |                |
+-------------+--------------+------+-----+---------+----------------+
```

## 下一步

<VPCard
  title="迁移基础"
  desc="了解如何进行 Schema 迁移"
  link="/guide/migration-strategies.html"
/>

<VPCard
  title="Schema 演进"
  desc="学习如何管理 Schema 变更"
  link="/guide/schema-evolution.html"
/>

<VPCard
  title="Spring Boot 集成"
  desc="在 Spring Boot 中使用 JustDB"
  link="/guide/spring-boot.html"
/>
