---
icon: file-code
title: Schema 定义详解
order: 1
---

# Schema 定义详解

深入了解 JustDB 的 Schema 定义语法和特性。

## 概述

JustDB Schema 是一种声明式的数据库结构定义语言，支持多种格式（XML、JSON、YAML、TOML、Properties）。

## 基本结构

### Schema 根元素

```yaml
id: myapp                    # Schema 唯一标识
namespace: com.example       # Java 命名空间（可选）
version: 1.0.0              # 版本号（可选）
```

### XML 格式

```xml
<Justdb id="myapp" namespace="com.example" version="1.0.0">
  <!-- 表定义 -->
</Justdb>
```

### JSON 格式

```json
{
  "id": "myapp",
  "namespace": "com.example",
  "version": "1.0.0"
}
```

## 表定义

### 基本语法

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
```

### 表属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | String | 表名（必需） |
| `comment` | String | 表注释 |
| `formerNames` | List | 曾用名列表，用于重命名检测 |
| `engine` | String | 存储引擎（MySQL） |
| `charset` | String | 字符集 |
| `collation` | String | 排序规则 |

### XML 格式表定义

```xml
<Table name="users" comment="用户表">
  <Column name="id" type="BIGINT" primaryKey="true"/>
  <Column name="username" type="VARCHAR(50)" nullable="false"/>
</Table>
```

## 列定义

### 基本语法

```yaml
Column:
  - name: id
    type: BIGINT
    primaryKey: true
    autoIncrement: true
    comment: 主键ID
```

### 列属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | String | 列名（必需） |
| `type` | String | 数据类型（必需） |
| `nullable` | Boolean | 是否可为空 |
| `defaultValue` | String | 默认值 |
| `primaryKey` | Boolean | 是否主键 |
| `autoIncrement` | Boolean | 是否自增 |
| `unique` | Boolean | 是否唯一 |
| `comment` | String | 列注释 |
| `formerNames` | List | 曾用名列表 |

### 数据类型

JustDB 支持标准 SQL 数据类型，会根据目标数据库自动转换：

| 类型 | 说明 |
|------|------|
| `BIGINT` | 64位整数 |
| `INTEGER` / `INT` | 32位整数 |
| `SMALLINT` | 16位整数 |
| `TINYINT` | 8位整数 |
| `VARCHAR(n)` | 变长字符串 |
| `CHAR(n)` | 定长字符串 |
| `TEXT` | 长文本 |
| `DECIMAL(p,s)` | 精确数值 |
| `DATE` | 日期 |
| `DATETIME` / `TIMESTAMP` | 日期时间 |
| `BOOLEAN` / `BOOL` | 布尔值 |

## 索引定义

### 基本语法

```yaml
Index:
  - name: idx_username
    columns: [username]
    unique: true
    comment: 用户名唯一索引
```

### 索引属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | String | 索引名（必需） |
| `columns` | List | 索引列（必需） |
| `unique` | Boolean | 是否唯一索引 |
| `type` | String | 索引类型（BTREE, HASH） |
| `comment` | String | 索引注释 |

### 复合索引

```yaml
Index:
  - name: idx_user_email
    columns: [user_id, email]
    unique: true
```

## 约束定义

### 主键约束

```yaml
Column:
  - name: id
    type: BIGINT
    primaryKey: true
```

### 外键约束

```yaml
Constraint:
  - name: fk_orders_user
    type: FOREIGN_KEY
    foreignKey: user_id
    referencedTable: users
    referencedColumn: id
    onDelete: CASCADE
    onUpdate: RESTRICT
```

### 唯一约束

```yaml
Constraint:
  - name: uk_email
    type: UNIQUE
    columns: [email]
```

### 检查约束

```yaml
Constraint:
  - name: ck_age
    type: CHECK
    check: "age >= 18"
```

## 视图定义

### 基本语法

```yaml
View:
  - name: user_orders
    comment: 用户订单视图
    query: |
      SELECT u.username, o.order_date, o.total
      FROM users u
      JOIN orders o ON u.id = o.user_id
```

### 视图属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | String | 视图名（必需） |
| `query` | String | SQL 查询（必需） |
| `comment` | String | 视图注释 |

## 序列定义

```yaml
Sequence:
  - name: seq_user_id
    startWith: 1000
    incrementBy: 1
    minValue: 1000
    maxValue: 999999
    cache: 20
```

## 触发器定义

```yaml
Trigger:
  - name: trg_update_timestamp
    table: users
    timing: BEFORE
    event: UPDATE
    body: |
      NEW.updated_at = CURRENT_TIMESTAMP
```

## 引用系统

### 引用全局列

```yaml
# 定义全局列
Column:
  - id: global_id
    name: id
    type: BIGINT
    primaryKey: true
    autoIncrement: true

# 在表中引用
Table:
  - name: users
    Column:
      - referenceId: global_id
      - name: id  # 可选覆盖名称
