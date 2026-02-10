---
title: Reference System Cheatsheet
icon: bolt
---

# Reference System

Reference system allows defining reusable components in Schema, implementing component inheritance and reuse through `referenceId`.

## Quick Examples

### Define Global Columns

```xml
<!-- Define reusable column templates -->
<Column id="global_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
<Column id="global_timestamp" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
<Column id="global_username" name="username" type="VARCHAR(50)" nullable="false"/>

<!-- Reference global columns -->
<Table name="users">
    <Column referenceId="global_id" name="id"/>
    <Column referenceId="global_username" name="username"/>
    <Column referenceId="global_timestamp" name="created_at"/>
</Table>
```

### Define Global Table Fragments

```xml
<!-- Define audit column group -->
<Table id="audit_columns" abstract="true">
    <Column name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
    <Column name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"/>
    <Column name="created_by" type="BIGINT"/>
    <Column name="updated_by" type="BIGINT"/>
</Table>

<!-- Reference audit columns -->
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>
    <!-- Include audit columns -->
    <Column referenceId="audit_columns.created_at"/>
    <Column referenceId="audit_columns.updated_at"/>
</Table>
```

## Common Scenarios

### Scenario 1: Primary Key Reuse

```xml
<!-- Define standard primary keys -->
<Column id="pk_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
<Column id="pk_uuid" name="id" type="CHAR(36)" primaryKey="true"/>

<!-- Use auto-increment ID -->
<Table name="users">
    <Column referenceId="pk_id"/>
    <Column name="username" type="VARCHAR(50)"/>
</Table>

<!-- Use UUID -->
<Table name="products">
    <Column referenceId="pk_uuid"/>
    <Column name="name" type="VARCHAR(100)"/>
</Table>
```

### Scenario 2: Timestamp Columns

```xml
<!-- Define standard timestamps -->
<Column id="ts_created" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
<Column id="ts_updated" name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"/>
<Column id="ts_deleted" name="deleted_at" type="TIMESTAMP"/>

<!-- Apply to all tables -->
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>
    <Column referenceId="ts_created"/>
    <Column referenceId="ts_updated"/>
    <Column referenceId="ts_deleted"/>
</Table>
```

### Scenario 3: Constraint Templates

```xml
<!-- Define standard constraints -->
<Constraint id="fk_user" type="FOREIGN_KEY">
    <referencedTable>users</referencedTable>
    <referencedColumn>id</referencedColumn>
    <onDelete>CASCADE</onDelete>
</Constraint>

<Constraint id="uk_email" type="UNIQUE">
    <column>email</column>
</Constraint>

<!-- Use constraint templates -->
<Table name="orders">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="user_id" type="BIGINT"/>
    <Column name="email" type="VARCHAR(100)"/>

    <Constraint referenceId="fk_user">
        <column>user_id</column>
    </Constraint>
    <Constraint referenceId="uk_email"/>
</Table>
```

### Scenario 4: Index Templates

```xml
<!-- Define standard indexes -->
<Index id="idx_created" name="idx_created_at">
    <column>created_at</column>
</Index>

<Index id="idx_search" name="idx_search">
    <column>name</column>
    <column>status</column>
</Index>

<!-- Use index templates -->
<Table name="products">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="name" type="VARCHAR(100)"/>
    <Column name="status" type="VARCHAR(20)"/>
    <Column name="created_at" type="TIMESTAMP"/>

    <Index referenceId="idx_created"/>
    <Index referenceId="idx_search"/>
</Table>
```

## Reference Syntax

### Basic Reference

```xml
<!-- Reference column -->
<Column referenceId="global_id"/>

<!-- Override name when referencing -->
<Column referenceId="global_id" name="user_id"/>

<!-- Override attributes when referencing -->
<Column referenceId="global_id" name="user_id" autoIncrement="false"/>
```

### Namespace Reference

```xml
<!-- Use dot notation -->
<Column referenceId="common.pk_id"/>
<Column referenceId="common.ts_created"/>

<!-- Or use prefix -->
<Column referenceId="pk_id" xmlns="common"/>
```

## Reference Rules

### 1. Attribute Merge Rules

| Reference Attribute | Local Attribute | Merge Result |
|-------------------|----------------|--------------|
| Not set | Not set | Use reference definition |
| Not set | Set | **Use local attribute** |
| Set | Not set | Use reference attribute |
| Set | Set | **Use local attribute** |

### 2. Column Reference Example

```xml
<!-- Definition -->
<Column id="username" name="username" type="VARCHAR(50)" nullable="false" comment="User login name"/>

<!-- Full reference -->
<Column referenceId="username"/>
<!-- Result: name=username, type=VARCHAR(50), nullable=false, comment="User login name" -->

<!-- Override name -->
<Column referenceId="username" name="login_name"/>
<!-- Result: name=login_name, type=VARCHAR(50), nullable=false, comment="User login name" -->

<!-- Override type -->
<Column referenceId="username" type="VARCHAR(100)"/>
<!-- Result: name=username, type=VARCHAR(100), nullable=false, comment="User login name" -->

<!-- Override multiple attributes -->
<Column referenceId="username" name="email" type="VARCHAR(255)" comment="Email address"/>
<!-- Result: name=email, type=VARCHAR(255), nullable=false, comment="Email address" -->
```

