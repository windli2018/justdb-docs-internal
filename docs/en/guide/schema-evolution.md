---
icon: code-branch
date: 2024-01-01
title: Schema Evolution
order: 7
category:
  - Guide
  - schema
tag:
  - schema
  - evolution
  - migration
---

# Schema Evolution

Learn how to manage database schema changes over time, ensuring data safety and system stability.

## Schema Change Types

JustDB automatically detects four schema change types:

### ADDED

```yaml
# Before
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true

# After
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username    # New
        type: VARCHAR(50) # New
```

**Generated SQL**:
```sql
ALTER TABLE users ADD COLUMN username VARCHAR(50);
```

### REMOVED

```yaml
# Before
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
      - name: username    # Will be removed
        type: VARCHAR(50)

# After
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
```

**Generated SQL**:
```sql
ALTER TABLE users DROP COLUMN username;
```

### MODIFIED

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
      - name: username
        type: VARCHAR(100)  # Type modified
        nullable: false     # Constraint modified
```

**Generated SQL**:
```sql
ALTER TABLE users MODIFY COLUMN username VARCHAR(100) NOT NULL;
```

### RENAMED

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

**Generated SQL**:
```sql
ALTER TABLE users RENAME COLUMN username TO user_name;
```

## Rename Detection

### Auto Rename Detection

JustDB intelligently detects rename operations through `formerNames` attribute to avoid data loss.

```yaml
# Scenario 1: Column rename
Column:
  - name: user_name           # New name
    formerNames: [username]   # Old name
    type: VARCHAR(50)

# Scenario 2: Table rename
Table:
  - name: users                   # New name
    formerNames: [user]           # Old name
    Column:
      - name: id
        type: BIGINT
        primaryKey: true

# Scenario 3: Index rename
Index:
  - name: idx_user_new            # New name
    formerNames: [idx_user_old]   # Old name
    columns: [user_id]
```

### Multiple Former Names

An object can track multiple former names:

```yaml
Column:
  - name: full_name
    formerNames: [name, username, user_name]
    type: VARCHAR(100)
```

### Rename vs Delete+Add

**Using formerNames (Recommended)**:
```yaml
# JustDB recognizes as rename
- name: new_name
  formerNames: [old_name]
  type: VARCHAR(50)

# Generates: ALTER TABLE ... RENAME COLUMN old_name TO new_name
# Data preserved ✓
```

**Not using formerNames (Not Recommended)**:
```yaml
# JustDB recognizes as delete + add
- name: old_name  # Delete
  type: VARCHAR(50)

- name: new_name  # Add
  type: VARCHAR(50)

# Generates:
# ALTER TABLE ... DROP COLUMN old_name  # Data lost ✗
# ALTER TABLE ... ADD COLUMN new_name
```

## Compatibility Handling

### Backward Compatible Changes

**Add Field**:
```yaml
# New field defaults to nullable
Column:
  - name: phone
    type: VARCHAR(20)
    # nullable: true (default)
```

**Expand Field Length**:
```yaml
Column:
  - name: username
    type: VARCHAR(100)  # Increase from 50 to 100
```

**Add Index**:
```yaml
Index:
  - name: idx_email
    columns: [email]
```

### Changes Requiring Data Migration

**Shrink Field Length**:
```yaml
# Need to handle over-length data first
Column:
  - name: username
    type: VARCHAR(20)  # Shrink from 50 to 20
```

**Change Field Type**:
```yaml
# Need to consider data conversion
Column:
  - name: status_code
    type: INT          # Change from VARCHAR to INT
```

**Drop Field**:
```yaml
# Need to confirm data has been migrated
Column:
  # old_field is removed
```

### Use before/after Hooks for Data Migration

```yaml
Table:
  - name: users
    beforeAlters:
      - dbms: mysql
        sql: |
          -- Backup data before migration
          CREATE TABLE users_backup AS SELECT * FROM users;
    Column:
      - name: status_code
        type: INT
        formerNames: [status]
    afterAlters:
      - dbms: mysql
        sql: |
          -- Update data after migration
          UPDATE users SET status_code = CASE status
            WHEN 'active' THEN 1
            WHEN 'inactive' THEN 0
            ELSE 0
          END;
```

## Migration Strategies

### Safe Migration Process

```bash
# 1. Preview changes
justdb migrate --dry-run

# 2. View differences
justdb diff

# 3. Validate schema
justdb validate

# 4. Backup database
justdb backup -o backup.sql

# 5. Execute migration
justdb migrate

# 6. Verify results
justdb verify
```

### Production Environment Migration

**Step-by-Step Migration Strategy**:

```yaml
# Step 1: Add new field (nullable)
Column:
  - name: new_field
    type: VARCHAR(100)
    nullable: true

