---
icon: puzzle-piece
title: Extension Points Implementation
order: 7
category: Design
tags:
  - schema
  - extension
  - implementation
---

# Extension Points Implementation

**Version**: 7.1
**Date**: 2026-02-08
**Author**: Claude Code
**Status**: Implementation in progress - SELECT runtime resolution debugging

---------------------------

## Quick Start

```xml
<!-- Recommended configuration: best of both worlds -->
<Column name="username"
         type="VARCHAR(255)"
         virtual="true"
         preferColumn="true"
         from="users.username"
         on="user_id"/>
```

**Effects**:
- ✅ DDL includes computed column (MySQL)
- ✅ Auto-resolution during pre-populated data
- ✅ Runtime bidirectional query support (physical column ↔ virtual column)

---------------------------

## Table of Contents

1. [Problem Background](#1-problem-background)
2. [Existing Solutions](#2-existing-solutions)
3. [JustDB Approach](#3-justdb-approach)
4. [Core Concepts](#4-core-concepts)
5. [Attribute Naming](#5-attribute-naming)
6. [Virtual Column Definition](#6-virtual-column-definition)
7. [Readable Column Definition](#7-readable-column-definition)
8. [Runtime Support Architecture](#8-runtime-support-architecture)
9. [Implementation Plan](#9-implementation-plan)
10. [Key Files](#10-key-files)
11. [Testing](#11-testing)
12. [Complete Examples](#12-complete-examples)
13. [Implementation Progress](#13-implementation-progress)

---------------------------

## 1. Problem Background

### 1.1 Normalized Database Design

**Current state**: Normalized relational table design following third normal form is standard practice

```sql
-- Standard design following database normalization
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL
);

CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rolename VARCHAR(50) NOT NULL
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

**This is the correct design**:
- ✅ Follows third normal form, avoids data redundancy
- ✅ Easy to maintain data consistency
- ✅ Saves storage space
- ✅ Good join query performance

### 1.2 Two Problem Scenarios

#### Scenario 1: Pre-Populated Data Readability

**Problem**: When pre-populating data to the system, using IDs makes data hard to understand

```xml
<!-- Defined in Schema -->
<Table name="user_roles">
    <Column name="user_id" type="BIGINT"/>
    <Column name="role_id" type="BIGINT"/>
</Table>

<!-- Data pre-population: hard to understand -->
<Data table="user_roles">
    <!-- Developers must manually maintain mapping: alice=1, admin=1, bob=2, viewer=2 -->
    <Row user_id="1" role_id="1"/>  <!-- alice is admin? -->
    <Row user_id="1" role_id="2"/>  <!-- alice is viewer? -->
    <Row user_id="2" role_id="1"/>  <!-- bob is admin? -->
    <Row user_id="2" role_id="2"/>  <!-- bob is viewer? -->
</Data>
```

**Pain points**:
- ❌ Developers must manually maintain ID mappings (alice=1, admin=1)
- ❌ Code review cannot intuitively understand data meaning
- ❌ Data changes require global find-replace of IDs (e.g., alice renamed to alice2)
- ❌ Error-prone: wrong IDs cause incorrect data relationships
- ❌ Difficult collaboration: other developers don't know business meaning of IDs

#### Scenario 2: Runtime Query Readability

**Problem**: Runtime SQL queries cannot directly get readable values

```sql
-- Current: need manual JOIN to get readable values
SELECT u.username, r.rolename
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 1;

-- Expected: directly query virtual columns
SELECT username, rolename FROM user_roles WHERE user_id = 1;
```

### 1.3 Design Intent

**Core goal**: Provide two complementary solutions

| Scenario | Solution | Attribute |
|----------|-----------|----------|
| **Pre-populated data readability** | Readable Column (PreferColumn) | `preferColumn="true"` |
| **Runtime query readability** | Virtual Column runtime support | `virtual="true"` |

**Not changing database design**:
- ✅ Relationship tables still only store IDs (follows normalization)
- ✅ Database structure unchanged
- ✅ SQL query performance controlled

**Only providing better readability at Schema level**:
- ✅ Schema definition serves as documentation
- ✅ Data definition uses business language
- ✅ Auto-resolution during queries
- ✅ Framework-level systematic support

---------------------------

## 2. Existing Solutions

### 2.1 Solution 1: SQL Comments + Documentation

```xml
<Data table="user_roles">
    <!-- alice has admin role -->
    <Row user_id="1" role_id="1"/>
</Data>
```

| Pros | Cons |
|------|------|
| ✅ Simple and direct | ❌ Comments easily outdated |
| ✅ Doesn't change data structure | ❌ Code cannot validate comment correctness |
| ✅ No additional dependencies | ❌ Risk of getting out of sync |

### 2.2 Solution 2: Separate Data Import Scripts

```sql
-- scripts/init_data.sql
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM (SELECT 1 AS id, 'alice' AS username) u
JOIN (SELECT 1 AS id, 'admin' AS rolename) r;
```

| Pros | Cons |
|------|------|
| ✅ SQL flexibility | ❌ Separated from Schema |
| ✅ Can use full SQL capabilities | ❌ Cannot reuse logic |
| ✅ Native database support | ❌ Need to hand-write SQL |

### 2.3 Solution 3: ORM/Application Layer Handling

```java
@Service
public class UserRoleService {
    public void assignRole(String username, String rolename) {
        User user = userRepository.findByUsername(username).get();
        Role role = roleRepository.findByRolename(rolename).get();
        UserRole userRole = new UserRole(user, role);
        userRoleRepository.save(userRole);
    }
}
```

| Pros | Cons |
|------|------|
| ✅ Type safety | ❌ Need to start entire application |
| ✅ Object-oriented | ❌ Cannot solve pre-populated data with pure SQL |
| ✅ Compile-time checking | ❌ Increases application complexity |

### 2.4 Solution 4: Database Views + Stored Procedures

```sql
CREATE VIEW v_user_roles AS
SELECT u.username, r.rolename, ur.user_id, ur.role_id
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id;
```

| Pros | Cons |
|------|------|
| ✅ Solved at database level | ❌ Increases database objects |
| ✅ Good readability | ❌ Complex maintenance |
| ✅ Native support | ❌ Depends on specific database features |

### 2.5 Solution 5: Computed/Generated Columns

```sql
-- MySQL 8.0+ generated column
ALTER TABLE user_roles
ADD COLUMN username VARCHAR(50)
AS (SELECT username FROM users WHERE id = user_id) STORED;
```

| Pros | Cons |
|------|------|
| ✅ Native database support | ❌ Stores redundant data |
| ✅ Auto-sync updates | ❌ Requires database version support |
| ✅ No JOIN needed during query | ❌ Uses extra storage space |

### 2.6 Solution Comparison Summary

| Solution | Readability | Maintainability | Automation | Schema Integration | Extra Complexity |
|----------|------------|---------------|-------------|-----------------|-------------------|
| SQL Comments | ⭐ | ⭐ | ⭐☆ | ⭐⭐⭐ | ⭐ |
| Import Scripts | ⭐⭐ | ⭐⭐ | ⭐⭐☆ | ⭐☆ | ⭐⭐ |
| ORM Handling | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐☆ | ⭐⭐⭐ |
| Views/Triggers | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Computed Columns | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **JustDB (combined)** | **⭐⭐⭐⭐** | **⭐⭐⭐⭐** | **⭐⭐⭐⭐** | **⭐⭐⭐⭐** | **⭐⭐** |

---------------------------

## 3. JustDB Approach

### 3.1 Core Positioning

**JustDB provides two complementary readability solutions**:

| Feature | Use Case | Attribute | Processing Time |
|---------|----------|----------|----------------|
| **Readable Column (PreferColumn)** | Pre-populated data | `preferColumn="true"` | Schema deployment |
| **Virtual Column runtime support** | Runtime SQL queries | `virtual="true"` | SQL query time |

### 3.2 Design Principles

1. **Declarative definition**: Explicitly declare mapping relationships in Schema
2. **Single data source**: Schema serves as documentation, avoid separated maintenance
3. **Framework-level support**: Built-in system, no additional tools needed
4. **Explicit control**: User explicitly enables transformation, not implicit execution
5. **Maintain normalization**: Don't change database design, only optimize readability

### 3.3 Feature Comparison

| Feature | Readable Column (PreferColumn) | Virtual Column Runtime |
|---------|-------------------------------|---------------------|
| **Use case** | Pre-populated data | Runtime SQL queries |
| **Attribute** | `preferColumn="true"` | `virtual="true"` |
| **Processing time** | Schema deployment | SQL execution |
| **SQL support** | INSERT (pre-processing) | SELECT/INSERT/UPDATE/DELETE |
| **Performance impact** | One-time resolution | Resolution on every query |
| **DDL inclusion** | Based on `virtual` attribute | Excluded when `virtual=true` |

### 3.4 Combined Usage (Recommended)

```xml
<!-- Best of both: DDL included + pre-pop resolution + runtime queries -->
<Column name="username"
         type="VARCHAR(255)"
         virtual="true"
         preferColumn="true"
         from="users.username"
         on="user_id"/>
```

---------------------------

## 4. Attribute Naming

### 4.1 Naming Standards

| Attribute | Canonical Name | Supported Aliases | Description |
|-----------|---------------|-----------------|-------------|
| **Readable column marker** | `preferColumn` | `prefercolumn`, `preferedColumn`, `PreferColumn` | Follows camelCase convention |
| **Virtual column marker** | `virtual` | - | Boolean type, already implemented |
| **Referenced table field** | `from` | - | Format: `table.field` |
| **Foreign key column** | `on` | - | Current table's foreign key column name |
| **Environment-specific column** | `noMigrate` | `nomigrate`, `NoMigrate` | Supports camelCase aliases |

### 4.2 Java Code Definition

```java
// Column.java attribute definitions
@JsonProperty("preferColumn")
@JsonAlias({"prefercolumn", "preferedColumn", "PreferColumn"})
@XmlAttribute(name = "preferColumn")
protected Boolean preferColumn;

public boolean isPreferColumn() {
    return preferColumn != null && preferColumn;
}

// Check typo compatibility
// preferedColumn -> preferColumn (auto-correction)
```

### 4.3 XML/JSON Usage Examples

```xml
<!-- Recommended: use canonical name -->
<Column name="username" preferColumn="true" from="users.username" on="user_id"/>

<!-- Compatible: old formats still supported -->
<Column name="username" prefercolumn="true" from="users.username" on="user_id"/>

<!-- Compatible: typo auto-correction -->
<Column name="username" preferedColumn="true" from="users.username" on="user_id"/>
```

---------------------------

## 5. Core Concepts

### 5.1 Attribute Independence

| Attribute | Function | Impact Scope |
|-----------|----------|-------------|
| `type` | Define column type | DDL generation (physical column definition) |
| `virtual` | Mark as virtual column (whether DDL includes it) | DDL generation, runtime queries |
| `preferColumn` | Mark for Data resolution | Data processing |
| `noMigrate` | Mark value as environment-specific | Data processing priority |

### 5.2 Judgment Criteria

**Virtual column judgment** (only standard):
- `virtual="true"` → Virtual column
- Other cases (no virtual attribute, `virtual="false"`, has type, etc.) → Physical column

**Readable column judgment**:
- `preferColumn="true"` → Readable column
- Independent of `virtual` attribute

---------------------------

## 6. Virtual Column Definition

### 6.1 Core Definition

**Virtual Column**: Column marked with `virtual="true"` attribute

**Judgment criteria**:
- `virtual="true"` → Virtual column (**only standard**)
- Other cases (no virtual attribute, `virtual="false"`, has type, etc.) → Physical column

```xml
<!-- Physical column: has type, included in DDL -->
<Column name="user_id" type="BIGINT"/>

<!-- Virtual column: virtual=true, excluded from DDL, runtime resolution -->
<Column name="username" virtual="true" from="users.username" on="user_id"/>
```

### 6.2 Attribute Reference

| Attribute | Description | Required |
|-----------|-------------|----------|
| `virtual="true"` | Mark as virtual column | Yes |
| `from="table.field"` | Reference table and field | Yes |
| `on="fk_column"` | Current table's foreign key column name | Yes |
| `preferColumn="true"` | Also support pre-populated data resolution (optional) | No |

### 6.3 DDL Generation and Computed Column Options

#### Computed Column Generation Strategy

**Command-line configuration options**: Control how virtual columns are generated in DDL

| Option | Description | When DB Supports | When DB Doesn't Support |
|--------|-------------|-------------------|------------------------|
| `auto` (default) | Generate when supported | Generate computed column | Don't generate (runtime resolution) |
| `always` | Always generate | Generate computed column | Generate physical column (app fills data) |
| `never` | Never generate | Don't generate (runtime resolution) | Don't generate (runtime resolution) |

**Configuration methods**:

**Method 1: Command line parameter**
```bash
# migrate command specify computed column strategy
justdb migrate --computed-column auto
justdb migrate --computed-column always
justdb migrate --computed-column never
```

**Method 2: CLI configuration file**
```xml
<!-- justdb-config.xml -->
<Configuration>
    <Migrate computedColumn="auto"/>
</Configuration>
```

**Method 3: Code configuration**
```java
// MigrateCommand.java
public class MigrateCommand extends BaseCommand {
    @Option(name = "--computed-column", description = "Computed column generation strategy")
    private ComputedColumnStrategy computedColumnStrategy = ComputedColumnStrategy.AUTO;

    public int execute() {
        // Read from command line or config file
        ComputedColumnStrategy strategy = computedColumnStrategy
            ?? config.getComputedColumnStrategy()
            ?? ComputedColumnStrategy.AUTO;

        // Pass to DBGenerator
        DBGenerator dbGenerator = new DBGenerator(pluginManager, dialect, strategy);
        // ...
    }
}
```

**Detailed options**:

**Option 1: `auto` (recommended, default)**
```xml
<Migrate computedColumn="auto"/>
```
- MySQL 8.0+/PostgreSQL 12+: Generate `AS (SELECT ...) STORED` computed column
- MySQL 5.7/PostgreSQL 11-: Don't generate, runtime resolution
- SQLite/Oracle: Decide based on version

**Option 2: `always` (force generation)**
```xml
<Migrate computedColumn="always"/>
```
- MySQL 8.0+: Generate `AS (SELECT ...) STORED`
- MySQL 5.7: Generate physical column `VARCHAR(255)`, app maintains data via triggers or other mechanism
- Use case: Confident application can maintain data consistency

**Option 3: `never` (never generate)**
```xml
<Migrate computedColumn="never"/>
```
- All databases: Don't generate, always runtime resolution
- Use case: Fully rely on JustDB JDBC Driver's bidirectional correction capability

#### DDL Generation Examples

```xml
<!-- Schema -->
<Table name="user_roles">
    <Column name="user_id" type="BIGINT"/>
    <Column name="username" virtual="true" type="VARCHAR(255)" from="users.username" on="user_id"/>
</Table>
```

**DDL generation results under different configurations**:

**Scenario A: `computedColumn="auto"` + MySQL 8.0+**
```sql
CREATE TABLE user_roles (
    user_id BIGINT,
    username VARCHAR(255) AS (SELECT username FROM users WHERE users.id = user_id) STORED
);
```

**Scenario B: `computedColumn="auto"` + MySQL 5.7**
```sql
CREATE TABLE user_roles (
    user_id BIGINT
);
-- username not included in DDL, runtime resolution
```

**Scenario C: `computedColumn="always"` + MySQL 8.0+**
```sql
CREATE TABLE user_roles (
    user_id BIGINT,
    username VARCHAR(255) AS (SELECT username FROM users WHERE users.id = user_id) STORED
);
```

**Scenario D: `computedColumn="always"` + MySQL 5.7**
```sql
CREATE TABLE user_roles (
    user_id BIGINT,
    username VARCHAR(255)  -- Physical column, app maintains data
);
```

**Scenario E: `computedColumn="never"` + any database**
```sql
CREATE TABLE user_roles (
    user_id BIGINT
);
-- username always resolved at runtime
```

---------------------------

## 7. Readable Column Definition

### 7.1 PreferColumn (Readable Column)

**Definition**: Used for Schema definition and pre-populated data readability resolution

**Key point**: `preferColumn` **independent of** whether column is virtual

| Attribute | Physical Column | Non-Physical Column |
|-----------|----------------|-------------------|
| Has `type` | ✅ Physical column (DDL included) | ❌ Non-physical column (DDL excluded) |
| `preferColumn="true"` | Used for Data resolution | Used for Data resolution |

### 7.2 Environment-Specific Columns (noMigrate)

**Definition**: Mark column values as environment-instance specific, not supporting cross-environment migration

**Use cases**: Auto-increment IDs, sequence values that may differ across environments (dev/staging/prod)

```xml
<Column name="user_id" type="BIGINT" noMigrate="true"/>
```

**Behavior rules**:

| Scenario | Behavior |
|----------|----------|
| **Only preferColumn provided** | Resolve preferColumn to ID, insert into database |
| **Only noMigrate column value provided** | Use that value directly, no conversion |
| **Both provided** | **Prefer preferColumn**, ignore noMigrate column value |

---------------------------

## 8. Runtime Support Architecture

### 8.1 Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    JustDB JDBC Engine                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              SqlExecutor                            │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │     VirtualColumnResolver (NEW)                 │  │   │
│  │  │  - SELECT: virtual column → runtime resolution  │  │   │
│  │  │  - INSERT: virtual column value → ID resolution │  │   │
│  │  │  - UPDATE: virtual column value → ID lookup + update│  │   │
│  │  │  - DELETE: virtual column value → ID lookup + delete│  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │  ┌────────────────────────────────────────────────┐    │   │
│  │  │    ExpressionEngine (extended)                   │    │   │
│  │  │    - Intercepts virtual columns in evaluateExprForRow│    │   │
│  │  │    - Calls VirtualColumnResolver for resolution     │    │   │
│  │  └────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              JustdbDataSource                          │   │
│  │  - Provides table data access                      │   │
│  │  - Supports virtual column lookup                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 9. Implementation Plan

### Phase 1: Create Virtual Column Resolver

**New file**: `justdb-core/src/main/java/ai.justdb/justdb/jdbc/virtual/VirtualColumnResolver.java`

```java
package ai.justdb.justdb.jdbc.virtual;

import ai.justdb.justdb.jdbc.JustdbDataSource;
import ai.justdb.justdb.schema.Column;
import ai.justdb.justdb.schema.Table;

import java.util.Map;

/**
 * Runtime resolver for virtual columns.
 */
public class VirtualColumnResolver {

    private final JustdbDataSource dataSource;

    public VirtualColumnResolver(JustdbDataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Resolve virtual column value for a given row.
     */
    public Object resolveVirtualColumn(Table table, Column column, Map<String, Object> row) {
        if (!column.isVirtual()) {
            return null;
        }

        Column.VirtualColumnRef ref = column.getVirtualColumnRef();
        if (ref == null) {
            return null;
        }

        // Get foreign key value from row
        String fkColumn = column.getOn();  // e.g., "user_id"
        Object fkValue = row.get(fkColumn);
        if (fkValue == null) {
            return null;
        }

        // Lookup in referenced table
        String refTableName = ref.getTable();  // e.g., "users"
        String refFieldName = ref.getField();  // e.g., "username"

        Table refTable = dataSource.getTable(refTableName);
        if (refTable == null) {
            throw new RuntimeException("Referenced table not found: " + refTableName);
        }

        // Find the row with matching id and return the field value
        return lookupFieldValue(refTable, "id", fkValue, refFieldName);
    }

    /**
     * Reverse lookup: find ID by readable value.
     */
    public Object reverseLookup(Table table, String keyField, Object keyValue, String returnField) {
        // TODO: Implement using JustdbDataSource.select()
        return null;
    }

    private Object lookupFieldValue(Table table, String keyField, Object keyValue, String targetField) {
        // TODO: Implement using JustdbDataSource.select()
        return null;
    }
}
```

### Phase 2: Integrate into SqlExecutor

**Modify file**: `justdb-core/src/main/java/ai.justdb/justdb/jdbc/SqlExecutor.java`

**Key integration point**: `evaluateExprForRow()` method (around line 5253-5600)

```java
// In SqlExecutor class, add
private final VirtualColumnResolver virtualColumnResolver;

// In constructor, initialize
public SqlExecutor(JustdbConnection connection) {
    // ...existing code...
    this.virtualColumnResolver = new VirtualColumnResolver(connection.getDataSource());
}

// Modify evaluateExprForRow method
private Object evaluateExprForRow(SQLExpr expr, Map<String, Object> row) {
    // NEW: Check if virtual column reference
    if (expr instanceof SQLIdentifierExpr) {
        String columnName = ((SQLIdentifierExpr) expr).getName();
        Table currentTable = getCurrentTable();

        if (currentTable != null) {
            Column column = currentTable.getColumn(columnName);
            if (column != null && column.isVirtual()) {
                return virtualColumnResolver.resolveVirtualColumn(currentTable, column, row);
            }
        }
    }

    // Existing: handle other expression types
    // ...existing code...
}
```

### Phase 3: INSERT/UPDATE Pre-processing

Add virtual column pre-processing in `executeUpdate()` method:

```java
public int executeUpdate(String sql) throws SQLException {
    SQLStatement statement = parseStatementWithDialectFallback(sql);

    if (statement instanceof MySqlInsertStatement) {
        return executeInsertWithVirtualColumns((MySqlInsertStatement) statement);
    } else if (statement instanceof MySqlUpdateStatement) {
        return executeUpdateWithVirtualColumns((MySqlUpdateStatement) statement);
    }
    // ...existing code...
}
```

## 10. Key Files

### 10.1 New Files

| File | Description |
|------|-------------|
| `jdbc/virtual/VirtualColumnResolver.java` | Runtime virtual column resolver |
| `jdbc/virtual/VirtualColumnMapping.java` | Virtual column mapping data class |

### 10.2 Modified Files

| File | Location | Description |
|------|-----------|-------------|
| `jdbc/SqlExecutor.java` | `evaluateExprForRow()` (~line 5402) | Add virtual column resolution logic |
| `jdbc/SqlExecutor.java` | `executeUpdate()` | Add INSERT/UPDATE virtual column pre-processing |
| `cli/MigrateCommand.java` | Add `--computed-column` parameter | Command line parameter support |
| `cli/CliConfiguration.java` | Add configuration item | computedColumn configuration |
| `generator/DBGenerator.java` | Constructor add parameter | Accept computed column strategy |
| `generator/TemplateRootContext.java` | Add methods and fields | computedColumnStrategy, dbSupportsComputedColumns |
| `generator/JavaGenerator.java` | Entity class generation method | Filter out virtual columns |
| `schema/Column.java` | - | Already has `virtual`, `from`, `on` attributes, no modification needed |
| `deploy/VirtualColumnResolver.java` | - | Already implemented preferColumn resolution, no modification needed |

### 10.3 Existing Code (No Modification Needed)

**Column.java** - Virtual column attributes already fully implemented:
- `virtual` attribute: line 117
- `from` attribute: line 120
- `on` attribute: line 123
- `isVirtual()` method: lines 395-405
- `getVirtualColumnRef()` method: lines 407-448

**default-plugins.xml** - DDL templates already filter virtual columns:
```xml
<template id="columns" name="columns" type="SQL" category="db">
  <content>{{#each this.columns}}
{{#unless this.virtual}}
  {{> column}}{{> comma-unless @last}}
{{/unless}}{{/each}}</content>
</template>
```

## 11. Testing

### 11.1 Unit Tests

```java
@Test
public void testResolveVirtualColumn() {
    Table userRoles = new Table();
    userRoles.setName("user_roles");
    userRoles.addColumn(new Column("user_id", "BIGINT"));
    userRoles.addColumn(new Column("username", null, true, "users.username", "user_id"));

    JustdbDataSource dataSource = createMockDataSource();

    VirtualColumnResolver resolver = new VirtualColumnResolver(dataSource);
    Map<String, Object> row = Map.of("user_id", 1L);

    Object result = resolver.resolveVirtualColumn(userRoles,
        userRoles.getColumn("username"), row);

    assertEquals("alice", result);
}
```

### 11.2 Integration Tests

**Note**: Integration tests conducted through JustDB JDBC Driver, simulating real JDBC usage scenarios.

## 12. Complete Examples

### 12.1 Scenario 1: Best of Both Worlds (Recommended)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb name="example">

    <!-- Main tables -->
    <Table name="users">
        <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
        <Column name="username" type="VARCHAR(50)" nullable="false"/>
    </Table>

    <Table name="roles">
        <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
        <Column name="rolename" type="VARCHAR(50)" nullable="false"/>
    </Table>

    <!-- Relationship table: only stores IDs -->
    <Table name="user_roles">
        <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
        <Column name="user_id" type="BIGINT" noMigrate="true"/>
        <Column name="role_id" type="BIGINT" noMigrate="true"/>

        <!-- Virtual column + readable column: DDL included, pre-pop resolution supported, runtime query supported -->
        <Column name="username"
                type="VARCHAR(255)"
                virtual="true"
                preferColumn="true"
                from="users.username"
                on="user_id"/>
        <Column name="rolename"
                type="VARCHAR(255)"
                virtual="true"
                preferColumn="true"
                from="roles.rolename"
                on="role_id"/>
    </Table>

    <!-- Pre-populated data: use readable values -->
    <Data table="users">
        <Row username="alice"/>
        <Row username="bob"/>
    </Data>

    <Data table="roles">
        <Row rolename="admin"/>
        <Row rolename="viewer"/>
    </Data>

    <Data table="user_roles">
        <Row username="alice" rolename="admin"/>
        <Row username="bob" rolename="viewer"/>
    </Data>

</Justdb>
```

**Generated DDL** (`computedColumn="auto"` + MySQL 8.0+):
```sql
CREATE TABLE user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    role_id BIGINT,
    username VARCHAR(255) AS (SELECT username FROM users WHERE users.id = user_id) STORED,
    rolename VARCHAR(255) AS (SELECT rolename FROM roles WHERE roles.id = role_id) STORED
);
```

**Usage**:
1. **Pre-populated data**: Auto-resolve `username="alice"` to ID
2. **Runtime queries**: `SELECT username FROM user_roles` auto-returns readable values
3. **Computed column strategy**: Control via command line parameters

## 13. Implementation Progress

### 13.1 Version 7.1 (2026-02-08)

**Status**: SELECT runtime resolution - debugging

#### ✅ Completed

| Feature | Status | Description |
|---------|--------|-------------|
| **preferColumn attribute** | ✅ Complete | `Column.java` added `preferColumn` attribute with `@Getter @Setter` annotations |
| **VirtualColumnResolver class** | ✅ Complete | Created `jdbc/virtual/VirtualColumnResolver.java` |
| **Forward resolution** | ✅ Complete | `resolveVirtualColumn()` - ID → readable value |
| **Reverse lookup** | ✅ Complete | `reverseLookupVirtualColumn()` - readable value → ID |
| **SqlExecutor.applyProjection** | ✅ Fixed | Uses `evaluateExprForRow(expr, row, table)` for all column expressions |
| **IsVirtualColumnHelper** | ✅ Complete | Template helper detects virtual columns |
| **ORM annotation support** | ✅ Complete | JPA/MyBatis/Hibernate templates add virtual column annotations |
| **Integration test framework** | ✅ Complete | `VirtualColumnIntegrationTest.java` created |

#### 📝 New Findings

1. **Table class missing `getColumn(String)` method**
   - Discovery location: SqlExecutor integration
   - Impact: Need to traverse `getColumns()` list to find column
   - Solution: Add helper method `findColumn(Table, String)`

2. **Table context passing approach**
   - Initial plan: Use ThreadLocal (rejected)
   - Final approach: Add overloaded method `evaluateExprForRow(expr, row, table)`
   - Reason: User requires explicit parameter passing, avoid implicit state

3. **Virtual column caching mechanism**
   - Implementation: Cache to row on first resolution in `evaluateExprForRow()`
   - Advantage: Avoid repeated resolution, improve performance

4. **@Getter/@Setter annotation convention**
   - User requirement: Use Lombok annotations, avoid manual getter/setter creation
   - Implementation: Column.java's `virtual`, `from`, `on` fields added `@Getter @Setter`

5. **applyProjection method fix**
   - Problem: Original code directly gets value from row, skipping virtual column resolution
   - Fix: Change to call `evaluateExprForRow(expr, row, table)` for unified processing

#### ⏳ To Implement

| Feature | Priority | Description |
|---------|----------|-------------|
| **SELECT virtual column resolution** | P0 | Currently returns null, needs debugging fix |
| **INSERT support** | P1 | Auto-resolve virtual column value → ID on insert |
| **UPDATE support** | P1 | Bidirectional sync virtual column ↔ physical column on update |
| **DELETE support** | P2 | Virtual column resolution in WHERE clause |
| **Unit tests** | P1 | Complete VirtualColumnResolver test coverage |
| **Integration tests** | P1 | End-to-end SQL query tests |
| **Performance optimization** | P2 | Query result caching mechanism |

## Appendix A: Attribute Combination Matrix

### A.1 Attribute Combination Matrix

| type | virtual | preferColumn | In DDL | Pre-Populated Data | Runtime Query |
|------|---------|-------------|--------|------------------|---------------|
| ✅ | unset/`false` | unset | ✅ | ❌ | ❌ |
| ✅ | unset/`false` | `true` | ✅ | ✅ | ❌ |
| ✅ | `true` | unset | ❌ | ❌ | ✅ |
| ✅ | `true` | `true` | ❌ | ✅ | ✅ |
| ❌ | unset | `true` | ❌ | ✅ | ❌ |
| ❌ | `true` | unset | ❌ | ❌ | ✅ |
| ❌ | `true` | `true` | ❌ | ✅ | ✅ |

### A.2 Recommended Usage

| Scenario | Recommended Configuration |
|----------|----------------------|
| **Only pre-populated data readability** | `preferColumn="true"` (no type) |
| **Only runtime query readability** | `virtual="true"` (no type) |
| **Best of both worlds** | `type="..."` + `virtual="true"` + `preferColumn="true"` |

**Document end**
