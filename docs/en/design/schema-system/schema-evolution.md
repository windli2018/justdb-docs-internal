---
title: Schema Evolution Design
icon: git-branch
order: 4
category: Design
tags:
  - schema
  - evolution
  - migration
---

# Schema Evolution

## Overview

JustDB provides two complementary Schema evolution tracking mechanisms for component reuse and change tracking:

1. **referenceId System**: Implements component reuse and inheritance
2. **formerNames System**: Tracks rename history, supports automatic migration SQL generation

## referenceId System

### Design Goals

- **Component Reuse**: Define once, use multiple times
- **Inheritance Override**: Modify specific attributes based on reference
- **Reduce Duplication**: Avoid duplicate definitions of same columns, indexes, etc.

### Use Cases

1. **Global Column Definitions**: Define common columns (like id, created_at)
2. **Common Indexes**: Define common index patterns
3. **Standard Constraints**: Define common constraint configurations

### Basic Usage

```xml
<!-- Define global column templates -->
<Column id="global_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
<Column id="global_created_at" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
<Column id="global_updated_at" name="updated_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>

<!-- Reference in tables -->
<Table name="users">
    <!-- Direct reference, inherit all attributes -->
    <Column id="col_users_id" referenceId="global_id" name="id"/>
    <Column id="col_users_username" name="username" type="VARCHAR(50)" nullable="false"/>
    <Column id="col_users_email" name="email" type="VARCHAR(100)" nullable="false"/>
    <Column id="col_users_created_at" referenceId="global_created_at" name="created_at"/>
    <Column id="col_users_updated_at" referenceId="global_updated_at" name="updated_at"/>
</Table>

<Table name="orders">
    <!-- Reuse global column definitions -->
    <Column id="col_orders_id" referenceId="global_id" name="id"/>
    <Column id="col_orders_user_id" name="user_id" type="BIGINT" nullable="false"/>
    <!-- ... -->
</Table>
```

### Inheritance and Override

Referenced columns can override specific attributes:

```xml
<!-- Global definition -->
<Column id="global_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>

<!-- Override name when referencing -->
<Table name="users">
    <Column id="col_users_id" referenceId="global_id" name="user_id"/>
</Table>

<!-- Override type when referencing -->
<Table name="config">
    <Column id="col_config_id" referenceId="global_id" name="id" type="VARCHAR(50)"/>
</Table>
```

### Dependency Resolution

JustDB, when loading Schema, will:
1. Resolve `referenceId` references
2. Merge referenced object attributes into current object
3. Apply current object's override attributes
4. Validate circular dependencies

### Circular Dependency Detection

System detects and prevents circular dependencies:

```xml
<!-- Error: circular dependency -->
<Column id="a" referenceId="b"/>
<Column id="b" referenceId="a"/>
```

Throws exception:
```
Circular reference detected: a -> b -> a
```

## formerNames System

### Design Goals

- **Automatic Tracking**: Record object rename history
- **Automatic Migration**: Generate RENAME statements
- **Backward Compatibility**: Maintain historical records

### Basic Usage

```xml
<!-- Track table name changes -->
<Table name="users">
    <formerNames>
        <oldName>user</oldName>
    </formerNames>
</Table>
```

Generated migration SQL:
```sql
ALTER TABLE user RENAME TO users;
```

### Multiple Renames

```xml
<Table name="users">
    <formerNames>
        <oldName>user</oldName>
        <oldName>sys_user</oldName>
    </formerNames>
</Table>
```

Generated migration SQL:
```sql
ALTER TABLE sys_user RENAME TO user;
ALTER TABLE user RENAME TO users;
```

### Column Renaming

```xml
<Table name="users">
    <Column name="email">
        <formerNames>
            <oldName>email_address</oldName>
        </formerNames>
    </Column>
</Table>
```

Generated migration SQL:
```sql
ALTER TABLE users RENAME COLUMN email_address TO email;
```

## Schema Diff Change Types

### ChangeType Enum

```java
public enum ChangeType {
    ADDED,      // New object
    REMOVED,    // Deleted object
    MODIFIED,   // Modified object
    RENAMED     // Renamed object (via formerNames)
}
```

