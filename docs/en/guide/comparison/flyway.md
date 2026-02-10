---
icon: code-branch
title: JustDB vs Flyway
order: 1
category:
  - Guide
  - Comparison
tag:
  - comparison
  - Flyway
---

# JustDB vs Flyway

## Core Differences

| Dimension | JustDB | Flyway |
|:---|:---|:---|
| **Design Philosophy** | Declarative | Imperative |
| **Schema Definition** | XML/YAML/JSON/SQL/TOML | SQL scripts |
| **Change Method** | Modify schema file | Add new SQL script |
| **Version Management** | Automatic | Manual version numbers |
| **Diff Calculation** | Automatic | Manual writing |

## Code Comparison

**JustDB - Declare desired state in your preferred format:**

::: code-tabs
@tab XML
```xml
<!-- schema.xml - Declare desired state -->
<Justdb>
    <Table name="users">
        <Column name="id" type="BIGINT" primaryKey="true"/>
        <Column name="username" type="VARCHAR(50)"/>
        <Column name="email" type="VARCHAR(100)"/>
    </Table>
</Justdb>

<!-- To modify, just update the file -->
<!-- JustDB automatically calculates the diff -->
```

@tab YAML
```yaml
# schema.yaml - Declare desired state
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

# To modify, just update the file
# JustDB automatically calculates the diff
```

@tab JSON
```json
{
  "Table": [
    {
      "name": "users",
      "Column": [
        {"name": "id", "type": "BIGINT", "primaryKey": true},
        {"name": "username", "type": "VARCHAR(50)"},
        {"name": "email", "type": "VARCHAR(100)"}
      ]
    }
  ]
}

// To modify, just update the file
// JustDB automatically calculates the diff
```

@tab SQL
```sql
-- schema.sql - Declare desired state
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100)
);

-- To modify, just update the file
-- JustDB automatically calculates the diff
```

@tab TOML
```toml
[[Table]]
name = "users"

[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"

[[Table.Column]]
name = "email"
type = "VARCHAR(100)"

# To modify, just update the file
# JustDB automatically calculates the diff
```
:::

**Flyway - Imperative SQL migration scripts:**

::: code-tabs
@tab SQL
```sql
-- V1__create_users_table.sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100)
);

-- V2__add_phone_column.sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- V3__add_avatar_column.sql
ALTER TABLE users ADD COLUMN avatar VARCHAR(500);

-- Each change requires a new script
```
:::

## Pros and Cons

**JustDB Advantages**:
- ✅ Simple: One file describes complete schema
- ✅ Smart: Auto-calculates diffs and changes
- ✅ Documented: Schema as documentation
- ✅ Flexible: Supports multiple formats
- ✅ AI Integration: Natural language operations

**Flyway Advantages**:
- ✅ Mature: Widely used, active community
- ✅ Precise control: Full SQL execution control
- ✅ Enterprise: Team support, audit, etc.
- ✅ Compatible: Supports all SQL databases

## Use Cases

- **Choose JustDB**: Rapid iteration, agile development, documentation-first
- **Choose Flyway**: Complex SQL, fine-grained control, enterprise requirements

## Migration Path

### Migrate from Flyway to JustDB

```bash
# 1. Extract schema from existing database
justdb db2schema \
    -u jdbc:mysql://localhost:3306/myapp \
    -o schema.yaml

# 2. View diff
justdb diff -c database -s schema.yaml

# 3. Start using JustDB
justdb migrate

# 4. (Optional) Remove old Flyway scripts
rm -rf src/main/resources/db/migration
```
