---
title: Migration Cheatsheet
icon: bolt
---

# Migration

Schema migration manages and applies database structure changes, supporting version control, incremental migration, and rollback.

## Quick Examples

### Basic Migration Commands

```bash
# Generate migration SQL
justdb diff --schema schema.xml --target db:mysql://localhost:3306/dbname

# Apply migration
justdb migrate --schema schema.xml --url jdbc:mysql://localhost:3306/dbname

# Rollback migration
justdb rollback --schema schema.xml --url jdbc:mysql://localhost:3306/dbname
```

### Migration Script Generation

```bash
# Generate incremental migration
justdb migrate --incremental --output migrations/V001__initial_schema.xml

# Generate rollback script
justdb migrate --rollback --output migrations/rollback/V001__initial_schema.xml
```

## Common Scenarios

### Scenario 1: Initialize Schema

```bash
# Create database from scratch
justdb migrate \
    --schema src/main/resources/schema.xml \
    --url jdbc:mysql://localhost:3306/mydb \
    --user root \
    --password secret
```

### Scenario 2: Incremental Update

```bash
# Apply only changes
justdb migrate \
    --schema new-schema.xml \
    --baseline current-schema.xml \
    --url jdbc:mysql://localhost:3306/mydb
```

### Scenario 3: Preview Changes

```bash
# Generate SQL without executing
justdb diff \
    --schema schema.xml \
    --url jdbc:mysql://localhost:3306/mydb \
    --output migration.sql \
    --dry-run
```

### Scenario 4: Cross-Database Migration

```bash
# MySQL → PostgreSQL
justdb migrate \
    --schema schema.xml \
    --source mysql://localhost:3306/mydb \
    --target postgresql://localhost:5432/mydb
```

## Command Reference

### migrate Command

```bash
justdb migrate [options]

Options:
  --schema <file>       Schema file path
  --url <jdbc-url>      Database JDBC URL
  --user <username>     Database username
  --password <pwd>      Database password
  --baseline <file>     Baseline Schema file
  --output <file>       Output file path
  --dry-run             Preview mode, don't execute
  --idempotent          Idempotent mode (IF NOT EXISTS)
  --safe-drop           Safe drop (rename instead of drop)
  --computed-column     Computed column strategy: auto, always, never
  --format              Output format: sql, xml, json
```

### diff Command

```bash
justdb diff [options]

Options:
  --schema <file>       Target Schema file
  --target <url>        Target database URL
  --baseline <file>     Baseline Schema (optional)
  --output <file>       Output file
  --direction <dir>     Diff direction: forward, backward, both
  --include-data        Include data differences
```

### rollback Command

```bash
justdb rollback [options]

Options:
  --schema <file>       Current Schema file
  --to <version>        Rollback to specific version
  --steps <n>           Rollback steps
  --output <file>       Output rollback script
```

### validate Command

```bash
justdb validate [options]

Options:
  --schema <file>       Schema file
  --target <url>        Target database
  --strict              Strict mode (warnings as errors)
  --computed-column     Computed column strategy
```

## Migration Strategies

### Idempotent Migration

```bash
# Use IF NOT EXISTS / IF EXISTS
justdb migrate --idempotent
```

Generated SQL:

```sql
CREATE TABLE IF NOT EXISTS users (...);
DROP TABLE IF EXISTS old_table;
```

### Safe Drop

```bash
# Rename before dropping (backup)
justdb migrate --safe-drop
```

Generated SQL:

```sql
RENAME TABLE users TO users_backup_20250210;
CREATE TABLE users (...);
```

### Computed Column Strategy

```bash
# auto: generate computed column when database supports it
justdb migrate --computed-column auto

# always: force generation
justdb migrate --computed-column always

# never: never generate
justdb migrate --computed-column never
```

## Migration Files

### Migration File Naming

```
migrations/
├── V001__initial_schema.xml
├── V002__add_users_table.xml
├── V003__add_orders_table.xml
└── V004__add_indexes.xml
```

Naming rules:
- `V` + version number + `__` + description
- Version: zero-padded, starting from 3 digits
- Description: lowercase, underscore-separated

### Migration File Content

```xml
<!-- V001__initial_schema.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<Migration version="1" description="Initial schema">
    <Changes>
        <CreateTable name="users">
            <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
            <Column name="username" type="VARCHAR(50)" nullable="false"/>
            <Column name="email" type="VARCHAR(100)"/>
        </CreateTable>

        <CreateTable name="roles">
            <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
            <Column name="name" type="VARCHAR(50)" nullable="false"/>
        </CreateTable>
    </Changes>
</Migration>
```

