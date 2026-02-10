---
icon: route
date: 2024-01-01
title: Migration Strategies
order: 8
category:
  - Guide
  - Migration
tag:
  - migration
  - strategies
  - best practices
---

# Migration Strategies

Learn how to safely and efficiently execute database migrations, ensuring data safety and system stability.

## Basic Migration

### First Migration

First migration is used to create a brand new database structure.

```bash
# Create schema file
cat > schema.yaml << EOF
namespace: com.example
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
EOF

# Execute first migration
justdb migrate schema.yaml

# Output:
# [INFO] Current database state: empty
# [INFO] Target schema: 1 table(s)
# [INFO] Changes to apply:
# [INFO]   + Create table: users
# [INFO] Executing migration...
# [INFO] Migration completed successfully
```

### Incremental Migration

Incremental migration is used to apply changes on existing database.

```yaml
# Modify schema, add new field
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
        nullable: false
      - name: email
        type: VARCHAR(100)
      - name: phone        # New field
        type: VARCHAR(20)  # New field
```

```bash
# Execute incremental migration
justdb migrate

# Output:
# [INFO] Current database state: 1 table(s)
# [INFO] Target schema: 1 table(s)
# [INFO] Changes to apply:
# [INFO]   ~ Modify table: users
# [INFO]     + Add column: phone
# [INFO] Executing migration...
# [INFO] Migration completed successfully
```

## Zero-Downtime Migration

### Online Add Column

Use `nullable` and default values when adding columns to avoid table locking.

```yaml
Table:
  - name: users
    Column:
      - name: phone
        type: VARCHAR(20)
        nullable: true        # Allow NULL, avoid full table update
        defaultValue: NULL
```

**Migration Steps**:

```bash
# 1. Add column (nullable)
justdb migrate

# 2. Application layer populates data
# Gradually fill phone field through background tasks

# 3. Set not null constraint
# Modify schema, set nullable: false
justdb migrate
```

### Online Modify Column Type

Use temporary column for type conversion.

```yaml
Table:
  - name: users
    Column:
      - name: status_code      # New field
        type: INT
        nullable: true
      - name: status           # Old field
        type: VARCHAR(20)
    beforeAlters:
      - sql: |
          -- 1. Copy data to new field
          UPDATE users
          SET status_code = CASE status
            WHEN 'active' THEN 1
            WHEN 'inactive' THEN 0
            ELSE -1
          END;
    afterAlters:
      - sql: |
          -- 2. Drop old field
          ALTER TABLE users DROP COLUMN status;
          -- 3. Rename new field
          ALTER TABLE users CHANGE COLUMN status_code status VARCHAR(20);
```

### Online Create Index

Use `ALGORITHM=INPLACE` to avoid table locking.

```yaml
Table:
  - name: users
    Index:
      - name: idx_email
        columns: [email]
        unique: true
        algorithm: INPLACE    # MySQL online index creation
```

**For large tables, create index in batches**:

```sql
-- Use pt-online-schema-change (Percona Toolkit)
pt-online-schema-change \
  --alter "ADD INDEX idx_email(email)" \
  --charset=utf8mb4 \
  --critical-load="Threads_running=50" \
  --execute \
  D=myapp,t=users
```

## Data Migration

### Data Type Conversion

```yaml
Table:
  - name: users
    Column:
      - name: status_code
        type: INT
        formerNames: [status]
    beforeAlters:
      - sql: |
          -- Convert data
          UPDATE users
          SET status = CASE status
            WHEN 'active' THEN 1
            WHEN 'inactive' THEN 0
            ELSE -1
          END
          WHERE status NOT IN ('1', '0', '-1');
```

### Data Migration Script

Use `afterCreates` hook to import initial data.

```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
    afterCreates:
      - sql: |
          -- Insert default admin
          INSERT INTO users (id, username) VALUES (1, 'admin');
```

### Large Data Migration

Use batch processing to avoid long table locks.

```yaml
Table:
  - name: orders
    Column:
      - name: status
        type: VARCHAR(20)
        formerNames: [order_status]
    beforeAlters:
      - sql: |
          -- Batch update, 10000 records at a time
          UPDATE orders SET status = order_status WHERE id BETWEEN 1 AND 10000;
          UPDATE orders SET status = order_status WHERE id BETWEEN 10001 AND 20000;
          -- ... continue batching
```

## Multi-Environment Migration

