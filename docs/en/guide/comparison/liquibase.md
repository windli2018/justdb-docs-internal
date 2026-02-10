---
icon: database
title: JustDB vs Liquibase
order: 2
category:
  - Guide
  - Comparison
tag:
  - comparison
  - Liquibase
---

# JustDB vs Liquibase

## Core Differences

| Dimension | JustDB | Liquibase |
|:---|:---|:---|
| **Design Philosophy** | Declarative | Imperative (abstract SQL) |
| **Schema Definition** | XML/YAML/JSON/SQL/TOML | XML/JSON/YAML/SQL |
| **Change Method** | Modify schema file | Add changeSet |
| **Version Management** | Automatic | Manual ID/Author |
| **Database Independence** | Automatic | Through abstract SQL |

## Code Comparison

**JustDB - Declare desired state in your preferred format:**

::: code-tabs
@tab XML
```xml
<!-- schema.xml -->
<Justdb>
    <Table name="users">
        <Column name="id" type="BIGINT" primaryKey="true"/>
        <Column name="username" type="VARCHAR(50)"/>
        <Index name="idx_username" unique="true">
            <IndexColumn name="username"/>
        </Index>
    </Table>
</Justdb>
```

@tab YAML
```yaml
# schema.yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
    Index:
      - name: idx_username
        columns: [username]
        unique: true
```

@tab JSON
```json
{
  "Table": [
    {
      "name": "users",
      "Column": [
        {"name": "id", "type": "BIGINT", "primaryKey": true},
        {"name": "username", "type": "VARCHAR(50)"}
      ],
      "Index": [
        {"name": "idx_username", "columns": ["username"], "unique": true}
      ]
    }
  ]
}
```

@tab SQL
```sql
-- schema.sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50),
    UNIQUE KEY idx_username (username)
);
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

[[Table.Index]]
name = "idx_username"
unique = true

[[Table.Index.IndexColumn]]
name = "username"
```

@tab Properties
```properties
table.users.name=users
table.users.column.id.name=id
table.users.column.id.type=BIGINT
table.users.column.id.primaryKey=true
table.users.column.username.name=username
table.users.column.username.type=VARCHAR(50)
table.users.index.idx_username.unique=true
table.users.index.idx_username.columns=username
```
:::

**Liquibase - Imperative changeSets:**

::: code-tabs
@tab XML
```xml
<databaseChangeLog>
  <changeSet id="1" author="john">
    <createTable tableName="users">
      <column name="id" type="BIGINT">
        <constraints primaryKey="true"/>
      </column>
      <column name="username" type="VARCHAR(50)"/>
    </createTable>
  </changeSet>

  <changeSet id="2" author="john">
    <addUniqueConstraint
      tableName="users"
      columnNames="username"
      constraintName="idx_username"/>
  </changeSet>
</databaseChangeLog>
```

@tab YAML
```yaml
databaseChangeLog:
  - changeSet:
      id: 1
      author: john
      changes:
        - createTable:
            tableName: users
            columns:
              - column:
                  name: id
                  type: BIGINT
                  constraints:
                    primaryKey: true
              - column:
                  name: username
                  type: VARCHAR(50)
  - changeSet:
      id: 2
      author: john
      changes:
        - addUniqueConstraint:
            tableName: users
            columnNames: username
            constraintName: idx_username
```
:::

## Pros and Cons

**JustDB Advantages**:
- ✅ More concise: No changeSet management
- ✅ More intuitive: Table structure at a glance
- ✅ Auto versioning: No manual numbering
- ✅ Multi-format: Native support for 8 formats
- ✅ JDBC Driver: Unique JDBC driver support

**Liquibase Advantages**:
- ✅ More flexible: Mix multiple formats
- ✅ More mature: Complete enterprise features
- ✅ Extensible: Custom change types
- ✅ Powerful: Complex conditional execution

## Use Cases

- **Choose JustDB**: Simplicity first, rapid development, documentation-driven
- **Choose Liquibase**: Complex changes, enterprise requirements, mixed formats

## Migration Path

### Migrate from Liquibase to JustDB

```bash
# Similar process, JustDB can read existing database state
justdb db2schema -u <database-url> -o schema.yaml
```
