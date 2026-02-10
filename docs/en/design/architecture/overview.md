# JustDB Project Overview

## Project Introduction

**JustDB** is a **WYSIWYG Database Development Suite** that revolutionizes traditional database development. Through declarative Schema definition and intelligent diff calculation, database development becomes simple, efficient, and reliable.

### Core Philosophy

Traditional database development workflow:
1. Design database table structure
2. Manually write CREATE TABLE statements
3. Execute SQL to create tables
4. When modification is needed, manually write ALTER TABLE statements
5. Worry about script execution order and error handling

**JustDB simplifies to**:
1. **Declare desired database state** (via XML, YAML, JSON, TOML, etc.)
2. **Tool automatically calculates differences**
3. **Tool automatically applies changes**

---------------------------

## Core Features

### 1. Declarative Schema Definition

```yaml
# users.yaml - This is exactly what you want your database to look like
Table:
  - id: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(255)
      - name: email
        type: VARCHAR(255)
```

JustDB ensures your database is **exactly** as defined above.

### 2. Intelligent Diff Calculation

When you modify the Schema, JustDB automatically calculates changes and generates corresponding SQL:

```sql
ALTER TABLE users ADD COLUMN avatar VARCHAR(500);
```

### 3. Multi-Format Support

JustDB supports almost all common data formats:

- **YAML** - Human-friendly configuration format
- **JSON** - Machine-readable data exchange format
- **XML** - Enterprise-grade configuration format
- **Properties** - Java-style configuration
- **TOML** - Modern configuration format
- **SQL** - Directly execute SQL scripts
- **Markdown** - Documentation as code
- **Excel** - Business-friendly spreadsheet format

### 4. AI Integration

Operate databases directly through natural language:

```bash
justdb ai "Add an orders table with order number, customer ID, amount and status"
```

### 5. Complete JDBC 4.2 Driver

JustDB provides a complete JDBC driver implementation supporting:

- Standard SQL queries (SELECT, INSERT, UPDATE, DELETE)
- JOIN queries
- Aggregate functions (COUNT, SUM, AVG, MIN, MAX)
- Transaction management
- Batch operations

### 6. Spring Boot Integration

Out-of-the-box Spring Boot Starter:

```yaml
justdb:
  enabled: true
  locations: classpath:justdb
  dry-run: false
```

Automatically executes database migration on application startup!

---------------------------

## Comparison with Other Tools

| Feature | JustDB | Flyway | Liquibase |
|------------------------------------------------------|--------------------------------------------------------|--------------------------------------------------------|-----------------------------------------------------------------------------------|
| Declarative Schema | ✅ | ❌ | ❌ |
| Automatic diff calculation | ✅ | ❌ | ❌ |
| Multi-format support | ✅ | ❌ | ❌ |
| AI integration | ✅ | ❌ | ❌ |
| JDBC driver | ✅ | ❌ | ❌ |
| Rollback support | ✅ | ✅ | ✅ |
| Incremental migration | ✅ | ✅ | ✅ |
| Multi-database support | 30+ | Multiple | Multiple |

---------------------------

## Use Cases

### 1. Agile Development

Rapidly iterate database Schema without manually writing SQL:

```bash
# Modify Schema
vim users.yaml

# Apply changes
justdb migrate

# Done!
```

### 2. Database Documentation

Schema as documentation, documentation as Schema:

```yaml
Table:
  - id: orders
    name: 订单表
    comment: 存储所有订单信息
    Column:
      - name: order_no
        comment: 订单号，唯一标识
```

### 3. Multi-Environment Consistency

Keep development, testing, and production environments completely consistent:

```bash
# Development environment
justdb migrate -c dev-config.yaml

# Testing environment
justdb migrate -c test-config.yaml

# Production environment
justdb migrate -c prod-config.yaml
```

### 4. Version Control Friendly

Include Schema in Git version control:

```bash
git add users.yaml
git commit -m "Add user avatar field"
git push

# Team members execute
justdb migrate
```

### 5. CI/CD Integration

Automatically manage databases in continuous integration workflows:

```yaml
# .github/workflows/ci.yml
- name: Migrate Database
  run: |
    justdb migrate --dry-run
    justdb migrate
```

---------------------------

## Supported Databases

JustDB supports 30+ databases, including but not limited to:

- **MySQL** - 5.6, 5.7, 8.0+
- **PostgreSQL** - 9.x, 10.x, 11.x, 12.x, 13.x, 14.x
- **Oracle** - 11g, 12c, 19c, 21c
- **SQL Server** - 2012, 2014, 2016, 2019
- **H2** - 1.x, 2.x
- **SQLite** - 3.x
- **MariaDB** - 10.x, 11.x
- **TiDB** - 3.x, 4.x, 5.x
- **DM** - DM7, DM8
- **KingBase** - KingBase
- **GBase** - 8s
- **OceanBase** - 2.x, 3.x, 4.x

---------------------------

