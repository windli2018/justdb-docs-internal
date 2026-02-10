---
icon: code
title: API Reference
order: 4
---

# API Reference

Programmatic API for working with JustDB schemas.

## Core API

### FormatFactory

Load and save schemas in various formats.

#### Loading Schemas

```java
import org.verydb.justdb.FormatFactory;

// From file
Justdb schema = FormatFactory.loadFromFile("schema.yaml");

// From URL
Justdb schema = FormatFactory.loadFromURL(new URL("http://example.com/schema.yaml"));

// From string
Justdb schema = FormatFactory.loadFromString("""
    id: myapp
    Table:
      - name: users
        Column:
          - name: id
            type: BIGINT
""");

// From input stream
try (InputStream is = new FileInputStream("schema.json")) {
    Justdb schema = FormatFactory.loadFromStream(is, "json");
}
```

#### Saving Schemas

```java
// Save to file
FormatFactory.saveToFile(schema, "output.yaml");

// Save as different format
FormatFactory.saveToFile(schema, "output.json");
FormatFactory.saveToFile(schema, "output.xml");

// Save to string
String yaml = FormatFactory.saveToString(schema, "yaml");
String json = FormatFactory.saveToString(schema, "json");
```

### SchemaDeployer

Deploy schemas to database.

#### Basic Deployment

```java
import org.verydb.justdb.SchemaDeployer;
import java.sql.Connection;

try (Connection conn = DriverManager.getConnection(url, user, pass)) {
    Justdb schema = FormatFactory.loadFromFile("schema.yaml");

    SchemaDeployer deployer = new SchemaDeployer(conn);
    deployer.deploy(schema);
}
```

#### Deployment Options

```java
SchemaDeployer deployer = new SchemaDeployer(conn);

// Idempotent mode (adds IF NOT EXISTS)
deployer.setIdempotent(true);

// Safe drop (rename instead of delete)
deployer.setSafeDrop(true);

// Dry run (don't execute)
deployer.setDryRun(true);

// Execute deployment
deployer.deploy(schema);
```

### SchemaMigrationService

Handle incremental migrations.

#### Basic Migration

```java
import org.verydb.justdb.SchemaMigrationService;

try (Connection conn = DriverManager.getConnection(url, user, pass)) {
    SchemaMigrationService service = new SchemaMigrationService(conn);

    // Execute migration
    MigrationResult result = service.migrate(schema);

    if (result.isSuccess()) {
        System.out.println("Migration completed");
    }
}
```

#### Migration Configuration

```java
SchemaMigrationService service = new SchemaMigrationService(conn);

// Auto-diff enabled
service.setAutoDiff(true);

// Idempotent mode
service.setIdempotent(true);

// Safe drop disabled
service.setSafeDrop(false);

// Set baseline
service.setBaselineOnMigrate(true);

// Execute
service.migrate(schema);
```

### DBGenerator

Generate SQL from schemas.

#### Generate SQL

```java
import org.verydb.justdb.generator.DBGenerator;

// Create generator for specific database
DBGenerator generator = new DBGenerator(
    PluginManager.getInstance(),
    "mysql"
);

// Generate CREATE TABLE
String sql = generator.generateCreateTable(table);

// Generate DROP TABLE
String sql = generator.generateDropTable(table);

// Generate ALTER TABLE
String sql = generator.generateAlterTable(table, diff);
```

#### Batch Generation

```java
// Generate all SQL
List&lt;String&gt; sqlList = generator.generateAll(schema);

// Generate specific types
List&lt;String&gt; createSQL = generator.generateCreates(schema);
List&lt;String&gt; dropSQL = generator.generateDrops(schema);
List&lt;String&gt; alterSQL = generator.generateAlters(schema);
```

## Schema Model

### Justdb

Root schema object.

```java
Justdb schema = new Justdb();
schema.setId("myapp");
schema.setNamespace("com.example");

// Add table
Table table = new Table();
table.setName("users");
schema.addTable(table);

// Get tables
List<Table&gt;> tables = schema.getTables();
```

### Table

Table definition.

```java
Table table = new Table();
table.setName("users");
table.setComment("User accounts");

// Add columns
Column column = new Column();
column.setName("id");
column.setType("BIGINT");
table.addColumn(column);

// Add indexes
Index index = new Index();
index.setName("idx_username");
index.setColumns(Arrays.asList("username"));
table.addIndex(index);

// Add constraints
Constraint constraint = new Constraint();
constraint.setName("pk_users");
constraint.setType(ConstraintType.PRIMARY_KEY);
table.addConstraint(constraint);
```

### Column

Column definition.

```java
Column column = new Column();
column.setName("username");
column.setType("VARCHAR(50)");
column.setNullable(false);
column.setDefaultValue("guest");
column.setComment("User name");

// Primary key
column.setPrimaryKey(true);
column.setAutoIncrement(true);

// Unique constraint
column.setUnique(true);
```

