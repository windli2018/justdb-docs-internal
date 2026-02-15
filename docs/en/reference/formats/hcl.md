---
icon: file-code
title: HCL Format Support
order: 9
category:
  - Reference
  - Format Support
tag:
  - hcl
  - atlas
  - terraform
---

# HCL Format Support

JustDB supports HCL (HashiCorp Configuration Language) format for Schema definitions, with the ability to import Atlas database schemas.

## Overview

HCL is a configuration language developed by HashiCorp, widely used by Terraform, Vault, Consul, and other tools. Atlas uses HCL format to define database schemas.

### Supported Features

**Phase 1 (MVP)**:
- Read Atlas HCL schema files
- Support Table, Column, Index, PrimaryKey, ForeignKey
- Basic type mapping

**Phase 2 (Future)**:
- Support View, Trigger, Sequence
- Support Check constraints
- Database-specific features

## Dependency

```xml
<dependency>
    <groupId>com.bertramlabs.plugins</groupId>
    <artifactId>hcl4j</artifactId>
    <version>0.9.8</version>
</dependency>
```

## File Extensions

JustDB recognizes the following HCL file extensions:

| Extension | Description |
|-----------|-------------|
| `.hcl` | Generic HCL file |
| `.my.hcl` | MySQL-specific HCL |
| `.pg.hcl` | PostgreSQL-specific HCL |

## Atlas HCL to JustDB Mapping

### Schema Structure Mapping

```
Atlas HCL                    →  JustDB
─────────────────────────────────────────
schema "name" {}             →  SchemaSense (schema/catalog)
table "name" {}              →  Table
column "name" {}             →  Column
index "name" {}              →  Index
primary_key {}               →  Constraint (primaryKey)
foreign_key "name" {}        →  Constraint (foreignKey)
```

### Type Mapping

| Atlas HCL Type | JustDB Type | Description |
|----------------|-------------|-------------|
| `varchar(n)` | `VARCHAR(n)` | String type |
| `text` | `TEXT` | Text type |
| `int` | `INTEGER` | Integer type |
| `bigint` | `BIGINT` | Long integer type |
| `smallint` | `SMALLINT` | Short integer type |
| `tinyint` | `TINYINT` | Tiny integer type |
| `boolean`/`bool` | `BOOLEAN` | Boolean type |
| `decimal(p,s)` | `DECIMAL(p,s)` | Decimal type |
| `float(p)` | `FLOAT(p)` | Float type |
| `double` | `DOUBLE` | Double precision type |
| `date` | `DATE` | Date type |
| `time(p)` | `TIME(p)` | Time type |
| `datetime(p)` | `DATETIME(p)` | Datetime type |
| `timestamp(p)` | `TIMESTAMP(p)` | Timestamp type |
| `json` | `JSON` | JSON type |
| `jsonb` | `JSONB` | PostgreSQL JSON type |
| `uuid` | `UUID` | UUID type |
| `binary(n)` | `BINARY(n)` | Binary type |
| `blob` | `BLOB` | Blob type |

### Attribute Mapping

| Atlas HCL | JustDB | Description |
|-----------|--------|-------------|
| `null = true/false` | `nullable` | Column nullability |
| `default = "value"` | `defaultValue` | Default value |
| `comment = "text"` | `comment` | Comment |
| `unique = true` | Index unique flag | Unique index |
| `auto_increment = true` | `autoIncrement` | Auto increment |
| `unsigned = true` | `unsigned` | Unsigned integer |
| `charset = "utf8mb4"` | `charset` | Character set |
| `collate = "..."` | `collate` | Collation |
| `engine = "InnoDB"` | Extension attribute | Table engine |

## Examples

### MySQL Schema