### CanonicalSchemaDiff

Used to represent differences between two Schemas:

```java
public class CanonicalSchemaDiff {
    private Justdb sourceSchema;      // Source Schema
    private Justdb targetSchema;      // Target Schema
    private List<Table> tables;       // Changed tables
    private List<Column> columns;     // Changed columns
    private List<Index> indexes;      // Changed indexes
    private List<Constraint> constraints; // Changed constraints
}
```

## Evolution Scenarios

### Scenario 1: Table Rename

**Initial state**:
```xml
<Table name="user">
    <columns>...</columns>
</Table>
```

**Evolution**:
```xml
<Table name="users">
    <formerNames>
        <oldName>user</oldName>
    </formerNames>
    <columns>...</columns>
</Table>
```

**Generated SQL**:
```sql
ALTER TABLE user RENAME TO users;
```

### Scenario 2: Column Type Modification

**Initial state**:
```xml
<Column name="username" type="VARCHAR(50)"/>
```

**Evolution**:
```xml
<Column name="username" type="VARCHAR(100)"/>
```

**Generated SQL** (MySQL):
```sql
ALTER TABLE users MODIFY COLUMN username VARCHAR(100);
```

### Scenario 3: Add Index

**Initial state**:
```xml
<Table name="users">
    <columns>...</columns>
</Table>
```

**Evolution**:
```xml
<Table name="users">
    <columns>...</columns>
    <indexes>
        <Index name="idx_users_email" unique="true" columns="email"/>
    </indexes>
</Table>
```

**Generated SQL**:
```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

### Scenario 4: Use referenceId for Reuse

**Global definition**:
```xml
<Column id="global_timestamp" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
```

**Multiple tables reference**:
```xml
<Table name="users">
    <Column referenceId="global_timestamp" name="created_at"/>
</Table>

<Table name="orders">
    <Column referenceId="global_timestamp" name="created_at"/>
</Table>

<Table name="products">
    <Column referenceId="global_timestamp" name="created_at"/>
</Table>
```

**Advantages**:
- Unified modification: Only need to modify global definition
- Guaranteed consistency: All references automatically update
- Reduce duplication: Avoid duplicate definitions

## SchemaEvolutionManager

### Responsibilities

`SchemaEvolutionManager` is responsible for Schema evolution execution:

- Parse difference Schema
- Generate change SQL
- Execute changes and record history

### Usage Example

```java
// Load current Schema
Justdb currentSchema = SchemaLoader.loadFromDatabase(connection);

// Load target Schema
Justdb targetSchema = SchemaLoader.loadFromFile("schema.yaml");

// Calculate differences
CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
diff.calculateAll();

// Generate SQL
List<String> sqlStatements = diff.generateSql("mysql");

// Execute changes
SchemaEvolutionManager manager = new SchemaEvolutionManager(connection);
manager.evolve(diff);
```

## Best Practices

### 1. Use referenceId to Reuse Common Definitions

```xml
<!-- Good practice -->
<Column id="global_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
<Column id="global_timestamp" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>

<!-- Avoid: duplicate definitions -->
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
</Table>
```

### 2. Record Rename History

```xml
<!-- Good practice -->
<Table name="users">
    <formerNames>
        <oldName>user</oldName>
    </formerNames>
</Table>

<!-- Avoid: rename without recording history -->
<Table name="users"/>
```

### 3. Version Control

Put Schema files under Git version control:

```bash
git add schema.yaml
git commit -m "Rename user table to users"
```

### 4. Incremental Evolution

Avoid large-scale renames, do it step by step:

```xml
<!-- Step 1: Rename -->
<Table name="users">
    <formerNames>
        <oldName>user</oldName>
    </formerNames>
</Table>

<!-- Step 2: Add new column (next commit) -->
<Table name="users">
    <formerNames>
        <oldName>user</oldName>
    </formerNames>
    <Column name="avatar" type="VARCHAR(500)"/>
</Table>
```

## Related Documents

- [Schema System Overview](./overview.md)
- [Type Hierarchy](./type-hierarchy.md)
- [Alias System](./alias-system.md)
- [Migration System Design](../migration-system/overview.md)