### 3. Constraint Reference Example

```xml
<!-- Definition -->
<Constraint id="fk_user" type="FOREIGN_KEY">
    <referencedTable>users</referencedTable>
    <referencedColumn>id</referencedColumn>
    <onDelete>CASCADE</onDelete>
</Constraint>

<!-- Reference and specify column -->
<Constraint referenceId="fk_user">
    <column>created_by</column>
</Constraint>

<!-- Override reference behavior -->
<Constraint referenceId="fk_user">
    <column>updated_by</column>
    <onDelete>SET NULL</onDelete>
</Constraint>
```

## Scope

### Global Scope

```xml
<Justdb>
    <!-- Global definition, all tables can reference -->
    <Column id="global_pk" name="id" type="BIGINT" primaryKey="true"/>

    <Table name="users">
        <Column referenceId="global_pk"/>
    </Table>

    <Table name="orders">
        <Column referenceId="global_pk"/>
    </Table>
</Justdb>
```

### Local Scope

```xml
<Justdb>
    <Table name="users">
        <!-- Only visible within users table -->
        <Column id="local_col" name="status" type="VARCHAR(20)"/>
        <Column referenceId="local_col" name="user_status"/>
    </Table>
</Justdb>
```

## Circular Reference Detection

JustDB detects circular references and reports errors:

```xml
<!-- ❌ Error: circular reference -->
<Column id="a" referenceId="b"/>
<Column id="b" referenceId="a"/>

<!-- ✅ Correct: no circular reference -->
<Column id="base" name="id" type="BIGINT"/>
<Column id="extended" referenceId="base" name="user_id"/>
```

## Best Practices

### 1. Naming Conventions

```xml
<!-- Use prefixes to distinguish types -->
<Column id="pk_id"/>           <!-- Primary Key -->
<Column id="fk_user"/>         <!-- Foreign Key -->
<Column id="uk_email"/>        <!-- Unique Key -->
<Column id="idx_created"/>     <!-- Index -->
<Column id="chk_status"/>      <!-- Check -->

<!-- Use module prefixes -->
<Column id="auth.username"/>   <!-- Auth module -->
<Column id="common.created_at"/> <!-- Common module -->
```

### 2. Layered Definition

```xml
<!-- Layer 1: Base types -->
<Column id="base.int" type="INT"/>
<Column id="base.varchar50" type="VARCHAR(50)"/>
<Column id="base.timestamp" type="TIMESTAMP"/>

<!-- Layer 2: Business columns -->
<Column id="common.username" referenceId="base.varchar50" nullable="false"/>
<Column id="common.email" referenceId="base.varchar50"/>
<Column id="common.created_at" referenceId="base.timestamp" defaultValue="CURRENT_TIMESTAMP"/>

<!-- Layer 3: Table-specific -->
<Column id="users.username" referenceId="common.username"/>
```

### 3. Abstract Table Templates

```xml
<!-- Define abstract table (doesn't generate DDL) -->
<Table id="audit_table" abstract="true">
    <Column name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
    <Column name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"/>
    <Column name="created_by" type="BIGINT"/>
    <Column name="updated_by" type="BIGINT"/>
</Table>

<!-- Extend abstract table -->
<Table name="users" extends="audit_table">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>
</Table>
```

## Important Notes

### 1. Reference Must Exist

```xml
<!-- ❌ Error: reference doesn't exist -->
<Column referenceId="nonexistent_id"/>

<!-- ✅ Correct: define first, then reference -->
<Column id="my_id" name="id" type="BIGINT"/>
<Column referenceId="my_id"/>
```

### 2. Type Compatibility

```xml
<!-- Definition -->
<Column id="base_col" type="VARCHAR(50)"/>

<!-- ✅ Correct: compatible type modification -->
<Column referenceId="base_col" type="VARCHAR(100)"/>

<!-- ⚠️ Warning: incompatible type modification -->
<Column referenceId="base_col" type="INT"/>
```

### 3. Reference Chain Length

```xml
<!-- Supports multi-level references -->
<Column id="a" name="id" type="BIGINT"/>
<Column id="b" referenceId="a"/>
<Column id="c" referenceId="b"/>
<Column id="d" referenceId="c"/>

<!-- ⚠️ Recommended: no more than 3 levels -->
```

## Advanced Techniques

### Technique 1: Dynamic Reference

```xml
<!-- Use variables -->
<Column id="pk_{table}" name="id" type="BIGINT" primaryKey="true"/>

<!-- Expand when using -->
<Table name="users">
    <Column referenceId="pk_users"/>
</Table>
```

### Technique 2: Conditional Reference

```xml
<!-- Select different reference based on environment -->
<Column referenceId="pk_id" if="env='production'"/>
<Column referenceId="pk_uuid" if="env='development'"/>
```

### Technique 3: Reference Composition

```xml
<!-- Combine multiple references -->
<Column id="full_user">
    <include referenceId="base.username"/>
    <include referenceId="base.email"/>
    <include referenceId="base.created_at"/>
</Column>
```

## Reference Links

- [Schema Definition](../../reference/schema/)
- [Column Reference](../../reference/schema/column.md)
