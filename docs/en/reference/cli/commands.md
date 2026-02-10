---------------------------
title: Command Reference
icon: list
description: Complete JustDB CLI command list, syntax and examples
order: 2
---------------------------

# Command Reference

This document provides a complete reference for all JustDB CLI commands.

## Command List

### Schema Management

#### init

Initialize a new JustDB project.

**Syntax**
```bash
justdb init [options] [project-name]
```

**Options**
```bash
-p, --project <name>     # Project name
-t, --format <fmt>       # Output format: xml, yaml, json (default: xml)
-o, --output <file>      # Output file (default: <project>/justdb.<fmt>)
-f, --force              # Overwrite existing files
```

**Examples**
```bash
# Initialize with default settings
justdb init

# Specify project name and format
justdb init -p myapp -t yaml

# Overwrite existing project
justdb init -f myapp
```

**Generated File Structure**
```
myapp/
└── justdb.xml          # Schema definition file
    ├── Justdb
    ├── Columns         # Global column definitions
    └── Tables          # Table definitions
        ├── users
        ├── orders
        └── products
```

---------------------------

#### db2schema

Export Schema from database.

**Syntax**
```bash
justdb db2schema [options]
```

**Options**
```bash
# Database connection
-C, --current-database <name>    # Use database from config file
-U, --db-url <url>               # JDBC URL
-u, --db-username <user>         # Username
-w, --db-password <pass>         # Password
-D, --dialect <type>             # Database dialect

# Table filtering
-I, --include-tables <patterns>  # Include table patterns
-X, --exclude-tables <patterns>  # Exclude table patterns

# Include rules (enhanced features)
-ir, --include-rule <rule>       # Include rule
                                  # Format: pattern&key1=value1&key2=value2
-d, --data-filter <rule>         # Simplified data filter rule
                                  # Format: pattern=condition

# Output
-o, --output <file>              # Output file
-t, --format <fmt>               # Output format (default: json)

# Data export
--process-data                   # Export data
--data-filter <condition>        # Data filter condition
```

**Supported Keys in Include Rules**
- `author` / `a`: Author
- `remark` / `r`: Remark
- `module` / `m`: Module
- `dataFilter` / `df`: Data filter condition

**Examples**
```bash
# Export all tables
justdb db2schema -C production -o schema.yaml

# Export specific pattern tables only
justdb db2schema -C production -I "sys_*" -o schema.yaml

# Use include rules
justdb db2schema -C production \
  -I "sys_*&author=admin&remark=System table&dataFilter=deleted=0" \
  -o schema.yaml

# Use simplified data filter
justdb db2schema -C production \
  -d "sys_user=deleted=0" \
  -d "sys_role=is_system=1" \
  -o schema.yaml

# Multi-tenant data export
justdb db2schema -C production \
  -I "user_data&remark=Tenant 0&dataFilter=tenant_id='0'" \
  -I "user_data&remark=Tenant 1&dataFilter=tenant_id='1'" \
  -o schema.yaml
```

**dataFilter Types**
| Value | Type | Description |
|---------------------------|---------------------------|---------------------------|
| Empty or `"none"` | NONE | Export structure only, no data |
| `"*"` or `"all"` | ALL | Export all data |
| Starts with `"SELECT"` | CONDITION | Complete SQL statement |
| Other values | CONDITION | WHERE condition expression |

---------------------------

#### format

Format Schema file.

**Syntax**
```bash
justdb format [options] <files>...
```

**Options**
```bash
-i, --input <files>       # Input files
-o, --output <file>       # Output file (default: overwrite original)
-t, --format <fmt>        # Output format
--sort-keys               # Sort keys
--indent <spaces>         # Indent spaces
```

**Examples**
```bash
# Format single file
justdb format schema.yaml

# Convert format
justdb format -t json schema.xml -o schema.json

# Format multiple files
justdb format *.yaml
```

---------------------------

#### validate

Validate Schema definition.

**Syntax**
```bash
justdb validate [options] [files...]
```

**Options**
```bash
# Database connection
-C, --current-database <name>    # Use database from config file
-U, --db-url <url>               # JDBC URL
-u, --db-username <user>         # Username
-w, --db-password <pass>         # Password

# Table filtering
-I, --include-tables <patterns>  # Include table patterns
-X, --exclude-tables <patterns>  # Exclude table patterns

# Validation options
--validate-data-conditions       # Validate data conditions
```

**Examples**
```bash
# Validate Schema file
justdb validate schema.yaml

# Validate against specific database
justdb validate -C production schema.yaml

# Validate specific tables
justdb validate -I "user*" schema.yaml
```

**Validation Status**
- **CONSISTENT** - Consistent with database
- **INCONSISTENT** - Inconsistent with database
- **NOT_APPLIED** - Not applied to database
- **OUTDATED** - Database version is outdated
- **EXISTS_IN_DB_NOT_IN_HISTORY** - Exists in database but not in history

