---
icon: server
title: JustDB vs Atlas
order: 5
category:
  - Guide
  - Comparison
tag:
  - comparison
  - Atlas
---

# JustDB vs Atlas

## Core Differences

| Dimension | JustDB | Atlas |
|:---|:---|:---|
| **Language Ecosystem** | Java/JVM | Multi-language (Go core) |
| **Design Philosophy** | Declarative | Declarative + GitOps |
| **Schema Definition** | XML/YAML/JSON/SQL/TOML | SQL/HCL/ORM |
| **Diff Calculation** | Automatic | Automatic |
| **AI Integration** | Local/Cloud AI | Atlas Copilot (cloud) |
| **JDBC Driver** | ✅ Unique | ❌ |
| **Deployment** | CLI/JDBC | CLI/Terraform/K8s |
| **Enterprise Features** | Open Source | Cloud SaaS |

## Code Comparison

**JustDB - Multi-format declarative schema:**

::: code-tabs
@tab XML
```xml
<!-- schema.xml -->
<Justdb>
    <Table name="users">
        <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
        <Column name="username" type="VARCHAR(50)" nullable="false"/>
        <Column name="email" type="VARCHAR(100)"/>
        <Index name="idx_username" unique="true">
            <IndexColumn name="username"/>
        </Index>
    </Table>
</Justdb>

<!-- Run migration directly -->
<!-- justdb migrate -->
```

@tab YAML
```yaml
# schema.yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
      - name: username
        type: VARCHAR(50)
        nullable: false
      - name: email
        type: VARCHAR(100)
    Index:
      - name: idx_username
        columns: [username]
        unique: true

# Run migration directly
# justdb migrate
```

@tab JSON
```json
{
  "Table": [
    {
      "name": "users",
      "Column": [
        {"name": "id", "type": "BIGINT", "primaryKey": true, "autoIncrement": true},
        {"name": "username", "type": "VARCHAR(50)", "nullable": false},
        {"name": "email", "type": "VARCHAR(100)"}
      ],
      "Index": [
        {"name": "idx_username", "columns": ["username"], "unique": true}
      ]
    }
  ]
}

// Run migration directly
// justdb migrate
```

@tab SQL
```sql
-- schema.sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    UNIQUE KEY idx_username (username)
);

-- Run migration directly
-- justdb migrate
```

@tab TOML
```toml
[[Table]]
name = "users"

[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true
autoIncrement = true

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"
nullable = false

[[Table.Column]]
name = "email"
type = "VARCHAR(100)"

[[Table.Index]]
name = "idx_username"
unique = true

[[Table.Index.IndexColumn]]
name = "username"

# Run migration directly
# justdb migrate
```

@tab Properties
```properties
table.users.name=users
table.users.column.id.name=id
table.users.column.id.type=BIGINT
table.users.column.id.primaryKey=true
table.users.column.id.autoIncrement=true
table.users.column.username.name=username
table.users.column.username.type=VARCHAR(50)
table.users.column.username.nullable=false
table.users.column.email.name=email
table.users.column.email.type=VARCHAR(100)
table.users.index.idx_username.unique=true
table.users.index.idx_username.columns=username

# Run migration directly
# justdb migrate
```
:::

**Atlas - GitOps-focused schema management:**

::: code-tabs
@tab HCL
```hcl
# schema.hcl
table "users" {
  schema = schema.public
  column "id" {
    type = serial
    null = false
  }
  column "username" {
    type = varchar(50)
    null = false
  }
  column "email" {
    type = varchar(100)
  }
  primary_key {
    columns = [column.id]
  }
}

# Apply changes
atlas schema apply -u "postgres://user:pass@localhost/db" \
  --to file://schema.hcl
```

@tab SQL
```sql
-- schema.sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100)
);

CREATE UNIQUE INDEX idx_username ON users(username);
```
:::

## Pros and Cons

**JustDB Advantages**:
- ✅ **JDBC Driver**: Unique in-memory database driver for offline development
- ✅ **Multi-format Support**: Native support for 8 data formats (XML/YAML/JSON/TOML/Properties, etc.)
- ✅ **AI Integration**: Support for local LLMs and multiple cloud AI providers
- ✅ **Java Ecosystem**: Deep integration with Java/JVM ecosystem
- ✅ **Template System**: Flexible template engine for custom SQL generation
- ✅ **Open Source**: Fully open source, no enterprise paywall
- ✅ **ORM Import**: Support importing from multiple ORM frameworks (orm2schema command)
- ✅ **Atlas Integration**: Can work with Atlas ORM import tools

**Atlas Advantages**:
- ✅ **GitOps Native**: Designed specifically for GitOps/CI-CD workflows
- ✅ **Terraform Integration**: Official Terraform provider support
- ✅ **Multi-language Friendly**: Works with SQL/HCL from any language project
- ✅ **Linting Validation**: Powerful schema change validation
- ✅ **Atlas Cloud**: Enterprise-grade platform (paid)
- ✅ **ORM Integration**: Built-in ORM import (Ent/GORM/Prisma, etc.)

**Atlas Disadvantages**:
- ❌ **Proprietary HCL Format**: Requires learning Atlas HCL DSL, adds learning curve
- ❌ **No JDBC Driver**: Does not provide in-memory database driver
- ❌ **Enterprise Features Paid**: Advanced features require Atlas Cloud subscription

## Use Cases

- **Choose JustDB**: Java projects, need JDBC driver, multi-format support, local AI
- **Choose Atlas**: DevOps/GitOps first, Terraform users, need cloud enterprise features
