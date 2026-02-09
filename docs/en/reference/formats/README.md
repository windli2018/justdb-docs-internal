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

JustDB supports multiple schema definition formats. You can choose the most suitable format for your project needs. All formats support complete schema definition functionality and can be converted between each other.

## Supported Formats

| Format | File Extension | Human Readable | Config Friendly | Comment Support | Recommended For |
|--------|---------------|----------------|-----------------|-----------------|----------------|
| **YAML** | .yaml, .yml | ✓✓✓ | ✓✓✓ | ✓ | Recommended, best readability |
| **JSON** | .json | ✓✓ | ✓✓ | - | API integration, machine processing |
| **XML** | .xml | ✓ | ✓✓ | ✓ | Enterprise applications, existing systems |
| **TOML** | .toml | ✓✓ | ✓✓ | ✓ | Configuration files |
| **Properties** | .properties | ✓ | ✓ | ✓ | Simple configuration |
| **SQL** | .sql | - | - | ✓ | Reverse engineering |
| **Markdown** | .md | ✓✓✓ | - | ✓ | Documented schemas |
| **Excel** | .xlsx | ✓✓ | ✓✓ | - | Non-technical user editing |

## Format Comparison

### Readability Comparison

<CodeGroup>
<CodeGroupItem title="YAML">
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
</CodeGroupItem>

<CodeGroupItem title="JSON">
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
</CodeGroupItem>

<CodeGroupItem title="XML">
```xml
<Table name="users" comment="User table">
  <Column name="id" type="BIGINT" primaryKey="true"/>
  <Column name="username" type="VARCHAR(50)"/>
</Table>
```
</CodeGroupItem>
</CodeGroup>

### Feature Comparison

| Feature | YAML | JSON | XML | TOML | Properties |
|---------|------|------|-----|------|-----------|
| Comments | ✓ | ✗ | ✓ | ✓ | ✓ |
| Multi-doc | ✓ | - | - | - | - |
| References | ✓ | ✓ | ✓ | ✓ | - |
| Alias support | ✓ | ✓ | ✓ | ✓ | ✓ |
| Type richness | ✓✓ | ✓✓ | ✓✓ | ✓ | ✓ |

## Format Selection Recommendations

### Recommended: YAML

**Advantages**:
- Best readability
- Comment support
- Concise syntax
- Wide support

**Use Cases**:
- New projects
- Manual editing required
- Team collaboration

```yaml
# Recommended: Use YAML
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
- Wide tool support
- API friendly
- Suitable for machine processing

**Use Cases**:
- API integration
- Automated processing
- Configuration as code

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

### Use XML

**Advantages**:
- Enterprise standard
- Strong type validation
- Schema validation

**Use Cases**:
- Existing Java enterprise applications
- Need XSD validation
- JAXB annotation projects

```xml
<Justdb id="myapp">
  <Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
  </Table>
</Justdb>
```

### Use TOML

**Advantages**:
- Configuration friendly
- Clear syntax
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

JustDB supports mutual conversion between formats:

```bash
# YAML to JSON
justdb convert -f yaml -t json schema.yaml > schema.json

# JSON to XML
justdb convert -f json -t xml schema.json > schema.xml

# XML to YAML
justdb convert -f xml -t yaml schema.xml > schema.yaml
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

All formats support field aliases, providing backward compatibility:

```yaml
# YAML using aliases
Table:
  - name: users
    # All valid:
    Column:         # Canonical name
    # columns:      # Alias
    # Columns:      # Alias
      - name: id
        type: BIGINT
        # All valid:
        primaryKey: true    # Canonical name
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

## Multi-Format Mixed Usage

Use multiple formats in one project:

```yaml
# Main schema (YAML)
id: myapp
namespace: com.example

# Import schemas in other formats
Import:
  - file: legacy-users.xml
  - file: additional-tables.json
```

## Format-Specific Features

### YAML Multi-Document

```yaml
# Document 1: Base schema
---
id: myapp
namespace: com.example
Table:
  - name: users

# Document 2: Extended schema
---
id: myapp-extensions
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
<justdb:Justdb xmlns:justdb="http://www.verydb.org/justdb"
               id="myapp"
               namespace="com.example">
  <justdb:Table name="users"/>
</justdb:Justdb>
```

## Complete Example

### Same Schema in Multiple Formats

<tabs>

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

</tabs>

## Related Documentation

- [YAML Format](./yaml.md) *(Coming soon)*
- [JSON Format](./json.md) *(Coming soon)*
- [XML Format](./xml.md) *(Coming soon)*
- [TOML Format](./toml.md) *(Coming soon)*
- [Properties Format](./properties.md) *(Coming soon)*
- [SQL Format](./sql.md) *(Coming soon)*
- [Markdown Format](./markdown.md) *(Coming soon)*
- [Excel Format](./excel.md) *(Coming soon)*
