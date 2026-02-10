# JustDB Schema Extractor Architecture

## Overview

JustDB Schema Extractor is a modular, extensible database schema reverse engineering framework.

### Design Principles

1. **JDBC Universal First** - Main features implemented with standard JDBC metadata API
2. **SQL Template Extension** - Database-specific features优先使用 SQL templates
3. **Small Interface Composition** - Features split into multiple small interfaces, independently optional
4. **Conflict-Free Design** - Interfaces don't depend on each other, can be implemented separately
5. **Minimal Code Principle** - Only write Java code when SQL cannot handle it

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CompositeSchemaExtractor                │
│                     (Composite Extractor)                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────────┐
        │         CapabilityRegistry              │
        │         (Capability Registry)                      │
        │  - TableExtractor                      │
        │  - ColumnExtractor                     │
        │  - PrimaryKeyExtractor                 │
        │  - IndexExtractor                      │
        │  - ForeignKeyExtractor                 │
        │  - ViewExtractor                       │
        │  - VersionExtractor                    │
        │  - SequenceExtractor                   │
        └──────────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
    ┌───────────┐  ┌───────────┐  ┌───────────┐
    │   JDBC    │  │  SQL 模板  │  │ 自定义    │
    │   实现    │  │  提取器    │  │  实现    │
    └───────────┘  └───────────┘  └───────────┘
         Universal          Specific optimization         Full control
```

## Core Interfaces

### 1. TableExtractor - Table Extractor

```java
public interface TableExtractor {
    List&lt;Table&gt; extractTables(Connection connection, ExtractConfig config) throws SQLException;
    default boolean supports(String dialect) { return true; }
}
```

### 2. ColumnExtractor - Column Extractor

```java
public interface ColumnExtractor {
    List&lt;Column&gt; extractColumns(Connection connection, String tableName, String schema) throws SQLException;
    default boolean supports(String dialect) { return true; }
}
```

### 3. PrimaryKeyExtractor - Primary Key Extractor

```java
public interface PrimaryKeyExtractor {
    interface PrimaryKeyColumn {
        String getColumnName();
        int getSequence();
        String getKeyName();
    }

    List&lt;PrimaryKeyColumn&gt; extractPrimaryKeys(Connection connection, String tableName, String schema) throws SQLException;
    default boolean supports(String dialect) { return true; }
}
```

### 4. IndexExtractor - Index Extractor

```java
public interface IndexExtractor {
    interface IndexInfo {
        String getIndexName();
        String getColumnName();
        boolean isUnique();
        int getSequence();
        String getIndexType();
        boolean isPrimary();
    }

    List&lt;IndexInfo&gt; extractIndexes(Connection connection, String tableName, String schema) throws SQLException;
    default boolean supports(String dialect) { return true; }
}
```

### 5. ForeignKeyExtractor - Foreign Key Extractor

```java
public interface ForeignKeyExtractor {
    interface ForeignKey {
        String getFkName();
        String getColumn();
        String getReferencedTable();
        String getReferencedColumn();
        int getSequence();
    }

    List&lt;ForeignKey&gt; extractForeignKeys(Connection connection, String tableName, String schema) throws SQLException;
    default boolean supports(String dialect) { return true; }
}
```

### 6. ViewExtractor - View Extractor

```java
public interface ViewExtractor {
    List&lt;View&gt; extractViews(Connection connection, String schema) throws SQLException;
    String getViewDefinition(Connection connection, String viewName, String schema) throws SQLException;
    default boolean supports(String dialect) { return true; }
}
```

### 7. VersionExtractor - Version Extractor

```java
public interface VersionExtractor {
    String getVersion(Connection connection) throws SQLException;
    int getMajorVersion(Connection connection) throws SQLException;
    int getMinorVersion(Connection connection) throws SQLException;
    default boolean supports(String dialect) { return true; }
}
```

### 8. SequenceExtractor - Sequence Extractor

```java
public interface SequenceExtractor {
    interface Sequence {
        String getSequenceName();
        String getSchema();
        Long getStartValue();
        Long getIncrement();
        Long getCurrentValue();
        Long getMinValue();
        Long getMaxValue();
        Boolean isCycle();
    }

    List&lt;Sequence&gt; extractSequences(Connection connection, String schema) throws SQLException;
    default boolean supports(String dialect) {
        return !"mysql".equals(dialect) && !"tidb".equals(dialect);
    }
}
```

## Usage

### Method 1: Use Built-in JDBC Implementation (Default)

```java
// Directly use CompositeSchemaExtractor
SchemaExtractorStrategy extractor = new CompositeSchemaExtractor();
Justdb schema = extractor.extractSchema(connection, config);
```

### Method 2: Register SQL Template Implementation

Define in `META-INF/justdb/mydb-extractors.xml`:

```xml
<plugins>
  <plugin id="mydb-extractors">
    <extractors>
      <extractor id="extract-tables" dialect="mydb">
        <sql>
          SELECT table_name, table_schema
          FROM information_schema.tables
          WHERE table_type = 'BASE TABLE'
        </sql>
      </extractor>
    </extractors>
  </plugin>
</plugins>
```

### Method 3: Implement Single Interface

```java
public class MyIndexExtractor implements IndexExtractor {
    @Override
    public List&lt;IndexInfo&gt; extractIndexes(Connection conn, String table, String schema) {
        // Use SQL template or direct query
    }

    @Override
    public boolean supports(String dialect) {
        return "mydb".equals(dialect);
    }
}