## Technical Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Layer                               │
│  - convert: Format conversion                                         │
│  - migrate: Database migration                                       │
│  - db2schema: Extract Schema from database                           │
│  - interactive: Interactive terminal                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       Core Layer                                │
│  - SchemaLoader: Multi-format Schema loading                          │
│  - SchemaDiff: Diff calculation engine                                   │
│  - SchemaEvolutionManager: Schema evolution management                   │
│  - TemplateEngine: Template engine (Handlebars)                     │
│  - PluginManager: Plugin manager                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Plugin Layer                                 │
│  - DatabaseAdapter: Database adapter                              │
│  - GenericTemplate: SQL generation template                             │
│  - ExtensionPoint: Extension point definition                                │
│  - TemplateHelper: Template helper functions                               │
│  - SchemaFormat: Schema formatter                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    JDBC Driver Layer                               │
│  - JustdbDataSource: DataSource implementation                               │
│  - JustdbConnection: Connection implementation                                 │
│  - JustdbPreparedStatement: Statement implementation                           │
│  - JustdbResultSet: ResultSet implementation                                │
└─────────────────────────────────────────────────────────────┘
```

### Template System

Handlebars-based template engine supporting:

- **Dialect inheritance**: Database dialect families (MySQL-lineage, PostgreSQL-lineage, ANSI-lineage)
- **Template priority**: name + category + type + dialect > name + category + type > name + category > name
- **Template references**: `{{> template-name}}` syntax for reusing template fragments
- **Conditional rendering**: `{{#if @root.idempotent}}`, `{{@root.dbType}}` and other root context variables

### Plugin System

Extensible plugin architecture supporting:

- **Custom database adapters**: Through `DatabaseAdapter` interface
- **Custom templates**: Define SQL generation templates through `GenericTemplate`
- **Extension points**: Define Schema extension attributes through `ExtensionPoint`
- **Helper functions**: Register Handlebars helper functions through `TemplateHelper`

---------------------------

## Schema Structure Design

### Core Type System

```
Item (base class - all Schema objects)
├── UnknownValues (dynamic extension mechanism)
├── SchemaSense (context holder)
├── QueryAble (lifecycle hooks)
│   ├── Table
│   ├── View
│   └── Query
├── Column
├── Index
├── Constraint
├── Trigger
├── Sequence
└── Procedure

Justdb (root container)
└── SchemaSense
```

### Lifecycle Hooks System

Supports complete DDL lifecycle hooks:

- `beforeCreates` / `afterCreates` - Before/after CREATE TABLE/VIEW/SEQUENCE
- `beforeAlters` / `afterAlters` - Before/after ALTER TABLE
- `beforeDrops` / `afterDrops` - Before/after DROP TABLE/VIEW/SEQUENCE

Supports conditional execution:

- `dbms` - Execute by database type
- Schema state comparison - Execute based on field value differences

### Alias System

Support multiple naming formats through `@JsonAlias`:

**Canonical naming**: camelCase, plural collections, SQL terminology

- `referenceId` (canonical) → aliases: `refId`, `ref-id`, `ref_id`
- `formerNames` (canonical) → aliases: `oldNames`, `oldName`, `formerName`, `previousNames`
- `beforeDrops` (canonical) → aliases: `beforeRemoves`, `beforeDrop` - Use SQL DROP terminology
- `beforeAlters` (canonical) → aliases: `beforeModifies`, `beforeAlter` - Use SQL ALTER terminology

### Schema Evolution Tracking

Two tracking mechanisms:

1. **referenceId system**: Component reuse and inheritance
2. **formerNames system**: Rename history tracking

---------------------------

## Design Principles

### 1. Simplicity
- Prefer the simplest expression
- Avoid redundant configuration options
- Provide reasonable defaults

### 2. Consistency
- Unified naming conventions
- Unified type system
- Unified lifecycle hook naming

### 3. Extensibility
- Support dynamic attributes through `UnknownValues` base class
- Support database-specific extensions through plugin system
- Open inheritance hierarchy

### 4. Broad Compatibility
- Support multiple naming formats through `@JsonAlias`: backward compatibility, AI compatibility, human compatibility
- Format is a convenience door, not a restriction
- Preserve compatibility layer for deprecated features

---------------------------

## Core Modules

### CLI Module (justdb-cli)
- `convert` - Format conversion
- `migrate` - Database migration
- `db2schema` - Extract Schema from database
- `interactive` - Interactive terminal
- `ai` - AI assistant
- `mysql-server` - MySQL protocol service

### Core Module (justdb-core)
- Schema loading and serialization
- Diff calculation engine
- Template engine
- Plugin manager

### JDBC Driver Module (justdb-jdbc)
- Standard JDBC interface implementation
- SQL parsing and execution
- Transaction management

### MySQL Protocol Service (justdb-mysql-protocol)
- MySQL protocol server
- Support standard MySQL client connections
- MySQL Workbench, DBeaver and other tool compatibility

### AI Module (justdb-ai)
- AI integration
- Natural language processing
- Intelligent Schema generation

---------------------------

## Open Source License

- **License**: Apache License 2.0
- **Author**: Wind Li
- **Version**: 1.0-SNAPSHOT

---------------------------

## Related Resources

- **Source code**: https://github.com/verydb/justdb
- **Documentation**: docs/ directory
- **Issue tracking**: GitHub Issues
