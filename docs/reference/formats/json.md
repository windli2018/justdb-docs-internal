---
icon: braces
title: JSON 格式
order: 13
category:
  - 参考文档
  - 格式支持
tag:
  - json
  - format
---

# JSON 格式

JSON（JavaScript Object Notation）是一种轻量级的数据交换格式，广泛用于 API 集成和配置即代码场景。

## 格式规范

### 文件扩展名

- `.json`

### 基本结构

```json
{
  "id": "myapp",
  "namespace": "com.example",
  "Table": [
    {
      "name": "users",
      "comment": "用户表",
      "Column": [
        {
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true,
          "autoIncrement": true
        }
      ]
    }
  ]
}
```

## 语法特性

### 数据类型

| JSON 类型 | Java 类型 | 示例 |
|-----------|----------|------|
| 字符串 | String | `"name": "users"` |
| 数字 | Integer, Long, Double | `"port": 3306` |
| 布尔值 | Boolean | `"nullable": false` |
| 数组 | List | `"dbms": ["mysql", "postgresql"]` |
| 对象 | Map, Object | `"metadata": {"key": "value"}` |
| null | null | `"defaultValue": null` |

### 转义字符

```json
{
  "content": "SELECT * FROM \"users\"",
  "comment": "User's name",
  "path": "C:\\Users\\config"
}
```

### 多行字符串

JSON 标准不支持多行字符串，使用 `\n`：

```json
{
  "View": [{
    "name": "active_users",
    "content": "SELECT *\nFROM users\nWHERE status = 'active'"
  }]
}
```

或使用 JSON5 扩展（JustDB 支持）：

```json
{
  "View": [{
    "name": "active_users",
    "content": "
      SELECT *
      FROM users
      WHERE status = 'active'
    "
  }]
}
```

## 别名支持

JSON 支持所有字段别名，提供向后兼容性：

```json
{
  "Table": [{
    "name": "users",
    "Column": [           // 规范名称
    // "columns": [       // 别名
    // "Columns": [       // 别名
      {
        "name": "id",
        "type": "BIGINT",
        "primaryKey": true,    // 规范名称
        // "primary_key": true, // 别名
        // "pk": true           // 别名
      }
    ]
  }]
}
```

## 完整示例

### 简单 Schema

```json
{
  "id": "myapp",
  "namespace": "com.example",
  "Table": [
    {
      "name": "users",
      "comment": "用户表",
      "Column": [
        {
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true,
          "autoIncrement": true,
          "comment": "用户ID"
        },
        {
          "name": "username",
          "type": "VARCHAR(50)",
          "nullable": false,
          "comment": "用户名"
        },
        {
          "name": "email",
          "type": "VARCHAR(100)",
          "comment": "邮箱"
        },
        {
          "name": "created_at",
          "type": "TIMESTAMP",
          "nullable": false,
          "defaultValueComputed": "CURRENT_TIMESTAMP",
          "comment": "创建时间"
        }
      ],
      "Index": [
        {
          "name": "idx_users_username",
          "columns": ["username"],
          "unique": true,
          "comment": "用户名唯一索引"
        },
        {
          "name": "idx_users_email",
          "columns": ["email"],
          "unique": true,
          "comment": "邮箱唯一索引"
        }
      ]
    }
  ]
}
```

