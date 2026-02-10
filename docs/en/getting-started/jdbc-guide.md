---
date: 2025-02-11
icon: database
title: JDBC Driver Guide
order: 6
category:
  - Quick Start
  - Getting Started
  - JDBC
tag:
  - Getting Started
  - JDBC
  - Database Driver
---

# JDBC Driver Guide

JustDB provides a complete JDBC driver implementation that supports the standard JDBC API. You can use JustDB just like any other database (MySQL, PostgreSQL, etc.).

## Prerequisites

::: tip Requirements
- **Java**: JDK 1.8 or higher
- **Dependency**: justdb-core JAR package
:::

### Add Dependency

#### Maven

```xml
<dependency>
    <groupId>ai.justdb</groupId>
    <artifactId>justdb-core</artifactId>
    <version>1.0.0</version>
</dependency>
```

#### Gradle

```groovy
implementation 'ai.justdb:justdb-core:1.0.0'
```

## JDBC URL Format

### Basic Format

```
jdbc:justdb:schema-file-path[?parameter=value&...]
```

### URL Examples

```bash
# File-based schema
jdbc:justdb:/path/to/schema.json

# File-based schema with output file (auto-save)
jdbc:justdb:/path/to/schema.json?outputFile=/path/to/output.json

# File-based schema with migration
jdbc:justdb:/path/to/schema.json?migrate=/path/to/migrate.json

# File-based schema with both outputfile and migrate
jdbc:justdb:/path/to/schema.json?outputFile=/path/to/output.json&migrate=/path/to/migrate.json

# In-memory empty schema
jdbc:justdb:memory:

# In-memory with schema file
jdbc:justdb:memory:/path/to/schema.json

# Registry (pre-registered schema)
jdbc:justdb:registry:mySchemaId
```

## Connection Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `outputFile` | String | Output file path for auto-save on connection close |
| `overwriteFile` | String | Alias for `outputFile` |
| `migrate` | String | Path to migrate schema file for schema migration |
| `create` | Boolean | Create schema file if it does not exist (default: false) |
| `default` | String | Default schema name (multi-schema only) |
| `autoScan` | Boolean | Auto-scan directory for schema files (multi-schema with directory) |
| `dialect` | String | SQL dialect for function resolution (mysql, postgresql, oracle) |

## Outputfile Merge Functionality

### Overview

When the `outputFile` parameter is specified, the JDBC driver automatically merges the output file with the original schema before creating the connection. This preserves user changes made via SQL commands that are stored in the output file, preventing data loss during migrate operations.

### Merge Flow

```
1. Load original schema (from schema file)
2. Load output file (if exists)
3. Merge output file into original schema
4. Create connection with merged schema
5. (Optional) Apply migrate operation to merged schema
```

### Schema Merging Behavior

- **Tables**: Tables from output file are added if they don't exist in original schema
- **Columns**: Columns from output file are added if they don't exist in the table
- **Views**: Views from output file are added if they don't exist in original schema
- **Data**: Data from output file is merged with existing data
- **Databases**: Database definitions from output file are added if they don't exist

### Special Cases

1. **Same file as schema**: If `outputFile` is the same as the schema file, merge is skipped
2. **Output file doesn't exist**: Connection succeeds without merge (first run scenario)
3. **Merge failure**: Logged as warning, connection continues with original schema

### Usage Examples

#### Example 1: Basic Outputfile Merge

```java
// Original schema: schema.json contains table1
// Output file: output.json contains table2 (created by user via SQL)
String url = "jdbc:justdb:/path/to/schema.json?outputFile=/path/to/output.json";

try (Connection conn = DriverManager.getConnection(url)) {
    // Merged schema contains: table1 (from original) + table2 (from output)
    // User changes via SQL are preserved
}
```

#### Example 2: Outputfile Merge with Migration

