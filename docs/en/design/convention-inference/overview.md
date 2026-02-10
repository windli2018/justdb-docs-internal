# Convention Inference Feature Overview

## Introduction

JustDB automatically infers schema configuration based on conventions, reducing repetitive user input. Convention inference is automatically applied during schema loading, following the "configuration over convention" principle - user explicitly set values always take priority.

## Core Principles

### Priority Rules

```
User explicit settings > referenceId inheritance > Convention inference > System defaults
```

1. **User explicit settings** (highest priority): Values explicitly specified by user in schema files
2. **referenceId inheritance**: Values inherited from other items via `referenceId`
3. **Convention inference**: Automatic inference based on naming conventions
4. **System defaults** (lowest priority): Framework default values

### Execution Timing

Convention inference is executed at the following stages of the schema loading process:

```
1. resolveReferences(justdb)    // Resolve referenceId, inherit attributes
2. generateAutoIds(justdb, ...)  // Generate automatic IDs
3. applyConventions(justdb)      // Apply convention inference
```

**Important**: Convention inference must be executed **after** `referenceId` resolution to ensure inherited values are not overridden.

---

## Convention List

### Group A - Type Defaults

| # | Convention | Auto Inference | Example |
|---|------|---------|------|
| A1 | `VARCHAR` | `VARCHAR(256)` | `<Column name="username" type="VARCHAR"/>` → `VARCHAR(256)` |
| A2 | `CHAR` | `CHAR(1)` | `<Column name="flag" type="CHAR"/>` → `CHAR(1)` |
| A3 | `NVARCHAR` | `NVARCHAR(256)` | `<Column name="name" type="NVARCHAR"/>` → `NVARCHAR(256)` |
| A4 | `DECIMAL` | `DECIMAL(10,2)` | `<Column name="price" type="DECIMAL"/>` → `DECIMAL(10,2)` |
| A5 | `NUMERIC` | `NUMERIC(10,2)` | `<Column name="amount" type="NUMERIC"/>` → `NUMERIC(10,2)` |
| A6 | `TIMESTAMP` | Add `DEFAULT CURRENT_TIMESTAMP` | `<Column name="created_at" type="TIMESTAMP"/>` |
| A7 | `DATETIME` | Add `DEFAULT CURRENT_TIMESTAMP` | `<Column name="updated_at" type="DATETIME"/>` |

**Note**: Inference is only applied to types without specified length/precision. If user has specified (e.g., `VARCHAR(100)`), it won't be overridden.

### Group B - Primary Key Naming Conventions

| # | Convention | Auto Inference | Example |
|---|------|---------|------|
| B1 | Column name `id` | `primaryKey=true`, `nullable=false` | `<Column name="id" type="BIGINT"/>` |
| B2 | Column name `[table]_id` | `primaryKey=true`, `nullable=false` | `<Column name="user_id" type="BIGINT"/>` (in `users` table) |

**Note**:
- Column name matching is case-insensitive (`id`, `ID`, `Id` all match)
- If user explicitly sets `primaryKey="false"`, inference is not applied

### Group D - Boolean Naming Conventions

| # | Convention | Auto Inference | Example |
|---|------|---------|------|
| D1 | Column name `is_*` | `BOOLEAN DEFAULT FALSE` | `<Column name="is_active"/>` → `BOOLEAN DEFAULT FALSE` |
| D2 | Column name `has_*` | `BOOLEAN DEFAULT FALSE` | `<Column name="has_permission"/>` |
| D3 | Column name `can_*` | `BOOLEAN DEFAULT FALSE` | `<Column name="can_edit"/>` |

### Group E - Other Naming Conventions

| # | Convention | Auto Inference | Example |
|---|------|---------|------|
| E1 | Column name `*_date` | `DATE` | `<Column name="birth_date"/>` → `DATE` |
| E2 | Column name `*_time` | `TIME` | `<Column name="start_time"/>` → `TIME` |
| E3 | Column name `*_status` | `VARCHAR(50)` | `<Column name="order_status"/>` → `VARCHAR(50)` |
| E4 | Column name `*_count` | `INT DEFAULT 0` | `<Column name="view_count"/>` → `INT DEFAULT 0` |
| E5 | Column name `email` | `VARCHAR(256)` | `<Column name="email"/>` → `VARCHAR(256)` |