### Environment Isolation

```yaml
# config/dev.yaml
database:
  url: jdbc:mysql://dev-db:3306/myapp_dev
  username: dev_user
  password: dev_pass

# config/test.yaml
database:
  url: jdbc:mysql://test-db:3306/myapp_test
  username: test_user
  password: test_pass

# config/prod.yaml
database:
  url: jdbc:mysql://prod-db:3306/myapp
  username: prod_user
  password: ${DB_PASSWORD}  # Environment variable
```

### Migration Flow

```bash
# 1. Development environment
justdb migrate -c config/dev.yaml

# 2. Test environment
justdb migrate -c config/test.yaml

# 3. Staging environment (dry-run)
justdb migrate -c config/staging.yaml --dry-run

# 4. Production environment
justdb migrate -c config/prod.yaml
```

### Data Synchronization

```bash
# Extract schema from production
justdb db2schema \
  -u jdbc:mysql://prod-db:3306/myapp \
  -o prod-schema.yaml

# Compare differences
justdb diff -s prod-schema.yaml

# Apply to development environment
justdb migrate -c config/dev.yaml
```

## Rollback Strategy

### Auto Rollback

```bash
# Auto rollback on migration failure
justdb migrate --auto-rollback

# Manual rollback
justdb rollback 002
```

### Manual Rollback

```yaml
Table:
  - name: users
    Column:
      - name: username
        type: VARCHAR(50)
        formerNames: [name]  # Preserve historical name
```

```bash
# Rollback using formerNames
# Change name back to username
justdb migrate

# JustDB recognizes as rename:
# ALTER TABLE users RENAME COLUMN username TO name;
```

### Data Backup Recovery

```bash
# Backup before migration
justdb backup -o backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
mysql -u root -p myapp < backup_20240115_103000.sql
```

## Best Practices

### 1. Pre-Migration Checklist

```bash
# Pre-migration checks
justdb validate              # 1. Validate schema
justdb diff                  # 2. View differences
justdb migrate --dry-run     # 3. Dry-run
justdb backup                # 4. Backup data
justdb migrate               # 5. Execute migration
justdb verify                # 6. Verify results
```

### 2. Idempotency

Ensure migrations can be repeated.

```yaml
Table:
  - name: users
    beforeCreates:
      - sql: |
          -- Use IF NOT EXISTS
          CREATE TABLE IF NOT EXISTS users_backup LIKE users;
```

```bash
# Use idempotent mode
justdb migrate --idempotent
```

### 3. Safe Drop

Avoid accidental data deletion.

```yaml
# Use safe-drop mode
# Drop operations rename instead of directly dropping
```

```bash
justdb migrate --safe-drop

# users -> users_deleted_20240115103000
```

### 4. Step-by-Step Migration

Break large migrations into small steps.

```yaml
# Step 1: Add field
Column:
  - name: new_field
    type: VARCHAR(100)
    nullable: true

# Step 2: Populate data
# Application layer handles

# Step 3: Set not null
Column:
  - name: new_field
    type: VARCHAR(100)
    nullable: false

# Step 4: Drop old field
# old_field is removed
```

### 5. Monitoring and Logging

```bash
# Verbose logging
justdb migrate --verbose

# Save logs
justdb migrate 2>&1 | tee migration.log
```

## Common Scenarios

### Add Column

```yaml
Column:
  - name: phone
    type: VARCHAR(20)
    nullable: true        # First allow NULL
```

### Modify Column Type

```yaml
Column:
  - name: status_code
    type: INT
    formerNames: [status]  # Preserve old name
```

### Drop Column

```yaml
# First confirm data has been migrated
# Then remove column from schema
Column:
  # old_field is removed
```

### Rename Table

```yaml
Table:
  - name: users_new
    formerNames: [users]
    Column: [...]
```

### Add Index

```yaml
Index:
  - name: idx_email
    columns: [email]
    unique: true
    algorithm: INPLACE    # Online index creation
```

## Next Steps

<VPCard
  title="Team Collaboration"
  desc="Best practices for using JustDB in teams"
  link="/en/guide/team-collaboration.html"
/>

<VPCard
  title="Performance"
  desc="Suggestions for optimizing migration performance"
  link="/en/guide/performance.html"
/>

<VPCard
  title="CI/CD Integration"
  desc="Integrate JustDB into CI/CD workflow"
  link="/en/guide/cicd.html"
/>
