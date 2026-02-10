---
icon: terminal
date: 2024-01-01
title: CLI Reference
order: 15
category:
  - Guide
  - CLI
tag:
  - CLI
  - commands
  - reference
---

# CLI Reference

Complete reference documentation for JustDB Command Line Interface (CLI).

## Command Overview

### Core Commands

| Command | Description |
|:---|:---|
| `migrate` | Execute database migration |
| `validate` | Validate Schema definition |
| `diff` | View Schema differences |
| `db2schema` | Extract Schema from database |
| `backup` | Backup database |
| `history` | View migration history |
| `rollback` | Rollback migration |
| `ai` | AI assistant |

### Utility Commands

| Command | Description |
|:---|:---|
| `convert` | Format conversion |
| `doc` | Generate documentation |
| `health` | Health check |
| `version` | Display version |
| `help` | Display help |

## Global Options

### Basic Options

```bash
justdb [global-options] [command] [command-options]
```

| Option | Short | Description | Default |
|:---|:---|:---|:---|
| `--config` | `-c` | Configuration file path | - |
| `--dialect` | `-d` | Database dialect | Auto-detect |
| `--verbose` | `-v` | Verbose output | false |
| `--quiet` | `-q` | Silent mode | false |
| `--help` | `-h` | Display help | - |
| `--version` | `-V` | Display version | - |

### Examples

```bash
# Use configuration file
justdb -c config.yaml migrate

# Specify database dialect
justdb -d postgresql migrate

# Verbose output
justdb -v migrate

# Silent mode
justdb -q migrate
```

## migrate Command

Execute database migration.

### Syntax

```bash
justdb migrate [options] [schema-files...]
```

### Options

| Option | Description | Default |
|:---|:---|:---|
| `--dry-run` | Preview changes, don't execute | false |
| `--baseline` | Set baseline version | false |
| `--idempotent` | Idempotent mode | true |
| `--safe-drop` | Safe drop mode | false |
| `--auto-diff` | Auto calculate diff | true |
| `--force` | Force execution | false |
| `--validate` | Validate only | false |

### Examples

```bash
# Basic migration
justdb migrate

# Specify Schema files
justdb migrate users.yaml orders.yaml

# Preview changes
justdb migrate --dry-run

# Set baseline
justdb migrate --baseline

# Safe drop mode
justdb migrate --safe-drop

# Force execution
justdb migrate --force
```

### Output Example

```bash
$ justdb migrate

[INFO] Loading schema from: ./justdb/
[INFO] Connecting to database: jdbc:mysql://localhost:3306/myapp
[INFO] Current database state: 2 table(s)
[INFO] Target schema: 2 table(s)
[INFO] Calculating schema diff...
[INFO] Changes to apply:
[INFO]   ~ Modify table: users
[INFO]     + Add column: phone
[INFO] Generated SQL:
[INFO]   ALTER TABLE users ADD COLUMN phone VARCHAR(20);
[INFO] Executing migration...
[INFO] Migration completed successfully
```

## validate Command

Validate Schema definition.

### Syntax

```bash
justdb validate [options] [schema-files...]
```

### Options

| Option | Description | Default |
|:---|:---|:---|
| `--strict` | Strict mode | false |
| `--verbose` | Show detailed information | false |

### Examples

```bash
# Validate all schemas
justdb validate

# Validate specific file
justdb validate users.yaml

# Strict mode
justdb validate --strict

# Verbose output
justdb validate --verbose
```

### Output Example

```bash
$ justdb validate

[INFO] Loading schema from: ./justdb/
[INFO] Validating schema...
[INFO] Schema validation passed
[INFO]   - 2 tables
[INFO]   - 15 columns
[INFO]   - 4 indexes
[INFO]   - 2 constraints
```

## diff Command

View Schema differences.

### Syntax

```bash
justdb diff [options]
```

### Options

| Option | Short | Description | Default |
|:---|:---|:---|:---|
| `--schema` | `-s` | Specify Schema file | - |
| `--format` | `-f` | Output format (text/json/yaml) | text |
| `--output` | `-o` | Output to file | - |

### Examples

```bash
# View differences
justdb diff

# Specify Schema file
justdb diff -s schema.yaml

# JSON format output
justdb diff -f json

# Save to file
justdb diff -o diff.txt
```

### Output Example

```bash
$ justdb diff

Schema Differences:
===================

Table: users
  Columns:
    + ADDED: phone VARCHAR(20)
    ~ MODIFIED: username VARCHAR(50) -> VARCHAR(100)
    - REMOVED: old_field

  Indexes:
    + ADDED: idx_phone (phone)

Table: orders
  + ADDED: new table
```

## db2schema Command

Extract Schema from database.

### Syntax

```bash
justdb db2schema [options]
```

### Options

| Option | Short | Description | Default |
|:---|:---|:---|:---|
| `--url` | `-u` | Database URL | - |
| `--username` | Database username | - |
| `--password` | Database password | - |
| `--output` | `-o` | Output file | schema.yaml |
| `--format` | Output format | yaml |

### Examples

```bash
# Extract Schema
justdb db2schema \
  -u jdbc:mysql://localhost:3306/myapp \
  -o schema.yaml

# Use configuration file
justdb db2schema -c config.yaml

# JSON format
justdb db2schema -o schema.json
```

## backup Command

Backup database.

### Syntax

```bash
justdb backup [options]
```

### Options

| Option | Short | Description | Default |
|:---|:---|:---|:---|
| `--output` | `-o` | Output file | backup.sql |
| `--data` | Include data | false |
| `--compress` | Compress backup | false |

### Examples

```bash
# Backup structure
justdb backup

# Backup structure and data
justdb backup --data

# Compress backup
justdb backup --compress

# Specify output file
justdb backup -o backup_$(date +%Y%m%d).sql
```

