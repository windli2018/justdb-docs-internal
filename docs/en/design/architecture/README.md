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

- [Layered Architecture](./layers.md) - Detailed layer structure *(Coming soon)*
- [Component Design](./components.md) - Core component details *(Coming soon)*
- [Data Flow](./data-flow.md) - Data flow through system *(Coming soon)*
- [Plugin Architecture](./plugins.md) - Plugin system design *(Coming soon)*

> **Note**: Detailed documentation is being written. Please refer to the Chinese documentation for complete information.
