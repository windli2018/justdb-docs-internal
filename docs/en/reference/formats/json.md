---
icon: braces
title: JSON Format
order: 13
category:
  - Reference
  - Format Support
tag:
  - json
  - format
---

# JSON Format

JSON (JavaScript Object Notation) is a lightweight data interchange format, widely used for API integration and configuration-as-code scenarios.

## Format Specification

### File Extension

- `.json`

### Basic Structure

```json
{
  "id": "myapp",
  "namespace": "com.example",
  "Table": [
    {
      "name": "users",
      "comment": "User table",
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

## Syntax Features

### Data Types

| JSON Type | Java Type | Example |
|-----------|----------|---------|
| String | String | `"name": "users"` |
| Number | Integer, Long, Double | `"port": 3306` |
| Boolean | Boolean | `"nullable": false` |
| Array | List | `"dbms": ["mysql", "postgresql"]` |
| Object | Map, Object | `"metadata": {"key": "value"}` |
| null | null | `"defaultValue": null` |

### Escaping Characters

```json
{
  "content": "SELECT * FROM \"users\"",
  "comment": "User's name",
  "path": "C:\\Users\\config"
}
```

### Multi-line Strings

Standard JSON doesn't support multi-line strings, use `\n`:

```json
{
  "View": [{
    "name": "active_users",
    "content": "SELECT *\nFROM users\nWHERE status = 'active'"
  }]
}
```

Or use JSON5 extensions (JustDB supports):

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

## Alias Support

JSON supports all field aliases for backward compatibility:

```json
{
  "Table": [{
    "name": "users",
    "Column": [           // Canonical name
    // "columns": [       // Alias
    // "Columns": [       // Alias
      {
        "name": "id",
        "type": "BIGINT",
        "primaryKey": true,    // Canonical name
        // "primary_key": true, // Alias
        // "pk": true           // Alias
      }
    ]
  }]
}
```

## Complete Examples

### Simple Schema

```json
{
  "id": "myapp",
  "namespace": "com.example",
  "Table": [
    {
      "name": "users",
      "comment": "User table",
      "Column": [
        {
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true,
          "autoIncrement": true,
          "comment": "User ID"
        },
        {
          "name": "username",
          "type": "VARCHAR(50)",
          "nullable": false,
          "comment": "Username"
        },
        {
          "name": "email",
          "type": "VARCHAR(100)",
          "comment": "Email"
        },
        {
          "name": "created_at",
          "type": "TIMESTAMP",
          "nullable": false,
          "defaultValueComputed": "CURRENT_TIMESTAMP",
          "comment": "Creation time"
        }
      ],
      "Index": [
        {
          "name": "idx_users_username",
          "columns": ["username"],
          "unique": true,
          "comment": "Unique username index"
        },
        {
          "name": "idx_users_email",
          "columns": ["email"],
          "unique": true,
          "comment": "Unique email index"
        }
      ]
    }
  ]
}
```

### Complex Schema

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
      "comment": "Primary key ID"
    },
    {
      "id": "global_created_at",
      "name": "created_at",
      "type": "TIMESTAMP",
      "nullable": false,
      "defaultValueComputed": "CURRENT_TIMESTAMP",
      "comment": "Creation time"
    }
  ],

  "Table": [
    {
      "id": "table_users",
      "name": "users",
      "comment": "User table",
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
          "comment": "Username"
        },
        {
          "name": "email",
          "type": "VARCHAR(100)",
          "comment": "Email"
        },
        {
          "name": "password_hash",
          "type": "VARCHAR(255)",
          "nullable": false,
          "comment": "Password hash"
        },
        {
          "name": "status",
          "type": "VARCHAR(20)",
          "defaultValue": "active",
          "comment": "Status"
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
          "comment": "Unique username index"
        },
        {
          "name": "idx_users_email",
          "columns": ["email"],
          "unique": true,
          "comment": "Unique email index"
        }
      ]
    },
    {
      "id": "table_orders",
      "name": "orders",
      "comment": "Order table",

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
          "comment": "User ID"
        },
        {
          "name": "order_no",
          "type": "VARCHAR(50)",
          "nullable": false,
          "comment": "Order number"
        },
        {
          "name": "status",
          "type": "VARCHAR(20)",
          "defaultValue": "pending",
          "comment": "Order status"
        },
        {
          "name": "total_amount",
          "type": "DECIMAL(10,2)",
          "defaultValue": 0.00,
          "comment": "Order total amount"
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
          "comment": "User foreign key"
        }
      ],

      "Index": [
        {
          "name": "idx_orders_user_id",
          "columns": ["user_id"],
          "comment": "User ID index"
        },
        {
          "name": "idx_orders_order_no",
          "columns": ["order_no"],
          "unique": true,
          "comment": "Unique order number index"
        }
      ]
    }
  ],

  "View": [
    {
      "name": "active_users",
      "comment": "Active users view",
      "content": "SELECT u.id, u.username, u.email, COUNT(o.id) AS order_count\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.status = 'active'\nGROUP BY u.id, u.username, u.email"
    }
  ]
}
```

