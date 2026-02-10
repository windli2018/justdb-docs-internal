---
icon: columns
title: Migration System Overview
order: 1
category: Design
tags:
  - migration
  - database
  - schema
---

# Migration System Overview

## Document Overview

This document describes JustDB framework's database migration (DB Migrate) functionality design, including architecture, data condition filtering, multi-Data node support, tableScopes filtering, and other core features.

**Version**: 1.0
**Last Updated**: 2026-02-06
**Maintainer**: Wind Li

## 1. Overview

### 1.1 Functional Goals

JustDB Migrate mode provides dynamic testing capabilities:
- After migrate, users can modify tables and data via SQL
- On re-migration, data restores to migrate state
- Table structure restores to migrate defined state
- Supports data condition filtering to restore scoped data

### 1.2 Core Features

- **Unified migration entry**: Calculate changes via SchemaDiff, generate SQL, execute SQL
- **tableScopes filtering**: Filter tables by pattern
- **Data condition filtering**: Specify data range via `Data.condition`
- **Multiple Data nodes**: Same table can have multiple Data nodes, each with different conditions
- **Logical delete priority**: Supports logical delete, rows with deleted=true are logically or physically deleted

### 1.3 Design Constraints

- System preset data managed via `Data` nodes
- User data managed via SQL or application layer, not affected by migrate
- All data migration logic centralized in `CanonicalSchemaDiff`

## 2. Core Architecture

### 2.1 Unified Migration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      SchemaDiff                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                   │
│  │   Tables    │    │    Data     │    │  Columns    │                   │
│  │ (tableScopes)│    │ (condition) │    │ (types...)  │                   │
│  └─────────────┘    └─────────────┘    └─────────────┘                   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    calculateAll()                          │  │
│  │  - calculateTables()   [apply tableScopes]                    │  │
│  │  - calculateColumns()                                       │  │
│  │  - calculateDataChanges() [handle condition]                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐      │
│  │              generateDataChangeSql()                     │      │
│  │  - has condition: DELETE + INSERT                          │      │
│  │  - no condition: INSERT new data + handle deleted          │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │                    generateSql(dialect)                   │      │
│  │  Generate all SQL (DDL + DML)                             │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │                    executeSql()                        │      │
│  │  Execute all SQL statements in order                    │      │
│  └─────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Core Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CanonicalSchemaDiff                     │
├─────────────────────────────────────────────────────────────┤
│ + currentSchema: Justdb                                     │
│ + targetSchema: Justdb                                     │
│ + dataChanges: List<DataChange&gt;>                            │
│                                                          │
│ + calculateAll(): CanonicalSchemaDiff                       │
│ + calculateTables(): CanonicalSchemaDiff                       │
│ + calculateColumns(): CanonicalSchemaDiff                      │
│ + calculateDataChanges(): CanonicalSchemaDiff                 │
│                                                          │
│ + generateSql(dialect): List&lt;String&gt;                         │
│ + generateDataChangeSql(dialect): List&lt;String&gt;               │
│                                                          │
│ + detectConditionOverlaps(table, dataNodes): OverlapResult  │
│ + findMatchingDataNode(currentDataNodes, target): Data       │
│ + groupDataByTable(schema): Map&lt;String, , List<Data&gt;>>          │
│ + filterByTableScopes(tables, scopes): Map&lt;String, , Table>   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                        DataChange                           │
├─────────────────────────────────────────────────────────────┤
│ + tableName: String                                        │
│ + condition: String                                        │
│ + module: String                                           │
│ + description: String                                      │
│ + changeType: ChangeType  (ADDED/MODIFIED/REMOVED/SYNCED)      │
│ + currentData: Data                                         │
│ + targetData: Data                                         │
└─────────────────────────────────────────────────────────────┘
```

## 3. Data Node Design

### 3.1 Data Node Structure

```java
public class Data extends SchemaSense {
    @XmlAttribute
    protected String table;           // Target table name

    @XmlAttribute
    protected String condition;      // Data condition (SQL WHERE syntax)

    @XmlAttribute
    protected String module;         // Module identifier

    @XmlAttribute
    protected String description;    // Detailed description

