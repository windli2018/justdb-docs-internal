---
icon: code
date: 2024-01-01
title: API Reference
order: 16
category:
  - Guide
  - API
tag:
  - API
  - Java
  - reference
---

# API Reference

Complete reference documentation for JustDB core API.

## Core API

### FormatFactory

Schema format factory, used for loading and saving schemas.

#### Load Schema

```java
import org.verydb.justdb.FormatFactory;

// Load from file
Justdb schema = FormatFactory.loadFromFile("schema.yaml");

// Load from URL
Justdb schema = FormatFactory.loadFromURL(new URL("http://example.com/schema.yaml"));

// Load from string
Justdb schema = FormatFactory.loadFromString("""
    id: myapp
    Table:
      - name: users
        Column:
          - name: id
            type: BIGINT
""");

// Load from input stream
try (InputStream is = new FileInputStream("schema.json")) {
    Justdb schema = FormatFactory.loadFromStream(is, "json");
}
```

#### Save Schema

```java
// Save to file
FormatFactory.saveToFile(schema, "output.yaml");

// Save as different formats
FormatFactory.saveToFile(schema, "output.json");
FormatFactory.saveToFile(schema, "output.xml");

// Save to string
String yaml = FormatFactory.saveToString(schema, "yaml");
String json = FormatFactory.saveToString(schema, "json");
```

### SchemaDeployer

Schema deployer, used to deploy schema to database.

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

// Idempotent mode
deployer.setIdempotent(true);

// Safe drop
deployer.setSafeDrop(true);

// Dry run
deployer.setDryRun(true);

// Execute deployment
deployer.deploy(schema);
```

### SchemaMigrationService

Schema migration service for incremental migration.

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

// Auto diff calculation
service.setAutoDiff(true);

// Idempotent mode
service.setIdempotent(true);

// Safe drop
service.setSafeDrop(false);

// Set baseline
service.setBaselineOnMigrate(true);
```

### DBGenerator

Database SQL generator.

#### Generate SQL

```java
import org.verydb.justdb.generator.DBGenerator;

// Create generator
DBGenerator generator = new DBGenerator(
    PluginManager.getInstance(),
    "mysql"
);

// Generate create table SQL
String sql = generator.generateCreateTable(table);

// Generate drop table SQL
String sql = generator.generateDropTable(table);

// Generate alter table SQL
String sql = generator.generateAlterTable(table, diff);
```

#### Batch Generation

```java
// Generate all SQL
List<String> sqlList = generator.generateAll(schema);

// Generate specific type SQL
List<String> createSQL = generator.generateCreates(schema);
List<String> dropSQL = generator.generateDrops(schema);
```

## Schema Model

### Justdb

Schema root object.

```java
Justdb schema = new Justdb();
schema.setId("myapp");
schema.setNamespace("com.example");

// Add table
Table table = new Table();
table.setName("users");
schema.addTable(table);
```

### Table

Table definition.

```java
Table table = new Table();
table.setName("users");
table.setComment("用户表");

// Add column
Column column = new Column();
column.setName("id");
column.setType("BIGINT");
table.addColumn(column);

// Add index
Index index = new Index();
index.setName("idx_username");
index.setColumns(Arrays.asList("username"));
table.addIndex(index);

// Add constraint
Constraint constraint = new Constraint();
constraint.setName("fk_orders_user");
constraint.setType(ConstraintType.FOREIGN_KEY);
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
column.setComment("用户名");

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
index.setComment("邮箱唯一索引");
```

### Constraint

Constraint definition.

```java
Constraint constraint = new Constraint();
constraint.setName("fk_orders_user");
constraint.setType(ConstraintType.FOREIGN_KEY);
constraint.setReferencedTable("users");
constraint.setReferencedColumn("id");
constraint.setForeignKey("user_id");
constraint.setOnDelete(ConstraintAction.CASCADE);
constraint.setOnUpdate(ConstraintAction.RESTRICT);
```

## Diff Calculation

### CanonicalSchemaDiff

Schema diff object.

```java
import org.verydb.justdb.diff.CanonicalSchemaDiff;

// Calculate diff
CanonicalSchemaDiff diff = SchemaDiffer.calculate(
    currentSchema,
    targetSchema
);

// Check change types
for (TableDiff tableDiff : diff.getTableDiffs()) {
    ChangeType changeType = tableDiff.getChangeType();
    switch (changeType) {
        case ADDED:
            // New table
            break;
        case REMOVED:
            // Drop table
            break;
        case MODIFIED:
            // Modify table
            break;
        case RENAMED:
            // Rename table
            break;
    }
}
```

### SchemaEvolutionManager

Schema evolution manager.

```java
import org.verydb.justdb.migration.SchemaEvolutionManager;

SchemaEvolutionManager manager = new SchemaEvolutionManager(conn);

// Detect renames
manager.setRenameDetectionEnabled(true);

// Handle evolution
manager.evolve(currentSchema, targetSchema);
```

