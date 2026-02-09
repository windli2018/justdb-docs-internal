---
icon: wrench
title: Development Guide
order: 60
---

# Development Guide

Guide for contributing to JustDB, developing plugins, and understanding the codebase.

## Development Sections

### Build

**[Build Guide](./build/)** - Building from source

- [Build from Source](./build/README.md) - Step-by-step build instructions
- Maven Structure *(Coming soon)* - Maven project structure
- Testing *(Coming soon)* - Running and writing tests

### Plugin Development

**[Plugin Development](./plugin-development/)** - Creating JustDB plugins

- [Plugin Development Overview](./plugin-development/README.md) - Plugin development introduction
- Database Adapter *(Coming soon)* - Adding database support
- Custom Templates *(Coming soon)* - Creating SQL templates
- Extension Points *(Coming soon)* - Defining extension attributes
- Template Helpers *(Coming soon)* - Writing Handlebars helpers
- Schema Formats *(Coming soon)* - Supporting file formats

### Contributing

**[Contributing](./contributing/)** - Contributing to JustDB

- [Contributing Overview](./contributing/README.md) - How to contribute
- Coding Standards *(Coming soon)* - Code style and conventions
- Commit Conventions *(Coming soon)* - Commit message guidelines
- Pull Request Process *(Coming soon)* - PR workflow
- Release Process *(Coming soon)* - Release procedures

### Architecture Decisions

**[Architecture Decision Records](./architecture-decisions/)** - Technical decisions

- ADR Template *(Coming soon)* - ADR template
- ADR-001: Alias System *(Coming soon)* - Canonical naming with aliases
- ADR-002: Template Engine *(Coming soon)* - Handlebars template system
- ADR-003: Lifecycle Hooks *(Coming soon)* - DDL lifecycle hooks

## Quick Start

### Prerequisites

- **Java**: JDK 1.8 or higher
- **Maven**: 3.6 or higher
- **Git**: For cloning repository

### Build Project

```bash
# Clone repository
git clone https://github.com/verydb/justdb.git
cd justdb

# Build project
mvn clean install

# Skip tests
mvn clean install -DskipTests

# Run specific test
mvn test -Dtest=SchemaLoaderTest
```

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and test
mvn test

# Commit changes
git commit -m "feat: add my new feature"

# Push and create PR
git push origin feature/my-feature
```

## Project Structure

```
justdb/
├── justdb-core/              # Core library
│   ├── src/main/java/
│   │   └── org/verydb/justdb/
│   │       ├── schema/       # Schema model
│   │       ├── adapter/      # Database adapters
│   │       ├── plugin/       # Plugin system
│   │       ├── generator/    # SQL generation
│   │       ├── templates/    # Template management
│   │       ├── loader/       # Schema loading
│   │       ├── jdbc/         # JDBC driver
│   │       ├── migration/    # Migration system
│   │       ├── history/      # History tracking
│   │       ├── validation/   # Schema validation
│   │       ├── cli/          # Command-line interface
│   │       └── ai/           # AI integration
│   └── src/main/resources/
│       └── default-plugins.xml
├── justdb-cli/               # CLI application
├── justdb-jdbc/              # JDBC driver
├── justdb-spring-boot/       # Spring Boot starter
└── docs/                     # Documentation
```

## Coding Standards

### Java Code

- Follow [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- Use 4-space indentation
- Maximum line length: 120 characters
- Use meaningful names

### Example

```java
/**
 * Schema loader for YAML format.
 *
 * Loads JustDB schema definitions from YAML files with support
 * for references, imports, and aliases.
 */
public class YamlSchemaLoader implements SchemaLoader {

    private final JustdbManager justdbManager;

    public YamlSchemaLoader(JustdbManager justdbManager) {
        this.justdbManager = justdbManager;
    }

    /**
     * Load schema from YAML file.
     *
     * @param path Path to YAML file
     * @return Loaded JustDB schema
     * @throws SchemaLoadingException If loading fails
     */
    public Justdb load(Path path) throws SchemaLoadingException {
        // Implementation...
    }
}
```

## Testing

### Write Tests

```java
@Test
public void testLoadYamlSchema() throws Exception {
    // Arrange
    Path schemaFile = Paths.get("src/test/resources/schema.yaml");

    // Act
    Justdb schema = FormatFactory.loadFromFile(schemaFile.toString());

    // Assert
    assertNotNull(schema);
    assertEquals("myapp", schema.getId());
    assertEquals(1, schema.getTables().size());
}
```

### Run Tests

```bash
# All tests
mvn test

# Specific test class
mvn test -Dtest=YamlSchemaLoaderTest

# Specific test method
mvn test -Dtest=YamlSchemaLoaderTest#testLoadYamlSchema

# Integration tests
mvn verify
```

## Plugin Development

### Create Plugin

```java
package com.example.justdb;

import org.verydb.justdb.plugin.*;

public class MyPlugin extends JustdbPlugin {
    @Override
    public String getId() {
        return "my-plugin";
    }

    @Override
    public DatabaseAdapter[] getDatabaseAdapters() {
        // Return database adapters
    }

    @Override
    public GenericTemplate[] getTemplates() {
        // Return SQL templates
    }
}
```

### Register Plugin

Create `META-INF/services/org.verydb.justdb.plugin.JustdbPlugin`:

```
com.example.justdb.MyPlugin
```

## Contributing Guidelines

### Types of Contributions

- **Bug fixes**: Fix reported issues
- **New features**: Add new functionality
- **Documentation**: Improve docs
- **Tests**: Add test coverage
- **Plugins**: Create new plugins

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add support for new database
fix: correct column type mapping
docs: update JDBC driver documentation
test: add integration tests for migration
refactor: simplify plugin loading logic
```

### Pull Request Process

1. Fork repository
2. Create feature branch
3. Make changes and test
4. Commit with conventional messages
5. Push to fork
6. Create pull request
7. Address review feedback

## Resources

### Documentation

- [JustDB Documentation](https://verydb.github.io/justdb)
- [CLAUDE.md](../../CLAUDE.md) - Project instructions

### Community

- [GitHub Issues](https://github.com/verydb/justdb/issues)
- [GitHub Discussions](https://github.com/verydb/justdb/discussions)

## Navigation

- **[Quick Start](../getting-started/)** - Get started quickly
- **[User Guide](../guide/)** - User documentation
- **[Reference](../reference/)** - API and command reference
- **[Design](../design/)** - Architecture and design documents
