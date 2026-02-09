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
| **Schema Definition** | YAML/JSON/XML | XML/JSON/YAML/SQL |
| **Change Method** | Modify schema file | Add changeSet |
| **Version Management** | Automatic | Manual ID/Author |
| **Database Independence** | Automatic | Through abstract SQL |

## Code Comparison

<CodeGroup>
<CodeGroupItem title="JustDB">

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

</CodeGroupItem>

<CodeGroupItem title="Liquibase (XML)">

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

</CodeGroupItem>

<CodeGroupItem title="Liquibase (YAML)">

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

</CodeGroupItem>
</CodeGroup>

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
