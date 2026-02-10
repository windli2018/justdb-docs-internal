---
icon: code
title: JDBC Driver Implementation
order: 2
category:
  - Design Documentation
  - JDBC Driver
tag:
  - jdbc
  - implementation
---

# JDBC Driver Implementation

## Core Classes

### JustdbDriver

JDBC driver main entry point, responsible for driver registration and connection creation.

### JustdbDataSource

DataSource implementation, supports connection pool configuration.

### JustdbConnection

Connection implementation, manages transactions and statement creation.

### JustdbPreparedStatement

Prepared statement implementation, supports parameter binding.

### JustdbResultSet

ResultSet implementation, supports data traversal and type conversion.

## Connection URL Format

```
jdbc:justdb:memory:/schema.yaml
jdbc:justdb:file:/path/to/schema.yaml
jdbc:justdb:classpath:/schema.yaml
```

## Usage Example

```java
// Load driver
Class.forName("org.verydb.justdb.jdbc.JustdbDriver");

// Connect to in-memory database
Connection conn = DriverManager.getConnection(
    "jdbc:justdb:memory:/path/to/schema.yaml"
);

// Execute query
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery("SELECT * FROM users");

// Process results
while (rs.next()) {
    String username = rs.getString("username");
    System.out.println("User: " + username);
}

// Close
rs.close();
stmt.close();
conn.close();
```

## Supported Features

- **Standard SQL queries**: SELECT, INSERT, UPDATE, DELETE
- **Transaction management**: BEGIN, COMMIT, ROLLBACK
- **Prepared statements**: Parameterized queries
- **Metadata queries**: DatabaseMetaData interface
- **In-memory database**: No external database required

## Related Documentation

- [MySQL Protocol](./mysql-protocol.md) - MySQL protocol service implementation
- [Virtual Tables](./virtual-tables.md) - Virtual table support
