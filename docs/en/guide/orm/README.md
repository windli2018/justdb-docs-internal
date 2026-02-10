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
| **Python** | SQLAlchemy | ✅ Supported |
| **Python** | Django | ✅ Supported |
| **TypeScript** | Prisma | ✅ Supported |
| **TypeScript** | TypeORM | ✅ Supported |
| **Go** | GORM | ✅ Supported |
| **Go** | sqlx | ✅ Supported |

## Quick Start

### Installation

```bash
# Download JustDB CLI
wget https://github.com/justdb/justdb/releases/latest/download/justdb-cli.zip
unzip justdb-cli.zip
export PATH=$PATH:$(pwd)/justdb-cli/bin
```

### Generate ORM Models

```bash
# SQLAlchemy (Python)
justdb schema2orm --input schema.xml --type sqlalchemy --output models.py

# Django (Python)
justdb schema2orm --input schema.xml --type django --output models.py

# Prisma (TypeScript)
justdb schema2orm --input schema.xml --type prisma --output schema.prisma

# TypeORM (TypeScript)
justdb schema2orm --input schema.xml --type typeorm --output entities/

# GORM (Go)
justdb schema2orm --input schema.xml --type gorm --output models.go
```

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

## Framework Guides

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

- [Python ORM Guide](./python.md)
- [TypeScript ORM Guide](./typescript.md)
- [Go ORM Guide](./go.md)
- [CLI Commands](../../../reference/cli/commands.md)
- [Schema Formats](../../../reference/formats/)