### Index

Index definition.

```java
Index index = new Index();
index.setName("idx_email");
index.setColumns(Arrays.asList("email"));
index.setUnique(true);
index.setType("BTREE");
index.setComment("Email unique index");
```

### Constraint

Constraint definition.

```java
// Foreign key constraint
Constraint constraint = new Constraint();
constraint.setName("fk_orders_user");
constraint.setType(ConstraintType.FOREIGN_KEY);
constraint.setReferencedTable("users");
constraint.setReferencedColumn("id");
constraint.setForeignKey("user_id");
constraint.setOnDelete(ConstraintAction.CASCADE);
constraint.setOnUpdate(ConstraintAction.RESTRICT);
```

## JDBC Driver

Use JustDB as a JDBC driver.

### Connection URL

```java
// Schema file
String url = "jdbc:justdb:schema.yaml";

// Multiple schema files
String url = "jdbc:justdb:schema1.yaml,schema2.yaml";

// Specify directory
String url = "jdbc:justdb:./justdb/";

// With config
String url = "jdbc:justdb:?config=justdb-config.yaml";
```

### Query Execution

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.sql.ResultSet;

try (Connection conn = DriverManager.getConnection(
        "jdbc:justdb:schema.yaml",
        null,
        null)) {

    // Execute query
    try (Statement stmt = conn.createStatement();
         ResultSet rs = stmt.executeQuery("SELECT * FROM users")) {

        while (rs.next()) {
            String username = rs.getString("username");
            System.out.println(username);
        }
    }
}
```

### With Database Connection

```java
String url = "jdbc:justdb:schema.yaml?target.url=jdbc:mysql://localhost:3306/myapp";

try (Connection conn = DriverManager.getConnection(url, null, null)) {
    // Queries execute against actual MySQL database
    // Schema from schema.yaml is used for validation
}
```

## Error Handling

### Exception Types

```java
try {
    schema = FormatFactory.loadFromFile("schema.yaml");
} catch (SchemaParseException e) {
    // Schema parsing error
    System.err.println("Parse error: " + e.getMessage());
} catch (FileNotFoundException e) {
    // File not found
    System.err.println("File not found: " + e.getMessage());
} catch (IOException e) {
    // IO error
    System.err.println("IO error: " + e.getMessage());
}

try {
    deployer.deploy(schema);
} catch (MigrationException e) {
    // Migration error
    System.err.println("Migration error: " + e.getMessage());
} catch (SQLException e) {
    // SQL error
    System.err.println("SQL error: " + e.getMessage());
}
```

## Plugin System

### PluginManager

Manage plugins.

```java
import org.verydb.justdb.plugin.PluginManager;

// Get instance
PluginManager pluginManager = PluginManager.getInstance();

// Load plugins
pluginManager.loadPlugins();

// Get database adapter
DatabaseAdapter adapter = pluginManager.getDatabaseAdapter("mysql");

// Get template
GenericTemplate template = pluginManager.getTemplate("create-table", "mysql");

// Get type mapping
TypeMapping typeMapping = pluginManager.getTypeMapping("mysql");
```

### DatabaseAdapter

Database-specific adapter.

```java
DatabaseAdapter adapter = pluginManager.getDatabaseAdapter("mysql");

// Get database type
String dialect = adapter.getDialect();

// Get URL pattern
String urlPattern = adapter.getUrlPattern();

// Get driver class
String driverClass = adapter.getDriverClass();

// Get type mapping
TypeMapping typeMapping = adapter.getTypeMapping();

// Check feature support
boolean supportsSequences = adapter.supports("sequences");
```

## Validation

### SchemaValidator

Validate schemas.

```java
import org.verydb.justdb.validation.SchemaValidator;

SchemaValidator validator = new SchemaValidator();
ValidationResult result = validator.validate(schema);

if (!result.isValid()) {
    System.err.println("Validation failed:");
    for (String error : result.getErrors()) {
        System.err.println("  - " + error);
    }
}
```

## Best Practices

### 1. Resource Management

```java
// Use try-with-resources
try (Connection conn = DriverManager.getConnection(url);
     InputStream is = new FileInputStream("schema.yaml")) {
    // Auto-closed resources
}
```

### 2. Error Handling

```java
try {
    deployer.deploy(schema);
} catch (MigrationException e) {
    // Log error
    logger.error("Migration failed", e);
    // Handle or rethrow
    throw e;
}
```

### 3. Validation

```java
// Always validate before deployment
SchemaValidator validator = new SchemaValidator();
ValidationResult result = validator.validate(schema);

if (!result.isValid()) {
    throw new ValidationException(result.getErrors());
}
```

## Next Steps

- **[Quick Start](/getting-started/)** - Get started quickly
- **[CLI Reference](/reference/cli/)** - Command-line tools
- **[Schema Reference](/reference/schema/)** - Schema definitions
