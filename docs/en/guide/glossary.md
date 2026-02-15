---
icon: book-bookmark
date: 2024-01-01
title: Glossary
order: 4
category:
  - Guide
  - Reference
tag:
  - glossary
  - reference
  - concepts
---

# Glossary

This document explains the core concepts and terminology used in JustDB.

## Core Concepts

### Schema

A database Schema is a **declarative definition** of database structure, describing what tables, views, indexes, constraints, and other objects are contained in the database along with their properties.

```yaml
# A simple Schema definition
namespace: com.example
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```

**Key Characteristics**:
- **Declarative**: Describes "what", not "how"
- **Database Agnostic**: Same Schema works with multiple databases
- **Version Controlled**: Can be managed in Git like code

### Migration

Migration is the process of transforming the database from its current state to the target Schema state.

```bash
# Execute migration
justdb migrate
```

**Migration Process**:
1. Load target Schema
2. Extract current database state
3. Calculate differences (Diff)
4. Generate SQL
5. Apply changes
6. Record history

### Deploy

Deployment is the operation of applying a Schema to a database, typically used when creating a new database for the first time.

```java
// Java API deployment
SchemaDeployer deployer = new SchemaDeployer(connection);
deployer.deploy(schema);
```

**Deploy vs Migration**:
- **Deploy**: Used for new databases, creates all objects
- **Migration**: Used for existing databases, only applies changes

### Diff

Diff is the calculated difference between the current database state and the target Schema.

```bash
# View differences
justdb diff
```

**Change Types**:
- `ADDED` - New object
- `REMOVED` - Deleted object
- `MODIFIED` - Modified object
- `RENAMED` - Renamed object

## Schema Objects

### Table

A table is the basic structure for storing data in a database.

```yaml
Table:
  - name: users
    comment: User table
    Column: [...]
    Index: [...]
    Constraint: [...]
```

### Column

A column defines the properties of a field in a table.

```yaml
Column:
  - name: username
    type: VARCHAR(50)
    nullable: false
    defaultValue: guest
    comment: Username
```

### Index

An index is used to improve query performance.

```yaml
Index:
  - name: idx_username
    columns: [username]
    unique: true
    comment: Unique index on username
```

### Constraint

A constraint defines rules for data in a table.

**Constraint Types**:
- `PRIMARY_KEY` - Primary key constraint
- `FOREIGN_KEY` - Foreign key constraint
- `UNIQUE` - Unique constraint
- `CHECK` - Check constraint
- `NOT_NULL` - Not null constraint

```yaml
Constraint:
  - name: fk_orders_user
    type: FOREIGN_KEY
    referencedTable: users
    referencedColumn: id
    foreignKey: user_id
    onDelete: CASCADE
```

### View

A view is a virtual table based on a SQL query.

```yaml
View:
  - name: active_users
    query: SELECT * FROM users WHERE status = 'active'
    comment: Active users view
```

### Trigger

A trigger is code that automatically executes when specific events occur.

```yaml
Trigger:
  - name: trg_before_insert
    table: users
    timing: BEFORE
    events: [INSERT]
    sql: |
      SET NEW.created_at = CURRENT_TIMESTAMP;
```

### Sequence

A sequence is an object that generates unique numeric values.

```yaml
Sequence:
  - name: seq_user_id
    startWith: 1
    incrementBy: 1
    maxValue: 999999
```

## JustDB-Specific Terminology

### Justdb

Justdb is the root container object for Schema definitions.

```yaml
namespace: com.example
catalog: myapp
Table: [...]
View: [...]
```

**Properties**:
- `id` - Unique Schema identifier
- `namespace` - Java namespace (for code generation)
- `catalog` - Database catalog

### referenceId

Used to implement Schema component reuse and inheritance.

```yaml
# Define reusable column
Column:
  - id: global_id
    name: id
    type: BIGINT
    primaryKey: true

# Reference in table
Table:
  - name: users
    Column:
      - referenceId: global_id
      - name: username
        type: VARCHAR(50)
```

### formerNames

Used to track object rename history for intelligent migration.

```yaml
Column:
  - name: user_name           # New name
    formerNames: [username]   # Old names
    type: VARCHAR(50)
```

### UnknownValues

Used to store database-specific extension attributes.

```yaml
Table:
  - name: users
    engine: InnoDB           # MySQL-specific, stored in UnknownValues
    row_format: COMPRESSED   # MySQL-specific, stored in UnknownValues
```

### Canonical Name

The standard naming format for fields, using camelCase convention.

| Canonical Name | Supported Aliases |
|:---|:---|
| `referenceId` | `refId`, `ref-id`, `ref_id` |
| `referencedTable` | `foreignTable`, `referenced-table` |
| `formerNames` | `oldNames`, `formerName`, `previousNames` |

## Template System Terminology

### Template

A template is a Handlebars template used to generate SQL or code.

```xml
<template id="create-table" name="create-table" type="SQL" category="db">
  <content>CREATE TABLE {{> table-name-spec}} ({{> columns}});</content>
</template>
```

### Lineage Template

Templates shared by database families.

| Lineage | Included Databases |
|:---|:---|
| `-mysql-lineage` | MySQL, MariaDB, GBase, TiDB |
| `-postgres-lineage` | PostgreSQL, Redshift, TimescaleDB, KingBase |
| `-ansi-lineage` | Oracle, DB2, Derby, HSQLDB, Dameng |
| `-sqlserver-lineage` | SQL Server |
| `-sqlite-lineage` | SQLite |

