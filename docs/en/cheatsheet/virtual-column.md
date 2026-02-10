---
title: Virtual Column Cheatsheet
icon: bolt
---

# Virtual Column

Virtual columns provide readability in related tables without storing redundant data.

## Quick Examples

### Basic Virtual Column

```xml
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>
</Table>

<Table name="user_roles">
    <Column name="user_id" type="BIGINT"/>
    <!-- Virtual column: resolved at query time -->
    <Column name="username" virtual="true" from="users.username" on="user_id"/>
</Table>
```

**Effect**: `SELECT username FROM user_roles` automatically returns the username.

### Virtual Column + preferColumn (Recommended)

```xml
<Table name="user_roles">
    <Column name="user_id" type="BIGINT" noMigrate="true"/>
    <!-- Support both pre-populated data and runtime queries -->
    <Column name="username"
            type="VARCHAR(255)"
            virtual="true"
            preferColumn="true"
            from="users.username"
            on="user_id"/>
</Table>

<Data table="user_roles">
    <Row username="alice"/>  <!-- Automatically resolved to user_id -->
</Data>
```

## Common Scenarios

### Scenario 1: Pre-Populated Data Readability

```xml
<Data table="user_roles">
    <!-- Use readable values instead of IDs -->
    <Row username="alice" rolename="admin"/>
    <Row username="bob" rolename="viewer"/>
</Data>
```

### Scenario 2: Runtime Queries

```sql
-- Query virtual column (auto-resolved)
SELECT username, rolename FROM user_roles;
-- Returns: alice, admin

-- Mixed query
SELECT user_id, username FROM user_roles;
-- Returns: 1, alice
```

### Scenario 3: INSERT Auto-Resolution

```sql
-- Insert readable value, auto-convert to ID
INSERT INTO user_roles (username) VALUES ('alice');
-- Converts to: INSERT INTO user_roles (user_id) VALUES (1);
```

### Scenario 4: UPDATE Bidirectional Sync

```sql
-- Update virtual column, sync physical column
UPDATE user_roles SET username='bob' WHERE id=1;
-- Converts to: UPDATE user_roles SET user_id=2 WHERE id=1;
```

## Attribute Reference

| Attribute | Type | Description | Required |
|-----------|------|-------------|----------|
| `virtual` | Boolean | Mark as virtual column | Yes |
| `from` | String | Reference table and field (format: `table.field`) | Yes |
| `on` | String | Foreign key column name in current table | Yes |
| `preferColumn` | Boolean | Support pre-populated data resolution | No |
| `type` | String | Column type (optional) | No |

## Attribute Combinations

| type | virtual | preferColumn | In DDL | Pre-Populated | Runtime Query |
|------|---------|-------------|--------|---------------|---------------|
| ✅ | false | false | ✅ | ❌ | ❌ |
| ✅ | false | true | ✅ | ✅ | ❌ |
| ✅ | true | false | ❌ | ❌ | ✅ |
| ✅ | true | true | ❌ | ✅ | ✅ |
| ❌ | true | false | ❌ | ❌ | ✅ |
| ❌ | true | true | ❌ | ✅ | ✅ |

## Environment-Specific Columns (noMigrate)

Mark column values as environment-specific, not supporting cross-environment migration.

```xml
<Column name="user_id" type="BIGINT" noMigrate="true"/>
<Column name="username" type="VARCHAR(50)" preferColumn="true" from="users.username" on="user_id"/>
```

**Behavior Rules**:

| Scenario | Behavior |
|----------|----------|
| Only preferColumn provided | Resolve to ID, insert into database |
| Only noMigrate column value | Use that value directly |
| Both provided | **Prefer preferColumn** |

## Computed Column Generation Strategy

Control DDL generation through `--computed-column` parameter.

### Strategy Options

| Option | Description | When DB Supports | When DB Doesn't Support |
|--------|-------------|------------------|------------------------|
| `auto` (default) | Generate when supported | Generate computed column | Don't generate (runtime resolution) |
| `always` | Always generate | Generate computed column | Generate physical column |
| `never` | Never generate | Don't generate (runtime resolution) | Don't generate |

### Command Line Usage

```bash
# Recommended: generate computed column when database supports it
justdb migrate --computed-column auto

# Force generation (generates physical column when unsupported)
justdb migrate --computed-column always

# Never generate (fully rely on runtime resolution)
justdb migrate --computed-column never
```

### Configuration File

```xml
<!-- justdb-config.xml -->
<Configuration>
    <Migrate computedColumn="auto"/>
</Configuration>
```

## DDL Generation Examples

### MySQL 8.0+ (computedColumn="auto")

```sql
CREATE TABLE user_roles (
    user_id BIGINT,
    username VARCHAR(255) AS (SELECT username FROM users WHERE users.id = user_id) STORED
);
```

### MySQL 5.7 (computedColumn="auto")

```sql
CREATE TABLE user_roles (
    user_id BIGINT
);
-- username not included, resolved at runtime
```

### Any Database (computedColumn="never")

```sql
CREATE TABLE user_roles (
    user_id BIGINT
);
-- username always resolved at runtime
```

## Important Notes

### 1. Virtual Column Criteria

```xml
<!-- ✅ Virtual column: virtual=true -->
<Column name="username" virtual="true" from="users.username" on="user_id"/>

<!-- ❌ Not virtual: has type, no virtual attribute -->
<Column name="username" type="VARCHAR(50)" from="users.username" on="user_id"/>
```

### 2. Referenced Table Must Exist

```xml
<!-- ❌ Error: users table doesn't exist -->
<Column name="username" virtual="true" from="users.username" on="user_id"/>

<!-- ✅ Correct: define users table first -->
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>
</Table>
```

### 3. Foreign Key Column Must Exist

```xml
<!-- ❌ Error: user_id column doesn't exist -->
<Column name="username" virtual="true" from="users.username" on="user_id"/>

<!-- ✅ Correct: define user_id first -->
<Column name="user_id" type="BIGINT"/>
<Column name="username" virtual="true" from="users.username" on="user_id"/>
```

### 4. preferColumn Priority

```xml
<Data table="user_roles">
    <!-- preferColumn takes priority over noMigrate column value -->
    <Row user_id="999" username="alice"/>
    <!-- Result: user_id=1 (resolved from alice), 999 is ignored -->
</Data>
```

## Advanced Techniques

### Technique 1: Multiple Virtual Columns

```xml
<Table name="user_roles">
    <Column name="user_id" type="BIGINT"/>
    <Column name="role_id" type="BIGINT"/>
    <Column name="username" virtual="true" from="users.username" on="user_id"/>
    <Column name="rolename" virtual="true" from="roles.rolename" on="role_id"/>
</Table>
```

### Technique 2: Cascading References

```xml
<Table name="orders">
    <Column name="user_id" type="BIGINT"/>
    <Column name="username" virtual="true" from="users.username" on="user_id"/>
    <Column name="company_name" virtual="true" from="companies.name" on="user_id"/>
</Table>
```

### Technique 3: Dual Storage

```xml
<Table name="user_roles">
    <!-- Both columns stored -->
    <Column name="user_id" type="BIGINT"/>
    <Column name="username" type="VARCHAR(50)" preferColumn="true" from="users.username" on="user_id"/>
</Table>

<Data table="user_roles">
    <!-- After insert, both columns have values -->
    <Row username="alice"/>
    <!-- Result: user_id=1, username='alice' -->
</Data>
```

## Reference Links

- [Column Reference](../../reference/schema/column.md)
- [Pre-Populated Data](../../reference/data/)