## history Command

View migration history.

### Syntax

```bash
justdb history [options] [migration-id]
```

### Options

| Option | Short | Description | Default |
|:---|:---|:---|:---|
| `--number` | `-n` | Show last N entries | 10 |
| `--format` | Output format | table |

### Examples

```bash
# View history
justdb history

# View last 20 entries
justdb history -n 20

# View specific migration
justdb history 001
```

### Output Example

```bash
$ justdb history

Migration History:
===================

ID      | Timestamp           | Description         | Status
--------|---------------------|---------------------|--------
001     | 2024-01-15 10:30:00 | Initial schema      | SUCCESS
002     | 2024-01-16 14:20:00 | Add phone column    | SUCCESS
003     | 2024-01-17 09:15:00 | Rename username     | SUCCESS
```

## rollback Command

Rollback migration.

### Syntax

```bash
justdb rollback [options] [version]
```

### Options

| Option | Description | Default |
|:---|:---|:---|
| `--dry-run` | Preview rollback | false |
| `--last` | Rollback last migration | false |

### Examples

```bash
# Rollback to specific version
justdb rollback 002

# Rollback last migration
justdb rollback --last

# Preview rollback
justdb rollback --dry-run 002
```

## ai Command

AI assistant.

### Syntax

```bash
justdb ai [options] [prompt]
```

### Options

| Option | Description | Default |
|:---|:---|:---|
| `--model` | AI model | - |
| `--interactive` | Interactive mode | true |

### Examples

```bash
# Interactive mode
justdb ai

# Direct question
justdb ai "Create a user table"

# Use specific model
justdb ai --model qwen "Add order table"
```

## convert Command

Format conversion.

### Syntax

```bash
justdb convert [options] <input-file> [output-file]
```

### Options

| Option | Short | Description | Default |
|:---|:---|:---|:---|
| `--from` | `-f` | Input format | auto |
| `--to` | `-t` | Output format | yaml |

### Examples

```bash
# JSON to YAML
justdb convert -f json -t yaml schema.json schema.yaml

# XML to JSON
justdb convert schema.xml schema.json
```

## doc Command

Generate documentation.

### Syntax

```bash
justdb doc [options]
```

### Options

| Option | Short | Description | Default |
|:---|:---|:---|:---|
| `--format` | Document format | markdown |
| `--output` | `-o` | Output file | DATABASE.md |

### Examples

```bash
# Generate Markdown documentation
justdb doc

# Generate HTML documentation
justdb doc --format html

# Specify output file
justdb doc -o SCHEMA.md
```

## health Command

Health check.

### Syntax

```bash
justdb health [options]
```

### Options

| Option | Description | Default |
|:---|:---|:---|
| `--verbose` | Detailed information | false |

### Examples

```bash
# Health check
justdb health

# Detailed information
justdb health --verbose
```

## Interactive Mode

### Start Interactive Mode

```bash
justdb
```

### Interactive Commands

```bash
justdb> /load users.yaml
justdb> /migrate
justdb> /diff
justdb> /validate
justdb> /help
justdb> /exit
```

### AI Interaction

```bash
justdb> /ai Create a user table
justdb> /ai Add phone field
justdb> /ai Generate user role table
```

## Environment Variables

### Configure Environment Variables

```bash
# Database configuration
export JUSTDB_DATABASE_URL="jdbc:mysql://localhost:3306/myapp"
export JUSTDB_DATABASE_USERNAME="root"
export JUSTDB_DATABASE_PASSWORD="password"

# Migration configuration
export JUSTDB_MIGRATION_DRY_RUN="false"
export JUSTDB_MIGRATION_SAFE_DROP="false"
```

### Use Environment Variables

```bash
# Use environment variable configuration
justdb migrate

# Override environment variables
justdb migrate --dry-run=true
```

## Exit Codes

| Code | Description |
|:---|:---|
| 0 | Success |
| 1 | General error |
| 2 | Validation failed |
| 3 | Migration failed |

### Example

```bash
# Check exit code
justdb migrate
if [ $? -eq 0 ]; then
    echo "Migration successful"
else
    echo "Migration failed"
fi
```

## Configuration File

### Configuration File Locations

```
./justdb-config.yaml
./justdb/config.yaml
~/.justdb/config.yaml
/etc/justdb/config.yaml
```

### Configuration File Example

```yaml
database:
  url: jdbc:mysql://localhost:3306/myapp
  username: root
  password: password

schema:
  locations:
    - ./justdb
  format: yaml

migrate:
  auto-diff: true
  safe-drop: false
  idempotent: true
```

## Best Practices

### 1. Use Configuration Files

```bash
# Create configuration file
cat > justdb-config.yaml << EOF
database:
  url: jdbc:mysql://localhost:3306/myapp
  username: root
  password: password
EOF

# Use configuration file
justdb -c justdb-config.yaml migrate
```

### 2. Preview Changes

```bash
# Always preview first
justdb migrate --dry-run

# Check differences
justdb diff

# Execute after confirmation
justdb migrate
```

### 3. Validate Schema

```bash
# Validate before migration
justdb validate

# Validate after migration
justdb migrate && justdb validate
```

### 4. Backup Data

```bash
# Backup before migration
justdb backup -o backup.sql

# Execute migration
justdb migrate

# Verify results
justdb verify
```

## Next Steps

<VPCard
  title="API Reference"
  desc="Programming API documentation"
  link="/en/guide/api-reference.html"
/>

<VPCard
  title="Configuration Reference"
  desc="Complete configuration options"
  link="/en/guide/config-reference.html"
/>

<VPCard
  title="Installation Guide"
  desc="Install and configure CLI tool"
  link="/en/getting-started/installation.html"
/>
