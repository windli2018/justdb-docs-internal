---
icon: file-code
title: Format Support Overview
order: 11
category:
  - Reference
  - Format Support
tag:
  - formats
  - serialization
---

# Format Support Overview

JustDB supports multiple Schema definition formats, allowing you to choose the most suitable format based on project requirements. All formats support complete Schema definition functionality and can be converted between each other.

## Supported Formats

| Format | Extensions | Human Readable | Config Friendly | Comments | Recommended Use Cases |
|--------|------------|----------------|-----------------|----------|----------------------|
| **XML** | .xml | ✓✓✓ | ✓✓ | ✓ | Recommended, clearest structure |
| **SQL** | .sql | ✓✓ | ✓✓ | ✓ | Developer preferred, intuitive |
| **YAML** | .yaml, .yml | ✓ | ✓✓ | ✓ | Configuration files, indentation matters |
| **JSON** | .json | ✓ | ✓✓ | - | API integration, machine processing |
| **TOML** | .toml | ✓✓ | ✓✓ | ✓ | Configuration files |
| **Properties** | .properties | ✓ | ✓ | ✓ | Simple configuration |
| **Markdown** | .md | ✓✓✓ | - | ✓ | Schema documentation |
| **Excel** | .xlsx | ✓✓ | ✓✓ | - | Non-technical user editing |

## Format Comparison

### Readability Comparison

::: code-tabs
@tab XML
```xml
<Table name="users" comment="User table">
  <Column name="id" type="BIGINT" primaryKey="true"/>
  <Column name="username" type="VARCHAR(50)"/>
</Table>
```

@tab YAML
```yaml
Table:
  - name: users
    comment: User table
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
      "comment": "User table",
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
) COMMENT 'User table';
```

@tab TOML
```toml
[[Table]]
name = "users"
comment = "User table"

[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"
```
:::

### Feature Comparison

| Feature | XML | SQL | YAML | JSON | TOML | Properties |
|---------|-----|-----|------|------|------|------------|
| Comment Support | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| Structure Clarity | ✓✓✓ | ✓✓ | ✓ | ✓ | ✓✓ | ✓ |
| Indentation Sensitivity | Low | Low | High | High | Medium | Low |
| Learning Cost | Medium | Low | Medium | Low | Low | Low |
| Tool Support | ✓✓✓ | ✓✓✓ | ✓✓ | ✓✓✓ | ✓✓ | ✓ |
| Enterprise Use | ✓✓✓ | ✓✓ | ✓ | ✓ | ✓ | ✓ |

## Format Selection Recommendations

### Recommended: Use XML

**Advantages**:
- Clearest structure with explicit hierarchy, less error-prone
- Strong type validation with explicit tag closing
- Comprehensive Schema validation (XSD) support
- Enterprise standard with rich tool support
- Indentation-insensitive, easy to understand and maintain

**Use Cases**:
- New projects (strongly recommended)
- Enterprise applications
- Strict structural validation required
- Team collaboration development
- Long-term maintenance projects

```xml
<!-- Recommended: Use XML -->
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="formats-readme" namespace="com.example">
    <Table name="users">
        <Column name="id" type="BIGINT"/>
    </Table>
</Justdb>
```

### Developer Preferred: Use SQL

**Advantages**:
- Most intuitive and understandable for database developers
- Direct correspondence to actual DDL statements
- No need to learn new syntax structures
- Easy for debugging and validation
- Seamless integration with existing database tools

**Use Cases**:
- Database experts and DBAs
- Direct database interaction required
- Reverse engineering of existing SQL assets
- Rapid prototype development
- Technical validation scenarios

```sql
-- Developer preferred: Use SQL
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) NOT NULL
) COMMENT 'User table';
```

### Use YAML

**Advantages**:
- Relatively clean syntax
- Comment support
- Common configuration file format

**Considerations**:
- Indentation-sensitive, prone to errors
- Difficult to read with deep nesting
- Lacks explicit end markers