```java
// Original schema: schema.json contains table1 with columns (id, name)
// Output file: output.json contains table1 with additional column (email) - user added via SQL
// Migrate schema: migrate.json contains table1 with additional column (status) - schema evolution
String url = "jdbc:justdb:/path/to/schema.json" +
             "?outputFile=/path/to/output.json" +
             "&migrate=/path/to/migrate.json";

try (Connection conn = DriverManager.getConnection(url)) {
    // Flow:
    // 1. Load schema.json (table1: id, name)
    // 2. Merge output.json (table1: id, name, email)
    // 3. Apply migrate.json (table1: id, name, email, status)
    // Result: table1 has all columns (id, name, email, status)
}
```

#### Example 3: Auto-Save on Close

```java
String url = "jdbc:justdb:/path/to/schema.json?outputFile=/path/to/output.json";

try (Connection conn = DriverManager.getConnection(url)) {
    Statement stmt = conn.createStatement();

    // User creates a new table via SQL
    stmt.execute("CREATE TABLE user_settings (id BIGINT PRIMARY KEY, theme VARCHAR(50))");

    // Insert data
    stmt.execute("INSERT INTO user_settings (id, theme) VALUES (1, 'dark')");

} // Connection close triggers auto-save to output.json
// output.json now contains user_settings table with data
```

### Connection Properties Alternative

You can also specify the output file using connection properties:

```java
Properties props = new Properties();
props.setProperty("justdb.outputFile", "/path/to/output.json");

try (Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.json", props)) {
    // Connection with output file merge
}
```

## Migration with Outputfile

### Purpose

The outputfile merge functionality is designed to work seamlessly with the migrate operation:

1. **Preserve user changes**: Tables/columns added via SQL commands are saved in output file
2. **Schema evolution**: Migrate operation applies schema changes from migrate schema
3. **No data loss**: User changes are merged before migrate, then migrate adds its changes

### Complete Flow

```
┌─────────────────┐
│  Original Schema│  (base schema definition)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Output File    │  (user changes via SQL - merged if exists)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Merged Schema  │  (original + output file)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Migrate Schema │  (applies evolution changes)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Final Schema   │  (preserved user changes + schema evolution)
└─────────────────┘
```

### Best Practices

1. **Separate output file**: Use a different file for output than the original schema
2. **Version control**: Commit original schema to version control, keep output file for runtime changes
3. **Backup before migrate**: The output file preserves user changes, but backup before major migrations
4. **Test migrations**: Test migrate operations in development before applying to production

## Basic Usage

### Creating Connections

```java
// Basic connection
try (Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.json")) {
    // Use connection
}

// Connection with output file
try (Connection conn = DriverManager.getConnection(
        "jdbc:justdb:/path/to/schema.json?outputFile=/path/to/output.json")) {
    // Use connection
}

// Using Properties
Properties props = new Properties();
props.setProperty("user", "username");
props.setProperty("password", "password");

try (Connection conn = DriverManager.getConnection(
        "jdbc:justdb:/path/to/schema.json", props)) {
    // Use connection
}
```

### Executing SQL

```java
try (Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.json");
     Statement stmt = conn.createStatement()) {

    // Create table
    stmt.execute("CREATE TABLE users (id BIGINT PRIMARY KEY, name VARCHAR(255))");

    // Insert data
    stmt.execute("INSERT INTO users (id, name) VALUES (1, 'John Doe')");

    // Query data
    try (ResultSet rs = stmt.executeQuery("SELECT * FROM users")) {
        while (rs.next()) {
            long id = rs.getLong("id");
            String name = rs.getString("name");
            System.out.println("User: " + id + " - " + name);
        }
    }
}
```

### Using PreparedStatement

```java
try (Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.json");
     PreparedStatement pstmt = conn.prepareStatement(
             "INSERT INTO users (id, name, email) VALUES (?, ?, ?)")) {

    pstmt.setLong(1, 1);
    pstmt.setString(2, "John Doe");
    pstmt.setString(3, "john@example.com");
    pstmt.executeUpdate();
}
```

### Batch Operations

```java
try (Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.json");
     Statement stmt = conn.createStatement()) {

    // Add batch statements
    stmt.addBatch("CREATE TABLE users (id BIGINT PRIMARY KEY, name VARCHAR(255))");
    stmt.addBatch("CREATE INDEX idx_users_id ON users(id)");
    stmt.addBatch("INSERT INTO users (id, name) VALUES (1, 'John Doe')");

    // Execute batch
    int[] results = stmt.executeBatch();
}
```