// Register
CapabilityRegistry.getInstance().register(
    IndexExtractor.class,
    new MyIndexExtractor(),
    "mydb",
    10  // High priority
);
```

### Method 4: Implement All Interfaces (Recommended for New Databases)

```java
public class MyDatabaseExtractor implements
    TableExtractor,
    ColumnExtractor,
    PrimaryKeyExtractor,
    IndexExtractor,
    ForeignKeyExtractor,
    ViewExtractor,
    VersionExtractor {

    // Implement all methods...

    public static void register(String dialect) {
        MyDatabaseExtractor extractor = new MyDatabaseExtractor();
        CapabilityRegistry registry = CapabilityRegistry.getInstance();
        registry.register(TableExtractor.class, extractor, dialect, 10);
        registry.register(ColumnExtractor.class, extractor, dialect, 10);
        // ... register other interfaces
    }
}

// Use
MyDatabaseExtractor.register("mydb");
```

## SQL Template Configuration

### Template Lookup Order

System looks up SQL templates in the following order:

1. `{dialect}-{templateId}-extractor` - Dialect specific
2. `{templateId}-extractor` - General extractor template
3. `{dialect}-{templateId}` - Dialect template
4. `{templateId}` - General template

### Template Parameter Binding

```xml
<extractor id="extract-columns" dialect="postgresql">
  <sql>
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = {{tableName}}
      {{#if schema}}AND table_schema = {{schema}}{{/if}}
    ORDER BY ordinal_position
  </sql>
</extractor>
```

Pass parameters when calling:

```java
Map&lt;String, Object&gt; bindings = new HashMap&lt;&gt;();
bindings.put("tableName", "users");
bindings.put("schema", "public");

List&lt;Map&lt;String, Object&gt;&gt; results = extractor.queryForMaps(conn, "extract-columns", bindings);
```

## Supported Databases

### Already Supported Databases (via JDBC metadata)

- MySQL / MariaDB / TiDB
- PostgreSQL
- Oracle
- SQL Server
- H2
- Derby
- HSQLDB
- DB2
- And more...

### Database-Specific Optimizations

Performance can be optimized for specific databases through SQL templates:

| Database | System Tables/Views |
|--------|-----------|
| MySQL | `information_schema.TABLES`, `information_schema.COLUMNS` |
| PostgreSQL | `information_schema.tables`, `pg_indexes`, `pg_class` |
| Oracle | `all_tables`, `all_tab_columns`, `all_indexes`, `all_constraints` |
| SQL Server | `sys.tables`, `sys.columns`, `sys.indexes`, `sys.foreign_keys` |

## Extension Points

### 1. Add New Extractor Interface

```java
public interface TriggerExtractor {
    interface Trigger {
        String getName();
        String getEvent();
        String getTiming();
        String getBody();
    }

    List&lt;Trigger&gt; extractTriggers(Connection connection, String tableName, String schema) throws SQLException;
    default boolean supports(String dialect) { return true; }
}

// Register to CapabilityRegistry
CapabilityRegistry.getInstance().register(TriggerExtractor.class, new JdbcTriggerExtractor());
```

### 2. Override Default Implementation

```java
// Register higher priority implementation, override default JDBC implementation
CapabilityRegistry.getInstance().register(
    ColumnExtractor.class,
    new MyColumnExtractor(),
    "mysql",
    100  // High priority, override default (priority=0)
);
```

### 3. Conditional Support

```java
public class SequenceExtractorImpl implements SequenceExtractor {
    @Override
    public boolean supports(String dialect) {
        // MySQL/TiDB doesn't support sequences
        return !"mysql".equals(dialect) && !"tidb".equals(dialect);
    }
}
```

## Complete Example

### PostgreSQL Support

```java
// 1. Create SQL template config file postgres-extractors.xml
// 2. Place in META-INF/justdb/ directory

// 3. Or use AllInOneExtractor pattern
public class PostgresExtractor extends AllInOneExtractor {
    public PostgresExtractor() {
        super("postgresql");
    }

    @Override
    public String getVersion(Connection conn) throws SQLException {
        try (Statement stmt = conn.createStatement()) {
            ResultSet rs = stmt.executeQuery("SELECT version()");
            if (rs.next()) {
                return rs.getString(1);
            }
        }
        return null;
    }

    @Override
    public boolean supports(String dialect) {
        return "postgresql".equals(dialect) || "redshift".equals(dialect);
    }
}

// Register
PostgresExtractor extractor = new PostgresExtractor();
CapabilityRegistry registry = CapabilityRegistry.getInstance();
registry.register(TableExtractor.class, extractor, "postgresql", 10);
registry.register(ColumnExtractor.class, extractor, "postgresql", 10);
// ... other interfaces
```

## Configuration Loading

PluginManager automatically loads:

1. `META-INF/justdb/*.xml` - From all JAR packages
2. `justdb/*.xml` - Project root directory
3. User-specified configuration files

## Performance Considerations

1. **JDBC metadata** - Universal but potentially slow, suitable for most scenarios
2. **SQL templates** - Can be optimized for single query to get multi-table information
3. **Cache** - TypeRegistry uses cache to improve type parsing performance
4. **Batch processing** - Can be extended to support batch extraction of multi-table information

## Summary

This architecture provides:

1. **Flexible extension methods** - SQL templates > small interfaces > full implementation
2. **Minimize code** - Most cases only need SQL templates
3. **Conflict-free** - Interfaces independent, implement on demand
4. **Backward compatible** - JDBC metadata as default implementation
5. **User-friendly** - Can implement all interfaces in one class