```

### 引用全局表

```yaml
# 定义全局表
Table:
  - id: base_user_table
    name: users
    Column: [...]

# 扩展表
Table:
  - id: user_profile
    referenceId: base_user_table
    Column:
      - name: avatar_url
        type: VARCHAR(255)
```

## 生命周期钩子

### 在 Schema 中定义

```yaml
Table:
  - name: users
    beforeCreates:
      - sql: |
          CREATE TABLE audit_log (
            action VARCHAR(50),
            timestamp TIMESTAMP
          );
    afterCreates:
      - dbms: mysql
        sql: |
          ALTER TABLE users AUTO_INCREMENT = 1000
```

### 钩子类型

| 钩子 | 说明 |
|------|------|
| `beforeCreates` | 创建前执行 |
| `afterCreates` | 创建后执行 |
| `beforeAlters` | 修改前执行 |
| `afterAlters` | 修改后执行 |
| `beforeDrops` | 删除前执行 |
| `afterDrops` | 删除后执行 |

## 条件执行

### 数据库特定代码

```yaml
afterCreates:
  - dbms: mysql
    sql: |
      ALTER TABLE users ENGINE=InnoDB
  - dbms: postgresql
    sql: |
      CREATE INDEX CONCURRENTLY idx_username ON users(username)
```

### Schema 状态条件

```yaml
afterAlters:
  - condition: "{{oldValue.size < newValue.size}}"
    sql: |
      -- 扩容操作
      ALTER TABLE [...] ALLOCATE EXTRA STORAGE
```

## 多文件 Schema

### 主文件

```yaml
# schema.yaml
id: myapp
includes:
  - path: tables/users.yaml
  - path: tables/orders.yaml
```

### 被包含文件

```yaml
# tables/users.yaml
Table:
  - name: users
    Column: [...]
```

### 绝对路径引用

```yaml
includes:
  - path: /opt/schema/common-tables.yaml
```

### URL 引用

```yaml
includes:
  - url: https://example.com/schemas/common.yaml
```

## 注释和文档

### 单行注释

```yaml
# 这是注释
Table:
  - name: users
```

### 多行注释（XML）

```xml
<!--
  用户表定义
  包含基本用户信息
-->
<Table name="users">
  ...
</Table>
```

## 最佳实践

### 1. 命名规范

```yaml
# 表名：小写，下划线分隔
Table:
  - name: user_profiles  # 推荐
  - name: UserProfiles   # 避免

# 列名：小写，下划线分隔
Column:
  - name: created_at  # 推荐
  - name: createdAt   # 避免

# 索引名：idx_开头
Index:
  - name: idx_username  # 推荐

# 约束名：描述性前缀
Constraint:
  - name: fk_orders_user    # 外键
  - name: uk_email           # 唯一
  - name: ck_age_positive    # 检查
```

### 2. 使用注释

```yaml
Table:
  - name: users
    comment: 用户信息表  # 总是添加注释
    Column:
      - name: status
        type: VARCHAR(20)
        comment: 用户状态: active, inactive, suspended  # 说明枚举值
```

### 3. 模块化

```yaml
# 主文件只包含结构
id: myapp
includes:
  - tables/*.yaml
  - views/*.yaml
  - constraints/*.yaml
```

### 4. 使用 formerNames 追踪变更

```yaml
Table:
  - name: users
    formerNames: [user]  # 记录重命名
```

## 完整示例

```yaml
---
id: myapp
version: 1.0.0
namespace: com.example

# 全局列定义
Column:
  - id: global_id
    name: id
    type: BIGINT
    primaryKey: true
    autoIncrement: true
    comment: 主键ID

  - id: global_timestamps
    Column:
      - name: created_at
        type: TIMESTAMP
        defaultValue: CURRENT_TIMESTAMP
      - name: updated_at
        type: TIMESTAMP

# 表定义
Table:
  - name: users
    comment: 用户表
    Column:
      - referenceId: global_id
      - name: username
        type: VARCHAR(50)
        nullable: false
        unique: true
      - referenceId: global_timestamps

    Index:
      - name: idx_username
        columns: [username]

    Constraint:
      - name: uk_username
        type: UNIQUE
        columns: [username]

  - name: orders
    comment: 订单表
    formerNames: [order]
    Column:
      - referenceId: global_id
      - name: user_id
        type: BIGINT
        nullable: false
      - name: total_amount
        type: DECIMAL(10,2)
        defaultValue: "0.00"

    Constraint:
      - name: fk_orders_user
        type: FOREIGN_KEY
        foreignKey: user_id
        referencedTable: users
        referencedColumn: id
        onDelete: CASCADE
```

## 相关文档

- **[Schema 结构设计](/reference/schema/)** - Schema 结构详细参考
- **[模板系统](/design/template-system/)** - SQL 生成模板
- **[迁移基础](/getting-started/migration-basics.html)** - 迁移机制