---------------------------

### Migration and Deployment

#### migrate

Execute Schema migration.

**Syntax**
```bash
justdb migrate [up|down|status] [options]
```

**Subcommands**
```bash
up      # Apply Schema changes (default)
down    # Rollback Schema changes
status  # View migration status
```

**Options**
```bash
# Database connection
-C, --current-database <name>    # Use database from config file
-U, --db-url <url>               # JDBC URL
-u, --db-username <user>         # Username
-w, --db-password <pass>         # Password

# Table filtering
-I, --include-tables <patterns>  # Include table patterns
-X, --exclude-tables <patterns>  # Exclude table patterns

# Migration options
--delete-marked                  # Delete marked objects
--retention-days <days>          # Retention period (default: 60)
--validate-data-conditions       # Validate data conditions

# Backup options
--backup                         # Backup before migration
--backup-provider <name>         # Backup provider
--backup-location <path>         # Backup location
--backup-encrypt                 # Encrypt backup
--backup-key <key>               # Encryption key
```

**Examples**
```bash
# Apply migration
justdb migrate up schema.yaml

# Migration with backup
justdb migrate up --backup schema.yaml

# View status
justdb migrate status schema.yaml

# Migrate specific tables
justdb migrate up -I "user*" schema.yaml
```

---------------------------

#### diff

Compare differences between two Schemas.

**Syntax**
```bash
justdb diff [options] [file1] [file2]
```

**Options**
```bash
-o, --output <file>        # Output diff Schema
-oq, --output-sql <file>   # Output SQL migration script
--report-format <fmt>      # Report format: text, md, html, json
```

**Examples**
```bash
# Compare two files
justdb diff old-schema.yaml new-schema.yaml

# Generate diff report
justdb diff old.yaml new.yaml -o diff.yaml

# Generate SQL migration script
justdb diff old.yaml new.yaml -oq migration.sql

# Use current Schema
justdb diff new-schema.yaml -o diff.yaml
```

**Diff Types**
- **ADDED** - New object
- **REMOVED** - Deleted object
- **MODIFIED** - Modified object
- **RENAMED** - Renamed object

---------------------------

#### deploy

Deploy Schema to database.

**Syntax**
```bash
justdb deploy [options] <files>...
```

**Options**
```bash
# Database connection
-C, --current-database <name>    # Use database from config file
-U, --db-url <url>               # JDBC URL
-u, --db-username <user>         # Username
-w, --db-password <pass>         # Password

# Deployment options
--dry-run                        # Simulate execution
--force                          # Force deployment
--idempotent                     # Idempotent mode (IF NOT EXISTS)
```

**Examples**
```bash
# Deploy to database
justdb deploy -C production schema.yaml

# Simulate execution
justdb deploy --dry-run schema.yaml

# Idempotent deployment
justdb deploy --idempotent schema.yaml
```

---------------------------

### Code Generation

#### convert

Convert Schema format or generate code.

**Syntax**
```bash
justdb convert [options] [files...]
```

**Options**
```bash
# Input/output
-i, --input <files>       # Input files
-o, --output <path>       # Output file or directory
-t, --format <fmt>        # Output format

# Code generation options
--java-orm-type <type>    # Java ORM type
                          # MYBATIS_BEAN (default)
                          # JPA_ENTITY
                          # HIBERNATE_BEAN
                          # SPRING_DATA_JPA
                          # JDBC_TEMPLATE
                          # GENERIC_DAO

# Table filtering
-I, --include-tables <patterns>  # Include table patterns
-X, --exclude-tables <patterns>  # Exclude table patterns
```

**Examples**
```bash
# Convert format
justdb convert schema.xml -o schema.json

# Generate SQL
justdb convert schema.yaml -t sql -o schema.sql

# Generate Java classes
justdb convert schema.yaml -t java -o src/

# Generate JPA entities
justdb convert schema.yaml --java-orm-type JPA_ENTITY -o src/
```

**Supported Output Formats**
- Schema formats: `yaml`, `json`, `xml`, `toml`
- SQL: `sql` (requires dialect specification)
- Code: `java` (requires ORM type specification)

---------------------------

### SQL Operations

#### sql

SQL interactive mode or execute SQL statements.

**Syntax**
```bash
justdb sql [options] [statement...]
```

**Options**
```bash
-s, --schema <file>       # Schema file
--migrate <file>          # Migrate Schema file
-o, --output <file>       # Output file
```

**Examples**
```bash
# Enter SQL interactive mode
justdb sql

# Execute single SQL
justdb sql "SELECT * FROM users"

# Execute multiple SQL
justdb sql "SELECT * FROM users" "SHOW TABLES"

# Use specific Schema
justdb sql -s schema.yaml "SHOW TABLES"
```

**SQL Interactive Mode Commands**
```bash
sql> SELECT * FROM users;
sql> SHOW TABLES;
sql> DESC users;
sql> exit          # Exit
```

