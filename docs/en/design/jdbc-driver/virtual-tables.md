# Virtual Tables

## Overview

JustDB JDBC driver supports virtual tables for system metadata queries, particularly for `information_schema` compatibility.

## Virtual Table Provider Interface

```java
package ai.justdb.justdb.jdbc;

import ai.justdb.justdb.schema.Justdb;
import java.util.Map;

/**
 * Virtual table provider (functional interface)
 */
@FunctionalInterface
public interface VirtualTableProvider {
    /**
     * Dynamically calculate virtual table definition
     * @param justdb JustDB container
     * @param tableName Table name
     * @param context SQL execution context
     * @return Table definition, null means not supported
     */
    Table get(Justdb justdb, String tableName, Map<String, Object> context);
}
```

## Built-in Virtual Tables

### information_schema.TABLES

Provides metadata about all tables in the Schema.

**Columns**: TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE, ENGINE, ROW_FORMAT, TABLE_ROWS, etc.

### information_schema.COLUMNS

Provides metadata about all columns in the Schema.

**Columns**: TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION, DATA_TYPE, IS_NULLABLE, etc.

## Usage Example

```java
// Create DataSource
JustdbDataSource dataSource = new JustdbDataSource(justdb);

// Enable built-in virtual tables
dataSource.setVirtualTableProvider(BuiltinVirtualTables.createBuiltinProvider());

// Query virtual table
TableData tables = dataSource.getTable("TABLES");
TableData columns = dataSource.getTable("COLUMNS");
```

## Related Documentation

- [MySQL Protocol](./mysql-protocol.md) - MySQL protocol virtual table integration
- [JDBC Driver Implementation](./implementation.md) - JDBC driver details
