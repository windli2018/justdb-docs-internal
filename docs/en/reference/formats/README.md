---
icon: file-code
title: Format Reference
order: 2
---

# Format Reference

JustDB supports multiple schema serialization formats for different use cases.

## Supported Formats

| Format | Extension | Read | Write | Use Case |
|--------|-----------|------|-------|----------|
| YAML | `.yaml` | ✅ | ✅ | Human-readable, recommended |
| JSON | `.json` | ✅ | ✅ | Machine-readable, API integration |
| XML | `.xml` | ✅ | ✅ | Enterprise, IDE support |
| TOML | `.toml` | ✅ | ✅ | Configuration files |
| Properties | `.properties` | ✅ | ✅ | Simple key-value pairs |
| SQL | `.sql` | ❌ | ✅ | Export database schemas |

## YAML Format

**Recommended** - Most readable and supports comments.

### Example

```yaml
id: myapp
namespace: com.example

Table:
  - name: users
    comment: User accounts
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
      - name: username
        type: VARCHAR(50)
        nullable: false
        unique: true
    Index:
      - name: idx_username
        columns: [username]
        unique: true
```

### Loading

```java
Justdb schema = FormatFactory.loadFromFile("schema.yaml");
```

### Saving

```java
FormatFactory.saveToFile(schema, "output.yaml");
```

## JSON Format

Machine-readable, good for APIs and automation.

### Example

```json
{
  "id": "myapp",
  "namespace": "com.example",
  "Table": [
    {
      "name": "users",
      "comment": "User accounts",
      "Column": [
        {
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true,
          "autoIncrement": true
        },
        {
          "name": "username",
          "type": "VARCHAR(50)",
          "nullable": false,
          "unique": true
        }
      ]
    }
  ]
}
```

### Loading

```java
Justdb schema = FormatFactory.loadFromFile("schema.json");
```

## XML Format

Enterprise-friendly, supports XSD validation.

### Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="myapp" namespace="com.example">
  <Table name="users" comment="User accounts">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="username" type="VARCHAR(50)" nullable="false" unique="true"/>
    <Index name="idx_username" columns="username" unique="true"/>
  </Table>
</Justdb>
```

### Loading

```java
Justdb schema = FormatFactory.loadFromFile("schema.xml");
```

## TOML Format

Clean configuration format.

### Example

```toml
id = "myapp"
namespace = "com.example"

[[Table]]
name = "users"
comment = "User accounts"

[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true
autoIncrement = true

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"
nullable = false
unique = true
```

### Loading

```java
Justdb schema = FormatFactory.loadFromFile("schema.toml");
```

## Properties Format

Simple key-value notation (limited support).

### Example

```properties
# Tables
table.users.name=users
table.users.comment=User accounts

# Columns
table.users.column.0.name=id
table.users.column.0.type=BIGINT
table.users.column.0.primaryKey=true
table.users.column.0.autoIncrement=true

table.users.column.1.name=username
table.users.column.1.type=VARCHAR(50)
table.users.column.1.nullable=false
```

### Loading

```java
Justdb schema = FormatFactory.loadFromFile("schema.properties");
```

## Format Conversion

Convert between formats:

```bash
justdb convert -f yaml -t json schema.yaml > schema.json
justdb convert -f json -t yaml schema.json > schema.yaml
justdb convert -f xml -t json schema.xml > schema.json
```

### Java API

```java
// Load from YAML
Justdb schema = FormatFactory.loadFromFile("schema.yaml");

// Save as JSON
FormatFactory.saveToFile(schema, "schema.json", "json");

// Save as XML
FormatFactory.saveToFile(schema, "schema.xml", "xml");
```

## Choosing a Format

### Use YAML when:
- ✅ Writing schemas manually
- ✅ Need comments
- ✅ Want readability
- ✅ Using version control

### Use JSON when:
- ✅ Generating schemas programmatically
- ✅ Integrating with APIs
- ✅ Processing with tools
- ✅ Machine consumption

### Use XML when:
- ✅ Enterprise environments
- ✅ Need XSD validation
- ✅ IDE tooling support
- ✅ Existing XML workflows

### Use TOML when:
- ✅ Configuration-driven
- ✅ Want clean syntax
- ✅ No nesting needed

### Use Properties when:
- ✅ Simple, flat schemas
- ✅ Java properties conventions
- ✅ Existing .properties files

## Best Practices

1. **Use YAML** for development and version control
2. **Commit YAML** to repositories for readability
3. **Generate JSON/XML** for build processes
4. **Validate schemas** before deployment
5. **Use consistent formatting**

## Next Steps

- **[Quick Start](/getting-started/)** - Get started with schemas
- **[CLI Reference](/reference/cli/)** - Command-line tools
- **[API Reference](/reference/api/)** - Programmatic access
