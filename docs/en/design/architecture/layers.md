---
icon: layer-group
title: Architecture Layers
order: 1
---

# Architecture Layers

JustDB is organized into distinct architectural layers, each with specific responsibilities.

## Layer Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │   CLI    │  │ Spring   │  │   API    │  │   AI   ││
│  │  Tool    │  │  Boot    │  │  Library │  │ Helper ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
│  ┌──────────────────────────────────────────────────┐ │
│  │         MySQL Protocol Server                     │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ Migration│  │  Deploy  │  │ Generate │  │History  ││
│  │ Service  │  │  Service │  │  Service │  │ Service ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    Core Layer                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │  Schema  │  │  Plugin  │  │ Template │  │ Adapter ││
│  │   Model  │  │  System  │  │  Engine  │  │ Manager ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   JDBC   │  │ Database │  │  Files   │              │
│  │  Driver  │  │  Adapters│  │  Loader  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

## Application Layer

Provides interfaces for different use cases:

### CLI Tool
- Command-line interface for database operations
- Interactive mode and batch mode
- Configuration management

### Spring Boot Integration
- Auto-configuration for Spring applications
- Health checks and metrics
- Migration on startup

### API Library
- Programmatic access to all features
- Java API for custom integrations

### AI Helper
- Natural language to Schema translation
- Intelligent migration suggestions

### MySQL Protocol Server
- Standard MySQL protocol implementation
- Support for any MySQL client connection
- Compatible with MySQL Workbench, DBeaver, Navicat, etc.
- SQL query execution via standard MySQL clients
- Transaction management (BEGIN, COMMIT, ROLLBACK)
- Metadata queries (SHOW, DESCRIBE)

## Service Layer

Business logic and orchestration:

### Migration Service
- Schema comparison and diff generation
- Incremental migration execution
- Rollback support

### Deploy Service
- Schema deployment to database
- Validation and verification
- Error handling and recovery

### Generate Service
- SQL generation from templates
- Multi-dialect support
- Optimization and formatting

### History Service
- Migration history tracking
- Schema evolution logging
- Audit trail

## Core Layer

Core abstractions and implementations:

### Schema Model
- Table, Column, Index, Constraint definitions
- Type system and validation
- Serialization and deserialization

### Plugin System
- Extensible architecture
- Database adapters
- Template inheritance

### Template Engine
- Handlebars-based SQL generation
- Custom helpers and partials
- Multi-level inheritance

### Adapter Manager
- Database-specific optimizations
- Type mapping
- URL pattern matching

## Data Layer

Data access and persistence:

### JDBC Driver
- Standard JDBC interface
- Connection pooling
- Transaction management

### Database Adapters
- MySQL, PostgreSQL, Oracle, SQL Server, etc.
- Vendor-specific features
- Performance optimizations

### File Loaders
- YAML, JSON, XML, TOML, Properties
- Include and reference support
- Format conversion

## Layer Communication

```
Application → Service → Core → Data
     ↑         ↑        ↑      ↑
     └─────────┴────────┴──────┘
           Event Bus
```

### Flow Example: Schema Migration

1. **Application**: CLI receives `migrate` command
2. **Service**: MigrationService loads schema and calculates diff
3. **Core**: PluginManager selects templates and generates SQL
4. **Data**: JDBC executes SQL against database

### Cross-Cutting Concerns

- **Logging**: All layers use structured logging
- **Validation**: Input validation at each layer boundary
- **Error Handling**: Consistent exception hierarchy
- **Configuration**: Centralized configuration management

## Next Steps

- **[Components](./components.html)** - Detailed component descriptions
- **[Data Flow](./data-flow.html)** - Request/response flow
- **[Plugins](./plugins.html)** - Plugin architecture
