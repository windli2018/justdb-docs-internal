---
icon: file-code
title: 格式支持概述
order: 11
category:
  - 参考文档
  - 格式支持
tag:
  - formats
  - serialization
---

# 格式支持概述

JustDB 支持多种 Schema 定义格式，你可以根据项目需求选择最适合的格式。所有格式都支持完整的 Schema 定义功能，并且可以相互转换。

## 支持的格式

| 格式 | 文件扩展名 | 人类可读 | 配置友好 | 注释支持 | 推荐场景 |
|------|-----------|---------|---------|---------|---------|
| **XML** | .xml | ✓✓✓ | ✓✓ | ✓ | 推荐使用，结构最清晰 |
| **SQL** | .sql | ✓✓ | ✓✓ | ✓ | 技术人员首选，直观易懂 |
| **YAML** | .yaml, .yml | ✓ | ✓✓ | ✓ | 配置文件，缩进需注意 |
| **JSON** | .json | ✓ | ✓✓ | - | API 集成，机器处理 |
| **TOML** | .toml | ✓✓ | ✓✓ | ✓ | 配置文件 |
| **Properties** | .properties | ✓ | ✓ | ✓ | 简单配置 |
| **Markdown** | .md | ✓✓✓ | - | ✓ | 文档化 Schema |
| **Excel** | .xlsx | ✓✓ | ✓✓ | - | 非技术人员编辑 |

## 格式对比

### 可读性对比

::: code-tabs
@tab XML
```xml
<Table name="users" comment="用户表">
  <Column name="id" type="BIGINT" primaryKey="true"/>
  <Column name="username" type="VARCHAR(50)"/>
</Table>
```

@tab YAML
```yaml
Table:
  - name: users
    comment: 用户表
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
```

@tab JSON
```json
{
  "Table": [
    {
      "name": "users",
      "comment": "用户表",
      "Column": [
        {
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true
        },
        {
          "name": "username",
          "type": "VARCHAR(50)"
        }
      ]
    }
  ]
}
```

@tab SQL
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50)
) COMMENT '用户表';
```

@tab TOML
```toml
[[Table]]
name = "users"
comment = "用户表"

[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"
```
:::

### 功能对比

| 功能 | XML | SQL | YAML | JSON | TOML | Properties |
|------|-----|-----|------|------|------|-----------|
| 注释支持 | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| 结构清晰度 | ✓✓✓ | ✓✓ | ✓ | ✓ | ✓✓ | ✓ |
| 缩进敏感性 | 低 | 低 | 高 | 高 | 中 | 低 |
| 学习成本 | 中 | 低 | 中 | 低 | 低 | 低 |
| 工具支持 | ✓✓✓ | ✓✓✓ | ✓✓ | ✓✓✓ | ✓✓ | ✓ |
| 企业级应用 | ✓✓✓ | ✓✓ | ✓ | ✓ | ✓ | ✓ |

## 格式选择建议

### 推荐使用 XML

**优势**：
- 结构最清晰，层次分明，不易出错
- 强类型验证，标签闭合明确
- Schema 验证（XSD）支持完善
- 企业级标准，工具支持丰富
- 缩进不敏感，易于理解和维护

**适用场景**：
- 新项目（强烈推荐）
- 企业级应用
- 需要严格结构验证
- 团队协作开发
- 长期维护项目

```xml
<!-- 推荐：使用 XML -->
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="formats-readme" namespace="com.example">
    <Table name="users">
        <Column name="id" type="BIGINT"/>
    </Table>
</Justdb>
```

### 技术人员首选：使用 SQL

**优势**：
- 对数据库开发人员最直观易懂
- 直接对应实际DDL语句
- 无需学习新的语法结构
- 便于调试和验证
- 与现有数据库工具无缝集成

**适用场景**：
- 数据库专家和DBA
- 需要直接与数据库交互
- 现有SQL资产的逆向工程
- 快速原型开发
- 技术验证场景

```sql
-- 技术人员首选：使用 SQL
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) NOT NULL
) COMMENT '用户表';
```

### 使用 YAML

**优势**：
- 语法相对简洁
- 支持注释
- 配置文件常用格式

**注意事项**：
- 缩进敏感，容易出错
- 嵌套层次深时难以阅读
- 缺少明确的结束标记

**适用场景**：
- 简单配置场景
- DevOps配置文件
- 对缩进敏感度要求不高的项目

```yaml
# 注意缩进！
id: myapp
namespace: com.example
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
```

### 使用 JSON

**优势**：
- 广泛的工具支持
- API友好的标准格式
- 适合程序自动生成

**限制**：
- 不支持注释
- 缩进敏感
- 语法相对冗长

**适用场景**：
- API集成
- 自动化处理
- 程序间数据交换

### 使用 TOML

**优势**：
- 配置友好
- 语法清晰
- 时间/日期支持

**适用场景**：
- 应用配置
- 小型项目

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

## 格式转换

JustDB 支持格式之间的相互转换：

```bash
# XML 转 YAML
justdb convert -f xml -t yaml schema.xml > schema.yaml

# XML 转 JSON
justdb convert -f xml -t json schema.xml > schema.json

# JSON 转 XML
justdb convert -f json -t xml schema.json > schema.xml

# YAML 转 XML
justdb convert -f yaml -t xml schema.yaml > schema.xml
```

### 编程方式转换

```java
// 加载 YAML
Justdb schema = FormatFactory.loadFromFile("schema.yaml");

// 保存为 JSON
FormatFactory.saveToFile(schema, "schema.json", Format.JSON);