    @JsonProperty("Row")
    @XmlElement(name = "Row")
    List<Row&gt;> rows = new ArrayList<>();
}
```

### 3.2 Data Nodes With Condition

**Purpose**: Manage active system preset data

**migrate behavior**:
- DELETE rows matching condition but not matching primary key
- INSERT rows from schema (rows matching condition)

**Example**:

```xml
<Data table="users"
      condition="is_system=1 and deleted=0"
      module="system-users"
      description="System administrator users">
  <Row id="1" name="admin" is_system="1" deleted="0"/>
  <Row id="2" name="system" is_system="1" deleted="0"/>
</Data>
```

### 3.3 Data Nodes Without Condition

**Purpose**: Manage default data (new data import) and cleanup of deleted data

**migrate behavior**:
- **Update existing data**: UPDATE rows matching primary key, non-matching rows remain unchanged
- **Import new data**: INSERT rows not in database (`deleted=false` or no `deleted` attribute)
- **Handle deleted marker**: Rows with `deleted=true` execute logical or physical delete

**Difference from Data nodes with condition**:

| Feature | With Condition | Without Condition |
|----------|----------------|-------------------|
| Existing data | DELETE rows in scope not matching PK, update matching id | Update data matching id (non-matching preserved) |
| New data | INSERT (deleted=false) | INSERT (deleted=false) |
| deleted=true | Logical delete or physical delete | Logical delete or physical delete |
| Use case | Precise state sync | Add default data + cleanup specific data |

**Example**:

```xml
<Data table="users"
      module="default-users"
      description="Default user data (new data import)">
  <!-- New data: insert if not exists -->
  <Row id="1" name="admin" deleted="false"/>
  <Row id="2" name="guest" deleted="false"/>
  <!-- Deleted data: will be logically or physically deleted -->
  <Row id="999" name="old_admin" deleted="true"/>
  <Row id="998" name="legacy_system" deleted="true"/>
</Data>
```

**Generated SQL**:

```sql
-- UPDATE rows matching primary key (update all fields)
INSERT INTO `users` (`id`, `name`, `deleted`) VALUES (1, 'admin', 0)
ON DUPLICATE KEY UPDATE `name`='admin', `deleted`=0;

INSERT INTO `users` (`id`, `name`, `deleted`) VALUES (2, 'guest', 0)
ON DUPLICATE KEY UPDATE `name`='guest', `deleted`=0;

-- Logical delete (table has deleted field)
UPDATE `users` SET `deleted`=1 WHERE `id`=999;
UPDATE `users` SET `deleted`=1 WHERE `id`=998;

-- Or physical delete (table has no deleted field)
DELETE FROM `users` WHERE `id`=999;
DELETE FROM `users` WHERE `id`=998;
```

## 4. tableScopes Filtering

### 4.1 tableScopes Structure

```java
@Data
@EqualsAndHashCode(callSuper = true)
public class TableScopes extends ItemScopes {
    @JsonProperty("includes")
    @JsonAlias({"includeTables", "tableIncludes",
               "includeTablePatterns", "table-include-patterns"})
    @Override
    public List&lt;String&gt; getIncludes();

    @JsonProperty("excludes")
    @JsonAlias({"excludeTables", "tableExcludes",
               "excludeTablePatterns", "table-exclude-patterns"})
    @Override
    public List&lt;String&gt; getExcludes();
}
```

### 4.2 Filtering Logic

```
┌─────────────────────────────────────────────────────────────────┐
│              filterByTableScopes(tables, scopes)               │
│                                                                 │
│  if (scopes == null ||                                      │
│      (scopes.getIncludes().isEmpty() &&                          │
│       scopes.getExcludes().isEmpty())) {                        │
│      return tables;  // No filtering                           │
│  }                                                            │
│                                                                 │
│  return tables.entrySet().stream()                             │
│      .filter(entry -> isTableInScope(entry.getKey(), scopes))    │
│      .collect(Collectors.toMap(                                │
│          Map.Entry::getKey, Map.Entry::getValue));             │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Pattern Matching Rules

- `*` matches any character sequence
- `?` matches single character
- Pattern converted to regex: `*.replace(".", "\\.").replace("*", ".*")`

**Examples**:

| Pattern | Matches | Doesn't Match |
|---------|---------|---------------|
| `users*` | users, users_active, users_temp | orders, sys_users |
| `*_temp` | users_temp, orders_temp | users, temp_table |
| `*.config` | app.config, system.config | .config, config |