# Step 2: Populate data
# Application layer or script migrates data

# Step 3: Set not null constraint
Column:
  - name: new_field
    type: VARCHAR(100)
    nullable: false

# Step 4: Drop old field
# old_field is removed
```

### Large Table Migration

**Use Batching**:

```sql
-- Batch update large table
UPDATE users SET new_field = 'value' WHERE id BETWEEN 1 AND 10000;
UPDATE users SET new_field = 'value' WHERE id BETWEEN 10001 AND 20000;
-- ...
```

**Use Temporary Table**:

```yaml
Table:
  - name: users_new
    comment: New table structure
    Column: [...]

  - name: users
    beforeAlters:
      - sql: |
          -- Create new table
          CREATE TABLE users_new LIKE users;
          -- Batch copy data
          INSERT INTO users_new SELECT * FROM users;
    afterAlters:
      - sql: |
          -- Rename tables
          RENAME TABLE users TO users_old, users_new TO users;
```

## Rollback Strategy

### Preserve History with formerNames

```yaml
# Preserve complete rename history
Column:
  - name: current_name
    formerNames: [old_name, original_name]
    type: VARCHAR(50)
```

### Manual Rollback

```bash
# Rollback to specific version
justdb rollback 002

# View rollback plan
justdb rollback --dry-run 002

# Rollback last migration
justdb rollback --last
```

### Data Backup Recovery

```bash
# Backup before migration
justdb backup -o backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
mysql -u root -p myapp < backup_20240115_103000.sql
```

## Conflict Resolution

### Concurrent Modification Conflicts

**Scenario**: Two developers modify the same table simultaneously

**Developer A**:
```yaml
Table:
  - name: users
    Column:
      - name: email
        type: VARCHAR(100)
      - name: phone       # A adds
        type: VARCHAR(20)
```

**Developer B**:
```yaml
Table:
  - name: users
    Column:
      - name: email
        type: VARCHAR(100)
      - name: address     # B adds
        type: VARCHAR(200)
```

**After Merge**:
```yaml
Table:
  - name: users
    Column:
      - name: email
        type: VARCHAR(100)
      - name: phone       # A's change
        type: VARCHAR(20)
      - name: address     # B's change
        type: VARCHAR(200)
```

### Schema Inconsistency Detection

```bash
# Detect differences between schema and database
justdb diff

# Detect consistency of multiple schema files
justdb validate --all
```

## Version Control

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/add-phone-field

# 2. Modify schema
vim justdb/users.yaml

# 3. Commit changes
git add justdb/users.yaml
git commit -m "Add phone field to users table"

# 4. Push and create PR
git push origin feature/add-phone-field
```

### Schema Review Checklist

**Check during code review**:
- [ ] Field types are appropriate
- [ ] Necessary constraints are set
- [ ] Indexes are reasonable
- [ ] Comments are complete
- [ ] Used formerNames (when renaming)
- [ ] Considered data migration

## Best Practices

### 1. Use formerNames to Track Renames

```yaml
# Good practice
- name: user_name
  formerNames: [username]
  type: VARCHAR(50)

# Avoid
- name: user_name
  type: VARCHAR(50)  # Not tracking old name
```

### 2. Maintain Backward Compatibility

```yaml
# Good practice: first add nullable field
- name: phone
  type: VARCHAR(20)
  # nullable: true (default)

# Then set not null
- name: phone
  type: VARCHAR(20)
  nullable: false
```

### 3. Small Steps

```yaml
# Good practice: modify one field at a time
commit 1: Add phone field
commit 2: Add index for phone
commit 3: Set phone to not null

# Avoid: multiple changes at once
commit: Add phone, email, address fields and their indexes
```

### 4. Complete Comments

```yaml
# Good practice
Table:
  - name: users
    comment: User table, stores system user information
    Column:
      - name: phone
        type: VARCHAR(20)
        comment: Phone number, 11 digits

# Avoid
Table:
  - name: users
    Column:
      - name: phone
        type: VARCHAR(20)
```

### 5. Test Environment First

```bash
# 1. Development environment test
justdb migrate -c dev-config.yaml

# 2. Test environment validation
justdb migrate -c test-config.yaml

# 3. Staging environment dry-run
justdb migrate -c staging-config.yaml --dry-run

# 4. Production environment execute
justdb migrate -c prod-config.yaml
```

## Next Steps

<VPCard
  title="Migration Strategies"
  desc="Learn detailed migration strategies and best practices"
  link="/en/guide/migration-strategies.html"
/>

<VPCard
  title="Team Collaboration"
  desc="Best practices for using JustDB in teams"
  link="/en/guide/team-collaboration.html"
/>

<VPCard
  title="Configuration Reference"
  desc="Complete configuration options documentation"
  link="/en/guide/config-reference.html"
/>
