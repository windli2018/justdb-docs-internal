# JustDB Code Examples

This directory contains code examples demonstrating various JustDB features and integrations.

## Directory Structure

```
examples/
├── serial/              # Serial/auto-increment column examples
├── virtual-column/      # Virtual column examples
├── plugin/              # Plugin development examples
├── orm/                 # ORM framework integration examples
└── type-mapping/        # Database type mapping examples
```

## Serial Examples

The `serial/` directory contains examples of auto-increment columns across different databases:

- `basic-usage.xml` - Basic serial column usage for MySQL, PostgreSQL, Oracle, SQL Server, SQLite, H2
- `composite-primary-key.xml` - Using serial columns with composite primary keys
- `starting-value.xml` - Custom starting values and increment steps

## Virtual Column Examples

The `virtual-column/` directory demonstrates computed column features:

- `computed-column.xml` - Various computed column use cases across databases
- `prefer-column.xml` - Using preferColumn for fallback values

## Plugin Examples

The `plugin/` directory shows how to extend JustDB:

- `custom-type.xml` - Creating custom database adapters and type mappings
- `custom-template.hbs` - Handlebars template example for custom DDL generation

## ORM Examples

The `orm/` directory contains ORM model examples:

### SQLAlchemy (Python)
- `sqlalchemy/models.py` - Complete SQLAlchemy models with relationships

### Prisma (TypeScript/JavaScript)
- `prisma/schema.prisma` - Prisma schema with models and relations

### GORM (Go)
- `gorm/models.go` - GORM models with hooks and relationships

### Django (Python)
To generate Django models from JustDB schema:

```bash
justdb schema2orm --input schema.xml --type django --output myapp/models.py
```

## Type Mapping Examples

The `type-mapping/` directory provides database migration type mappings:

- `mysql-to-postgres.yaml` - Complete type mapping for MySQL to PostgreSQL migration

## Usage Examples

### Converting Schema to ORM Models

```bash
# Generate SQLAlchemy models
justdb schema2orm --input schema.xml --type sqlalchemy --output models.py

# Generate Prisma schema
justdb schema2orm --input schema.xml --type prisma --output schema.prisma

# Generate GORM models
justdb schema2orm --input schema.xml --type gorm --output models.go
```

### Using Type Mappings

```bash
# Convert MySQL schema to PostgreSQL
justdb convert --input mysql-schema.xml --output postgres-schema.yaml \
  --type-mapping type-mapping/mysql-to-postgres.yaml
```

### Loading Custom Plugins

```bash
# Load custom plugin at runtime
justdb validate --schema schema.xml --plugin /path/to/custom-plugin.jar
```

## Contributing

To add new examples:

1. Create a new directory under `examples/`
2. Add example files with clear documentation
3. Update this README with the new example description
4. Ensure examples are valid and can be used with JustDB

## Related Documentation

- [Serial Reference](/cheatsheet/serial.html)
- [Virtual Column Reference](/cheatsheet/virtual-column.html)
- [Plugin Development](/development/plugin-development/)
- [ORM Integration Guide](/guide/orm/)
