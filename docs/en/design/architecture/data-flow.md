---
icon: arrows-alt-circle
title: Data Flow
order: 3
---

# Data Flow

How data flows through JustDB during various operations.

## Schema Loading Flow

```
┌─────────────┐
│ Schema File │
│ (YAML/JSON) │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                 SchemaLoader                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │   YAML   │  │   JSON   │  │    XML   │            │
│  │  Loader  │  │  Loader  │  │  Loader  │            │
│  └──────────┘  └──────────┘  └──────────┘            │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│              Schema Validation                          │
│  - Required fields                                      │
│  - Type constraints                                     │
│  - Reference integrity                                  │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│              JustDB Schema Object                       │
│  - Tables, Columns, Indexes                             │
│  - Constraints, Views                                   │
│  - Relationships                                        │
└─────────────────────────────────────────────────────────┘
```

## Schema Deployment Flow

```
┌─────────────┐
│   Schema    │
│   Object    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│            SchemaDeployer                               │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │   Compare    │  │   Generate   │                   │
│  │   Current    │→ │     SQL      │                   │
│  │   vs Target  │  │   (Templates)│                   │
│  └──────────────┘  └──────┬───────┘                   │
└────────────────────────────────────┼────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────┐
│              SQL Statements                             │
│  - CREATE TABLE                                         │
│  - ALTER TABLE                                          │
│  - DROP TABLE                                           │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│            JDBC Execution                               │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │  Transaction │  │   Execute    │                   │
│  │   Management │  │   Batch      │                   │
│  └──────────────┘  └──────────────┘                   │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│  Database   │
└─────────────┘
```

## Template Execution Flow

```
┌─────────────┐
│ Template ID │
│ + Context   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│          TemplateExecutor                               │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │   Lookup     │  │   Compile    │                   │
│  │   Template   │→ │   Handlebars │                   │
│  │              │  │              │                   │
│  └──────────────┘  └──────┬───────┘                   │
└───────────────────────────┼─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│          Template Inheritance Chain                     │
│  1. (name + category + type + dialect)                  │
│  2. (name + category + type)                            │
│  3. (name + category, type='')                          │
│  4. (name, type='' + category='')                       │
└───────────────────────────┼─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│          Render with Context                            │
│  - @root.justdbManager                                  │
│  - @root.dbType                                         │
│  - @root.idempotent                                     │
│  - Custom data                                          │
└───────────────────────────┼─────────────────────────────┘
                            │
                            ▼
┌─────────────┐
│   Output    │
│   (SQL)     │
└─────────────┘
```

## Migration Flow

```
┌─────────────┐
│  User Input │
│  (CLI/API)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│      SchemaMigrationService                            │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │   Load       │  │    Diff      │                   │
│  │   Target     │  │  Calculation │                   │
│  └──────┬───────┘  └──────┬───────┘                   │
│         │                  │                            │
│         └──────────┬───────┘                            │
│                    ▼                                    │
│         ┌──────────────────┐                            │
│         │  Plan Migration  │                            │
│         │  - Add/Modify     │                            │
│         │  - Rename/Drop    │                            │
│         └──────┬───────────┘                            │
└────────────────┼─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│          Preview & Confirm                              │
│  - Show generated SQL                                   │
│  - Calculate impact                                     │
│  - User confirmation                                   │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│          Execute Migration                              │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │  Begin Tx    │  │  Execute SQL │                   │
│  └──────┬───────┘  └──────┬───────┘                   │
│         │                  │                            │
│         └──────────┬───────┘                            │
│                    ▼                                    │
│         ┌──────────────────┐                            │
│         │   Commit/Rollback │                            │
│         └──────┬───────────┘                            │
└────────────────┼─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│          Record History                                 │
│  - Migration version                                    │
│  - Applied SQL                                          │
│  - Timestamp                                            │
└─────────────────────────────────────────────────────────┘
```

## Plugin Loading Flow

```
┌─────────────────────────────────────────────────────────┐
│          Plugin Discovery                               │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │   Built-in   │  │  External    │                   │
│  │   Plugins    │  │   JARs       │                   │
│  │ (XML file)   │  │(ServiceLoader)│                   │
│  └──────┬───────┘  └──────┬───────┘                   │
└─────────┼─────────────────┼─────────────────────────────┘
          │                 │
          └────────┬────────┘
                   ▼
┌─────────────────────────────────────────────────────────┐
│          Plugin Registration                            │
│  - DatabaseAdapter registration                         │
│  - Template registration                                │
│  - TypeMapping registration                              │
│  - Helper registration                                  │
└───────────────────────────┼─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│          Plugin Initialization                          │
│  - Validate dependencies                                │
│  - Compile templates                                    │
│  - Initialize adapters                                  │
└─────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────┐
│   Error     │
│  Detected   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│          Exception Hierarchy                            │
│  ┌──────────────┐                                      │
│  │ JustDBException                                      │
│  │  ├─ SchemaLoadingException                          │
│  │  ├─ DeployException                                 │
│  │  ├─ ValidationException                             │
│  │  └─ MigrationException                              │
│  └──────┬───────┘                                      │
└─────────┼───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│          Error Response                                 │
│  - Log error details                                    │
│  - Provide actionable message                           │
│  - Suggest recovery options                             │
└─────────────────────────────────────────────────────────┘
```

## Next Steps

- **[Layers](./layers.html)** - Layer architecture
- **[Components](./components.html)** - Component details
- **[Plugins](./plugins.html)** - Plugin architecture
