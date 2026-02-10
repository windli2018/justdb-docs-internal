---
icon: sitemap
title: Architecture Overview
order: 51
---

# Architecture Overview

JustDB's architecture is designed around flexibility, extensibility, and database agnosticism.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      User Layer                          │
│  ┌─────────┐ ┌──────────┐ ┌────────────┐ ┌──────────┐ │
│  │   CLI   │ │ Java API │ │ JDBC Driver│ │Spring Boot│ │
│  └─────────┘ └──────────┘ └────────────┘ └──────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │         MySQL Protocol Server                       │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    Core Services                         │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐ │
│  │SchemaLoader  │ │SchemaDeployer│ │MigrationService│ │
│  └──────────────┘ └──────────────┘ └────────────────┘ │
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

## Related Documentation

- [Layered Architecture](./layers.md) - Detailed layer structure
- [Component Design](./components.md) - Core component details *(Coming soon)*
- [Data Flow](./data-flow.md) - Data flow through system *(Coming soon)*
- [Plugin Architecture](./plugins.md) - Plugin system design *(Coming soon)*

## User Layer Interfaces

JustDB provides multiple access methods:

- **CLI Tool** - Command-line interface for all operations
- **Java API** - Programmatic access for Java applications
- **JDBC Driver** - Standard JDBC interface for database access
- **Spring Boot** - Auto-configuration for Spring applications
- **MySQL Protocol Server** - Standard MySQL protocol for any MySQL client

> **Note**: Detailed documentation is being written. Please refer to the Chinese documentation for complete information.