---------------------------

### AI Integration

#### ai

One-time AI query.

**Syntax**
```bash
justdb ai [options] [message]
```

**Options**
```bash
-m, --message <text>           # Message to send to AI
--message-from-file <file>     # Read message from file
-i, --input <file>             # Schema file
-o, --output <file>            # Save generated Schema

# AI configuration
--provider <name>              # AI provider (default: local)
--base-url <url>               # AI service URL
--model <name>                 # Model name
```

**Examples**
```bash
# Interactive query
justdb ai "Create a user table with id, username, email"

# Read from stdin
echo "Create orders table" | justdb ai

# Read from file
justdb ai --message-from-file prompt.txt

# Save result
justdb ai "Create products table" -o schema.yaml

# Use specific provider
justdb ai --provider openai "Create table"
```

**AI Provider Types**
- `local` / `ollama` - Local models (Ollama)
- `openai` - OpenAI API
- `zhipu` / `glm` - Zhipu AI
- `qwen` - Qwen (Tongyi Qianwen)

---------------------------

#### ai-history

Manage AI history records.

**Syntax**
```bash
justdb ai-history [options] [command]
```

**Subcommands**
```bash
list        # List history records
show <id>   # Show specific record
delete <id> # Delete record
clear       # Clear all records
```

**Examples**
```bash
# List history
justdb ai-history list

# Show specific record
justdb ai-history show abc123

# Delete record
justdb ai-history delete abc123
```

---------------------------

### Configuration and Plugins

#### config

Manage CLI configuration.

**Syntax**
```bash
justdb config [command] [options]
```

**Subcommands**
```bash
show        # Show current configuration
edit        # Edit configuration file
validate    # Validate configuration
```

**Examples**
```bash
# Show configuration
justdb config show

# Validate configuration
justdb config validate
```

---------------------------

#### plugin

Manage plugins.

**Syntax**
```bash
justdb plugin [command] [options]
```

**Subcommands**
```bash
list            # List all plugins
install <url>   # Install plugin
remove <id>     # Remove plugin
enable <id>     # Enable plugin
disable <id>    # Disable plugin
```

**Examples**
```bash
# List plugins
justdb plugin list

# Disable plugin
justdb plugin disable mysql

# Enable plugin
justdb plugin enable postgres
```

---------------------------

#### driver

Manage JDBC drivers.

**Syntax**
```bash
justdb driver [command] [options]
```

**Subcommands**
```bash
list            # List all drivers
install <url>   # Install driver
remove <id>     # Remove driver
```

**Examples**
```bash
# List drivers
justdb driver list

# Install driver
justdb driver install mysql:mysql-connector-java:8.0.33
```

---------------------------

### Other Tools

#### show

Display Schema information.

**Syntax**
```bash
justdb show [what] [options]
```

**Subcommands**
```bash
schema              # Show Schema overview
tables              # List all tables
columns <table>     # Show table columns
indexes <table>     # Show table indexes
constraints <table> # Show table constraints
data <table>        # Show table data
```

**Examples**
```bash
# Show Schema
justdb show schema schema.yaml

# List tables
justdb show tables schema.yaml

# Show columns
justdb show columns users schema.yaml
```

---------------------------

#### test

Test database connection.

**Syntax**
```bash
justdb test [options]
```

**Options**
```bash
-C, --current-database <name>    # Use database from config file
-U, --db-url <url>               # JDBC URL
-u, --db-username <user>         # Username
-w, --db-password <pass>         # Password
```

**Examples**
```bash
# Test database from config file
justdb test -C production

# Test specific connection
justdb test -U "jdbc:mysql://localhost:3306/test" -u root
```

---------------------------

#### load

Load Schema file to interactive context.

**Syntax**
```bash
justdb load [options] <files...>
```

**Examples**
```bash
# Load Schema
justdb load schema.yaml

# Load multiple files
justdb load schema1.yaml schema2.yaml
```

---------------------------

#### save

Save current Schema to file.

**Syntax**
```bash
justdb save [options] [file]
```

**Options**
```bash
-t, --format <fmt>        # Output format
```

**Examples**
```bash
# Save to file
justdb save schema.yaml

# Convert format and save
justdb save -t json schema.json
```

---------------------------

#### watch

Monitor Schema file changes.

**Syntax**
```bash
justdb watch [options] [files...]
```

**Options**
```bash
--command <cmd>           # Command to execute on file change
--delay <ms>              # Check interval (milliseconds)
```

**Examples**
```bash
# Monitor files
justdb watch schema.yaml

# Auto-validate on file changes
justdb watch --command "justdb validate %f" schema.yaml
```

---------------------------

## Related Documentation

- [Interactive Mode](./interactive-mode.md) - Interactive shell usage guide
- [Configuration File](./configuration.md) - Configuration file details
- [File Loading Mechanism](./file-loading.md) - Schema file loading rules