### Transaction Management

```java
try (Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.json")) {

    // Disable auto-commit
    conn.setAutoCommit(false);

    try {
        Statement stmt = conn.createStatement();

        stmt.execute("INSERT INTO users (id, name) VALUES (1, 'John Doe')");
        stmt.execute("INSERT INTO user_settings (id, theme) VALUES (1, 'dark')");

        // Commit transaction
        conn.commit();

    } catch (SQLException e) {
        // Rollback transaction
        conn.rollback();
        throw e;
    }
}
```

## DatabaseMetaData

The JustDB JDBC driver supports DatabaseMetaData for retrieving database information:

```java
try (Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.json")) {
    DatabaseMetaData meta = conn.getMetaData();

    // Get table information
    try (ResultSet tables = meta.getTables(null, null, "%", new String[]{"TABLE"})) {
        while (tables.next()) {
            String tableName = tables.getString("TABLE_NAME");
            System.out.println("Table: " + tableName);
        }
    }

    // Get column information
    try (ResultSet columns = meta.getColumns(null, null, "users", "%")) {
        while (columns.next()) {
            String columnName = columns.getString("COLUMN_NAME");
            String columnType = columns.getString("TYPE_NAME");
            System.out.println("Column: " + columnName + " - " + columnType);
        }
    }
}
```

## Auto-Save Behavior

The output file is automatically saved in the following scenarios:

1. **After data modifications** (in auto-commit mode)
2. **After commit** (when auto-commit is disabled)
3. **On connection close** (synchronous save to ensure all data is persisted)

### Disabling Auto-Save

To disable auto-save, simply don't specify the `outputFile` parameter:

```java
// No auto-save - changes are lost when connection closes
try (Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.json")) {
    // Changes are not saved
}
```

## Schema Registry

For in-memory schemas without file I/O, use the schema registry:

```java
// Register schema
import ai.justdb.justdb.jdbc.JustdbDriver;
import ai.justdb.justdb.schema.Justdb;

Justdb schema = loadYourSchema();
JustdbDriver.registerSchema("mySchema", schema);

// Connect using registered schema
try (Connection conn = DriverManager.getConnection("jdbc:justdb:registry:mySchema")) {
    // Use connection
}
```

## Complete Examples

### Example 1: Basic CRUD Operations

```java
import java.sql.*;

public class JustDBExample {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:justdb:/path/to/schema.json";

        try (Connection conn = DriverManager.getConnection(url)) {
            // Create table
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("""
                    CREATE TABLE products (
                        id BIGINT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        price DECIMAL(10, 2),
                        stock INT DEFAULT 0
                    )
                """);
            }

            // Insert data
            try (PreparedStatement pstmt = conn.prepareStatement(
                    "INSERT INTO products (id, name, price, stock) VALUES (?, ?, ?, ?)")) {
                pstmt.setLong(1, 1);
                pstmt.setString(2, "Laptop");
                pstmt.setBigDecimal(3, new BigDecimal("999.99"));
                pstmt.setInt(4, 50);
                pstmt.executeUpdate();
            }

            // Query data
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT * FROM products")) {
                while (rs.next()) {
                    System.out.println("Product: " + rs.getString("name") +
                                     ", Price: $" + rs.getBigDecimal("price"));
                }
            }

            // Update data
            try (PreparedStatement pstmt = conn.prepareStatement(
                    "UPDATE products SET stock = ? WHERE id = ?")) {
                pstmt.setInt(1, 45);
                pstmt.setLong(2, 1);
                int updated = pstmt.executeUpdate();
                System.out.println("Updated " + updated + " rows");
            }

            // Delete data
            try (PreparedStatement pstmt = conn.prepareStatement(
                    "DELETE FROM products WHERE id = ?")) {
                pstmt.setLong(1, 1);
                int deleted = pstmt.executeUpdate();
                System.out.println("Deleted " + deleted + " rows");
            }
        }
    }
}
```

### Example 2: Using Outputfile to Preserve User Changes

