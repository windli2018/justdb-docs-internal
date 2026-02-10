---
title: Schema Deployer
icon: 🚀
description: SchemaDeployer API detailed reference for deploying Schema to database
order: 5
---

# Schema Deployer

SchemaDeployer provides the ability to deploy JustDB Schema to a target database. This document details the usage of the Schema deployer.

## Table of Contents

- [Deployer Overview](#deployer-overview)
- [Constructor Methods](#constructor-methods)
- [Deploy Methods](#deploy-methods)
- [Deploy Options](#deploy-options)
- [Lifecycle](#lifecycle)
- [Code Examples](#code-examples)

## Deployer Overview

SchemaDeployer is the core deployment component of JustDB, responsible for:

- Creating database objects (tables, views, indexes, constraints, etc.)
- Executing Schema changes
- Managing migration history
- Verifying Schema status

**Package Path**: `org.verydb.justdb.SchemaDeployer`

### Core Features

1. **Automatic Database Detection** - Automatically identifies database type
2. **SQL Generation** - Generates optimized SQL based on database type
3. **History Tracking** - Records all Schema changes
4. **Idempotency** - Supports version checking, avoids duplicate deployment
5. **Incremental Updates** - Supports Schema diff deployment

## Constructor Methods

SchemaDeployer provides multiple construction methods for different use cases.

### 1. Constructor with Database Connection

```java
public SchemaDeployer(Connection connection)
```

Creates a deployer connected to a database, automatically detects database type and enables history tracking.

**Example**:

```java
Connection connection = DriverManager.getConnection(
    "jdbc:mysql://localhost:3306/mydb"
);

SchemaDeployer deployer = new SchemaDeployer(connection);
```

### 2. Constructor with History Tracking Option

```java
public SchemaDeployer(Connection connection, boolean trackHistory)
```

Creates a deployer with optional history tracking.

**Parameters**:
- `connection` - Database connection
- `trackHistory` - Whether to track history

**Example**:

```java
// Don't track history
SchemaDeployer deployer = new SchemaDeployer(connection, false);

// Track history
SchemaDeployer deployer = new SchemaDeployer(connection, true);
```

### 3. Constructor with Custom History Manager

```java
public SchemaDeployer(Connection connection, SchemaHistoryManager historyManager)
```

Creates a deployer using a custom history manager.

**Example**:

```java
SchemaHistoryManager historyManager = new SchemaHistoryManager(connection);
SchemaDeployer deployer = new SchemaDeployer(connection, historyManager);
```

### 4. SQL Generation Mode Constructor

```java
public SchemaDeployer()
public SchemaDeployer(String databaseType)
```

Creates a deployer for SQL generation only (no database connection required).

**Example**:

```java
// Use default database type (MySQL)
SchemaDeployer deployer = new SchemaDeployer();

// Specify database type
SchemaDeployer deployer = new SchemaDeployer("postgresql");
```

## Deploy Methods

### deploy()

Deploys the complete Schema to the database.

```java
public void deploy(Justdb expected) throws SQLException
```

**Parameters**:
- `expected` - Expected Schema definition

**Behavior**:
1. Process SERIAL columns for all tables, generate corresponding sequences
2. Create sequences
3. Create tables
4. Create views
5. Create indexes
6. Create constraints

**Example**:

```java
Justdb justdb = new Justdb();
// ... set up Schema

Connection connection = DriverManager.getConnection("jdbc:mysql://localhost:3306/mydb");
SchemaDeployer deployer = new SchemaDeployer(connection);

deployer.deploy(justdb);
```

### deployDiff()

Deploys Schema differences to the database (incremental migration).

```java
public void deployDiff(Justdb diffSchema) throws SQLException
```

**Parameters**:
- `diffSchema` - Schema containing changes (each object has changeType attribute)

**Change Types**:
- `ADDED` - Create new object
- `REMOVED` - Delete object
- `RENAMED` - Rename object
- `MODIFIED` - Modify object

**Example**:

```java
// Calculate differences
CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
diff.calculateAll();

// Convert to diff schema
Justdb diffSchema = diff.toDiffSchema();

// Deploy differences
SchemaDeployer deployer = new SchemaDeployer(connection);
deployer.deployDiff(diffSchema);
```

### deployIfNotApplied()

Deployment with version checking (idempotent).

```java
public boolean deployIfNotApplied(Justdb schema, String version, String description)
    throws SQLException
```

**Parameters**:
- `schema` - Schema to deploy
- `version` - Version identifier
- `description` - Deployment description

**Returns**: `true` - deployed, `false` - skipped

**Example**:

```java
SchemaDeployer deployer = new SchemaDeployer(connection);

boolean deployed = deployer.deployIfNotApplied(
    justdb,
    "v1.0.0",
    "Initial schema deployment"
);

if (deployed) {
    System.out.println("Schema deployed successfully");
} else {
    System.out.println("Schema already at v1.0.0, skipped");
}
```

### deployDiffIfNotApplied()

Version-checked diff deployment.

```java
public boolean deployDiffIfNotApplied(Justdb diffSchema, String version, String description)
    throws SQLException
```

**Parameters**:
- `diffSchema` - Diff Schema
- `version` - Version identifier
- `description` - Deployment description

**Returns**: `true` - deployed, `false` - skipped

**Example**:

```java
boolean deployed = deployer.deployDiffIfNotApplied(
    diffSchema,
    "v1.1.0",
    "Add email column to users table"
);
```

### withVersion()

Sets the current deployment version (chained call).

```java
public SchemaDeployer withVersion(String version)
```

**Example**:

```java
deployer.withVersion("v1.0.0").deploy(justdb);
```

## Deploy Options

### History Management

**Get history manager**:

```java
public SchemaHistoryManager getHistoryManager()
```

**Set history manager**:

```java
public void setHistoryManager(SchemaHistoryManager historyManager)
```

**Check if version is applied**:

```java
public boolean isVersionApplied(String version)
```

**Get list of applied versions**:

```java
public List<String> getAppliedVersions()
```

**Get latest applied version**:

```java
public String getLatestAppliedVersion()
```

**Check if database is at specified version**:

```java
public boolean isUpToDate(String version)
```

### SQL Generation

**Generate SQL scripts** (without execution):

```java
public List<String> generateScripts(Justdb schema)
```

**Example**:

```java
SchemaDeployer deployer = new SchemaDeployer("mysql");
List<String> scripts = deployer.generateScripts(justdb);

for (String script : scripts) {
    System.out.println(script);
}
```

### Schema Verification

**Verify if Schema matches database**:

```java
public SchemaVerificationResult verifySchema(Justdb expectedSchema)
```

**Returns**: `SchemaVerificationResult` - Contains verification result and detailed information

**Example**:

```java
SchemaDeployer deployer = new SchemaDeployer(connection);
SchemaVerificationResult result = deployer.verifySchema(justdb);

if (result.isSuccess()) {
    System.out.println("Schema verification passed");
} else {
    System.out.println("Schema verification failed:");
    for (String difference : result.getDifferences()) {
        System.out.println("  - " + difference);
    }
}
```

## Lifecycle

### Deployment Flow

```
1. Initialization
   ├─ Detect database type
   ├─ Initialize DBGenerator
   └─ Initialize history manager

2. Preprocessing
   ├─ Deep copy table definitions
   └─ Preprocess columns (SERIAL → Sequence)

3. Create Sequences
   ├─ Table-level sequences (generated from SERIAL columns)
   └─ Schema-level sequences

4. Create Tables
   ├─ Generate CREATE TABLE SQL
   ├─ Execute SQL
   └─ Record changes

5. Create Views
6. Create Indexes
7. Create Constraints

8. Record History
   └─ Save deployment record
```

### Error Handling

```java
try {
    deployer.deploy(justdb);
} catch (SQLException e) {
    // Handle deployment failure
    System.err.println("Deployment failed: " + e.getMessage());

    // Check history
    SchemaHistoryManager history = deployer.getHistoryManager();
    if (history != null) {
        List<String> appliedVersions = history.getAppliedVersions();
        System.out.println("Applied versions: " + appliedVersions);
    }
}
```

## Code Examples

### Basic Deployment

```java
import org.verydb.justdb.SchemaDeployer;
import org.verydb.justdb.schema.*;
import java.sql.*;
import java.util.Arrays;

public class BasicDeployment {
    public static void main(String[] args) throws SQLException {
        // Create Schema
        Justdb justdb = new Justdb();

        Table usersTable = new Table("users");
        usersTable.setComment("User table");

        Column idColumn = new Column();
        idColumn.setName("id");
        idColumn.setType("BIGINT");
        idColumn.setPrimaryKey(true);
        idColumn.setAutoIncrement(true);

        Column nameColumn = new Column();
        nameColumn.setName("username");
        nameColumn.setType("VARCHAR(50)");
        nameColumn.setNullable(false);

        usersTable.setColumns(Arrays.asList(idColumn, nameColumn));
        justdb.setTables(Arrays.asList(usersTable));

        // Deploy to database
        Connection connection = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/mydb",
            "root",
            "password"
        );

        SchemaDeployer deployer = new SchemaDeployer(connection);
        deployer.deploy(justdb);

        System.out.println("Schema deployed successfully");

        connection.close();
    }
}
```

### Incremental Deployment

```java
import org.verydb.justdb.SchemaDeployer;
import org.verydb.justdb.schema.*;
import java.sql.*;

public class IncrementalDeployment {
    public static void main(String[] args) throws SQLException {
        Connection connection = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/mydb"
        );

        SchemaDeployer deployer = new SchemaDeployer(connection);

        // Create diff Schema
        Justdb diffSchema = new Justdb();

        Table tableDiff = new Table("users");
        tableDiff.setChangeType(ChangeType.MODIFIED);

        // Add new column
        Column emailColumn = new Column();
        emailColumn.setName("email");
        emailColumn.setType("VARCHAR(100)");
        emailColumn.setChangeType(ChangeType.ADDED);

        tableDiff.setColumns(Arrays.asList(emailColumn));
        diffSchema.setTables(Arrays.asList(tableDiff));

        // Deploy diff
        deployer.deployDiff(diffSchema);

        System.out.println("Incremental deployment completed");

        connection.close();
    }
}
```

### Versioned Deployment

```java
import org.verydb.justdb.SchemaDeployer;
import org.verydb.justdb.schema.*;
import java.sql.*;

public class VersionedDeployment {
    public static void main(String[] args) throws SQLException {
        Connection connection = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/mydb"
        );

        SchemaDeployer deployer = new SchemaDeployer(connection);

        // Create Schema
        Justdb justdb = createSchema();

        // Deploy with version
        boolean deployed = deployer.deployIfNotApplied(
            justdb,
            "v1.0.0",
            "Initial schema deployment"
        );

        if (deployed) {
            System.out.println("Schema v1.0.0 deployed");

            // Check version
            String latestVersion = deployer.getLatestAppliedVersion();
            System.out.println("Latest version: " + latestVersion);
        } else {
            System.out.println("Schema v1.0.0 already deployed, skipped");
        }

        connection.close();
    }

    private static Justdb createSchema() {
        Justdb justdb = new Justdb();
        // ... build Schema
        return justdb;
    }
}
```

### SQL Generation Mode

```java
import org.verydb.justdb.SchemaDeployer;
import org.verydb.justdb.schema.*;
import java.util.*;

public class SqlGeneration {
    public static void main(String[] args) {
        // Create Schema
        Justdb justdb = new Justdb();
        // ... build Schema

        // SQL generation mode (no database connection needed)
        SchemaDeployer deployer = new SchemaDeployer("postgresql");

        List<String> scripts = deployer.generateScripts(justdb);

        System.out.println("-- PostgreSQL SQL Scripts");
        System.out.println();

        for (int i = 0; i < scripts.size(); i++) {
            System.out.println("-- Script " + (i + 1));
            System.out.println(scripts.get(i));
            System.out.println();
        }
    }
}
```

### Schema Verification

```java
import org.verydb.justdb.SchemaDeployer;
import org.verydb.justdb.SchemaDeployer.SchemaVerificationResult;
import org.verydb.justdb.schema.*;
import java.sql.*;

public class SchemaVerification {
    public static void main(String[] args) throws SQLException {
        Connection connection = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/mydb"
        );

        SchemaDeployer deployer = new SchemaDeployer(connection);

        // Create expected Schema
        Justdb expectedSchema = createExpectedSchema();

        // Verify Schema
        SchemaVerificationResult result = deployer.verifySchema(expectedSchema);

        if (result.isSuccess()) {
            System.out.println("✓ Schema verification passed");
        } else {
            System.out.println("✗ Schema verification failed:");
            System.out.println("Messages:");
            for (String message : result.getMessages()) {
                System.out.println("  - " + message);
            }
            System.out.println("Differences:");
            for (String difference : result.getDifferences()) {
                System.out.println("  - " + difference);
            }
        }

        connection.close();
    }

    private static Justdb createExpectedSchema() {
        // Create expected Schema
        return new Justdb();
    }
}
```

### Multi-Database Support

```java
import org.verydb.justdb.SchemaDeployer;
import org.verydb.justdb.schema.*;
import java.util.*;

public class MultiDatabaseSupport {
    public static void main(String[] args) {
        Justdb justdb = createSchema();

        // Supported database types
        String[] databases = {"mysql", "postgresql", "oracle", "h2"};

        for (String dbType : databases) {
            System.out.println("=== " + dbType.toUpperCase() + " ===");

            SchemaDeployer deployer = new SchemaDeployer(dbType);
            List<String> scripts = deployer.generateScripts(justdb);

            for (String script : scripts) {
                System.out.println(script);
                System.out.println();
            }
        }
    }

    private static Justdb createSchema() {
        Justdb justdb = new Justdb();
        // ... build Schema
        return justdb;
    }
}
```

## Best Practices

### 1. Use Version Management

```java
// Always use versioned deployment
deployer.withVersion("v1.0.0").deploy(justdb);

// Or use idempotent deployment
deployer.deployIfNotApplied(justdb, "v1.0.0", "Initial deployment");
```

### 2. Error Handling

```java
try {
    deployer.deploy(justdb);
} catch (SQLException e) {
    // Log error
    log.error("Deployment failed", e);

    // Check and recover
    if (deployer.getLatestAppliedVersion() != null) {
        log.info("Last successful version: {}",
            deployer.getLatestAppliedVersion());
    }

    throw e;
}
```

### 3. Pre-deployment Verification

```java
// Verify Schema before deployment
SchemaVerificationResult result = deployer.verifySchema(justdb);
if (!result.isSuccess()) {
    throw new IllegalStateException("Schema verification failed: " +
        result.getDifferences());
}

// Deploy after verification passes
deployer.deploy(justdb);
```

### 4. Incremental Updates

```java
// Use diff deployment for incremental updates
CanonicalSchemaDiff diff = new CanonicalSchemaDiff(current, target);
diff.calculateAll();

Justdb diffSchema = diff.toDiffSchema();
deployer.deployDiffIfNotApplied(diffSchema, "v1.1.0", "Add new features");
```

## Related Documentation

- [Java API Reference](./java-api.md) - Core Java API
- [Schema Loader](./schema-loader.md) - Schema loading details
- [Schema Diff Calculation](./schema-diff.md) - Schema diff calculation details
- [JDBC Driver](./jdbc-driver.md) - JDBC driver usage guide