## 5. Multiple Data Node Scenarios

### 5.1 Scenario 1: Same Table, Different Data Types

```xml
<Data table="dict"
      condition="type='status' and deleted=0"
      module="dict-status"
      description="Status dictionary data">
  <Row code="active" label="Active" type="status"/>
  <Row code="inactive" label="Inactive" type="status"/>
</Data>

<Data table="dict"
      condition="type='region' and deleted=0"
      module="dict-region"
      description="Region dictionary data">
  <Row code="east" label="East" type="region"/>
  <Row code="west" label="West" type="region"/>
</Data>
```

**migrate behavior**:
- Each node processed independently
- SQL modifies `type='status'` data, re-migration only restores this portion
- `type='region'` data unaffected

### 5.2 Scenario 2: Same Table, Different Environments

```xml
<Data table="config"
      condition="env='dev' and deleted=0"
      module="dev-config"
      description="Development environment config">
  <Row key="debug_mode" value="true" env="dev"/>
</Data>

<Data table="config"
      condition="env='prod' and deleted=0"
      module="prod-config"
      description="Production environment config">
  <Row key="debug_mode" value="false" env="prod"/>
</Data>
```

## 6. Command Line Interface

### 6.1 MigrateCommand New Parameters

| Parameter | Short | Description |
|-----------|-------|-------------|
| `--migrate-data-filter` | `-mdf` | Data filter condition (WHERE clause) |
| `--migrate-include-tables` | `-mit` | Include table patterns (comma-separated) |
| `--migrate-exclude-tables` | `-met` | Exclude table patterns (comma-separated) |
| `--migrate-validate-data-conditions` | `-mvdc` | Validate Data node conditions |

## 7. Configuration Support

### 7.1 Configuration File Example

```yaml
# justdbcfg.yaml

# Table filtering
tableScopes:
  includes:
    - users*
    - orders*
  excludes:
    - *_temp
    - *_bak

# Data filtering (optional)
dataFilter: "deleted=0 and is_system=1"

# Validation switch
validateDataConditions: true
```

## 8. Design Principles

### 8.1 Core Principles

#### Principle 1: Unified Migration Entry
**System has only one data migration entry point: SchemaDiff**

```java
// Single entry point
CanonicalSchemaDiff diff = new CanonicalSchemaDiff(current, target);
diff.calculateAll();        // Calculate all changes
List&lt;String&gt; sql = diff.generateSql();  // Generate SQL
executeSql(sql);               // Execute SQL
```

#### Principle 2: Condition-Driven Data Restoration

- **With condition**: DELETE rows in scope not matching PK, update matching id + INSERT schema rows with deleted=false (precise state sync)
- **Without condition**: UPDATE data matching id + INSERT new data + handle `deleted=true` rows (add default data + cleanup specific data)

#### Principle 3: System Data vs User Data Separation

- **System data**: Use `Data` nodes + `condition` markers
- **User data**: Managed via SQL or application layer

#### Principle 4: Logical Delete Priority

- Prefer logical delete (`SET deleted=1`)
- Use physical delete only when table has no `deleted` field

### 8.2 Data Node Design Principles

#### Principle 1: Condition Mutual Exclusivity

**Recommended**: Multiple Data nodes' conditions should be mutually exclusive

```xml
<!-- Good design -->
<Data table="users" condition="user_type='admin' and deleted=0">
  <Row id="1" user_type="admin"/>
</Data>
<Data table="users" condition="user_type='guest' and deleted=0">
  <Row id="2" user_type="guest"/>
</Data>

<!-- Avoid: overlapping conditions -->
<Data table="users" condition="deleted=0">
  <Row id="1" deleted="0"/>
</Data>
<Data table="users" condition="is_active=1">
  <Row id="1" is_active="1"/>  <!-- Overlap -->
</Data>
```

#### Principle 2: Condition Completeness

**Recommended**: Multiple Data nodes' conditions should cover all system data

#### Principle 3: Clear Markers

- Use `module` to identify modules (e.g., `system-users`)
- Use `description` to add detailed explanations
- Support both fields simultaneously

#### Principle 4: Modular Management

**Don't put all data in one Data node**

Split by functional module, data type, environment, etc.

## 9. Complete Example

### 9.1 Schema Example

