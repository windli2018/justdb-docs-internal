---
title: Column Name Mapping System
icon: code
order: 5
category: Design
tags:
  - schema
  - data
  - mapping
  - row
---

# Column Name Mapping System

## Overview

JustDB's column name mapping system handles different naming conventions automatically when loading data, ensuring field names in Row match Table definitions.

> **Format compatibility is done once during data loading**

**Core Design Approach**:
1. **Convert during data loading**: When loading from JSON/XML/YAML, automatically convert user input field names (userId) to Table-defined field names (user_id)
2. **No special handling internally**: Row field names match Table definitions, DataManager/DataValidator etc. use Table-defined field names directly

**Purpose**:
- Compat with old data in different naming formats (userId, user-id, etc.)
- No impact on internal code logic (Row and Table always use consistent field names)

## Design Goals

1. **Convert during loading**: Data field names converted to Table-defined names when loaded
2. **Internal consistency**: Row field names match Table definitions
3. **Minimal changes**: Internal code (DataManager, DataValidator, etc.) requires no changes

## Supported Naming Formats

| Format | Example | Description |
|--------|---------|-------------|
| snake_case | `user_id`, `created_at` | Common database format |
| camelCase | `userId`, `createdAt` | Common Java/JavaScript format |
| PascalCase | `UserId`, `CreatedAt` | Common C#/.NET format |
| kebab-case | `user-id`, `created-at` | Common CSS/HTML format |

## Implementation Plan

### Files to Create

| File | Path | Description |
|------|------|-------------|
| `ColumnNameResolver.java` | `justdb-core/src/main/java/ai/justdb/justdb/data/ColumnNameResolver.java` | Column name resolver utility class |
| `ColumnNameResolverTest.java` | `justdb-core/src/test/java/ai/justdb/justdb/data/ColumnNameResolverTest.java` | Unit tests |

### Files to Modify

| File | Changes | Priority |
|------|----------|----------|
| **SchemaLoader.java** | Use ColumnNameResolver to convert field names when loading data | P0 |

**Note**: DataManager, DataValidator, etc. internal code **requires no changes** because Row field names match Table definitions.

### Specific Changes

#### 1. Create ColumnNameResolver.java

See Chinese version for complete code.

#### 2. Modify SchemaLoader.java

Use ColumnNameResolver to convert field names when loading from JSON/XML/YAML:

```java
// In SchemaLoader.java add data loading field name conversion

private ColumnNameResolver columnNameResolver = new ColumnNameResolver();

/**
 * Load Data with column name conversion.
 */
private Data loadDataWithColumnNameConversion(Object rawData, Table table) {
    Data data = new Data();

    if (rawData instanceof List) {
        List<Object> rawRows = (List<Object>) rawData;
        for (Object rawRow : rawRows) {
            Row row = new Row();

            if (rawRow instanceof Map) {
                Map<String, Object> rawValues = (Map<String, Object>) rawRow;

                // Use ColumnNameResolver to convert field names
                for (Map.Entry<String, Object> entry : rawValues.entrySet()) {
                    String inputName = entry.getKey();
                    Object value = entry.getValue();

                    // Convert: userId -> user_id
                    String actualName = columnNameResolver.resolveColumnName(table, inputName);

                    row.put(actualName, value);
                }
            }

            data.addRows(row);
        }
    }

    return data;
}
```

**Effect**:
```json
// User data
{"users": [{"userId": 1, "userName": "Alice", "createdAt": "2024-01-01"}]}

// After loading, Row field names match Table definition
Row: {"user_id": 1, "user_name": "Alice", "created_at": "2024-01-01"}
```

### Change Priorities

| Priority | File | Description |
|----------|------|-------------|
| P0 | `ColumnNameResolver.java` | Core class, must create first |
| P0 | `SchemaLoader.java` | Data loading with field name conversion |
| P1 | `ColumnNameResolverTest.java` | Unit tests |

### Architecture After Changes

```
Data loading phase (SchemaLoader):
  User data (userId) → ColumnNameResolver → Row (user_id)
                                    ↓
                                  Table definition (user_id)

Internal use (DataManager, DataValidator):
  Row (user_id) ← Directly use Table definition field names → Table (user_id)

  No special handling needed!
```

### Backward Compatibility

- Row data structure unchanged, still Map<String, Object>
- Internal code requires no changes
- Conversion only at data loading entry point

## Edge Cases

### 1. Field Name Conflicts

When multiple columns map to the same variant name, returns the first matching column (by column definition order).

### 2. formerNames Support

Resolver supports finding historical names via `formerNames`.

### 3. Column Not Found

If field name cannot map to any column, returns the original input.

## Best Practices

### 1. Data Format Compatibility

Automatically handle different naming formats when loading data.

### 2. Internal Use Simplification

Internal code directly uses Table-defined field names, no special handling.

## Related Documents

- [Alias System](./alias-system.md) - Alias system for schema fields
- [Virtual Columns](./virtual-columns.md) - Design and implementation of virtual columns
- [Schema Evolution](./schema-evolution.md) - Schema version management
- [StringCaseUtils](../../util/StringCaseUtils.java) - Naming conversion utilities
