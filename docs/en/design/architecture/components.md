---
icon: puzzle-piece
title: Architecture Components
order: 2
---

# Architecture Components

Detailed description of key JustDB components and their responsibilities.

## Core Components

### JustdbManager

Central coordinator for all JustDB operations.

```java
public class JustdbManager {
    private PluginManager pluginManager;
    private TemplateExecutor templateExecutor;
    private SchemaValidator validator;

    // Manages plugins and templates
    // Coordinates schema operations
}
```

**Responsibilities:**
- Plugin lifecycle management
- Template compilation and caching
- Schema validation coordination
- Configuration management

### SchemaLoader

Loads schema definitions from various formats.

```java
public interface SchemaLoader {
    Justdb load(Path path) throws SchemaLoadingException;
    Justdb load(String content, String format);
}
```

**Implementations:**
- `YamlSchemaLoader` - YAML format
- `JsonSchemaLoader` - JSON format
- `XmlSchemaLoader` - XML format
- `TomlSchemaLoader` - TOML format
- `PropertiesSchemaLoader` - Properties format

### SchemaDeployer

Deploys schema to database.

```java
public class SchemaDeployer {
    public void deploy(Justdb schema) throws DeployException;
    public void deploy(Connection conn, Justdb schema);
    public void setDryRun(boolean dryRun);
    public void setIdempotent(boolean idempotent);
}
```

**Features:**
- Incremental deployment
- Rollback support
- Validation before deployment
- Transaction management

### SchemaDiffer

Compares two schemas and finds differences.

```java
public class SchemaDiffer {
    public CanonicalSchemaDiff calculate(Justdb current, Justdb target);
    public List<TableDiff> calculateTableDiff(Table current, Table target);
}
```

**Change Types:**
- `ADDED` - New object
- `REMOVED` - Deleted object
- `MODIFIED` - Changed object
- `RENAMED` - Renamed object (via formerNames)

## Template Components

### TemplateExecutor

Executes Handlebars templates.

```java
public class TemplateExecutor {
    public String execute(String templateId, TemplateRootContext context);
    public String executeTemplate(GenericTemplate template, Object data);
}
```

**Features:**
- Template inheritance
- Custom helpers
- Partial templates
- Context variables

### TemplateRootContext

Context object passed to templates.

```java
public class TemplateRootContext {
    private JustdbManager justdbManager;
    private String dbType;
    private boolean idempotent;
    private boolean safeDrop;
    private Map<String, Object> data;
}
```

**Available Variables:**
- `@root.justdbManager` - Manager instance
- `@root.dbType` - Database type
- `@root.idempotent` - Idempotent mode
- `@root.safeDrop` - Safe drop mode

## Plugin Components

### PluginManager

Manages JustDB plugins.

```java
public class PluginManager {
    public void loadPlugins();
    public DatabaseAdapter getDatabaseAdapter(String dialect);
    public GenericTemplate getTemplate(String templateId, String dialect);
    public TypeMapping getTypeMapping(String dialect);
}
```

**Plugin Sources:**
- Built-in plugins (default-plugins.xml)
- External JARs (ServiceLoader)
- Custom plugins at runtime

### DatabaseAdapter

Database-specific adapter.

```java
public interface DatabaseAdapter {
    String getDialect();
    String getUrlPattern();
    String getDriverClass();
    TypeMapping getTypeMapping();
    boolean supports(String feature);
}
```

**Supported Databases:**
- MySQL, MariaDB, TiDB, GBase
- PostgreSQL, Redshift, TimescaleDB, KingBase
- Oracle, DB2, Derby, HSQLDB, Dameng
- SQL Server
- SQLite, H2

## Migration Components

### SchemaMigrationService

Handles schema migrations.

```java
public class SchemaMigrationService {
    public MigrationResult migrate(Justdb schema);
    public MigrationResult migrate(Connection conn, Justdb schema);
    public void setAutoDiff(boolean autoDiff);
    public void setSafeDrop(boolean safeDrop);
}
```

**Features:**
- Automatic diff calculation
- Safe drop (rename instead of delete)
- Migration history tracking
- Rollback support

### CanonicalSchemaDiff

Represents schema differences.

```java
public class CanonicalSchemaDiff {
    private List<TableDiff> tableDiffs;
    private List<ViewDiff> viewDiffs;
    private List<IndexDiff> indexDiffs;
}
```

## History Components

### HistoryService

Tracks schema evolution.

```java
public interface HistoryService {
    void recordMigration(Justdb schema, List<String> sql);
    List<MigrationRecord> getHistory();
    Justdb getSchemaAtVersion(String version);
}
```

**Implementations:**
- `HashBasedHistoryService` - Hash-based tracking
- `DatabaseHistoryService` - Database table storage

## Validation Components

### SchemaValidator

Validates schema definitions.

```java
public class SchemaValidator {
    public ValidationResult validate(Justdb schema);
    public ValidationResult validateTable(Table table);
}
```

**Validation Rules:**
- Required fields
- Type constraints
- Naming conventions
- Reference integrity

## Type System

### TypeMapping

Maps Java types to database types.

```java
public interface TypeMapping {
    String getSQLType(String javaType);
    String getJavaType(String sqlType);
    String getDefaultType(ColumnInfo column);
}
```

### TypeConverter

Converts between types.

```java
public interface TypeConverter {
    boolean canConvert(String fromType, String toType);
    String getConversionSQL(Column from, Column to);
}
```

## Next Steps

- **[Layers](./layers.html)** - Layer architecture
- **[Data Flow](./data-flow.html)** - Request/response flow
- **[Plugins](./plugins.html)** - Plugin system details