```java
import java.sql.*;

public class JustDBOutputFileExample {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:justdb:/path/to/schema.json?outputFile=/path/to/output.json";

        try (Connection conn = DriverManager.getConnection(url)) {
            Statement stmt = conn.createStatement();

            // User adds new table via SQL
            stmt.execute("""
                CREATE TABLE user_preferences (
                    user_id BIGINT PRIMARY KEY,
                    theme VARCHAR(50) DEFAULT 'light',
                    language VARCHAR(10) DEFAULT 'en',
                    notifications_enabled BOOLEAN DEFAULT true
                )
            """);

            // Insert initial preferences
            stmt.execute("""
                INSERT INTO user_preferences (user_id, theme, language, notifications_enabled)
                VALUES (1, 'dark', 'en', true)
            """);

        } // Connection close triggers auto-save to output.json
          // output.json now contains user_preferences table and data

        // Next connection automatically loads user_preferences table
        try (Connection conn = DriverManager.getConnection(url)) {
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT * FROM user_preferences");

            while (rs.next()) {
                System.out.println("User " + rs.getLong("user_id") +
                                 " prefers " + rs.getString("theme") + " theme");
            }
        }
    }
}
```

### Example 3: Schema Evolution with Migration

```java
import java.sql.*;

public class JustDBMigrationExample {
    public static void main(String[] args) throws Exception {
        // Scenario:
        // 1. schema.json defines base users table (id, name)
        // 2. output.json contains user-added email column
        // 3. migrate-v2.json adds new status column

        String url = "jdbc:justdb:/path/to/schema.json" +
                     "?outputFile=/path/to/output.json" +
                     "&migrate=/path/to/migrate-v2.json";

        try (Connection conn = DriverManager.getConnection(url)) {
            // Query final table structure
            DatabaseMetaData meta = conn.getMetaData();
            ResultSet columns = meta.getColumns(null, null, "users", null);

            System.out.println("Final users table structure:");
            while (columns.next()) {
                System.out.println("  - " + columns.getString("COLUMN_NAME") +
                                 ": " + columns.getString("TYPE_NAME"));
            }
            // Output:
            // Final users table structure:
            //   - id: BIGINT
            //   - name: VARCHAR
            //   - email: VARCHAR  (from output file)
            //   - status: VARCHAR  (from migration)
        }
    }
}
```

## Advanced Usage

### Multi-Schema Support

```java
// Multi-schema URL format
String url = "jdbc:justdb:schema1=/path1,schema2=/path2?default=schema1";

try (Connection conn = DriverManager.getConnection(url)) {
    // Use default schema
    // Can switch to other schemas
}
```

### Directory Scanning

```java
// Auto-scan all schema files in directory
String url = "jdbc:justdb:directory:/path/to/schemas?autoScan=true&default=main";

try (Connection conn = DriverManager.getConnection(url)) {
    // Automatically loads all schema files from directory
}
```

## FAQ

### Q: How do I view JustDB logs?

A: JustDB uses SLF4J for logging. Configure your logging framework (like Logback or Log4j2) to display logs from the `ai.justdb.justdb.jdbc` package.

```xml
<!-- logback.xml -->
<logger name="ai.justdb.justdb.jdbc" level="DEBUG"/>
```

### Q: Will the output file overwrite the original schema?

A: No. The original schema file remains unchanged. The output file is a separate file used to save runtime changes.

### Q: How do I use JustDB JDBC in Spring Boot?

A: See the [Spring Boot Integration Guide](./spring-boot-integration.html).

### Q: What SQL features does JustDB support?

A: JustDB supports standard SQL DDL and DML operations, including CREATE, ALTER, DROP, INSERT, UPDATE, DELETE, SELECT, and more. Refer to the documentation for specific supported features.

## Next Steps

<VPCard
  title="Spring Boot Integration"
  desc="Using JustDB in Spring Boot projects"
  link="/en/getting-started/spring-boot-integration.html"
/>

<VPCard
  title="Migration Basics"
  desc="Learn detailed mechanisms of Schema migration"
  link="/en/getting-started/migration-basics.html"
/>

<VPCard
  title="Common Tasks"
  desc="View common database operation examples"
  link="/en/getting-started/common-tasks.html"
/>