---

## Usage Examples

### Basic Example

```xml
<Justdb>
    <Table name="users">
        <!-- B1: id column automatically inferred as primary key -->
        <Column name="id" type="BIGINT"/>

        <!-- A1: VARCHAR automatically completed to VARCHAR(256) -->
        <Column name="username" type="VARCHAR"/>

        <!-- E5: email automatically inferred as VARCHAR(256) -->
        <Column name="email"/>

        <!-- D1: is_active automatically inferred as BOOLEAN DEFAULT FALSE -->
        <Column name="is_active"/>

        <!-- A6: TIMESTAMP automatically adds DEFAULT CURRENT_TIMESTAMP -->
        <Column name="created_at" type="TIMESTAMP"/>
    </Table>
</Justdb>
```

### Disabling Specific Conventions

```xml
<Table name="products">
    <!-- User explicitly sets, disables primary key inference -->
    <Column name="id" type="BIGINT" primaryKey="false"/>

    <!-- User explicitly specifies length, type default not applied -->
    <Column name="name" type="VARCHAR(100)"/>
</Table>
```

### referenceId Inheritance Priority

```xml
<Justdb>
    <!-- Define global id template -->
    <Column id="global_id" name="id" type="BIGINT" primaryKey="true" nullable="false"/>

    <Table name="users">
        <!-- Inherit through referenceId, convention inference not applied -->
        <Column name="id" referenceId="global_id"/>
    </Table>
</Justdb>
```

---

## Implementation Details

### Related Classes

| Class | Path | Description |
|---|------|------|
| `ConventionInferrer` | `org.verydb.justdb.util.ConventionInferrer` | Convention inference processor |
| `ConventionInferenceResult` | `org.verydb.justdb.util.ConventionInferenceResult` | Inference result class |
| `SchemaLoader` | `org.verydb.justdb.util.SchemaLoader` | Schema loader (integrated inference) |

### Log Example

```
DEBUG SchemaLoader - Convention inference applied: 1 primary keys, 1 NOT NULL, 3 types, 1 type defaults, 2 default values
DEBUG ConventionInferrer - Primary key inferred for column: id
DEBUG ConventionInferrer - NOT NULL inferred for column: id
DEBUG ConventionInferrer - Type 'BOOLEAN' inferred for column: is_active
DEBUG ConventionInferrer - Default value 'FALSE' set for column: is_active
DEBUG ConventionInferrer - Type 'VARCHAR(256)' inferred for column: email
DEBUG ConventionInferrer - Type default applied: VARCHAR → VARCHAR(256) for column: username
```

---

## Design Decisions

### Why Not Apply Convention Inference Before Loading?

Convention inference must be executed after `referenceId` resolution for the following reasons:

1. **Maintain inheritance priority**: User configuration explicitly inherited via `referenceId` should take priority over convention inference
2. **Avoid accidental override**: If convention inference is applied first, it might override configuration users want to inherit
3. **Meet expectations**: Users expect "inheritance > convention" priority order

### Why Are Certain Conventions Not Implemented?

The following conventions were discussed and decided **not to implement**:

- **Group C - Timestamp naming conventions** (`created_at`, `updated_at`): Users want explicit control over timestamp behavior
- **Group F - Automatic index conventions**: Indexes are performance-related, should be explicitly decided by users
- **B3 - Foreign key inference**: Foreign key relationships are complex, should be explicitly defined by users

---

## Configuration and Extension

Current implementation does not support configuration to disable specific conventions. If you need to disable a convention, you can achieve it by explicitly setting related attributes.

---

## Reference Documentation

- [Column Schema](../../reference/schema/column.md) - Column definition reference
- [Schema System](../schema-system/overview.md) - Schema system overview
