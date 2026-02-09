---
icon: terminal
title: CLI Reference
order: 3
---

# CLI Reference

Complete reference for the JustDB command-line interface.

## Installation

```bash
# Download
wget https://github.com/verydb/justdb/releases/download/v1.0.0/justdb-1.0.0-linux.tar.gz
tar -xzf justdb-1.0.0-linux.tar.gz

# Add to PATH
export PATH=$PATH:$PWD/bin

# Verify
justdb --version
```

## Global Options

| Option | Short | Description |
|--------|-------|-------------|
| `--config` | `-c` | Configuration file path |
| `--dialect` | `-d` | Database dialect (mysql, postgresql, etc.) |
| `--verbose` | `-v` | Verbose output |
| `--quiet` | `-q` | Quiet mode |
| `--help` | `-h` | Show help |
| `--version` | `-V` | Show version |

## Commands

### migrate

Execute database migrations.

```bash
justdb migrate [options] [schema-files...]
```

**Options:**
- `--dry-run` - Preview changes without executing
- `--baseline` - Set baseline version
- `--idempotent` - Enable idempotent mode (default: true)
- `--safe-drop` - Enable safe drop (rename instead of delete)
- `--force` - Force execution
- `--validate` - Only validate schema

**Examples:**

```bash
# Basic migration
justdb migrate

# Specific schema files
justdb migrate users.yaml orders.yaml

# Preview changes
justdb migrate --dry-run

# Set baseline
justdb migrate --baseline
```

### validate

Validate schema definitions.

```bash
justdb validate [options] [schema-files...]
```

**Options:**
- `--strict` - Enable strict validation
- `--verbose` - Show detailed validation results

**Examples:**

```bash
# Validate all schemas
justdb validate

# Strict mode
justdb validate --strict
```

### diff

Compare schemas.

```bash
justdb diff [options]
```

**Options:**
- `--schema` | `-s` - Target schema file
- `--format` | `-f` - Output format (text, json, yaml)
- `--output` | `-o` - Output file

**Examples:**

```bash
# Show differences
justdb diff

# JSON output
justdb diff -f json

# Save to file
justdb diff -o diff.txt
```

### db2schema

Extract schema from database.

```bash
justdb db2schema [options]
```

**Options:**
- `--url` | `-u` - Database URL
- `--username` - Database username
- `--password` - Database password
- `--output` | `-o` - Output file (default: schema.yaml)
- `--format` - Output format (default: yaml)

**Examples:**

```bash
# Extract schema
justdb db2schema -u jdbc:mysql://localhost:3306/myapp

# JSON format
justdb db2schema -u jdbc:postgresql://localhost:5432/myapp -o schema.json
```

### backup

Backup database schema and data.

```bash
justdb backup [options]
```

**Options:**
- `--output` | `-o` - Output file (default: backup.sql)
- `--data` - Include data
- `--compress` - Compress backup

**Examples:**

```bash
# Backup schema only
justdb backup

# Backup schema and data
justdb backup --data

# Compressed backup
justdb backup --compress
```

### history

View migration history.

```bash
justdb history [options] [migration-id]
```

**Options:**
- `--number` | `-n` - Number of recent migrations (default: 10)
- `--format` - Output format

**Examples:**

```bash
# Show recent migrations
justdb history

# Show last 20
justdb history -n 20

# Show specific migration
justdb history 001
```

### rollback

Rollback migrations.

```bash
justdb rollback [options] [version]
```

**Options:**
- `--dry-run` - Preview rollback
- `--last` - Rollback last migration

**Examples:**

```bash
# Rollback to version
justdb rollback 002

# Rollback last migration
justdb rollback --last
```

### convert

Convert between formats.

```bash
justdb convert [options] <input> [output]
```

**Options:**
- `--from` | `-f` - Input format
- `--to` | `-t` - Output format

**Examples:**

```bash
# YAML to JSON
justdb convert -f yaml -t json schema.yaml schema.json

# JSON to YAML
justdb convert schema.json schema.yaml
```

### doc

Generate documentation.

```bash
justdb doc [options]
```

**Options:**
- `--format` - Output format (markdown, html, ascii)
- `--output` | `-o` - Output file (default: DATABASE.md)

**Examples:**

```bash
# Generate Markdown
justdb doc

# Generate HTML
justdb doc --format html
```

## Interactive Mode

Start interactive mode:

```bash
justdb
```

### Interactive Commands

```bash
justdb> /load schema.yaml        # Load schema
justdb> /migrate                 # Run migration
justdb> /diff                    # Show differences
justdb> /validate                # Validate schema
justdb> /help                    # Show help
justdb> /exit                    # Exit
```

## Configuration File

Create `justdb-config.yaml`:

```yaml
database:
  url: jdbc:mysql://localhost:3306/myapp
  username: root
  password: password

schema:
  locations:
    - ./justdb
    - ./db
  format: yaml

migrate:
  auto-diff: true
  safe-drop: false
  idempotent: true
  dry-run: false

history:
  enabled: true
  table: justdb_history

logging:
  level: INFO
  file: logs/justdb.log
```

Use configuration:

```bash
justdb -c justdb-config.yaml migrate
```

## Environment Variables

```bash
# Database configuration
export JUSTDB_DATABASE_URL="jdbc:mysql://localhost:3306/myapp"
export JUSTDB_DATABASE_USERNAME="root"
export JUSTDB_DATABASE_PASSWORD="password"

# Migration options
export JUSTDB_MIGRATION_DRY_RUN="false"
export JUSTDB_MIGRATION_SAFE_DROP="false"
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Validation failed |
| 3 | Migration failed |

## Examples

### Complete Workflow

```bash
# 1. Initialize
justdb init

# 2. Create schema
cat > schema.yaml << EOF
id: myapp
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
EOF

# 3. Validate
justdb validate schema.yaml

# 4. Preview
justdb migrate --dry-run schema.yaml

# 5. Deploy
justdb migrate schema.yaml

# 6. Verify
justdb diff
```

### CI/CD Integration

```bash
# In CI/CD pipeline
set -e  # Exit on error

# Validate schema
justdb validate

# Preview changes
justdb migrate --dry-run

# Deploy
justdb migrate

# Verify deployment
justdb diff
```

## Next Steps

- **[Quick Start](/getting-started/)** - Get started quickly
- **[API Reference](/reference/api/)** - Programmatic API
- **[Configuration](/reference/config/)** - Configuration options
