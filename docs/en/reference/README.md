---
icon: list
title: Reference Documentation
order: 10
---

# Reference Documentation

Complete reference documentation for JustDB, covering schema definition, CLI commands, API usage, and more.

## Reference Sections

### Schema Definition

**[Schema Reference](./schema/)** - Complete schema definition documentation

- [Schema Overview](./schema/README.md) - Schema concepts and object hierarchy
- Table Definition *(Coming soon)* - Table structure and properties
- Column Definition *(Coming soon)* - Column types and constraints
- Index Definition *(Coming soon)* - Index configuration
- Constraint Definition *(Coming soon)* - Primary keys, foreign keys, and constraints
- View Definition *(Coming soon)* - View creation and management
- Sequence Definition *(Coming soon)* - Sequence configuration
- Trigger Definition *(Coming soon)* - Trigger configuration
- Procedure Definition *(Coming soon)* - Stored procedures
- Lifecycle Hooks *(Coming soon)* - DDL lifecycle hooks

### Format Support

**[Formats](./formats/)** - Supported serialization formats

- [Format Overview](./formats/README.md) - Format comparison and selection
- YAML Format *(Coming soon)* - YAML schema definition
- JSON Format *(Coming soon)* - JSON schema definition
- XML Format *(Coming soon)* - XML schema definition
- TOML Format *(Coming soon)* - TOML schema definition
- Properties Format *(Coming soon)* - Properties schema definition
- SQL Format *(Coming soon)* - SQL reverse engineering
- Markdown Format *(Coming soon)* - Documentation format
- Excel Format *(Coming soon)* - Excel-based schema editing

### CLI Reference

**[CLI Commands](./cli/)** - Command-line interface documentation

- [CLI Overview](./cli/README.md) - CLI introduction and installation
- Commands *(Coming soon)* - Complete command reference
- Interactive Mode *(Coming soon)* - Interactive shell usage
- Configuration *(Coming soon)* - Configuration file format
- File Loading *(Coming soon)* - Schema file loading mechanism

### API Reference

**[API Documentation](./api/)** - Programming API reference

- [API Overview](./api/README.md) - API design and usage patterns
- JDBC Driver *(Coming soon)* - JDBC driver documentation
- Java API *(Coming soon)* - Java programming interface
- Schema API *(Coming soon)* - Schema manipulation API
- Migration API *(Coming soon)* - Migration control API

### Database Support

**[Databases](./databases/)** - Supported database platforms

- [Database Overview](./databases/README.md) - Supported database list and compatibility
- MySQL/MariaDB *(Coming soon)* - MySQL and MariaDB specifics
- PostgreSQL *(Coming soon)* - PostgreSQL specifics
- Oracle *(Coming soon)* - Oracle specifics
- SQL Server *(Coming soon)* - SQL Server specifics
- SQLite *(Coming soon)* - SQLite specifics
- H2/HSQLDB *(Coming soon)* - Embedded databases
- Other Databases *(Coming soon)* - Other supported databases

### AI Integration

**[AI Features](./ai/)** - AI-powered features

- [AI Overview](./ai/README.md) - AI capabilities and configuration
- Natural Language Schema *(Coming soon)* - Creating schemas with natural language
- AI Migration Planning *(Coming soon)* - AI-assisted migration planning
- AI Configuration *(Coming soon)* - AI provider configuration
- AI Best Practices *(Coming soon)* - Tips for using AI features

## Quick Reference

### Schema Object Hierarchy

```
Justdb (root)
├── Database       # Database definition
├── Table          # Table definition
├── Column         # Column definition (global)
├── View           # View definition
├── Query          # Query definition
├── Index          # Index definition (global)
├── Constraint     # Constraint definition (global)
├── Trigger        # Trigger definition
├── Sequence       # Sequence definition
├── Procedure      # Stored procedure definition
└── Data           # Data export definition
```

### Common CLI Commands

```bash
# Schema management
justdb init                    # Initialize project
justdb db2schema -o schema.yaml  # Export from database
justdb validate                # Validate schema

# Migration
justdb migrate                 # Execute migration
justdb diff                    # Show differences
justdb migrate --dry-run       # Preview changes

# Format conversion
justdb convert -f yaml -t json schema.yaml > schema.json

# AI assistance
justdb ai "create user table"  # Generate schema with AI
justdb interactive             # Interactive mode with AI
```

### Basic Schema Example

```yaml
id: myapp
namespace: com.example
Table:
  - name: users
    comment: User table
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
```

## Navigation

- **[Quick Start](../getting-started/)** - Get started quickly
- **[User Guide](../guide/)** - In-depth guides
- **[Design Docs](../design/)** - Architecture and design
- **[Development](../development/)** - Plugin development and contributing
