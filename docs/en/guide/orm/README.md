---
title: ORM Integration
icon: code
description: Generate ORM models from JustDB schema definitions
---

# ORM Integration

JustDB supports converting Schema definitions into ORM models for multiple programming languages and frameworks.

## Supported ORMs

| Language | Framework | Status |
|----------|-----------|--------|
| **Java** | JPA/Hibernate | ✅ Supported |
| **Java** | MyBatis | ✅ Supported |
| **Python** | SQLAlchemy | ✅ Supported |
| **Python** | Django | ✅ Supported |
| **TypeScript** | Prisma | ✅ Supported |
| **TypeScript** | TypeORM | ✅ Supported |
| **Go** | GORM | ✅ Supported |
| **Go** | sqlx | ✅ Supported |

## Quick Start

### Define Schema

JustDB supports multiple formats for schema definition. Choose the format that works best for you:

::: code-tabs
@tab XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb namespace="com.example">
    <Table name="users" comment="User table">
        <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true" comment="User ID"/>
        <Column name="username" type="VARCHAR(50)" nullable="false" comment="Username"/>
        <Column name="email" type="VARCHAR(100)" comment="Email address"/>
        <Column name="created_at" type="TIMESTAMP" nullable="false" defaultValueComputed="CURRENT_TIMESTAMP" comment="Creation time"/>
    </Table>
</Justdb>
```

@tab YAML
```yaml
namespace: com.example
Table:
  - name: users
    comment: User table
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
        comment: User ID
      - name: username
        type: VARCHAR(50)
        nullable: false
        comment: Username
      - name: email
        type: VARCHAR(100)
        comment: Email address
      - name: created_at
        type: TIMESTAMP
        nullable: false
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: Creation time
```

@tab JSON
```json
{
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
          "comment": "Email address"
        },
        {
          "name": "created_at",
          "type": "TIMESTAMP",
          "nullable": false,
          "defaultValueComputed": "CURRENT_TIMESTAMP",
          "comment": "Creation time"
        }
      ]
    }
  ]
}
```

@tab SQL
```sql
-- JustDB SQL format
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'User ID',
    username VARCHAR(50) NOT NULL COMMENT 'Username',
    email VARCHAR(100) COMMENT 'Email address',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time'
) COMMENT 'User table';
```

@tab TOML
```toml
namespace = "com.example"

[[Table]]
name = "users"
comment = "User table"