## JSON5 Extension Support

JustDB supports JSON5 extended syntax:

### Comments

```json
{
  // This is a single-line comment
  "Table": [
    {
      "name": "users",
      /*
       * This is a multi-line comment
       * Used to describe table structure
       */
      "comment": "User table"
    }
  ]
}
```

### Trailing Commas

```json
{
  "Table": [
    {
      "name": "users",
      "comment": "User table",
    },
    {
      "name": "orders",
      "comment": "Order table",
    }
  ]
}
```

### Unquoted Keys

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

### Multi-line Strings

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

## Programmatic Processing

### Java

```java
import ai.justdb.justdb.FormatFactory;
import ai.justdb.justdb.schema.Justdb;
import com.fasterxml.jackson.databind.ObjectMapper;

// Read JSON
Justdb schema = FormatFactory.loadFromFile("schema.json");

// Write JSON
ObjectMapper mapper = new ObjectMapper();
mapper.writerWithDefaultPrettyPrinter()
      .writeValue(new File("schema.json"), schema);
```

### JavaScript/Node.js

```javascript
const fs = require('fs');

// Read JSON
const schema = JSON.parse(fs.readFileSync('schema.json', 'utf8'));

// Write JSON
fs.writeFileSync('schema.json', JSON.stringify(schema, null, 2));
```

### Python

```python
import json

# Read JSON
with open('schema.json', 'r') as f:
    schema = json.load(f)

# Write JSON
with open('schema.json', 'w') as f:
    json.dump(schema, f, indent=2)
```

## Best Practices

### 1. Use Formatting

```json
// Recommended: Formatted JSON
{
  "name": "users",
  "Column": [
    {"name": "id", "type": "BIGINT"}
  ]
}

// Not recommended: Minified JSON (hard to read)
{"name":"users","Column":[{"name":"id","type":"BIGINT"}]}
```

### 2. Use Sorting

```json
// Recommended: Fields in alphabetical or logical order
{
  "Column": [
    {
      "comment": "User ID",
      "name": "id",
      "primaryKey": true,
      "type": "BIGINT"
    }
  ]
}
```

### 3. Escape Special Characters

```json
{
  "content": "SELECT * FROM \"users\"",
  "regex": "^\\d{3}-\\d{2}-\\d{4}$"
}
```

### 4. Use Validation

Validate with JSON Schema:

```bash
# Validate JSON format
justdb validate schema.json
```

## Tool Support

### Online Tools

- [JSONLint](https://jsonlint.com/) - JSON validation
- [JSON Editor Online](https://jsoneditoronline.org/) - JSON editor

### Editor Plugins

- **VS Code**: ESLint, Prettier
- **IntelliJ IDEA**: Built-in support
- **Sublime Text**: Linter-json

## Format Conversion

```bash
# JSON to YAML
justdb convert -f json -t yaml schema.json > schema.yaml

# JSON to XML
justdb convert -f json -t xml schema.json > schema.xml

# JSON beautify
justdb format schema.json
```

## Related Documentation

- [YAML Format](./yaml.md)
- [XML Format](./xml.md)
- [Format Support Overview](./README.md)