### 复杂 Schema

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
      "autoIncrement": true,
      "comment": "主键ID"
    },
    {
      "id": "global_created_at",
      "name": "created_at",
      "type": "TIMESTAMP",
      "nullable": false,
      "defaultValueComputed": "CURRENT_TIMESTAMP",
      "comment": "创建时间"
    }
  ],

  "Table": [
    {
      "id": "table_users",
      "name": "users",
      "comment": "用户表",
      "expectedRecordCount": 1000000,
      "expectedGrowthRate": 10000,

      "Column": [
        {
          "id": "col_users_id",
          "referenceId": "global_id",
          "name": "id"
        },
        {
          "name": "username",
          "type": "VARCHAR(50)",
          "nullable": false,
          "comment": "用户名"
        },
        {
          "name": "email",
          "type": "VARCHAR(100)",
          "comment": "邮箱"
        },
        {
          "name": "password_hash",
          "type": "VARCHAR(255)",
          "nullable": false,
          "comment": "密码哈希"
        },
        {
          "name": "status",
          "type": "VARCHAR(20)",
          "defaultValue": "active",
          "comment": "状态"
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
          "unique": true,
          "comment": "用户名唯一索引"
        },
        {
          "name": "idx_users_email",
          "columns": ["email"],
          "unique": true,
          "comment": "邮箱唯一索引"
        }
      ]
    },
    {
      "id": "table_orders",
      "name": "orders",
      "comment": "订单表",

      "Column": [
        {
          "id": "col_orders_id",
          "referenceId": "global_id",
          "name": "id"
        },
        {
          "name": "user_id",
          "type": "BIGINT",
          "nullable": false,
          "comment": "用户ID"
        },
        {
          "name": "order_no",
          "type": "VARCHAR(50)",
          "nullable": false,
          "comment": "订单号"
        },
        {
          "name": "status",
          "type": "VARCHAR(20)",
          "defaultValue": "pending",
          "comment": "订单状态"
        },
        {
          "name": "total_amount",
          "type": "DECIMAL(10,2)",
          "defaultValue": 0.00,
          "comment": "订单总额"
        }
      ],

      "Constraint": [
        {
          "name": "fk_orders_user_id",
          "type": "FOREIGN_KEY",
          "referencedTable": "users",
          "referencedColumn": "id",
          "columns": ["user_id"],
          "onDelete": "RESTRICT",
          "comment": "用户外键"
        }
      ],

      "Index": [
        {
          "name": "idx_orders_user_id",
          "columns": ["user_id"],
          "comment": "用户ID索引"
        },
        {
          "name": "idx_orders_order_no",
          "columns": ["order_no"],
          "unique": true,
          "comment": "订单号唯一索引"
        }
      ]
    }
  ],

  "View": [
    {
      "name": "active_users",
      "comment": "活跃用户视图",
      "content": "SELECT u.id, u.username, u.email, COUNT(o.id) AS order_count\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.status = 'active'\nGROUP BY u.id, u.username, u.email"
    }
  ]
}
```

## JSON5 扩展支持

JustDB 支持 JSON5 扩展语法：

### 注释

```json
{
  // 这是单行注释
  "Table": [
    {
      "name": "users",
      /*
       * 这是多行注释
       * 用于说明表结构
       */
      "comment": "用户表"
    }
  ]
}
```

### 尾随逗号

```json
{
  "Table": [
    {
      "name": "users",
      "comment": "用户表",
    },
    {
      "name": "orders",
      "comment": "订单表",
    }
  ]
}
```

### 未引号的键

```json
{
  id: "myapp",
  namespace: "com.example",
  Table: [
    {
      name: "users"
    }
  ]
}
```

### 多行字符串

```json
{
  "View": [{
    "name": "active_users",
    "content": "
      SELECT *
      FROM users
      WHERE status = 'active'
    "
  }]
}
```

## 编程处理

### Java

```java
import org.verydb.justdb.FormatFactory;
import org.verydb.justdb.schema.Justdb;
import com.fasterxml.jackson.databind.ObjectMapper;

// 读取 JSON
Justdb schema = FormatFactory.loadFromFile("schema.json");

// 写入 JSON
ObjectMapper mapper = new ObjectMapper();
mapper.writerWithDefaultPrettyPrinter()
      .writeValue(new File("schema.json"), schema);
```

### JavaScript/Node.js

```javascript
const fs = require('fs');

// 读取 JSON
const schema = JSON.parse(fs.readFileSync('schema.json', 'utf8'));

// 写入 JSON
fs.writeFileSync('schema.json', JSON.stringify(schema, null, 2));
```

### Python

```python
import json

# 读取 JSON
with open('schema.json', 'r') as f:
    schema = json.load(f)

# 写入 JSON
with open('schema.json', 'w') as f:
    json.dump(schema, f, indent=2)
```

## 最佳实践

### 1. 使用格式化

```json
// 推荐：格式化的 JSON
{
  "name": "users",
  "Column": [
    {"name": "id", "type": "BIGINT"}
  ]
}

// 不推荐：压缩的 JSON（难以阅读）
{"name":"users","Column":[{"name":"id","type":"BIGINT"}]}
```

### 2. 使用排序

```json
// 推荐：字段按字母顺序或逻辑顺序排列
{
  "Column": [
    {
      "comment": "用户ID",
      "name": "id",
      "primaryKey": true,
      "type": "BIGINT"
    }
  ]
}
```

### 3. 转义特殊字符

```json
{
  "content": "SELECT * FROM \"users\"",
  "regex": "^\\d{3}-\\d{2}-\\d{4}$"
}
```

### 4. 使用验证

使用 JSON Schema 验证：

```bash
# 验证 JSON 格式
justdb validate schema.json
```

## 工具支持

### 在线工具

- [JSONLint](https://jsonlint.com/) - JSON 验证
- [JSON Editor Online](https://jsoneditoronline.org/) - JSON 编辑器

### 编辑器插件

- **VS Code**: ESLint, Prettier
- **IntelliJ IDEA**: 内置支持
- **Sublime Text**: Linter-json

## 格式转换

```bash
# JSON 转 YAML
justdb convert -f json -t yaml schema.json > schema.yaml

# JSON 转 XML
justdb convert -f json -t xml schema.json > schema.xml

# JSON 美化
justdb format schema.json
```

## 相关文档

- [YAML 格式](./yaml.md)
- [XML 格式](./xml.md)
- [格式支持概述](./README.md)