### Template Helper

Handlebars custom functions for logic processing in templates.

```java
{{#eq type "VARCHAR"}}VARCHAR({{length}}){{/eq}}
{{#not nullable}}NOT NULL{{/not}}
```

### TemplateRootContext

The global context object during template execution.

```java
TemplateRootContext context = TemplateRootContext.builder()
    .justdbManager(justdbManager)
    .dbType("mysql")
    .idempotent(true)
    .safeDrop(false)
    .build();
```

**Available Variables**:
- `@root.justdbManager` - JustDB manager
- `@root.dbType` - Database type
- `@root.idempotent` - Idempotent mode
- `@root.safeDrop` - Safe drop mode

## Lifecycle Hooks

### beforeCreates / afterCreates

SQL scripts executed before/after creating objects.

```yaml
Table:
  - name: users
    beforeCreates:
      - dbms: mysql
        sql: "SET sql_mode='STRICT_TRANS_TABLES'"
    afterCreates:
      - sql: "INSERT INTO users (username) VALUES ('admin')"
```

### beforeDrops / afterDrops

SQL scripts executed before/after dropping objects.

### beforeAlters / afterAlters

SQL scripts executed before/after modifying objects.

### beforeAdds / afterAdds

SQL scripts executed before/after adding objects.

## Plugin System Terminology

### JustdbPlugin

JustDB plugin providing database-specific extensions.

```
JustdbPlugin
├── DatabaseAdapter[]     # Database adapters
├── GenericTemplate[]     # SQL templates
├── ExtensionPoint[]      # Extension points
├── TemplateHelper[]      # Template helpers
└── SchemaFormat[]        # Format support
```

### DatabaseAdapter

Defines database connection information, drivers, and type mappings.

```xml
<DatabaseAdapter id="mysql" dialect="mysql">
  <driverClass>com.mysql.cj.jdbc.Driver</driverClass>
  <urlPattern>jdbc:mysql://.*</urlPattern>
  <typeMappings>...</typeMappings>
</DatabaseAdapter>
```

### ExtensionPoint

Defines custom attributes that objects can accept.

```xml
<ExtensionPoint id="mysql-table" target="Table">
  <attributes>
    <ExtensionAttribute name="engine" type="string" defaultValue="InnoDB"/>
    <ExtensionAttribute name="charset" type="string" defaultValue="utf8mb4"/>
  </attributes>
</ExtensionPoint>
```

## Database Type Related

### Dialect

Specific database SQL syntax and features.

```bash
justdb migrate --dialect postgresql
```

**Supported Dialects**: `mysql`, `postgresql`, `oracle`, `sqlserver`, `sqlite`, `h2`, `db2`, `dameng`, `kingbase`, `gbase`, `oceanbase`, `tidb`, `mariadb`, etc.

### Type Mapping

The mapping relationship between JustDB types and database-specific types.

| JustDB Type | MySQL | PostgreSQL | Oracle | SQL Server |
|:---|:---|:---|:---|:---|
| `BIGINT` | `BIGINT` | `BIGINT` | `NUMBER(19)` | `BIGINT` |
| `VARCHAR(n)` | `VARCHAR(n)` | `VARCHAR(n)` | `VARCHAR2(n)` | `NVARCHAR(n)` |
| `TIMESTAMP` | `TIMESTAMP` | `TIMESTAMP` | `TIMESTAMP` | `DATETIME2` |
| `BOOLEAN` | `TINYINT(1)` | `BOOLEAN` | `NUMBER(1)` | `BIT` |

## Configuration Related

### Schema Format

Input/output formats supported by JustDB.

- `YAML` - Human-friendly configuration format
- `JSON` - Machine-readable data format
- `XML` - Enterprise configuration format
- `PROPERTIES` - Java properties files
- `TOML` - Tom's configuration format
- `SQL` - SQL scripts
- `MARKDOWN` - Markdown documentation
- `EXCEL` - Excel spreadsheets

### Location

Search paths for Schema files.

```
Default search paths:
./justdb/
./db/
./
classpath:justdb/
```

## Migration Related

### Baseline

Set a version starting point for existing databases.

```bash
justdb migrate --baseline
```

### Safe Drop

Rename instead of directly deleting during drop operations.

```bash
justdb migrate --safe-drop

# users -> users_deleted_20240115103000
```

### Idempotent

Ensure repeated execution does not cause errors.

```bash
justdb migrate --idempotent

# Generate idempotent SQL like IF NOT EXISTS
```

### Dry Run

Preview changes without actually executing them.

```bash
justdb migrate --dry-run
```

## History and Version

### History

Historical record of Schema changes.

```bash
justdb history
```

### Rollback

Restore database to a previous version.

```bash
justdb rollback 002
```

## AI Related

### AI Service

JustDB's AI integration service for natural language Schema operations.

```bash
justdb ai "create a user table"
```

### Prompt

Natural language instructions sent to AI.

```yaml
# Define AI prompts via Schema
ai:
  prompts:
    - "generate user login related table structure"
    - "add order management feature"
```

## Related Documentation

<VPCard
  title="What is JustDB"
  desc="Understand JustDB's core concepts"
  link="/guide/what-is-justdb.html"
/>

<VPCard
  title="First Schema"
  desc="Learn how to define Schema"
  link="/getting-started/first-schema.html"
/>

<VPCard
  title="Schema Evolution"
  desc="Understand Schema change management"
  link="/guide/schema-evolution.html"
/>