[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true
autoIncrement = true
comment = "User ID"

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"
nullable = false
comment = "Username"

[[Table.Column]]
name = "email"
type = "VARCHAR(100)"
comment = "Email address"

[[Table.Column]]
name = "created_at"
type = "TIMESTAMP"
nullable = false
defaultValueComputed = "CURRENT_TIMESTAMP"
comment = "Creation time"
```

@tab Markdown
```markdown
# User Table (users)

| Column | Type | Nullable | PK | Default | Comment |
|--------|------|----------|-----|---------|---------|
| id | BIGINT | false | true | AUTO_INCREMENT | User ID |
| username | VARCHAR(50) | false | false | NULL | Username |
| email | VARCHAR(100) | true | false | NULL | Email address |
| created_at | TIMESTAMP | false | false | CURRENT_TIMESTAMP | Creation time |
```
:::

### Generate ORM Models

JustDB accepts any supported schema format as input:

::: code-tabs
@tab XML
```bash
# From XML schema
justdb schema2orm --input schema.xml --type jpa-entity --output src/main/java/

# JPA/Hibernate Entity
justdb schema2orm --input schema.xml --type jpa-entity --output src/main/java/

# MyBatis Bean
justdb schema2orm --input schema.xml --type mybatis-bean --output src/main/java/
```

@tab YAML
```bash
# From YAML schema
justdb schema2orm --input schema.yaml --type jpa-entity --output src/main/java/

# SQLAlchemy (Python)
justdb schema2orm --input schema.yaml --type sqlalchemy --output models.py

# Django (Python)
justdb schema2orm --input schema.yaml --type django --output models.py
```

@tab JSON
```bash
# From JSON schema
justdb schema2orm --input schema.json --type jpa-entity --output src/main/java/

# Prisma (TypeScript)
justdb schema2orm --input schema.json --type prisma --output schema.prisma

# TypeORM (TypeScript)
justdb schema2orm --input schema.json --type typeorm --output entities/
```

@tab SQL
```bash
# From SQL schema
justdb schema2orm --input schema.sql --type jpa-entity --output src/main/java/

# GORM (Go)
justdb schema2orm --input schema.sql --type gorm --output models.go
```

@tab TOML
```bash
# From TOML schema
justdb schema2orm --input schema.toml --type mybatis-bean --output src/main/java/

# sqlx (Go)
justdb schema2orm --input schema.toml --type sqlx --output models.go
```

@tab Markdown
```bash
# From Markdown schema
justdb schema2orm --input schema.md --type jpa-entity --output src/main/java/

# SQLAlchemy (Python)
justdb schema2orm --input schema.md --type sqlalchemy --output models.py
```
:::

## From Existing Database

### Extract Schema from Database

```bash
justdb db2schema \
  --db-url "jdbc:postgresql://localhost:5432/mydb" \
  --username postgres \
  --password password \
  --output schema.xml
```

### Then Generate ORM Models

```bash
justdb schema2orm --input schema.xml --type sqlalchemy --output models.py
```

## Import Schema from ORM

JustDB supports importing Schema definitions from existing ORM models, making it easy to migrate your existing projects to JustDB.

### Using orm2schema Command

```bash
justdb orm2schema [options]

Options:
  --input, -i <path>      Input source (ORM file or directory)
  --orm, -t <type>        ORM type or importer ID
  --output, -o <file>     Output JustDB Schema file
  --dialect, -d <type>    Database dialect (default: mysql)
  --format <fmt>          Output format (yaml, json, xml, default: yaml)
  --type-map <k=v>        Type mapping overrides
  --no-constraints        Exclude constraints from import
  --no-indexes            Exclude indexes from import
  --include-tables        Comma-separated list of tables to include
  --exclude-tables        Comma-separated list of tables to exclude
  --param <k=v>           Additional importer parameters
  --list-importers        List all available importers
  --validate-only         Validate source without performing import
  --verbose               Show detailed import information
```

### Supported Import Types

JustDB supports importing from multiple ORM frameworks:

| Language | Supported ORMs/Frameworks |
|----------|---------------------------|
| **Python** | SQLAlchemy, Django, Peewee |
| **TypeScript** | Prisma, TypeORM, Sequelize, Drizzle |
| **Java** | JPA/Hibernate, MyBatis, jOOQ |
| **Go** | GORM, sqlx |
| **C#** | Entity Framework, Dapper |
| **Ruby** | Rails (ActiveRecord) |
| **PHP** | Laravel Eloquent, Doctrine |

### Import from Prisma

```bash
# Import from Prisma schema
justdb orm2schema \
  --input prisma/schema.prisma \
  --orm prisma \
  --output schema.yaml \
  --dialect postgresql
```

### Import from SQLAlchemy

```bash
# Import from SQLAlchemy models directory
justdb orm2schema \
  --input models/ \
  --orm sqlalchemy \
  --output schema.yaml \
  --dialect mysql
```

### Import from GORM

```bash
# Import from GORM struct files
justdb orm2schema \
  --input models.go \
  --orm gorm \
  --output schema.yaml \
  --dialect postgresql
```

### Import from Hibernate/JPA

```bash
# Import from JPA-annotated Java classes
justdb orm2schema \
  --input src/main/java/com/example/entities/ \
  --orm hibernate-annotations \
  --output schema.yaml \
  --dialect mysql
```

### Atlas Integration

JustDB supports integration with Atlas ORM import tools. Since DDL format parsing is under development, the recommended workflow is:

::: tip Atlas Integration

**Option 1: Direct Atlas Usage (Recommended)**

```bash
# 1. Use Atlas to generate DDL from ORM
atlas schema diff \
  --from "ent://schema" \
  --to "mysql://user:pass@localhost:3306/mydb" \
  --format '{{ sql . }}' > schema.sql

# 2. Create a temporary database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS temp_db;"

# 3. Import DDL to temporary database
mysql -u root -p temp_db < schema.sql

# 4. Use JustDB to extract schema
justdb db2schema \
  --db-url "jdbc:mysql://localhost:3306/temp_db" \
  --username root \
  --password password \
  --output schema.yaml
```

**Option 2: Configure Custom Importer**

If your Atlas provider can output JSON/YAML format, you can configure a custom importer:

```java
import org.verydb.justdb.orm.importer.external.*;

SchemaImporter importer = ExternalProgramImporter.builder()
    .id("atlas-custom")
    .name("Atlas Custom Provider")
    .command("atlas")
    .defaultArgs("schema", "inspect", "--format", "json")
    .outputFormat(OutputFormat.JSON)
    .supportedInputTypes(InputType.ATLAS_HCL)
    .build();

// Register the importer
SchemaImporterRegistry registry = new SchemaImporterRegistry();
registry.register(importer);

// Use custom importer
justdb orm2schema \
  --input schema.hcl \
  --orm atlas-custom \
  --output schema.yaml
```

:::

### List Available Importers

```bash
# List all registered importers
justdb orm2schema --list-importers
```

## Framework Guides

- **[Java ORM Guide](./java.md)** - JPA/Hibernate and MyBatis
- **[Python ORM Guide](./python.md)** - SQLAlchemy and Django
- **[TypeScript ORM Guide](./typescript.md)** - Prisma and TypeORM
- **[Go ORM Guide](./go.md)** - GORM and sqlx

## Features

### Automatic Type Mapping

JustDB automatically maps database types to appropriate ORM types:

| Database Type | SQLAlchemy | Prisma | GORM |
|--------------|------------|--------|------|
| BIGINT | BigInteger | BigInt | uint |
| VARCHAR | String | String | string |
| TIMESTAMP | DateTime | DateTime | time.Time |
| DECIMAL | Numeric | Decimal | float64 |

### Relationship Detection

Foreign keys are automatically converted to ORM relationships:

```xml
<!-- JustDB Schema -->
<Table name="orders">
    <Column name="user_id" type="BIGINT" nullable="false">
        <referencedTable>users</referencedTable>
    </Column>
</Table>
```

```python
# Generated SQLAlchemy
class Order(Base):
    user_id = Column(BigInteger, ForeignKey('users.id'))
    user = relationship("User", back_populates="orders")
```

### Index Support

Indexes are preserved in generated models:

```xml
<Index name="idx_username" unique="true">
    <column>username</column>
</Index>
```

## Best Practices

### 1. Use Markdown Schema for Complex Schemas

Markdown format is more readable and easier to maintain:

```markdown
# Users Table

| Column | Type | Primary Key | Comment |
|--------|------|-------------|---------|
| id | BIGINT | true | User ID |
| username | VARCHAR(50) | false | Username |
```

### 2. Define Relationships Explicitly

```xml
<Column name="user_id" type="BIGINT">
    <referencedTable>users</referencedTable>
    <referencedColumn>id</referencedColumn>
</Column>
```

### 3. Use Reference System for Reusable Columns

```xml
<Column id="global_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>

<Table name="users">
    <Column referenceId="global_id" name="id"/>
</Table>
```

## Reference Links

- [Java ORM Guide](./java.md)
- [Python ORM Guide](./python.md)
- [TypeScript ORM Guide](./typescript.md)
- [Go ORM Guide](./go.md)
- [CLI Commands](../../reference/cli/commands.md)
- [Schema Formats](../../reference/formats/)
