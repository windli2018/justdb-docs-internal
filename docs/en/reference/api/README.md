---
icon: code
title: API Overview
order: 20
category:
  - Reference
  - API
tag:
  - api
  - reference
---

# API Overview

JustDB provides comprehensive APIs for programmatic database schema management, migration, and JDBC driver integration.

## API Sections

### JDBC Driver

**[JDBC Driver](./jdbc-driver.md)** - Standard JDBC 4.2 driver implementation

JustDB provides a complete JDBC driver that allows you to use JustDB schemas directly in your applications with standard JDBC APIs.

```java
// Use JustDB JDBC driver
Class.forName("org.verydb.justdb.jdbc.JustdbDriver");

// Connect with schema path
Connection conn = DriverManager.getConnection(
    "jdbc:justdb:classpath:/justdb/schema.yaml");

// Use standard JDBC
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery("SELECT * FROM users");
```

### Java API

**[Java API](./java-api.md)** - Core Java programming interface

Core APIs for schema loading, manipulation, and deployment.

```java
// Load schema
Justdb schema = FormatFactory.loadFromFile("schema.yaml");

// Deploy to database
SchemaDeployer deployer = new SchemaDeployer(connection);
deployer.deploy(schema);

// Generate migration
SchemaDiff diff = SchemaDiff.calculate(oldSchema, newSchema);
List<String> sql = MigrationService.generateSql(diff);
```

### Schema API

**[Schema API](./schema-api.md)** - Schema manipulation API

APIs for programmatically creating and modifying schema objects.

```java
// Create table
Table table = new Table();
table.setName("users");

// Add column
Column idColumn = new Column();
idColumn.setName("id");
idColumn.setType("BIGINT");
idColumn.setPrimaryKey(true);
table.addColumn(idColumn);

// Add to schema
Justdb schema = new Justdb();
schema.addTable(table);
```

### Migration API

**[Migration API](./migration-api.md)** - Migration control API

APIs for managing schema migrations, diff calculation, and SQL generation.

```java
// Calculate schema differences
SchemaDiffService diffService = new SchemaDiffService();
CanonicalSchemaDiff diff = diffService.calculateDiff(oldSchema, newSchema);

// Generate migration SQL
MigrationService migrationService = new MigrationService(justdbManager);
List<String> sql = migrationService.generateSql(diff, "mysql");

// Execute migration
for (String statement : sql) {
    stmt.execute(statement);
}
```

## Quick Reference

### Common APIs

| API | Description |
|-----|-------------|
| `FormatFactory` | Load/save schemas in various formats |
| `SchemaDeployer` | Deploy schema to database |
| `SchemaDiffService` | Calculate schema differences |
| `MigrationService` | Generate migration SQL |
| `JustdbManager` | Core manager for plugin and configuration |

### Usage Patterns

#### Load Schema

```java
import org.verydb.justdb.FormatFactory;
import org.verydb.justdb.schema.Justdb;

// From file
Justdb schema = FormatFactory.loadFromFile("schema.yaml");

// From string
Justdb schema = FormatFactory.loadFromString(
    "{ \"id\": \"myapp\", \"Table\": [...]}",
    Format.JSON);

// From stream
Justdb schema = FormatFactory.loadFromStream(inputStream, Format.YAML);
```

#### Deploy Schema

```java
import org.verydb.justdb.SchemaDeployer;
import java.sql.Connection;

// Basic deployment
SchemaDeployer deployer = new SchemaDeployer(connection);
deployer.deploy(schema);

// With options
SchemaDeployer deployer = new SchemaDeployer(connection)
    .setDryRun(false)
    .setSafeDrop(true);
deployer.deploy(schema);
```

#### Generate Migration

```java
import org.verydb.justdb.migration.SchemaMigrationService;

// Calculate diff
CanonicalSchemaDiff diff = SchemaDiffService.calculateDiff(
    oldSchema, newSchema);

// Generate SQL
List<String> sql = MigrationService.generateSql(diff, "mysql");

// Execute
try (Statement stmt = connection.createStatement()) {
    for (String statement : sql) {
        stmt.execute(statement);
    }
}
```

## API Design Principles

### 1. Simplicity

Clean, intuitive APIs that follow Java conventions.

### 2. Flexibility

Support multiple usage patterns - from simple to advanced.

### 3. Type Safety

Strong typing with comprehensive validation.

### 4. Database Agnostic

Same API works across all supported databases.

## Complete Examples

### Example 1: Schema Migration

```java
public class SchemaMigrationExample {
    public static void main(String[] args) throws Exception {
        // Load schemas
        Justdb oldSchema = FormatFactory.loadFromFile("schema-old.yaml");
        Justdb newSchema = FormatFactory.loadFromFile("schema-new.yaml");

        // Calculate diff
        SchemaDiffService diffService = new SchemaDiffService();
        CanonicalSchemaDiff diff = diffService.calculateDiff(oldSchema, newSchema);

        // Generate SQL
        MigrationService migrationService = new MigrationService(justdbManager);
        List<String> sql = migrationService.generateSql(diff, "mysql");

        // Execute migration
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/myapp", "user", "pass")) {
            SchemaDeployer deployer = new SchemaDeployer(conn);
            deployer.applyDiff(diff);
        }
    }
}
```

### Example 2: JDBC Usage

```java
public class JdbcExample {
    public static void main(String[] args) throws Exception {
        // Load JustDB JDBC driver
        Class.forName("org.verydb.justdb.jdbc.JustdbDriver");

        // Connect with schema
        try (Connection conn = DriverManager.getConnection(
                "jdbc:justdb:classpath:/justdb/schema.yaml")) {

            // Use standard JDBC
            String sql = "INSERT INTO users (username, email) VALUES (?, ?)";
            try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                pstmt.setString(1, "john");
                pstmt.setString(2, "john@example.com");
                pstmt.executeUpdate();
            }

            // Query
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT * FROM users")) {
                while (rs.next()) {
                    System.out.println("User: " + rs.getString("username"));
                }
            }
        }
    }
}
```

## Related Documentation

- [JDBC Driver](./jdbc-driver.md) - JDBC driver details *(Coming soon)*
- [Java API](./java-api.md) - Java API reference *(Coming soon)*
- [Schema API](./schema-api.md) - Schema manipulation *(Coming soon)*
- [Migration API](./migration-api.md) - Migration control *(Coming soon)*
