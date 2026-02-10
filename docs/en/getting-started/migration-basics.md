---
date: 2024-01-01
icon: arrows-rotate
title: Migration Basics
order: 5
category:
  - Quick Start
  - Migration
tag:
  - migration
  - schema
  - version-control
---

# Migration Basics

Learn about JustDB's Schema migration mechanism to make your database changes safer and more controllable.

## What is Migration

Migration is the process of transforming a database from one state to another. JustDB adopts a **declarative migration** approach:

```mermaid
flowchart LR
    A[Define Target Schema] --> B[JustDB Extracts<br/>Current Database State]
    B --> C[Calculate Diff]
    C --> D[Generate SQL]
    D --> E[Execute Changes]
    E --> F[Record History]
```

**Traditional Migration vs JustDB Migration**:

| Dimension | Traditional (Flyway/Liquibase) | JustDB |
|:---|:---|:---|
| **Definition** | Imperative (write SQL) | Declarative (define state) |
| **Change Detection** | Manually write scripts | Auto calculate diff |
| **Version Control** | Manual version numbers | Auto version tracking |
| **Rollback** | Manually write rollback scripts | Auto generate rollback |
| **Conflict Resolution** | Manually resolve | Auto merge |

## Basic Migration

### First Migration

```bash
# Create Schema
cat > users.yaml << EOF
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
EOF

# Execute migration
justdb migrate users.yaml

# Output:
# [INFO] Loading schema from: users.yaml
# [INFO] Connecting to database: jdbc:mysql://localhost:3306/myapp
# [INFO] Current database state: empty
# [INFO] Target schema: 1 table(s)
# [INFO] Changes to apply:
# [INFO]   + Create table: users
# [INFO] Generated SQL:
# [INFO]   CREATE TABLE users (
# [INFO]     id BIGINT NOT NULL,
# [INFO]     username VARCHAR(50),
# [INFO]     PRIMARY KEY (id)
# [INFO]   );
# [INFO] Executing migration...
# [INFO] Migration completed successfully
```

### Incremental Migration

```bash
# Modify Schema, add new field
cat > users.yaml << EOF
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
      - name: email              # New field
        type: VARCHAR(100)       # New field
EOF

# Execute migration
justdb migrate

# Output:
# [INFO] Current database state: 1 table(s)
# [INFO] Target schema: 1 table(s)
# [INFO] Changes to apply:
# [INFO]   ~ Modify table: users
# [INFO]     + Add column: email
# [INFO] Generated SQL:
# [INFO]   ALTER TABLE users ADD COLUMN email VARCHAR(100);
# [INFO] Executing migration...
# [INFO] Migration completed successfully
```

## Migration Commands

### Basic Commands

```bash
# Execute migration
justdb migrate

# Specify config file
justdb migrate -c config.yaml

# Specify Schema file
justdb migrate schema.yaml

# Preview changes (don't execute)
justdb migrate --dry-run

# Verbose output
justdb migrate --verbose
```

### Command Options

| Option | Description |
|:---|:---|
| `--dry-run` | Preview changes without executing |
| `--verbose` | Show detailed information |
| `--force` | Force execution, skip confirmation |
| `--baseline` | Set baseline version |
| `--validate` | Only validate, don't execute |
| `-c, --config` | Specify config file |
| `-d, --dialect` | Specify database dialect |

## Diff Calculation

### Supported Change Types

JustDB automatically detects the following changes:

| Change Type | Description | Example SQL |
|:---|:---|:---|
| **ADDED** | Add table/column/index | `CREATE TABLE`, `ALTER TABLE ADD` |
| **REMOVED** | Drop table/column/index | `DROP TABLE`, `ALTER TABLE DROP` |
| **MODIFIED** | Modify column/index | `ALTER TABLE MODIFY` |
| **RENAMED** | Rename table/column | `ALTER TABLE RENAME`, `ALTER TABLE CHANGE` |

### View Diff

```bash
# View diff between current database and Schema
justdb diff

# Specify Schema file
justdb diff -s schema.yaml

# Output format: json/yaml
justdb diff -f json

# Save diff to file
justdb diff > diff.txt
```

### Diff Output Example

```
Schema Differences:
===================

Table: users
  Columns:
    + ADDED: email VARCHAR(100)
    ~ MODIFIED: username VARCHAR(50) -> VARCHAR(100)
    - REMOVED: phone

  Indexes:
    + ADDED: idx_email (email)
    - REMOVED: idx_phone

Table: orders
  + ADDED: new table
```

## Rename Detection

### Auto Rename Detection

JustDB intelligently detects renames through the `formerNames` attribute:

```yaml
# Before
Table:
  - name: users
    Column:
      - name: username
        type: VARCHAR(50)

# After
Table:
  - name: users
    Column:
      - name: user_name           # New name
        formerNames: [username]   # Old name
        type: VARCHAR(50)
```

```bash
# Auto generates rename SQL during migration
justdb migrate

# Generates: ALTER TABLE users CHANGE COLUMN username user_name VARCHAR(50);
```

