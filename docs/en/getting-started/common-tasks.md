---
date: 2024-01-01
icon: checklist
title: Common Tasks
order: 7
category:
  - Quick Start
  - Tasks
tag:
  - tasks
  - examples
  - practices
---

# Common Tasks

This document collects common JustDB usage scenarios and solutions.

## Create Table

### Basic Table

```yaml
Table:
  - name: users
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
```

### Table with Comments

```yaml
Table:
  - name: orders
    comment: Order table, stores all order information
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        comment: Order ID
      - name: order_no
        type: VARCHAR(50)
        comment: Order number
```

### Multi-Table Creation

```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)

  - name: orders
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: user_id
        type: BIGINT
```

## Add Column

### Single Column Addition

```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
      - name: email         # New
        type: VARCHAR(100)  # New
```

### Multi-Column Addition

```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
      - name: email         # New
        type: VARCHAR(100)  # New
      - name: phone         # New
        type: VARCHAR(20)   # New
      - name: address       # New
        type: TEXT          # New
```

### Add Column with Constraints

```yaml
Column:
  - name: email
    type: VARCHAR(100)
    unique: true           # Unique constraint
    nullable: false        # Not null constraint
    comment: Email address
```

## Modify Column

### Change Column Type

```yaml
Column:
  - name: username
    type: VARCHAR(100)     # From VARCHAR(50) to VARCHAR(100)
```

### Rename Column

```yaml
Column:
  - name: user_name        # New name
    formerNames: [username]  # Old name
    type: VARCHAR(50)
```

### Add Constraint

```yaml
Column:
  - name: email
    type: VARCHAR(100)
    unique: true           # Add unique constraint
    nullable: false        # Add not null constraint
```

### Change Default Value

```yaml
Column:
  - name: status
    type: VARCHAR(20)
    defaultValue: active   # Add default value
```

## Drop Column

### Drop Single Column

```yaml
# Remove column definition from Schema file
# JustDB will auto-detect and drop
Column:
  - name: id
    type: BIGINT
    primaryKey: true
  # - name: phone        # Drop this column
  #   type: VARCHAR(20)
```

### Safe Drop

```bash
# Use safe drop mode (rename instead of directly dropping)
justdb migrate --safe-drop
```

## Create Index

### Regular Index

```yaml
Index:
  - name: idx_username
    columns: [username]
    comment: Index on username
```

### Unique Index

```yaml
Index:
  - name: idx_email
    columns: [email]
    unique: true
    comment: Unique index on email
```

### Composite Index

```yaml
Index:
  - name: idx_user_status
    columns: [user_id, status]
    comment: Composite index on user status
```

### Fulltext Index

```yaml
Index:
  - name: idx_content_fulltext
    columns: [content]
    type: FULLTEXT
    comment: Fulltext index on content
```

## Drop Index

```yaml
# Remove index definition from Schema file
# JustDB will auto-detect and drop
Index:
  # - name: idx_old       # Drop this index
  #   columns: [field]
```

## Foreign Key Relationships

### Create Foreign Key

```yaml
Table:
  - name: orders
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: user_id
        type: BIGINT
        nullable: false
    Constraint:
      - name: fk_orders_user
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        foreignKey: user_id
        onDelete: CASCADE
```

### Cascade Operations

```yaml
Constraint:
  - type: FOREIGN_KEY
    referencedTable: users
    referencedColumn: id
    foreignKey: user_id
    onDelete: CASCADE      # Cascade delete
    onUpdate: RESTRICT     # Restrict update
```

## Rename Table

### Basic Rename

```yaml
Table:
  - name: users           # New name
    formerNames: [user]   # Old name
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```

### Batch Rename

```yaml
Table:
  - name: user_profiles          # New name
    formerNames: [profiles]      # Old name
    Column: []

  - name: order_items            # New name
    formerNames: [items]         # Old name
    Column: []
```

## Data Export

### Export as SQL

```bash
justdb migrate --dry-run > migration.sql
```

### Export Schema

```bash
# Export as YAML
justdb db2schema -u jdbc:mysql://localhost:3306/myapp -o schema.yaml

# Export as JSON
justdb db2schema -u jdbc:mysql://localhost:3306/myapp -f json -o schema.json
```

### Generate Documentation

```bash
# Generate Markdown documentation
justdb doc -f markdown -o DATABASE.md

# Generate HTML documentation
justdb doc -f html -o DATABASE.html
```

## Format Conversion

### YAML to JSON

```bash
justdb convert -f yaml -t json schema.yaml > schema.json
```

### JSON to XML

```bash
justdb convert -f json -t xml schema.json > schema.xml
```

### XML to YAML

```bash
justdb convert -f xml -t yaml schema.xml > schema.yaml
```

## Validation and Checking

### Validate Schema

```bash
# Validate Schema file
justdb validate schema.yaml

# Validate database consistency
justdb validate
```

### View Diff

```bash
# View diff between current database and Schema
justdb diff

# Save diff to file
justdb diff > diff.txt
```

### Generate ER Diagram

```bash
# Generate ER diagram (requires graphviz)
justdb erd -o erd.png

# Generate SVG format
justdb erd -f svg -o erd.svg
```

## AI Assistant

### Create Table

```bash
justdb ai "Create a product table with product ID, name, price, stock and category"
```

### Optimization Suggestions

```bash
justdb ai "Analyze current Schema and provide optimization suggestions"
```

### Generate Documentation

```bash
justdb ai "Generate detailed documentation for current Schema"
```

## Batch Operations

### Batch Migration

```bash
# Migrate multiple Schema files
justdb migrate justdb/*.yaml
```

### Batch Validation

```bash
# Validate multiple Schema files
justdb validate justdb/*.yaml
```

### Batch Conversion

```bash
# Batch convert formats
for file in justdb/*.yaml; do
    justdb convert -f yaml -t json "$file" > "output/$(basename $file .yaml).json"
done
```

## Environment Management

### Development Environment

```bash
justdb migrate -c config/dev.yaml
```

### Test Environment

```bash
justdb migrate -c config/test.yaml
```

### Production Environment

```bash
# Preview first
justdb migrate -c config/prod.yaml --dry-run

# Execute after confirmation
justdb migrate -c config/prod.yaml
```

## Failure Recovery

### Rollback Migration

```bash
# Rollback to specific version
justdb rollback 002

# Rollback last migration
justdb rollback --last
```

### Fix Failed Migration

```bash
# Fix and continue
justdb migrate --repair
```

### Reset Database

```bash
# Dangerous operation! Use with caution
justdb migrate --reset
```

## Script Automation

### Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Starting database migration..."

# Preview changes
justdb migrate --dry-run

# Confirm
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Execute migration
    justdb migrate
    echo "Migration completed successfully!"
else
    echo "Migration cancelled."
    exit 1
fi
```

### CI/CD Script

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

## Performance Optimization

### Batch Migration

```yaml
justdb:
  batch-size: 100
```

### Connection Pool Configuration

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 10
      connection-timeout: 30000
```

### Parallel Execution

```bash
# Execute multiple Schema migrations in parallel
justdb migrate --parallel
```

## Next Steps

<VPCard
  title="CLI Reference"
  desc="Complete command-line tool reference"
  link="/en/reference/cli/commands.html"
/>

<VPCard
  title="Java API"
  desc="Learn JustDB Java API in depth"
  link="/en/reference/api/java-api.html"
/>

<VPCard
  title="Design Documentation"
  desc="Learn more about design details"
  link="/en/guide/design-philosophy.html"
/>