**Use Cases**:
- Simple configuration scenarios
- DevOps configuration files
- Projects with low indentation sensitivity requirements

```yaml
# Mind the indentation!
id: myapp
namespace: com.example
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
```

### Use JSON

**Advantages**:
- Extensive tool support
- API-friendly standard format
- Suitable for programmatic generation

**Limitations**:
- No comment support
- Indentation-sensitive
- Relatively verbose syntax

**Use Cases**:
- API integration
- Automated processing
- Program-to-program data exchange

### Use TOML

**Advantages**:
- Configuration friendly
- Clean syntax
- Time/date support

**Use Cases**:
- Application configuration
- Small projects

```toml
id = "myapp"
namespace = "com.example"

[[Table]]
name = "users"
comment = "User table"

[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true
```

## Format Conversion

JustDB supports conversion between formats:

```bash
# XML to YAML
justdb convert -f xml -t yaml schema.xml > schema.yaml

# XML to JSON
justdb convert -f xml -t json schema.xml > schema.json

# JSON to XML
justdb convert -f json -t xml schema.json > schema.xml

# YAML to XML
justdb convert -f yaml -t xml schema.yaml > schema.xml
```

### Programmatic Conversion

```java
// Load YAML
Justdb schema = FormatFactory.loadFromFile("schema.yaml");

// Save as JSON
FormatFactory.saveToFile(schema, "schema.json", Format.JSON);

// Save as XML
FormatFactory.saveToFile(schema, "schema.xml", Format.XML);
```

## Alias Support

All formats support field aliases for backward compatibility:

```yaml
# YAML using aliases
Table:
  - name: users
    # All of the following are valid:
    Column:         # Standard name
    # columns:      # Alias
    # Columns:      # Alias
      - name: id
        type: BIGINT
        # All of the following are valid:
        primaryKey: true    # Standard name
        # primary_key: true # Alias
        # pk: true          # Alias
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

## Multi-Format Mixing

Multiple formats can be used in one project:

```yaml
# Main Schema (YAML)
id: formats-readme
namespace: com.example

# Import schemas from other formats
Import:
  - file: legacy-users.xml
  - file: additional-tables.json
```

## Format-Specific Features

### YAML Multi-Document

```yaml
# Document 1: Base Schema
---
id: formats-readme
namespace: com.example
Table:
  - name: users

# Document 2: Extended Schema
---
id: formats-readme-extensions
namespace: com.example
Table:
  - name: orders
```

### JSON5 Support

JustDB supports JSON5 extended syntax:

```json
{
  // Comment support
  "Table": [
    {
      "name": "users",
      "Column": [
        {
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true  // Trailing comma support
        }
      ]
    }
  ]
}
```

### XML Namespaces

```xml
<?xml version="1.0" encoding="UTF-8"?>
<justdb:Justdb xmlns:justdb="http://www.justdb.ai/justdb"
               id="myapp"
               namespace="com.example">
  <justdb:Table name="users"/>
</justdb:Justdb>
```

## Complete Examples

### Same Schema in Multiple Formats

#### YAML Format

```yaml
id: ecommerce
namespace: com.example.ecommerce

# Global column definitions
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

# Users table
Table:
  - name: users
    comment: User table
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

#### JSON Format

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
      "comment": "User table",
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

#### XML Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="ecommerce" namespace="com.example.ecommerce">

  <!-- Global column definitions -->
  <Column id="global_id" name="id" type="BIGINT"
          primaryKey="true" autoIncrement="true"/>

  <Column id="global_created_at" name="created_at" type="TIMESTAMP"
          nullable="false" defaultValueComputed="CURRENT_TIMESTAMP"/>

  <!-- Users table -->
  <Table name="users" comment="User table">
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

## Related Documentation

- [YAML Format](./yaml.md)
- [JSON Format](./json.md)
- [XML Format](./xml.md)
- [TOML Format](./toml.md)
- [Properties Format](./properties.md)
- [SQL Format](./sql.md)
- [Markdown Format](./markdown.md)
- [Excel Format](./excel.md)
