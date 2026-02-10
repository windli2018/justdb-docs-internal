---
title: Schema Diff Calculation
icon: arrows-clockwise
description: CanonicalSchemaDiff API detailed reference for calculating and generating Schema differences
order: 6
---

# Schema Diff Calculation

CanonicalSchemaDiff provides Schema difference calculation functionality for detecting changes between two Schemas. This document details the usage of Schema difference calculation.

## Table of Contents

- [Diff Calculation Overview](#diff-calculation-overview)
- [Change Types](#change-types)
- [Diff Data Structure](#diff-data-structure)
- [Calculation Methods](#calculation-methods)
- [Diff Generation](#diff-generation)
- [Code Examples](#code-examples)

## Diff Calculation Overview

CanonicalSchemaDiff is JustDB's core difference calculation component, used for:

- Comparing differences between two Schemas
- Detecting changes in tables, columns, indexes, constraints, sequences
- Supporting rename detection (via `formerNames`)
- Generating diff Schema for migration
- Supporting data change detection

**Package Path**: `org.verydb.justdb.schema.CanonicalSchemaDiff`

### Core Features

1. **Comprehensive Change Detection** - Detects ADDED, REMOVED, RENAMED, MODIFIED
2. **Smart Rename Detection** - Automatically identifies renames through `formerNames`
3. **Multi-level Comparison** - Tables, columns, indexes, constraints, sequences, data
4. **Filtering Support** - Filter specific tables via `tableScopes`
5. **SQL Generation** - Convert differences to executable SQL

## Change Types

**ChangeType** enum defines all supported change types.

| Type | Description | Applicable Objects |
|------|-------------|-------------------|
| `ADDED` | New object | Table, Column, Index, Constraint, Sequence |
| `REMOVED` | Deleted object | Table, Column, Index, Constraint, Sequence |
| `RENAMED` | Renamed object | Table, Column, Sequence |
| `MODIFIED` | Modified object | Table, Column, Sequence |
| `SYNCED` | Data sync | Data |

### Change Detection Rules

**Table Level**:
- `ADDED` - Exists in target Schema, not in current Schema
- `REMOVED` - Exists in current Schema, not in target Schema
- `RENAMED` - Matched via `formerNames` to old name
- `MODIFIED` - Same table name, but columns/indexes/constraints changed

**Column Level**:
- `ADDED` - Exists in target table, not in current table
- `REMOVED` - Exists in current table, not in target table
- `RENAMED` - Matched via `formerNames` to old column name
- `MODIFIED` - Same column name, but properties (type, constraints, etc.) different

**Index/Constraint**:
- `ADDED` - Exists in target table, not in current table
- `REMOVED` - Exists in current table, not in target table
- RENAMED and MODIFIED not supported

## Diff Data Structure

### CanonicalSchemaDiff

Main diff calculation class.

**Core Properties**:

```java
public class CanonicalSchemaDiff {
    private final Justdb currentSchema;        // Current Schema
    private final Justdb targetSchema;         // Target Schema
    private final List<TableChange&gt;> tableChanges;      // Table changes
    private final List<ColumnChange&gt;> columnChanges;    // Column changes
    private final List<IndexChange&gt;> indexChanges;      // Index changes
    private final List<ConstraintChange&gt;> constraintChanges; // Constraint changes
    private final List<SequenceChange&gt;> sequenceChanges;  // Sequence changes
    private final List<DataChange&gt;> dataChanges;         // Data changes
    private final List<TableDataFilterChange&gt;> tableDataFilterChanges; // Data filter changes
}
```

### TableChange

Table change information.

```java
public static class TableChange extends Item {
    private String tableName;      // New table name
    private ChangeType changeType; // Change type
    private List&lt;String&gt; formerNames; // Old name list
    private Table currentTable;    // Current table
    private Table targetTable;     // Target table
}
```

### ColumnChange

Column change information.

```java
public static class ColumnChange extends Item {
    private String tableName;      // Owner table name
    private String columnName;     // New column name
    private ChangeType changeType; // Change type
    private List&lt;String&gt; formerNames; // Old name list
    private Column currentColumn;  // Current column
    private Column targetColumn;   // Target column
}
```

### IndexChange

Index change information.

```java
public static class IndexChange extends Item {
    private String tableName;      // Owner table name
    private String indexName;      // Index name
    private ChangeType changeType; // Change type (ADDED/REMOVED)
    private Index currentIndex;    // Current index
    private Index targetIndex;     // Target index
}
```

### ConstraintChange

Constraint change information.

```java
public static class ConstraintChange extends Item {
    private String tableName;      // Owner table name
    private String constraintName; // Constraint name
    private ChangeType changeType; // Change type (ADDED/REMOVED)
    private Constraint currentConstraint; // Current constraint
    private Constraint targetConstraint;  // Target constraint
}
```

### SequenceChange

Sequence change information.

```java
public static class SequenceChange extends Item {
    private String sequenceName;       // Sequence name
    private ChangeType changeType;     // Change type
    private List&lt;String&gt; formerNames;  // Old name list
    private Sequence currentSequence;  // Current sequence
    private Sequence targetSequence;   // Target sequence
}
```

### DataChange

Data change information (for conditional data migration).

```java
public static class DataChange extends Item {
    private String tableName;      // Owner table name
    private String condition;      // Data condition
    private String module;         // Module identifier
    private String description;    // Detailed description
    private ChangeType changeType; // Change type
    private Data currentData;      // Current data
    private Data targetData;       // Target data
}
```

## Calculation Methods

### Constructor

```java
// Create diff calculator
public CanonicalSchemaDiff(Justdb currentSchema, Justdb targetSchema)

// Empty constructor (for manually building diff)
public CanonicalSchemaDiff()
```

### calculateAll()

Calculate all types of differences.

```java
public CanonicalSchemaDiff calculateAll()
```

**Execution Order**:
1. `calculateTables()` - Table differences
2. `calculateColumns()` - Column differences
3. `calculateIndexes()` - Index differences
4. `calculateConstraints()` - Constraint differences
5. `calculateSequences()` - Sequence differences
6. `calculateDataChanges()` - Data differences
7. `calculateTableDataFilterChanges()` - Data filter differences

**Example**:

```java
CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
diff.calculateAll();

// Get changes
List<TableChange&gt;> tableChanges = diff.getTableChanges();
List<ColumnChange&gt;> columnChanges = diff.getColumnChanges();
```

### calculateTables()

Calculate table-level differences.

```java
public CanonicalSchemaDiff calculateTables()
```

**Detection Logic**:
1. Detect RENAMED via `formerNames`
2. Detect ADDED (exists in target, not in current)
3. Detect REMOVED (exists in current, not in target)
4. Process MODIFIED for same-name tables

### calculateColumns()

Calculate column-level differences.

```java
public CanonicalSchemaDiff calculateColumns()
```

**Detection Logic**:
1. Detect RENAMED via `formerNames`
2. Detect ADDED
3. Detect REMOVED
4. Compare properties to detect MODIFIED (type, constraints, default values, etc.)

**Compared Properties**:
- type (including precision and scale)
- nullable
- primaryKey
- defaultValue
- autoIncrement

### calculateIndexes()

Calculate index differences.

```java
public CanonicalSchemaDiff calculateIndexes()
```

**Supported Changes**: ADDED, REMOVED

### calculateConstraints()

Calculate constraint differences.

```java
public CanonicalSchemaDiff calculateConstraints()
```

**Supported Changes**: ADDED, REMOVED

**Special Handling**: Detect primary key changes (via column definitions)

### calculateSequences()

Calculate sequence differences.

```java
public CanonicalSchemaDiff calculateSequences()
```

**Detection Logic**:
1. Detect RENAMED via `formerNames`
2. Detect ADDED
3. Detect REMOVED
4. Compare parameters to detect MODIFIED

**Compared Parameters**:
- startWith
- incrementBy
- minValue
- maxValue
- cycle
- cache

### calculateDataChanges()

Calculate data changes.

```java
public CanonicalSchemaDiff calculateDataChanges()
```

**Purpose**: Detect changes for conditional data migration.

### calculateTableDataFilterChanges()

Calculate table data filter changes.

```java
public CanonicalSchemaDiff calculateTableDataFilterChanges()
```

**Purpose**: Detect changes in `dataExportStrategy` and `dataFilterCondition`.

## Diff Generation

### toDiffSchema()

Convert differences to Schema object.

```java
public Justdb toDiffSchema()
```

**Returns**: Schema containing all changes, each object has `changeType` attribute.

**Example**:

```java
CanonicalSchemaDiff diff = new CanonicalSchemaDiff(current, target);
diff.calculateAll();

Justdb diffSchema = diff.toDiffSchema();

// Use diffSchema for deployment
SchemaDeployer deployer = new SchemaDeployer(connection);
deployer.deployDiff(diffSchema);
```

### generateDataChangeSql()

Generate data change SQL.

```java
public List&lt;String&gt; generateDataChangeSql(String dialect)
```

**Parameters**:
- `dialect` - Database dialect (mysql, postgresql, etc.)

**Strategy**:
- With condition: Precise state sync (DELETE out-of-range rows + UPSERT)
- Without condition: Update matching rows + insert new rows + handle deletions

### generateTableDataFilterChangeSql()

Generate data filter change SQL.

```java
public List&lt;String&gt; generateTableDataFilterChangeSql(String dialect)
```

**Strategy**: Delete undeleted rows, then re-import based on new filter conditions.

## Code Examples

### Basic Diff Calculation

```java
import org.verydb.justdb.schema.*;
import org.verydb.justdb.util.schema.SchemaLoaderFactory;
import org.verydb.justdb.JustdbManager;
import org.verydb.justdb.cli.Loaded;
import java.util.List;

public class BasicDiff {
    public static void main(String[] args) {
        JustdbManager manager = JustdbManager.getInstance();

        // Load current Schema
        Loaded&lt;Justdb&gt; currentResult = SchemaLoaderFactory.load(
            "current-schema.json",
            manager
        );
        Justdb currentSchema = currentResult.getData();

        // Load target Schema
        Loaded&lt;Justdb&gt; targetResult = SchemaLoaderFactory.load(
            "target-schema.json",
            manager
        );
        Justdb targetSchema = targetResult.getData();

        // Calculate differences
        CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
        diff.calculateAll();

        // Output changes
        System.out.println("=== Table Changes ===");
        for (TableChange tc : diff.getTableChanges()) {
            System.out.println(tc.getTableName() + ": " + tc.getChangeType());
        }

        System.out.println("\n=== Column Changes ===");
        for (ColumnChange cc : diff.getColumnChanges()) {
            System.out.println(cc.getTableName() + "." + cc.getColumnName() +
                ": " + cc.getChangeType());
        }
    }
}
```

### Rename Detection

```java
import org.verydb.justdb.schema.*;
import java.util.Arrays;

public class RenameDetection {
    public static void main(String[] args) {
        // Current Schema
        Justdb currentSchema = new Justdb();

        Table userTable = new Table("user");
        userTable.setColumns(Arrays.asList(
            createColumn("id", "BIGINT"),
            createColumn("user_name", "VARCHAR(50)")
        ));
        currentSchema.setTables(Arrays.asList(userTable));

        // Target Schema (with formerNames)
        Justdb targetSchema = new Justdb();

        Table usersTable = new Table("users");
        usersTable.setFormerNames(Arrays.asList("user"));
        usersTable.setColumns(Arrays.asList(
            createColumn("id", "BIGINT"),
            createColumn("username", "VARCHAR(50)")
        ));

        // Set column formerNames
        usersTable.getColumns().get(1).setFormerNames(Arrays.asList("user_name"));

        targetSchema.setTables(Arrays.asList(usersTable));

        // Calculate differences
        CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
        diff.calculateAll();

        // Output results
        for (TableChange tc : diff.getTableChanges()) {
            System.out.println("Table: " + tc.getTableName() +
                " (" + tc.getFormerNames() + ") -> " + tc.getChangeType());
        }

        for (ColumnChange cc : diff.getColumnChanges()) {
            System.out.println("Column: " + cc.getTableName() + "." +
                cc.getColumnName() + " (" + cc.getFormerNames() + ") -> " +
                cc.getChangeType());
        }
    }

    private static Column createColumn(String name, String type) {
        Column column = new Column();
        column.setName(name);
        column.setType(type);
        return column;
    }
}
```

### Generate Migration SQL

```java
import org.verydb.justdb.schema.*;
import org.verydb.justdb.migration.SchemaMigrationService;
import org.verydb.justdb.JustdbManager;
import java.util.List;

public class MigrationSqlGeneration {
    public static void main(String[] args) {
        JustdbManager manager = JustdbManager.getInstance();
        Justdb currentSchema = loadSchema("current-schema.json");
        Justdb targetSchema = loadSchema("target-schema.json");

        // Calculate differences
        CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
        diff.calculateAll();

        // Generate migration SQL
        SchemaMigrationService migrationService =
            new SchemaMigrationService(currentSchema, manager);

        List&lt;String&gt; sqlStatements = migrationService.generateMigrationSql(diff);

        // Output SQL
        System.out.println("-- Migration SQL");
        for (String sql : sqlStatements) {
            System.out.println(sql);
            System.out.println();
        }
    }

    private static Justdb loadSchema(String path) {
        // Implement Schema loading
        return new Justdb();
    }
}
```

### Table Scope Filtering

```java
import org.verydb.justdb.schema.*;
import java.util.List;
import java.util.Map;

public class TableScopeFiltering {
    public static void main(String[] args) {
        Justdb currentSchema = ...;
        Justdb targetSchema = ...;

        // Create table scope filter
        TableScopes scopes = new TableScopes();
        scopes.setIncludes(Arrays.asList("user*", "order*"));
        scopes.setExcludes(Arrays.asList("*_temp", "*_backup"));

        // Filter tables
        Map&lt;String, , Table> currentTables = toTableMap(currentSchema);
        Map&lt;String, , Table> targetTables = toTableMap(targetSchema);

        Map&lt;String, , Table> filteredCurrent =
            CanonicalSchemaDiff.filterByTableScopes(currentTables, scopes);
        Map&lt;String, , Table> filteredTarget =
            CanonicalSchemaDiff.filterByTableScopes(targetTables, scopes);

        // Calculate differences using filtered tables
        Justdb filteredCurrent = new Justdb();
        filteredCurrent.setTables(new ArrayList<>(filteredCurrent.values()));

        Justdb filteredTarget = new Justdb();
        filteredTarget.setTables(new ArrayList<>(filteredTarget.values()));

        CanonicalSchemaDiff diff = new CanonicalSchemaDiff(filteredCurrent, filteredTarget);
        diff.calculateAll();

        System.out.println("Filtered changes: " + diff.getTableChanges().size());
    }
}
```

### Complete Migration Process

```java
import org.verydb.justdb.schema.*;
import org.verydb.justdb.migration.SchemaMigrationService;
import org.verydb.justdb.SchemaDeployer;
import org.verydb.justdb.JustdbManager;
import java.sql.Connection;
import java.sql.DriverManager;

public class FullMigration {
    public static void main(String[] args) throws Exception {
        JustdbManager manager = JustdbManager.getInstance();

        // Load Schemas
        Justdb currentSchema = SchemaLoaderFactory.load(
            "current-schema.json",
            manager
        ).getData();

        Justdb targetSchema = SchemaLoaderFactory.load(
            "target-schema.json",
            manager
        ).getData();

        // 1. Calculate differences
        CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
        diff.calculateAll();

        System.out.println("Found " + diff.getTableChanges().size() + " table changes");
        System.out.println("Found " + diff.getColumnChanges().size() + " column changes");

        // 2. Generate migration SQL
        SchemaMigrationService migrationService =
            new SchemaMigrationService(currentSchema, manager);

        List&lt;String&gt; sqlStatements = migrationService.generateMigrationSql(diff);

        // 3. Execute migration
        Connection connection = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/mydb",
            "root",
            "password"
        );

        try {
            int executedCount = migrationService.executeMigrationSql(
                sqlStatements,
                connection
            );

            System.out.println("Executed " + executedCount + " SQL statements");

            // 4. Verify results
            SchemaDeployer deployer = new SchemaDeployer(connection);
            SchemaDeployer.SchemaVerificationResult result =
                deployer.verifySchema(targetSchema);

            if (result.isSuccess()) {
                System.out.println("Migration completed successfully!");
            } else {
                System.out.println("Migration verification failed:");
                for (String difference : result.getDifferences()) {
                    System.out.println("  - " + difference);
                }
            }
        } finally {
            connection.close();
        }
    }
}
```

## Best Practices

### 1. Use formerNames to Track Renames

```xml
<!-- Target Schema -->
<Table name="users" formerNames="user">
  <Column name="username" formerNames="user_name" type="VARCHAR(50)"/>
</Table>
```

### 2. Verify Diff Before Deployment

```java
diff.calculateAll();

if (diff.getTableChanges().isEmpty() &&
    diff.getColumnChanges().isEmpty()) {
    System.out.println("No changes detected");
    return;
}

// Review changes
for (TableChange tc : diff.getTableChanges()) {
    if (tc.getChangeType() == ChangeType.REMOVED) {
        System.out.println("Warning: Table " + tc.getTableName() + " will be dropped");
    }
}
```

### 3. Use Version Management

```java
Justdb diffSchema = diff.toDiffSchema();

SchemaDeployer deployer = new SchemaDeployer(connection);
deployer.deployDiffIfNotApplied(
    diffSchema,
    "v1.1.0",
    "Add email column to users"
);
```

## Related Documentation

- [Java API Reference](./java-api.md) - Core Java API
- [Schema Loader](./schema-loader.md) - Schema loading details
- [Schema Deployer](./schema-deployer.md) - Schema deployment details
- [JDBC Driver](./jdbc-driver.md) - JDBC driver usage guide
