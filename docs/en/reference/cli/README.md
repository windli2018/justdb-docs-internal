---
title: CLI Overview
icon: terminal
description: JustDB command-line interface introduction, installation and basic usage
order: 1
---

# CLI Overview

JustDB CLI is a powerful command-line tool for managing database schemas, executing migrations, generating code, and interacting with AI assistants.

## Installation

### Build with Maven

```bash
# Clone repository
git clone https://github.com/verydb/justdb.git
cd justdb

# Build project
mvn clean package -DskipTests

# CLI tool is located at justdb-cli/target/justdb-cli-*-bin.tar.gz
```

### Use Docker

```bash
docker pull verydb/justdb:latest
docker run -it --rm verydb/justdb:latest --help
```

### Download from Release

Download pre-compiled binaries from [GitHub Releases](https://github.com/verydb/justdb/releases).

## Basic Usage

```bash
# Display help
justdb --help

# Display specific command help
justdb migrate --help

# View version
justdb --version
```

## Command Categories

### Schema Management

| Command | Description |
|---------|-------------|
| [`init`](./commands.md#init) | Initialize new JustDB project |
| [`db2schema`](./commands.md#db2schema) | Export schema from database |
| [`format`](./commands.md#format) | Format schema files |
| [`validate`](./commands.md#validate) | Validate schema definitions |

### Migration and Deployment

| Command | Description |
|---------|-------------|
| [`migrate`](./commands.md#migrate) | Execute schema migration |
| [`diff`](./commands.md#diff) | Compare schema differences |
| [`deploy`](./commands.md#deploy) | Deploy schema to database |

### Code Generation

| Command | Description |
|---------|-------------|
| [`convert`](./commands.md#convert) | Convert schema format or generate code |

### SQL Operations

| Command | Description |
|---------|-------------|
| [`sql`](./commands.md#sql) | SQL interactive mode or execute SQL |

### AI Integration

| Command | Description |
|---------|-------------|
| [`ai`](./commands.md#ai) | One-time AI query |
| [`interactive`](./interactive-mode.md) | Interactive shell (with AI assistant) |
| [`ai-history`](./commands.md#ai-history) | Manage AI history |

### Configuration and Plugins

| Command | Description |
|---------|-------------|
| [`config`](./commands.md#config) | Manage CLI configuration |
| [`plugin`](./commands.md#plugin) | Manage plugins |
| [`driver`](./commands.md#driver) | Manage JDBC drivers |

### Other Tools

| Command | Description |
|---------|-------------|
| [`show`](./commands.md#show) | Display schema information |
| [`test`](./commands.md#test) | Test database connection |
| [`testrun`](./commands.md#testrun) | Test run schema |
| [`load`](./commands.md#load) | Load schema files |
| [`save`](./commands.md#save) | Save schema files |
| [`watch`](./commands.md#watch) | Monitor file changes |

## Common Options

All commands support the following common options:

### Input Options (InputMixin)

```bash
-i, --input <files>      # Input files/directories/URLs (comma-separated)
--type <types>           # File types (yaml, json, xml, sql, java, class)
-p, --project <name>     # Project name or path
```

### Output Options (OutputMixin)

```bash
-o, --output <path>      # Output file or directory (auto-detected)
-t, --format <fmt>       # Output format: yaml, json, xml, toml, sql, java
-r, --report-format <fmt> # Report format: text, xml, md, html, json, yaml
```

### Database Connection Options (DatabaseConnectionMixin)

```bash
-U, --db-url <url>       # JDBC URL
-u, --db-username <user> # Database username
-w, --db-password <pass> # Database password
-D, --dialect <type>     # Database dialect (auto-detected)
-C, --current-database <name> # Use database from config file
```

### Table Filter Options (TableFilterMixin)

```bash
-I, --include-tables <patterns>  # Include table patterns (supports * and ?)
-X, --exclude-tables <patterns>  # Exclude table patterns
```

### Data Filter Options (DataFilterMixin)

```bash
--data-filter <condition>         # Data filter condition
--process-data                    # Process data nodes
```

### Global Options

```bash
-c, --config <files>     # Configuration files (can be specified multiple times)
--disable-plugins <list> # Disable plugins
-v, --verbose            # Verbose output
-q, --quiet              # Quiet mode
--log-level <level>      # Log level: trace, debug, info, warn, error
--log-file <file>        # Log file
-f, --force              # Force execution
-n, --dry-run            # Dry run
```

## Configuration Files

JustDB CLI supports multiple configuration formats:

### Configuration File Lookup Order (low to high priority)

1. Built-in configuration (`justdb/builtin-config.*`)
2. Auto-discovered configuration (`~/.justdb-cli.*`, `./.justdb-cli.*`)
3. User-specified configuration (`-c` option)
4. Environment variables
5. Command-line arguments (highest priority)

### Supported Configuration Formats

- YAML (`.yaml`, `.yml`)
- JSON (`.json`)
- XML (`.xml`)
- Properties (`.properties`)
- TOML (`.toml`)

For detailed configuration, see [Configuration File Documentation](./configuration.md).

## Quick Start

### 1. Initialize Project

```bash
justdb init myproject
cd myproject
```

### 2. Connect Database

Edit `justdb.yaml`:

```yaml
databases:
  - name: production
    type: mysql
    jdbcUrl: jdbc:mysql://localhost:3306/mydb
    username: root
    password: password
```

### 3. Export Schema

```bash
justdb db2schema -C production -o schema.yaml
```

### 4. Execute Migration

```bash
justdb migrate -C production schema.yaml
```

### 5. Use AI Assistant

```bash
# Enter interactive mode
justdb interactive

# Or one-time query
justdb ai "create a user table"
```

## Best Practices

1. **Use Configuration Files**: Store database connection info in config files to avoid entering it every time
2. **Version Control**: Include schema files in version control
3. **Validate Before Migrate**: Use `validate` command to check schema before migration
4. **Use AI Assistance**: Leverage AI assistant to quickly generate schema definitions
5. **Check Differences**: Use `diff` command to view changes before migration

## Related Documentation

- [Command Reference](./commands.md) - Complete command list and options *(Coming soon)*
- [Interactive Mode](./interactive-mode.md) - Interactive shell usage guide *(Coming soon)*
- [Configuration Files](./configuration.md) - Configuration file details *(Coming soon)*
- [File Loading Mechanism](./file-loading.md) - Schema file loading rules *(Coming soon)*
