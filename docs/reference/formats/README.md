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
| **YAML** | .yaml, .yml | ✓✓✓ | ✓✓✓ | ✓ | 推荐使用，最佳可读性 |
| **JSON** | .json | ✓✓ | ✓✓ | - | API 集成，机器处理 |
| **XML** | .xml | ✓ | ✓✓ | ✓ | 企业应用，现有系统 |
| **TOML** | .toml | ✓✓ | ✓✓ | ✓ | 配置文件 |
| **Properties** | .properties | ✓ | ✓ | ✓ | 简单配置 |
| **SQL** | .sql | - | - | ✓ | 逆向工程 |
| **Markdown** | .md | ✓✓✓ | - | ✓ | 文档化 Schema |
| **Excel** | .xlsx | ✓✓ | ✓✓ | - | 非技术人员编辑 |

## 格式对比

### 可读性对比

&lt;CodeGroup&gt;
&lt;CodeGroupItem title="YAML"&gt;
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
&lt;/CodeGroupItem&gt;

&lt;CodeGroupItem title="JSON"&gt;
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
&lt;/CodeGroupItem&gt;

&lt;CodeGroupItem title="XML"&gt;
```xml
&lt;Table name="users" comment="用户表"&gt;
  &lt;Column name="id" type="BIGINT" primaryKey="true"/&gt;
  &lt;Column name="username" type="VARCHAR(50)"/&gt;
&lt;/Table&gt;
```
&lt;/CodeGroupItem&gt;
&lt;/CodeGroup&gt;

### 功能对比

| 功能 | YAML | JSON | XML | TOML | Properties |
|------|------|------|-----|------|-----------|
| 注释 | ✓ | ✗ | ✓ | ✓ | ✓ |
| 多文档 | ✓ | - | - | - | - |
| 引用 | ✓ | ✓ | ✓ | ✓ | - |
| 别名支持 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 类型丰富度 | ✓✓ | ✓✓ | ✓✓ | ✓ | ✓ |

## 格式选择建议

### 推荐使用 YAML

**优势**：
- 最佳可读性
- 支持注释
- 语法简洁
- 广泛支持

**适用场景**：
- 新项目
- 需要人工编辑
- 团队协作

```yaml
# 推荐：使用 YAML
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
- API 友好
- 适合机器处理

**适用场景**：
- API 集成
- 自动化处理
- 配置即代码

```json
{
  "id": "myapp",
  "Table": [
    {
      "name": "users",
      "Column": [
        {"name": "id", "type": "BIGINT"}
      ]
    }
  ]
}
```

### 使用 XML

**优势**：
- 企业级标准
- 强类型验证
- Schema 验证

**适用场景**：
- 现有 Java 企业应用
- 需要 XSD 验证
- JAXB 注解项目

```xml
&lt;Justdb id="myapp"&gt;
  &lt;Table name="users"&gt;
    &lt;Column name="id" type="BIGINT" primaryKey="true"/&gt;
  &lt;/Table&gt;
&lt;/Justdb&gt;
```

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
# YAML 转 JSON
justdb convert -f yaml -t json schema.yaml > schema.json

# JSON 转 XML
justdb convert -f json -t xml schema.json > schema.xml

# XML 转 YAML
justdb convert -f xml -t yaml schema.xml > schema.yaml
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
id: myapp
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
id: myapp
namespace: com.example
Table:
  - name: users

# 文档 2：扩展 Schema
---
id: myapp-extensions
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
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
<justdb:Justdb xmlns:justdb="http://www.verydb.org/justdb"
               id="myapp"
               namespace="com.example">
  &lt;justdb:Table name="users"/&gt;
&lt;/justdb:Justdb&gt;
```

## 完整示例

### 同一 Schema 的多种格式

&lt;tabs&gt;

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
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;Justdb id="ecommerce" namespace="com.example.ecommerce"&gt;

  &lt;!-- 全局列定义 --&gt;
  <Column id="global_id" name="id" type="BIGINT"
          primaryKey="true" autoIncrement="true"/>

  <Column id="global_created_at" name="created_at" type="TIMESTAMP"
          nullable="false" defaultValueComputed="CURRENT_TIMESTAMP"/>

  &lt;!-- 用户表 --&gt;
  &lt;Table name="users" comment="用户表"&gt;
    &lt;Column id="col_users_id" referenceId="global_id" name="id"/&gt;
    &lt;Column name="username" type="VARCHAR(50)" nullable="false"/&gt;
    &lt;Column name="email" type="VARCHAR(100)"/&gt;
    &lt;Column id="col_users_created_at" referenceId="global_created_at" name="created_at"/&gt;

    &lt;Index name="idx_users_username" unique="true"&gt;
      &lt;columns&gt;username&lt;/columns&gt;
    &lt;/Index&gt;
  &lt;/Table&gt;

&lt;/Justdb&gt;
```

&lt;/tabs&gt;

## 相关文档

- [YAML 格式](./yaml.md)
- [JSON 格式](./json.md)
- [XML 格式](./xml.md)
- [TOML 格式](./toml.md)
- [Properties 格式](./properties.md)
- [SQL 格式](./sql.md)
- [Markdown 格式](./markdown.md)
- [Excel 格式](./excel.md)
