---
icon: pen-to-square
title: Design Documentation
order: 50
---

# Design Documentation

In-depth design documents covering JustDB's architecture, subsystems, and technical decisions.

## Design Sections

### Architecture

**[Architecture Overview](./architecture/)** - System architecture and design principles

- [Architecture Overview](./architecture/README.md) - Overall system architecture
- Layered Architecture *(Coming soon)* - Layer structure and responsibilities
- Component Design *(Coming soon)* - Core components and interactions
- Data Flow *(Coming soon)* - Data flow through the system
- Plugin Architecture *(Coming soon)* - Plugin system design

### Schema System

**[Schema System](./schema-system/)** - Schema definition and processing

- [Schema System Overview](./schema-system/README.md) - Schema system design
- Schema Model *(Coming soon)* - Schema object model
- Schema Loading *(Coming soon)* - Schema file loading mechanism
- Schema Validation *(Coming soon)* - Validation rules and enforcement
- Schema Evolution *(Coming soon)* - Schema change tracking

### Template System

**[Template System](./template-system/)** - SQL/code generation templates

- [Template System Overview](./template-system/README.md) - Template system design
- Template Syntax *(Coming soon)* - Handlebars template syntax
- Template Inheritance *(Coming soon)* - Template inheritance and override
- Lineage Templates *(Coming soon)* - Database lineage templates
- Template Helpers *(Coming soon)* - Built-in template helpers

### Migration System

**[Migration System](./migration-system/)** - Schema migration and diff

- [Migration System Overview](./migration-system/README.md) - Migration system design
- Diff Algorithm *(Coming soon)* - Schema difference calculation
- Change Classification *(Coming soon)* - Change type classification
- SQL Generation *(Coming soon)* - Migration SQL generation
- Safe Migration *(Coming soon)* - Safe migration strategies

### JDBC Driver

**[JDBC Driver](./jdbc-driver/)** - JDBC driver implementation

- [JDBC Driver Overview](./jdbc-driver/README.md) - JDBC driver design
- Connection Management *(Coming soon)* - Connection pooling and management
- Statement Execution *(Coming soon)* - Statement execution
- ResultSet Handling *(Coming soon)* - ResultSet implementation
- Transaction Management *(Coming soon)* - Transaction handling

### History Service

**[History Service](./history-service/)** - Schema history tracking

- [History Service Overview](./history-service/README.md) - History system design
- Version Tracking *(Coming soon)* - Schema version tracking
- Change Log *(Coming soon)* - Change logging mechanism
- Rollback *(Coming soon)* - Schema rollback support

### TypeScript Implementation

**[TypeScript Implementation](./typescript-implementation.md)** - TypeScript port design and analysis

- [TypeScript Implementation Design](./typescript-implementation.md) - Design analysis and comparison
- [TypeScript Refactoring Progress](./typescript-refactor-progress.md) - Refactoring status and improvements

## Key Design Principles

### 1. Database Agnostic

JustDB is designed to work with multiple databases through a unified API.

```yaml
# Same schema works for all databases
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        autoIncrement: true
```

### 2. Declarative Design

Describe **what** you want, not **how** to achieve it.

```yaml
# Declarative: Describe desired state
Table:
  - name: users
    Column:
      - name: username
        type: VARCHAR(50)
        nullable: false
```

### 3. Immutable History

All schema changes are tracked and reversible.

### 4. Template-Based Generation

SQL is generated through templates, not hardcoded.

```xml
<template id="create-table" type="SQL" category="db">
  <content>CREATE TABLE {{name}} (...)</content>
</template>
```

### 5. Plugin Extensibility

All functionality can be extended through plugins.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      User Layer                          │
│  CLI Tool | Java API | JDBC Driver | Spring Boot        │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    Core Services                         │
│  SchemaLoader | SchemaDeployer | MigrationService       │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    Schema Model                          │
│  Justdb | Table | Column | Index | View | Trigger        │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                   Plugin System                          │
│  DatabaseAdapter | GenericTemplate | ExtensionPoint      │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                  Template Engine                         │
│  Handlebars Templates | Lineage Templates               │
└─────────────────────────────────────────────────────────┘
```

## Design Documents

### High-Level Design

- [Design Philosophy](/guide/design-philosophy.md) - JustDB's design philosophy
- [Architecture Decisions](/development/architecture-decisions/) - ADR documents
- [Future Roadmap](/plans/README.md) - Planned features and improvements

### Subsystem Design

- [Schema System](./schema-system/) - Schema definition and processing
- [Template System](./template-system/) - SQL generation templates
- [Migration System](./migration-system/) - Schema migration
- [Plugin System](./architecture/plugins.md) - Plugin architecture
- [JDBC Driver](./jdbc-driver/) - JDBC implementation

## Technical Decisions

See [Architecture Decision Records](../development/architecture-decisions/) for detailed technical decisions:

- [ADR-001: Alias System](../development/architecture-decisions/adr-001-alias-system.md)
- [ADR-002: Template Engine](../development/architecture-decisions/adr-002-template-engine.md)
- [ADR-003: Lifecycle Hooks](../development/architecture-decisions/adr-003-lifecycle-hooks.md)

## Navigation

- **[Quick Start](/en/getting-started/)** - Get started quickly
- **[User Guide](/guide/)** - User documentation
- **[Reference](/reference/)** - API and command reference
- **[Development](/development/)** - Plugin development and contributing
