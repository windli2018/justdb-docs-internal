---
icon: gear
title: Basic Operations
order: 4
category:
  - Guide
  - Getting Started
tag:
  - operations
  - cli
  - migration
---

# Basic Operations

This guide covers the most common operations you'll perform with JustDB, including schema management, data operations, migration commands, and CLI usage.

## Schema Operations

### Creating a Schema

Create a new schema definition file:

```yaml
# users.yaml
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
        comment: User ID
      - name: username
        type: VARCHAR(50)
        nullable: false
        comment: Username
      - name: email
        type: VARCHAR(100)
        comment: Email address
```

Deploy the schema:

```bash
# Deploy using CLI
justdb migrate users.yaml

# Or use auto-discovery (place in justdb/ directory)
mkdir -p justdb
mv users.yaml justdb/
justdb migrate
```

### Modifying a Schema

JustDB automatically detects changes and generates appropriate migration scripts.

#### Adding Columns

```yaml
# Add new columns to the schema
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
      - name: email
        type: VARCHAR(100)
      - name: phone              # New column
        type: VARCHAR(20)        # New column
      - name: created_at         # New column
        type: TIMESTAMP          # New column
```

```bash
justdb migrate

# Output:
# [INFO] Calculating schema diff...
# [INFO] Adding column: users.phone
# [INFO] Adding column: users.created_at
# [INFO] JustDB migration completed successfully
```

#### Renaming Columns

Use `formerNames` to track rename history:

```yaml
Table:
  - name: users
    Column:
      - name: user_name           # New name
        formerNames: [username]   # Old name
        type: VARCHAR(50)
        nullable: false
```

JustDB automatically generates:
```sql
ALTER TABLE users CHANGE COLUMN username user_name VARCHAR(50) NOT NULL;
```

#### Modifying Column Types

```yaml
Column:
  - name: username
    type: VARCHAR(100)  # Changed from VARCHAR(50)
```

### Deleting Schema Objects

Simply remove the definition from your schema file:

```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
      # - name: phone      # Removed
      #   type: VARCHAR(20) # Removed
```

::: warning Safe Drop
For production environments, use the `--safe-drop` option to rename objects instead of deleting them:

```bash
justdb migrate --safe-drop
```

This renames tables/columns with a `_deleted_<timestamp>` suffix instead of dropping them.
:::

### Schema Validation

Validate your schema before deployment:

```bash
# Validate schema file
justdb validate users.yaml

# Validate database consistency
justdb validate

# Detailed validation output
justdb validate --verbose
```

## Data Operations

### Querying Data

While JustDB is primarily a schema management tool, you can use the standard JDBC API for data operations:

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.sql.ResultSet;

public class DataOperations {
    public static void main(String[] args) throws Exception {
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/myapp", "root", "password")) {

            // Query data
            String sql = "SELECT * FROM users";
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(sql)) {

                while (rs.next()) {
                    System.out.println("User: " + rs.getString("username"));
                }
            }
        }
    }
}
```

### Inserting Data

```java
// Insert using standard JDBC
String sql = "INSERT INTO users (username, email) VALUES (?, ?)";
try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    pstmt.setString(1, "john_doe");
    pstmt.setString(2, "john@example.com");
    pstmt.executeUpdate();
}
```

### Updating Data

```java
// Update using standard JDBC
String sql = "UPDATE users SET email = ? WHERE username = ?";
try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    pstmt.setString(1, "newemail@example.com");
    pstmt.setString(2, "john_doe");
    pstmt.executeUpdate();
}
```

::: tip Data Migration
For complex data migrations during schema changes, use lifecycle hooks:
```yaml
Table:
  - name: users
    afterAlters:
      - script: "UPDATE users SET email = LOWER(email)"
```
:::

## Migration Commands

### Executing Migrations

#### Basic Migration

```bash
# Execute migration
justdb migrate

# Specify schema file
justdb migrate schema.yaml

# Use configuration file
justdb migrate -c config.yaml
```

#### Preview Changes

```bash
# Preview without executing
justdb migrate --dry-run

# Preview with detailed SQL
justdb migrate --dry-run --verbose

# Save preview to file
justdb migrate --dry-run > migration.sql
```

#### Migration Options

| Option | Description |
|:---|:---|
| `--dry-run` | Preview changes without executing |
| `--verbose` | Show detailed output |
| `--force` | Force execution without confirmation |
| `--safe-drop` | Use safe drop mode (rename instead of drop) |
| `--idempotent` | Generate idempotent SQL (IF NOT EXISTS) |
| `-c, --config` | Specify configuration file |
| `-d, --dialect` | Specify database dialect |

### Viewing Migration Status

```bash
# View migration history
justdb history

# View recent N migrations
justdb history -n 10

# View specific migration details
justdb history <migration-id>
```

Output example:
```
Migration History:
===================

ID      | Timestamp           | Description         | Status
--------|---------------------|---------------------|--------
001     | 2024-01-15 10:30:00 | Initial schema      | SUCCESS
002     | 2024-01-16 14:20:00 | Add email column    | SUCCESS
003     | 2024-01-17 09:15:00 | Rename username     | SUCCESS
```

### Rolling Back Migrations

```bash
# Rollback to specific version
justdb rollback 002

# Rollback last migration
justdb rollback --last