### Table Rename

```yaml
Table:
  - name: users                   # New name
    formerNames: [user]           # Old name
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```

```bash
# Generates: ALTER TABLE user RENAME TO users;
```

## Safe Drop

### Safe Drop Mode

Use safe drop mode to avoid accidental data deletion:

```bash
# Enable safe drop
justdb migrate --safe-drop

# Drop operations will rename instead of directly dropping
# users -> users_deleted_<timestamp>
```

### Confirm Deletion

```bash
# Deletion operations requiring confirmation
justdb migrate

# Output:
# [WARN] The following objects will be REMOVED:
# [WARN]   - Table: old_table
# [WARN]   - Column: users.phone
# [WARN]   - Index: users.idx_old
# [WARN] Continue? (yes/no):
```

## Migration History

### View Migration History

```bash
# View all migration records
justdb history

# View last N migrations
justdb history -n 10

# View specific migration details
justdb history <migration-id>
```

### History Record Example

```
Migration History:
===================

ID      | Timestamp           | Description         | Status
--------|---------------------|---------------------|--------
001     | 2024-01-15 10:30:00 | Initial schema      | SUCCESS
002     | 2024-01-16 14:20:00 | Add email column    | SUCCESS
003     | 2024-01-17 09:15:00 | Rename username     | SUCCESS
004     | 2024-01-18 16:45:00 | Add orders table    | SUCCESS
```

### Rollback Migration

```bash
# Rollback to specific version
justdb rollback 002

# Rollback last migration
justdb rollback --last

# Preview rollback
justdb rollback --dry-run 002
```

## Version Management

### Baseline Version

Set baseline version for existing databases:

```bash
# Set baseline (don't execute migration, only record version)
justdb migrate --baseline

# Subsequent migrations based on baseline
justdb migrate
```

### Version Validation

```bash
# Validate database version
justdb validate

# Validate Schema file
justdb validate schema.yaml

# Detailed validation info
justdb validate --verbose
```

## Multi-Environment Migration

### Environment Configuration

```yaml
# config/dev.yaml
database:
  url: jdbc:mysql://dev-db:3306/myapp
  username: dev_user
  password: dev_pass

# config/test.yaml
database:
  url: jdbc:mysql://test-db:3306/myapp
  username: test_user
  password: test_pass

# config/prod.yaml
database:
  url: jdbc:mysql://prod-db:3306/myapp
  username: prod_user
  password: ${DB_PASSWORD}  # Environment variable
```

### Environment Switching

```bash
# Development environment
justdb migrate -c config/dev.yaml

# Test environment
justdb migrate -c config/test.yaml

# Production environment (preview first)
justdb migrate -c config/prod.yaml --dry-run

# Execute after confirmation
justdb migrate -c config/prod.yaml
```

## Migration Best Practices

### 1. Preview Before Execute

```bash
# Always preview first
justdb migrate --dry-run

# Check generated SQL
justdb migrate --dry-run --verbose

# Execute after confirmation
justdb migrate
```

### 2. Small Steps

```yaml
# Good practice: modify only one table at a time
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
# Commit and migrate

# Then add new field
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
      - name: email        # New
        type: VARCHAR(100)  # New
# Commit and migrate again
```

### 3. Use Git Version Control

```bash
# Schema files under version control
git add users.yaml
git commit -m "Add email column to users table"
git push

# Team members pull and migrate
git pull
justdb migrate
```

### 4. Maintain Idempotency

```yaml
# Use idempotent mode
# Ensure repeated execution won't cause errors
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```

```bash
# Enable idempotent mode
justdb migrate --idempotent
```

### 5. Production Environment Caution

```bash
# Production environment checklist
justdb migrate -c config/prod.yaml --dry-run    # 1. Preview
justdb validate -c config/prod.yaml             # 2. Validate
justdb backup -c config/prod.yaml               # 3. Backup
justdb migrate -c config/prod.yaml              # 4. Migrate
justdb verify -c config/prod.yaml               # 5. Verify
```

## Troubleshooting

### Migration Failure

```bash
# Handling migration failure
justdb migrate

# Output:
# [ERROR] Migration failed: Duplicate column name 'email'
# [ERROR] SQL: ALTER TABLE users ADD COLUMN email VARCHAR(100);
# [ERROR] Fix the schema and run: justdb migrate --repair

# Continue after fix
justdb migrate --repair
```

### Manual Repair

```bash
# Skip failed migration
justdb migrate --skip-failed

# Mark migration as successful (use with caution)
justdb migrate --mark-success
```

## Next Steps

<VPCard
  title="Spring Boot Integration"
  desc="Automate migrations in Spring Boot"
  link="/en/getting-started/spring-boot-integration.html"
/>

<VPCard
  title="Common Tasks"
  desc="View common database operation examples"
  link="/en/getting-started/common-tasks.html"
/>

<VPCard
  title="Schema Definition Details"
  desc="Learn Schema definition syntax in depth"
  link="/en/design/schema-system/definition.html"
/>