```xml
<Justdb>
  <!-- tableScopes: define table-level filtering -->
  <tableScopes>
    <includes>
      <include>users*</include>
      <include>dict*</include>
      <include>config*</include>
    </includes>
    <excludes>
      <exclude>*_temp</exclude>
      <exclude>*_bak</exclude>
    </excludes>
  </tableScopes>

  <!-- Table definitions -->
  <tables>
    <Table name="users">
      <columns>
        <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
        <Column name="name" type="VARCHAR(100)" nullable="false"/>
        <Column name="is_system" type="BOOLEAN" defaultValue="false"/>
        <Column name="deleted" type="BOOLEAN" defaultValue="false"/>
        <Column name="env" type="VARCHAR(20)"/>
      </columns>
    </Table>

    <Table name="dict">
      <columns>
        <Column name="code" type="VARCHAR(50)" primaryKey="true"/>
        <Column name="label" type="VARCHAR(100)"/>
        <Column name="type" type="VARCHAR(50)"/>
        <Column name="deleted" type="BOOLEAN" defaultValue="false"/>
      </columns>
    </Table>

    <Table name="config">
      <columns>
        <Column name="key" type="VARCHAR(100)" primaryKey="true"/>
        <Column name="value" type="TEXT"/>
        <Column name="env" type="VARCHAR(20)"/>
        <Column name="deleted" type="BOOLEAN" defaultValue="false"/>
      </columns>
    </Table>
  </tables>

  <!-- Data definitions -->
  <Datas>
    <!-- users table: system admins (with condition) -->
    <Data table="users"
          condition="is_system=1 and deleted=0"
          module="system-users"
          description="System administrator users with system-level permissions">
      <Row id="1" name="admin" is_system="true" deleted="false"/>
      <Row id="2" name="system" is_system="true" deleted="false"/>
    </Data>

    <!-- users table: default users (no condition, new data import + handle deleted) -->
    <Data table="users"
          module="default-users"
          description="Default user data including initial users and old users to cleanup">
      <Row id="1" name="admin" deleted="false"/>
      <Row id="2" name="guest" deleted="false"/>
      <Row id="999" name="old_admin" deleted="true"/>
    </Data>

    <!-- dict table: categorized by type (multiple Data nodes) -->
    <Data table="dict"
          condition="type='status' and deleted=0"
          module="dict-status"
          description="Status dictionary data">
      <Row code="active" label="Active" type="status"/>
      <Row code="inactive" label="Inactive" type="status"/>
    </Data>

    <Data table="dict"
          condition="type='region' and deleted=0"
          module="dict-region"
          description="Region dictionary data">
      <Row code="east" label="East" type="region"/>
      <Row code="west" label="West" type="region"/>
    </Data>

    <!-- config table: categorized by environment (multiple Data nodes) -->
    <Data table="config"
          condition="env='dev' and deleted=0"
          module="dev-config"
          description="Development environment config">
      <Row key="debug_mode" value="true" env="dev"/>
    </Data>

    <Data table="config"
          condition="env='prod' and deleted=0"
          module="prod-config"
          description="Production environment config">
      <Row key="debug_mode" value="false" env="prod"/>
    </Data>
  </Datas>
</Justdb>
```

### 9.2 Migration Example

**Scenario**: User modified data via SQL after migrate, then re-migrate

**Initial state** (after migrate):
- users table has system users (id=1, 2)
- dict table has status and region data

**SQL modifications**:
```sql
-- Modified system user
UPDATE users SET name='SuperAdmin' WHERE id=1;

-- Added new region (user data, not in any Data node)
INSERT INTO dict (code, label, type, deleted)
VALUES ('south', 'South', 'region', 0);

-- Added new user (user data)
INSERT INTO users (id, name, is_system, deleted)
VALUES (100, 'Regular User', false, false);
```

**Re-migrate**:
```bash
justdb migrate up --migrate-include-tables="users*,dict*,config*"
```

**Result**:
1. `id=1` name restored to 'admin' (within condition scope)
2. `id=100` user preserved as 'Regular User' (not in any condition scope)
3. `south` region preserved (not in any Data node, or user added)
4. `type='status'` and `type='region'` dictionary data kept consistent

## Related Documents

- [Schema Structure Design](../../reference/schema/README.md)
- [Template System Design](../template-system/README.md)