```hcl
schema "mydb" {
  charset = "utf8mb4"
  collate = "utf8mb4_unicode_ci"
}

table "users" {
  schema = schema.mydb
  column "id" {
    type = bigint
    auto_increment = true
    null = false
  }
  column "email" {
    type = varchar(255)
    null = false
  }
  column "name" {
    type = varchar(100)
    null = true
    default = "Anonymous"
  }
  column "created_at" {
    type = timestamp
    null = false
    default = sql("CURRENT_TIMESTAMP")
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_email" {
    columns = [column.email]
    unique = true
  }
}

table "posts" {
  schema = schema.mydb
  column "id" {
    type = bigint
    auto_increment = true
    null = false
  }
  column "user_id" {
    type = bigint
    null = false
  }
  column "title" {
    type = varchar(255)
    null = false
  }
  column "content" {
    type = text
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "fk_user" {
    columns = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete = CASCADE
  }
}
```

### PostgreSQL Schema

```hcl
schema "public" {
}

table "users" {
  schema = schema.public
  column "id" {
    type = integer
    null = false
  }
  column "email" {
    type = varchar(255)
    null = false
  }
  column "status" {
    type = enum.user_status
    null = false
    default = "active"
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_email" {
    type = HASH
    columns = [column.email]
    unique = true
  }
}

enum "user_status" {
  schema = schema.public
  values = ["active", "inactive", "suspended"]
}
```

## Reference Syntax Resolution

Atlas uses reference syntax that requires special handling:

```hcl
table "posts" {
  foreign_key "user_fk" {
    columns = [column.user_id]
    ref_columns = [table.users.column.id]  # ← Reference
  }
}
```

**Resolution Strategy**:

1. **First pass**: Collect all table and column definitions
2. **Second pass**: Resolve references and build relationships

## Java API

### Loading HCL Files

```java
import ai.justdb.justdb.hcl.HclSchemaLoader;

// Create loader
HclSchemaLoader loader = new HclSchemaLoader(justdbManager);

// Check if supported
if (loader.canLoad("schema.hcl")) {
    // Load Schema
    Justdb justdb = loader.load("schema.hcl", new SchemaLoadConfig());
}
```

### Using the Converter

```java
import ai.justdb.justdb.hcl.converter.AtlasToJustdbConverter;

// Create converter
AtlasToJustdbConverter converter = new AtlasToJustdbConverter(justdbManager);

// Convert HCL Schema
Justdb justdb = converter.convert(hclSchema);
```

## Parser Selection

### Available Parsers

| Parser | Priority | Description |
|--------|----------|-------------|
| SimpleHclParser | 8 | Recommended: supports function-style types like `varchar(255)` |
| AscopesHclParser | 6 | Requires Java 17+ |
| BertramlabsHclParser | 5 | Limited function-style type support |

### Function-Style Type Issue

**Problem**: Some parsers treat `varchar(255)` as a function call expression instead of a type declaration.

**Solution**: Use `SimpleHclParser`, which correctly parses function-style types using regex:

```java
private String parseType(String typeStr) {
    Pattern typeWithArgsPattern = Pattern.compile("(\\w+)\\(([^)]*)\\)");
    Matcher matcher = typeWithArgsPattern.matcher(typeStr);

    if (matcher.matches()) {
        String baseType = matcher.group(1);
        String args = matcher.group(2);
        return baseType.toUpperCase() + "(" + args + ")";
    }

    return typeStr.toUpperCase();
}
```

## Error Handling

### Parse Errors

```java
public class HclParseException extends Exception {
    private final int lineNumber;
    private final String hclFile;

    public HclParseException(String message, int lineNumber, String hclFile) {
        super(String.format("%s at line %d in %s", message, lineNumber, hclFile));
        this.lineNumber = lineNumber;
        this.hclFile = hclFile;
    }
}
```

### Common Validation Issues

- Missing required attributes
- Invalid type specifications
- Circular references
- Unresolved references

## Future Enhancements

1. **HCL Output**: Generate Atlas-compatible HCL from JustDB schemas
2. **Migration Support**: Generate migration scripts from HCL diffs
3. **IDE Support**: Schema validation and autocomplete
4. **Atlas CLI Integration**: Use Atlas for advanced migrations

## Related Resources

- [Atlas HCL Documentation](https://atlasgo.io/atlas-schema/sql-resources)
- [hcl4j Repository](https://github.com/bertramlabs/hcl4j)
- [Schema Structure Documentation](../../design/schema-system/overview.md)