# Preview rollback
justdb rollback --dry-run 002
```

## CLI Common Commands

### diff - View Schema Differences

Compare current database state with schema definition:

```bash
# View differences
justdb diff

# Specify schema file
justdb diff -s schema.yaml

# Output format
justdb diff -f json
justdb diff -f yaml

# Save to file
justdb diff > diff.txt
```

Output example:
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

### deploy - Deploy Schema

Deploy schema changes to database:

```bash
# Basic deployment
justdb deploy

# Deploy specific schema
justdb deploy users.yaml

# Preview deployment
justdb deploy --dry-run

# Deploy with confirmation
justdb deploy --confirm
```

### db2schema - Extract Schema from Database

Reverse engineer existing database:

```bash
# Extract as YAML
justdb db2schema -u jdbc:mysql://localhost:3306/myapp -o schema.yaml

# Extract as JSON
justdb db2schema -u jdbc:mysql://localhost:3306/myapp -f json -o schema.json

# Extract specific tables
justdb db2schema -u jdbc:mysql://localhost:3306/myapp -t users,orders -o schema.yaml

# Extract with filtering
justdb db2schema -u jdbc:mysql://localhost:3306/myapp --exclude-tables=temp_* -o schema.yaml
```

### format - Format Schema Files

Format and validate schema files:

```bash
# Format YAML file
justdb format users.yaml

# Format all files in directory
justdb format justdb/*.yaml

# Check format without modifying
justdb format --check users.yaml

# Auto-fix formatting issues
justdb format --fix users.yaml
```

### validate - Validate Schema

Validate schema files and database consistency:

```bash
# Validate schema file
justdb validate users.yaml

# Validate database state
justdb validate

# Validate with detailed output
justdb validate --verbose

# Validate multiple files
justdb validate justdb/*.yaml
```

### Additional Commands

#### Convert Format

```bash
# YAML to JSON
justdb convert -f yaml -t json schema.yaml > schema.json

# JSON to XML
justdb convert -f json -t xml schema.json > schema.xml

# XML to YAML
justdb convert -f xml -t yaml schema.xml > schema.yaml
```

#### Generate Documentation

```bash
# Generate Markdown documentation
justdb doc -f markdown -o DATABASE.md

# Generate HTML documentation
justdb doc -f html -o DATABASE.html

# Generate ER Diagram
justdb erd -o erd.png

# Generate SVG format
justdb erd -f svg -o erd.svg
```

## Configuration Files

### Configuration Structure

Create a configuration file for database connection:

```yaml
# config.yaml
database:
  url: jdbc:mysql://localhost:3306/myapp
  username: root
  password: password
  dialect: mysql

justdb:
  locations:
    - justdb
  dry-run: false
  safe-drop: false
  idempotent: true

logging:
  level: INFO
```

### Environment-Specific Configuration

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

Use environment-specific configuration:

```bash
# Development
justdb migrate -c config/dev.yaml

# Testing
justdb migrate -c config/test.yaml

# Production (with preview)
justdb migrate -c config/prod.yaml --dry-run
```

## Best Practices

### 1. Always Preview First

```bash
# Preview before executing
justdb migrate --dry-run

# Check generated SQL
justdb migrate --dry-run --verbose

# Confirm and execute
justdb migrate
```

### 2. Use Version Control

```bash
# Track schema changes in Git
git add users.yaml
git commit -m "Add email column to users table"
git push

# Team members pull and migrate
git pull
justdb migrate
```

### 3. Small, Incremental Changes

```yaml
# Good: One change at a time
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
# Commit and migrate

# Then add next change
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
      - name: email  # New addition
        type: VARCHAR(100)
# Commit and migrate again
```

### 4. Use Safe Drop in Production

```bash
# Production deployment
justdb migrate -c config/prod.yaml --dry-run  # Preview
justdb validate -c config/prod.yaml           # Validate
justdb migrate -c config/prod.yaml --safe-drop  # Deploy with safety
```

### 5. Automate with CI/CD

```yaml
# .github/workflows/migrate.yml
name: Database Migration

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup JustDB
        run: |
          wget https://github.com/verydb/justdb/releases/latest/download/justdb.tar.gz
          tar -xzf justdb.tar.gz

      - name: Migrate database
        run: |
          justdb migrate --dry-run
          justdb migrate
        env:
          DB_URL: ${{ secrets.DB_URL }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
```

## Next Steps

### Further Reading

<VPCard
  title="Migration Basics"
  desc="Learn more about schema migration mechanisms"
  link="/en/getting-started/migration-basics.html"
/>

<VPCard
  title="Common Tasks"
  desc="View more database operation examples"
  link="/en/getting-started/common-tasks.html"
/>

<VPCard
  title="CLI Reference"
  desc="Complete CLI command reference"
  link="/en/reference/cli/commands.html"
/>

<VPCard
  title="Java API"
  desc="Learn JustDB Java API in depth"
  link="/en/reference/api/java-api.html"
/>

### Advanced Topics

<VPCard
  title="AI Integration"
  desc="Use AI to generate and optimize schemas"
  link="/en/reference/ai/ai-schema-generation.html"
/>

<VPCard
  title="Lifecycle Hooks"
  desc="Execute custom SQL during migrations"
  link="/en/reference/schema/lifecycle-hooks.html"
/>

<VPCard
  title="Plugin Development"
  desc="Extend JustDB with custom plugins"
  link="/en/development/plugin-development/README.html"
/>