// 保存为 XML
FormatFactory.saveToFile(schema, "schema.xml", Format.XML);
```

## 别名支持

所有格式都支持字段别名，提供向后兼容性：

```yaml
# YAML 使用别名
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
```

```json
{
  "Table": [{
    "name": "users",
    "Column": [{
      "name": "id",
      "type": "BIGINT",
      "primaryKey": true
    }]
  }]
}
```

## 多格式混合使用

可以在一个项目中使用多种格式：

```yaml
# 主 Schema (YAML)
id: formats-readme
namespace: com.example

# 导入其他格式的 Schema
Import:
  - file: legacy-users.xml
  - file: additional-tables.json
```

## 格式特定特性

### YAML 多文档

```yaml
# 文档 1：基础 Schema
---
id: formats-readme
namespace: com.example
Table:
  - name: users

# 文档 2：扩展 Schema
---
id: formats-readme-extensions
namespace: com.example
Table:
  - name: orders
```

### JSON5 支持

JustDB 支持 JSON5 扩展语法：

```json
{
  // 支持注释
  "Table": [
    {
      "name": "users",
      "Column": [
        {
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true  // 支持尾随逗号
        }
      ]
    }
  ]
}
```

### XML 命名空间

```xml
<?xml version="1.0" encoding="UTF-8"?>
<justdb:Justdb xmlns:justdb="http://www.verydb.org/justdb"
               id="myapp"
               namespace="com.example">
  <justdb:Table name="users"/>
</justdb:Justdb>
```

## 完整示例

### 同一 Schema 的多种格式

#### YAML 格式

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

# 用户表
Table:
  - name: users
    comment: 用户表
    Column:
      - id: col_users_id
        referenceId: global_id
        name: id

      - name: username
        type: VARCHAR(50)
        nullable: false

      - name: email
        type: VARCHAR(100)

      - id: col_users_created_at
        referenceId: global_created_at
        name: created_at

    Index:
      - name: idx_users_username
        columns: [username]
        unique: true
```

#### JSON 格式

```json
{
  "id": "ecommerce",
  "namespace": "com.example.ecommerce",
  "Column": [
    {
      "id": "global_id",
      "name": "id",
      "type": "BIGINT",
      "primaryKey": true,
      "autoIncrement": true
    },
    {
      "id": "global_created_at",
      "name": "created_at",
      "type": "TIMESTAMP",
      "nullable": false,
      "defaultValueComputed": "CURRENT_TIMESTAMP"
    }
  ],
  "Table": [
    {
      "name": "users",
      "comment": "用户表",
      "Column": [
        {
          "id": "col_users_id",
          "referenceId": "global_id",
          "name": "id"
        },
        {
          "name": "username",
          "type": "VARCHAR(50)",
          "nullable": false
        },
        {
          "name": "email",
          "type": "VARCHAR(100)"
        },
        {
          "id": "col_users_created_at",
          "referenceId": "global_created_at",
          "name": "created_at"
        }
      ],
      "Index": [
        {
          "name": "idx_users_username",
          "columns": ["username"],
          "unique": true
        }
      ]
    }
  ]
}
```

#### XML 格式

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="ecommerce" namespace="com.example.ecommerce">

  <!-- 全局列定义 -->
  <Column id="global_id" name="id" type="BIGINT"
          primaryKey="true" autoIncrement="true"/>

  <Column id="global_created_at" name="created_at" type="TIMESTAMP"
          nullable="false" defaultValueComputed="CURRENT_TIMESTAMP"/>

  <!-- 用户表 -->
  <Table name="users" comment="用户表">
    <Column id="col_users_id" referenceId="global_id" name="id"/>
    <Column name="username" type="VARCHAR(50)" nullable="false"/>
    <Column name="email" type="VARCHAR(100)"/>
    <Column id="col_users_created_at" referenceId="global_created_at" name="created_at"/>

    <Index name="idx_users_username" unique="true">
      <columns>username</columns>
    </Index>
  </Table>

</Justdb>
```

#### SQL 格式

```sql
-- JustDB SQL 格式示例
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    email VARCHAR(100) COMMENT '邮箱地址',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) COMMENT '用户表';

CREATE INDEX idx_users_username ON users(username);
```

#### TOML 格式

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
name = "users"
comment = "用户表"

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

[[Table.Column]]
id = "col_users_created_at"
referenceId = "global_created_at"
name = "created_at"

[[Table.Index]]
name = "idx_users_username"
unique = true
columns = ["username"]
```

#### Properties 格式

```properties
# 全局列定义
column.global_id.name=id
column.global_id.type=BIGINT
column.global_id.primaryKey=true
column.global_id.autoIncrement=true

column.global_created_at.name=created_at
column.global_created_at.type=TIMESTAMP
column.global_created_at.nullable=false
column.global_created_at.defaultValueComputed=CURRENT_TIMESTAMP

# 用户表
table.users.name=users
table.users.comment=用户表

table.users.column.col_users_id.referenceId=global_id
table.users.column.col_users_id.name=id

table.users.column.username.name=username
table.users.column.username.type=VARCHAR(50)
table.users.column.username.nullable=false

table.users.column.email.name=email
table.users.column.email.type=VARCHAR(100)

table.users.column.col_users_created_at.referenceId=global_created_at
table.users.column.col_users_created_at.name=created_at

table.users.index.idx_users_username.unique=true
table.users.index.idx_users_username.columns=username
```

## 相关文档

- [YAML 格式](./yaml.md)
- [JSON 格式](./json.md)
- [XML 格式](./xml.md)
- [TOML 格式](./toml.md)
- [Properties 格式](./properties.md)
- [SQL 格式](./sql.md)
- [Markdown 格式](./markdown.md)
- [Excel 格式](./excel.md)