## Plugin System

### PluginManager

Plugin manager.

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
```

### DatabaseAdapter

Database adapter.

```java
// Get adapter
DatabaseAdapter adapter = pluginManager.getDatabaseAdapter("mysql");

// Get type mapping
TypeMapping typeMapping = adapter.getTypeMapping();
String sqlType = typeMapping.getSQLType("BIGINT");

// Get URL pattern
String urlPattern = adapter.getUrlPattern();

// Get driver class
String driverClass = adapter.getDriverClass();
```

## JDBC Driver

### JustDB Driver

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.sql.ResultSet;

// Use JustDB JDBC driver
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

### Connection URL

```java
// Schema file
String url = "jdbc:justdb:schema.yaml";

// Multiple schema files
String url = "jdbc:justdb:schema1.yaml,schema2.yaml";

// Specify directory
String url = "jdbc:justdb:./justdb/";

// Use config file
String url = "jdbc:justdb:?config=justdb-config.yaml";
```

## Usage Examples

### Complete Example

```java
import org.verydb.justdb.*;
import org.verydb.justdb.migration.*;
import org.verydb.justdb.generator.*;
import java.sql.Connection;
import java.sql.DriverManager;

public class JustdbExample {

    public static void main(String[] args) throws Exception {
        // 1. Load schema
        Justdb schema = FormatFactory.loadFromFile("schema.yaml");

        // 2. Connect to database
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/myapp",
                "root",
                "password")) {

            // 3. Create migration service
            SchemaMigrationService service = new SchemaMigrationService(conn);

            // 4. Configure migration
            service.setAutoDiff(true);
            service.setIdempotent(true);
            service.setSafeDrop(false);

            // 5. Execute migration
            MigrationResult result = service.migrate(schema);

            // 6. Check result
            if (result.isSuccess()) {
                System.out.println("Migration completed successfully");
                System.out.println("Applied changes: " + result.getAppliedChanges());
            } else {
                System.err.println("Migration failed: " + result.getError());
            }
        }
    }
}
```

### Spring Boot Integration

```java
import org.verydb.justdb.spring.JustdbProperties;
import org.verydb.justdb.spring.SchemaMigrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class Application {

    @Autowired
    private JustdbProperties properties;

    @Autowired
    private SchemaMigrationService migrationService;

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Bean
    public CommandLineRunner runner() {
        return args -> {
            if (properties.isMigrateOnStartup()) {
                migrationService.migrate();
            }
        };
    }
}
```

## JavaDoc Links

For detailed API documentation, refer to:

- **[Online JavaDoc](https://verydb.github.io/justdb/apidocs/)**
- **[Core API](https://verydb.github.io/justdb/apidocs/org/verydb/justdb/core/package-summary.html)**
- **[Generator API](https://verydb.github.io/justdb/apidocs/org/verydb/justdb/generator/package-summary.html)**
- **[Migration API](https://verydb.github.io/justdb/apidocs/org/verydb/justdb/migration/package-summary.html)**

## Error Handling

### Exception Types

```java
try {
    schema = FormatFactory.loadFromFile("schema.yaml");
} catch (SchemaParseException e) {
    // Schema parse error
    System.err.println("Schema parse error: " + e.getMessage());
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

### Error Handling Example

```java
public class SafeMigration {

    public void migrateSafely(String schemaFile, Connection conn) {
        try {
            // 1. Load schema
            Justdb schema = FormatFactory.loadFromFile(schemaFile);

            // 2. Validate schema
            SchemaValidator validator = new SchemaValidator();
            ValidationResult result = validator.validate(schema);

            if (!result.isValid()) {
                System.err.println("Schema validation failed:");
                for (String error : result.getErrors()) {
                    System.err.println("  - " + error);
                }
                return;
            }

            // 3. Preview changes
            SchemaMigrationService service = new SchemaMigrationService(conn);
            service.setDryRun(true);
            service.migrate(schema);

            // 4. Confirm and execute
            System.out.print("Execute migration? (yes/no): ");
            Scanner scanner = new Scanner(System.in);
            if (scanner.nextLine().equalsIgnoreCase("yes")) {
                service.setDryRun(false);
                MigrationResult result = service.migrate(schema);

                if (result.isSuccess()) {
                    System.out.println("Migration completed successfully");
                } else {
                    System.err.println("Migration failed: " + result.getError());
                }
            }

        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
```

## Next Steps

<VPCard
  title="CLI Reference"
  desc="Complete command-line interface reference"
  link="/en/guide/cli-reference.html"
/>

<VPCard
  title="Configuration Reference"
  desc="Complete configuration options"
  link="/en/guide/config-reference.html"
/>

<VPCard
  title="Spring Boot Integration"
  desc="Use JustDB in Spring Boot"
  link="/en/guide/spring-boot.html"
/>