### Rollback Script

```xml
<!-- V001__initial_schema_rollback.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<Migration version="1" description="Rollback initial schema">
    <Changes>
        <DropTable name="users"/>
        <DropTable name="roles"/>
    </Changes>
</Migration>
```

## Change Types

| Change Type | Command | Example |
|-------------|---------|---------|
| **Add Table** | `CreateTable` | `<CreateTable name="users">` |
| **Drop Table** | `DropTable` | `<DropTable name="users">` |
| **Rename Table** | `RenameTable` | `<RenameTable from="users" to="members"/>` |
| **Add Column** | `AddColumn` | `<AddColumn table="users" column="email"/>` |
| **Drop Column** | `DropColumn` | `<DropColumn table="users" column="old_col"/>` |
| **Modify Column** | `ModifyColumn` | `<ModifyColumn table="users" column="email" type="VARCHAR(255)"/>` |
| **Add Index** | `CreateIndex` | `<CreateIndex name="idx_email" table="users"/>` |
| **Drop Index** | `DropIndex` | `<DropIndex name="idx_email"/>` |
| **Add Constraint** | `AddConstraint` | `<AddConstraint type="FOREIGN_KEY">` |
| **Drop Constraint** | `DropConstraint` | `<DropConstraint name="fk_user"/>` |

## Version Management

### Version Tracking

```xml
<Justdb>
    <!-- Migration history table -->
    <Table name="schema_migrations">
        <Column name="version" type="BIGINT" primaryKey="true"/>
        <Column name="description" type="VARCHAR(255)"/>
        <Column name="applied_at" type="TIMESTAMP"/>
        <Column name="execution_time" type="INT"/>
    </Table>
</Justdb>
```

### Version Locking

```bash
# Lock version (prevent concurrent migration)
justdb migrate --lock

# Release lock
justdb migrate --unlock
```

## Data Migration

### Include Data Migration

```bash
# Schema + Data migrate together
justdb migrate --schema schema.xml --data data.xml
```

### Data Transformation

```xml
<Data table="users" transform="true">
    <Row username="alice">
        <!-- Transform: lowercase to uppercase -->
        <Column name="username" transform="toUpperCase"/>
    </Row>
</Data>
```

## Important Notes

### 1. Backup Before Migration

```bash
# Auto backup
justdb migrate --backup --backup-dir /backups

# Manual backup
mysqldump -u root -p mydb > backup.sql
```

### 2. Transaction Handling

```bash
# Single transaction execution (rollback on failure)
justdb migrate --single-transaction

# Large batch decomposition
justdb migrate --batch-size 100
```

### 3. Dependency Order

```xml
<!-- Define dependency table first -->
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
</Table>

<!-- Then define dependent table -->
<Table name="orders">
    <Column name="user_id" type="BIGINT"/>
    <Constraint type="FOREIGN_KEY">
        <referencedTable>users</referencedTable>
    </Constraint>
</Table>
```

### 4. Production Environment Check

```bash
# Validate schema
justdb validate --schema schema.xml --target $PROD_DB

# Preview SQL
justdb diff --schema schema.xml --target $PROD_DB --dry-run

# Small scale test
justdb migrate --schema schema.xml --target $TEST_DB
```

## Advanced Techniques

### Technique 1: Phased Migration

```bash
# Phase 1: Add new column (optional)
justdb migrate --file V001__add_new_column.xml

# Phase 2: Populate data
justdb migrate --file V002__populate_data.xml

# Phase 3: Remove old column
justdb migrate --file V003__remove_old_column.xml
```

### Technique 2: Conditional Migration

```xml
<Migration version="1">
    <Changes>
        <AddColumn table="users" name="email" type="VARCHAR(100)">
            <!-- Only add when column doesn't exist -->
            <condition>!columnExists('users', 'email')</condition>
        </AddColumn>
    </Changes>
</Migration>
```

### Technique 3: Rollback Points

```bash
# Create rollback point
justdb migrate --savepoint sp1

# Rollback to rollback point
justdb migrate --rollback-to sp1
```

## Reference Links

- [Migration System Design](../../design/migration-system/)
- [CLI Command Reference](../../reference/cli/commands.md)
- [Schema Diff](../../reference/api/schema-diff.md)
