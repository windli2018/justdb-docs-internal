---
title: JDBC Driver Reference
icon: plug
description: JustDB JDBC driver complete reference, including connection strings, supported features, and usage examples
order: 3
---

# JDBC Driver Reference

JustDB provides a standard JDBC driver that allows accessing JustDB Schema through the JDBC API. This document details the usage of the JDBC driver.

## Table of Contents

- [Driver Overview](#driver-overview)
- [Connection Strings](#connection-strings)
- [Connection Properties](#connection-properties)
- [Supported JDBC Features](#supported-jdbc-features)
- [Usage Examples](#usage-examples)
- [Migration Mode](#migration-mode)
- [Schema Registry](#schema-registry)
- [Limitations](#limitations)

## Driver Overview

JustDB JDBC driver implements core JDBC API functionality, supporting:

- Standard JDBC connection management
- SQL query execution
- PreparedStatement support
- Metadata queries
- Transaction management (basic support)
- Multi-Schema support

**Driver Class**: `ai.justdb.justdb.jdbc.JustdbDriver`

**JDBC URL Prefix**: `jdbc:justdb:`

## Connection Strings

### Single Schema Connection

Basic format: `jdbc:justdb:schema-file-path[?parameter=value&...]`

**Examples**:

```java
// JSON Schema
Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.json");

// XML Schema
Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.xml");

// YAML Schema
Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.yaml");

// Connection with parameters
Connection conn = DriverManager.getConnection(
    "jdbc:justdb:./schema.json?readonly=true&autocommit=false"
);

// In-memory Schema (empty)
Connection conn = DriverManager.getConnection("jdbc:justdb:memory:");

// In-memory Schema (loaded from file)
Connection conn = DriverManager.getConnection("jdbc:justdb:memory:schema.json");
```

### Multi-Schema Connection

Support connecting multiple Schema files simultaneously.

**Format**:

1. **Implicit Naming** (use filename as Schema name):
   ```
   jdbc:justdb:/path1/schema1.json,/path2/schema2.xml?default=schema1
   ```

2. **Explicit Naming**:
   ```
   jdbc:justdb:schema1=/path1/schema.json,schema2=/path2/schema.xml?default=schema1
   ```

3. **Directory Scanning**:
   ```
   jdbc:justdb:directory:/path/to/schemas?autoScan=true&default=schema1
   ```

**Code Example**:

```java
// Multi-Schema connection
String url = "jdbc:justdb:schema1=./db1.json,schema2=./db2.json?default=schema1";
Connection conn = DriverManager.getConnection(url);

// Use different Schemas
Statement stmt = conn.createStatement();
stmt.execute("USE schema2");
ResultSet rs = stmt.executeQuery("SELECT * FROM users");
```

## Connection Properties

### JDBC Standard Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `user` | String | "" | Username (for logging) |
| `password` | String | "" | Password (for logging) |
| `readonly` | boolean | false | Read-only mode |
| `autocommit` | boolean | true | Auto-commit |

### JustDB Extended Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `outputSchema` | String | ".justdb" | Schema output directory |
| `outputFile` | String | - | Schema output file path |
| `create` | boolean | false | Create Schema if not exists |
| `migrate` | String | - | Migration Schema file path |
| `default` | String | - | Default Schema name (multi-Schema) |
| `autoScan` | boolean | false | Auto-scan directory |

**Code Example**:

```java
Properties props = new Properties();
props.setProperty("readonly", "true");
props.setProperty("autocommit", "false");
props.setProperty("user", "admin");
props.setProperty("outputSchema", "./output");

Connection conn = DriverManager.getConnection(
    "jdbc:justdb:./schema.json",
    props
);
```

## Supported JDBC Features

### Connection Interface

| Method | Support | Description |
|--------|----------|-------------|
| `createStatement()` | ✅ | Create Statement |
| `prepareStatement(String)` | ✅ | Create PreparedStatement |
| `prepareCall(String)` | ⚠️ | Partial support |
| `getMetaData()` | ✅ | Get database metadata |
| `commit()` | ✅ | Commit transaction |
| `rollback()` | ✅ | Rollback transaction |
| `setAutoCommit(boolean)` | ✅ | Set auto-commit |
| `getAutoCommit()` | ✅ | Get auto-commit status |
| `close()` | ✅ | Close connection |
| `isClosed()` | ✅ | Check if connection closed |
| `setReadOnly(boolean)` | ✅ | Set read-only mode |
| `isReadOnly()` | ✅ | Get read-only status |

### Statement Interface

| Method | Support | Description |
|--------|----------|-------------|
| `execute(String)` | ✅ | Execute SQL statement |
| `executeQuery(String)` | ✅ | Execute query |
| `executeUpdate(String)` | ✅ | Execute update |
| `executeBatch()` | ✅ | Batch execution |
| `addBatch(String)` | ✅ | Add to batch |
| `clearBatch()` | ✅ | Clear batch |
| `getResultSet()` | ✅ | Get result set |
| `getUpdateCount()` | ✅ | Get update count |
| `close()` | ✅ | Close statement |

### PreparedStatement Interface

| Method | Support | Description |
|--------|----------|-------------|
| `setXxx(int, xxx)` | ✅ | Set parameter |
| `executeQuery()` | ✅ | Execute query |
| `executeUpdate()` | ✅ | Execute update |
| `execute()` | ✅ | Execute statement |
| `getParameterMetaData()` | ✅ | Get parameter metadata |

### ResultSet Interface

| Method | Support | Description |
|--------|----------|-------------|
| `next()` | ✅ | Move to next row |
| `getXxx(String)` | ✅ | Get value by column name |
| `getXxx(int)` | ✅ | Get value by column index |
| `findColumn(String)` | ✅ | Find column index |
| `getMetaData()` | ✅ | Get result set metadata |
| `close()` | ✅ | Close result set |

### DatabaseMetaData Interface

| Method | Support | Description |
|--------|----------|-------------|
| `getTables()` | ✅ | Get table list |
| `getColumns()` | ✅ | Get column information |
| `getIndexInfo()` | ✅ | Get index information |
| `getPrimaryKeys()` | ✅ | Get primary key information |
| `getDatabaseProductName()` | ✅ | Get database name |
| `getDatabaseProductVersion()` | ✅ | Get database version |

## Usage Examples

### Basic Query

```java
import java.sql.*;

public class BasicQuery {
    public static void main(String[] args) throws SQLException {
        // Establish connection
        Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.json");

        // Create Statement
        Statement stmt = conn.createStatement();

        // Execute query
        ResultSet rs = stmt.executeQuery("SELECT * FROM users");

        // Process results
        while (rs.next()) {
            Long id = rs.getLong("id");
            String username = rs.getString("username");
            String email = rs.getString("email");
            System.out.println(id + ": " + username + " (" + email + ")");
        }

        // Close resources
        rs.close();
        stmt.close();
        conn.close();
    }
}
```

### PreparedStatement

```java
import java.sql.*;

public class PreparedStatementExample {
    public static void main(String[] args) throws SQLException {
        Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.json");

        // Use PreparedStatement
        String sql = "SELECT * FROM users WHERE username = ? AND status = ?";
        PreparedStatement pstmt = conn.prepareStatement(sql);

        pstmt.setString(1, "admin");
        pstmt.setString(2, "active");

        ResultSet rs = pstmt.executeQuery();

        while (rs.next()) {
            System.out.println("User: " + rs.getString("username"));
        }

        rs.close();
        pstmt.close();
        conn.close();
    }
}
```

### Transaction Processing

```java
import java.sql.*;

public class TransactionExample {
    public static void main(String[] args) throws SQLException {
        Connection conn = DriverManager.getConnection(
            "jdbc:justdb:./schema.json?autocommit=false"
        );

        try {
            // Disable auto-commit
            conn.setAutoCommit(false);

            // Execute multiple operations
            Statement stmt = conn.createStatement();

            stmt.executeUpdate("INSERT INTO users (username, email) VALUES ('user1', 'user1@example.com')");
            stmt.executeUpdate("INSERT INTO users (username, email) VALUES ('user2', 'user2@example.com')");

            // Commit transaction
            conn.commit();

            stmt.close();
        } catch (SQLException e) {
            // Rollback transaction
            conn.rollback();
            throw e;
        } finally {
            conn.close();
        }
    }
}
```

### Batch Operations

```java
import java.sql.*;

public class BatchExample {
    public static void main(String[] args) throws SQLException {
        Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.json");

        Statement stmt = conn.createStatement();

        // Add batch operations
        stmt.addBatch("INSERT INTO users (username, email) VALUES ('user1', 'user1@example.com')");
        stmt.addBatch("INSERT INTO users (username, email) VALUES ('user2', 'user2@example.com')");
        stmt.addBatch("INSERT INTO users (username, email) VALUES ('user3', 'user3@example.com')");

        // Execute batch
        int[] counts = stmt.executeBatch();

        System.out.println("Affected rows: " + Arrays.toString(counts));

        stmt.close();
        conn.close();
    }
}
```

### Metadata Query

```java
import java.sql.*;

public class MetadataExample {
    public static void main(String[] args) throws SQLException {
        Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.json");

        DatabaseMetaData metaData = conn.getMetaData();

        // Get table information
        ResultSet tables = metaData.getTables(null, null, "%", new String[]{"TABLE"});
        while (tables.next()) {
            String tableName = tables.getString("TABLE_NAME");
            System.out.println("Table: " + tableName);
        }

        // Get column information
        ResultSet columns = metaData.getColumns(null, null, "users", "%");
        while (columns.next()) {
            String columnName = columns.getString("COLUMN_NAME");
            String columnType = columns.getString("TYPE_NAME");
            int columnSize = columns.getInt("COLUMN_SIZE");
            System.out.println("Column: " + columnName + " " + columnType + "(" + columnSize + ")");
        }

        conn.close();
    }
}
```

## Migration Mode

JustDB JDBC driver supports automatic Schema migration through the `migrate` parameter specifying target Schema.

**Migration Process**:

1. Load current Schema
2. Load target Schema
3. Calculate differences
4. Generate migration SQL
5. Execute migration
6. Update to target Schema

**Connection String Example**:

```java
String url = "jdbc:justdb:./current-schema.json?migrate=./target-schema.json";
Connection conn = DriverManager.getConnection(url);
```

**Complete Example**:

```java
import java.sql.*;

public class MigrationExample {
    public static void main(String[] args) throws SQLException {
        // Create connection with migration
        String url = "jdbc:justdb:./v1/schema.json?migrate=./v2/schema.json";
        Connection conn = DriverManager.getConnection(url);

        // Migration completes automatically, can use new Schema structure
        Statement stmt = conn.createStatement();

        // Use new column from v2
        ResultSet rs = stmt.executeQuery("SELECT id, username, email, new_column FROM users");

        while (rs.next()) {
            System.out.println(rs.getString("username"));
        }

        conn.close();
    }
}
```

## Schema Registry

Schema registry allows registering Schemas in memory, then referencing them through JDBC URL.

### Register Schema

```java
import ai.justdb.justdb.jdbc.JustdbDriver;
import ai.justdb.justdb.schema.Justdb;
import ai.justdb.justdb.schema.Table;
import ai.justdb.justdb.schema.Column;
import java.sql.*;

public class RegistryExample {
    public static void main(String[] args) throws SQLException {
        // Create in-memory Schema
        Justdb justdb = new Justdb();
        justdb.setId("in-memory-users");

        Table usersTable = new Table("users");
        Column idColumn = new Column();
        idColumn.setName("id");
        idColumn.setType("BIGINT");
        idColumn.setPrimaryKey(true);

        Column nameColumn = new Column();
        nameColumn.setName("username");
        nameColumn.setType("VARCHAR(50)");

        usersTable.setColumns(Arrays.asList(idColumn, nameColumn));
        justdb.setTables(Arrays.asList(usersTable));

        // Register Schema
        JustdbDriver.registerSchema("my-schema", justdb);

        // Use registered Schema
        Connection conn = DriverManager.getConnection("jdbc:justdb:registry:my-schema");

        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT * FROM users");

        while (rs.next()) {
            System.out.println(rs.getString("username"));
        }

        conn.close();

        // Unregister Schema (optional)
        JustdbDriver.unregisterSchema("my-schema");
    }
}
```

### Schema Registry API

| Method | Description |
|--------|-------------|
| `registerSchema(String id, Justdb schema)` | Register Schema |
| `unregisterSchema(String id)` | Unregister Schema |
| `getRegisteredSchema(String id)` | Get registered Schema |
| `isSchemaRegistered(String id)` | Check if Schema is registered |
| `getRegisteredSchemaIds()` | Get all registered Schema IDs |
| `clearRegistry()` | Clear registry |

## Limitations

### JDBC Compatibility

JustDB JDBC driver is **not fully JDBC compliant**. The following limitations should be noted:

1. **Transaction Support**: Only supports basic transaction management, no advanced features like savepoint
2. **Stored Procedures**: Does not support `prepareCall()` and stored procedure calls
3. **ResultSet Types**: Only supports `TYPE_FORWARD_ONLY` result sets
4. **Concurrency Control**: Does not support concurrent modification and row-level locks
5. **SQL Syntax**: Supports JustDB-supported SQL subset

### Performance Considerations

1. **Memory Usage**: Data is loaded into memory, not suitable for large data scenarios
2. **Concurrency**: Multi-threaded access requires external synchronization
3. **Persistence**: Data changes require manual save trigger

### Feature Limitations

1. **Database Functions**: Supports limited SQL function set
2. **Connection Pool**: Does not support connection pooling
3. **Distributed Transactions**: Does not support XA transactions

## Best Practices

### 1. Resource Management

```java
try (Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.json");
     Statement stmt = conn.createStatement();
     ResultSet rs = stmt.executeQuery("SELECT * FROM users")) {

    while (rs.next()) {
        // Process results
    }
} // Auto-close resources
```

### 2. Error Handling

```java
try (Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.json")) {
    conn.setAutoCommit(false);

    try (Statement stmt = conn.createStatement()) {
        // Execute operations
        stmt.executeUpdate("INSERT INTO users ...");

        conn.commit();
    } catch (SQLException e) {
        conn.rollback();
        throw e;
    }
}
```

### 3. Schema Management

```java
// Use try-with-resources to ensure resource release
try (Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.json")) {
    // Use connection
}
```

## Related Documentation

- [Java API Reference](./java-api.md) - Core Java API
- [Schema Loader](./schema-loader.md) - Schema loading details
- [Schema Deployer](./schema-deployer.md) - Schema deployment details
- [Schema Diff Calculation](./schema-diff.md) - Schema diff calculation details
