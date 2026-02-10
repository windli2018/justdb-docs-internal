---
title: Schema Loader
icon: 📥
description: SchemaLoader API detailed reference for loading Schema from multiple formats and data sources
order: 4
---

# Schema Loader

JustDB provides a flexible Schema loader that supports loading Schema definitions from multiple formats and data sources. This document details the usage of the Schema loader.

## Table of Contents

- [Loader Overview](#loader-overview)
- [SchemaLoaderFactory](#schemaloaderfactory)
- [Supported Formats](#supported-formats)
- [Supported Data Sources](#supported-data-sources)
- [Loading Options](#loading-options)
- [Code Examples](#code-examples)

## Loader Overview

The Schema loader is responsible for reading and parsing Schema definitions from various sources. JustDB provides a unified loading interface supporting multiple formats and data sources.

### Core Interfaces

**ISchemaLoader** - Schema loader interface

```java
public interface ISchemaLoader {
    boolean canLoad(String source);
    Justdb load(ExtensionPointRegistryView registry, String source, SchemaLoadConfig config) throws Exception;
    String[] getSupportedProtocols();
}
```

**SchemaLocation** - Schema location handler (factory pattern usage)

```java
public interface SchemaLocation {
    boolean supports(String location);
    List<Loaded<Justdb>> load(String location, List<String> fileTypes, JustdbManager manager);
}
```

## SchemaLoaderFactory

Factory class for loading Schema from various locations.

**Package Path**: `org.verydb.justdb.util.schema.SchemaLoaderFactory`

### Core Methods

#### load()

Loads a single Schema from a specified location.

```java
public static Loaded<Justdb> load(String location, JustdbManager manager)
```

**Parameters**:
- `location` - Schema location (file path, URL, etc.)
- `manager` - JustdbManager instance

**Returns**: `Loaded<Justdb>` - Encapsulates loading result

**Example**:

```java
JustdbManager manager = JustdbManager.getInstance();

// Load from file
Loaded<Justdb> result = SchemaLoaderFactory.load("schema.json", manager);
if (result.isSuccess()) {
    Justdb justdb = result.getData();
}
```

#### loadAll()

Loads multiple Schemas from a specified location (supports directory scanning).

```java
public static List<Loaded<Justdb>> loadAll(String location, List<String> fileTypes, JustdbManager manager)
```

**Parameters**:
- `location` - Schema location
- `fileTypes` - File type filter (null means default types)
- `manager` - JustdbManager instance

**Returns**: `List<Loaded<Justdb>>` - List of loading results

**Default File Types**: xml, json, yaml, yml, toml, sql

**Example**:

```java
// Load all Schemas in directory
List<Loaded<Justdb>> results = SchemaLoaderFactory.loadAll("./schemas", null, manager);

// Load only JSON files
List<Loaded<Justdb>> results = SchemaLoaderFactory.loadAll(
    "./schemas",
    Arrays.asList("json"),
    manager
);
```

#### registerHandler()

Registers custom Schema location handler.

```java
public static void registerHandler(SchemaLocation handler)
```

#### getHandlers()

Gets all registered handlers.

```java
public static List<SchemaLocation> getHandlers()
```

## Supported Formats

JustDB supports multiple Schema definition formats, automatically recognized by file extension.

### JSON (.json)

```json
{
  "namespace": "com.example",
  "tables": [
    {
      "name": "users",
      "comment": "User table",
      "columns": [
        {
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true,
          "autoIncrement": true
        },
        {
          "name": "username",
          "type": "VARCHAR(50)",
          "nullable": false
        }
      ]
    }
  ]
}
```

### XML (.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb namespace="com.example">
  <Table name="users" comment="User table">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="username" type="VARCHAR(50)" nullable="false"/>
  </Table>
</Justdb>
```

### YAML (.yaml, .yml)

```yaml
namespace: com.example
tables:
  - name: users
    comment: "User table"
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
      - name: username
        type: VARCHAR(50)
        nullable: false
```

### TOML (.toml)

```toml
namespace = "com.example"

[[tables]]
name = "users"
comment = "User table"

[[tables.columns]]
name = "id"
type = "BIGINT"
primaryKey = true
autoIncrement = true

[[tables.columns]]
name = "username"
type = "VARCHAR(50)"
nullable = false
```

## Supported Data Sources

### 1. File System

**Protocol**: `file://` or empty (default)

**Examples**:

```java
// Absolute path
SchemaLoaderFactory.load("file:///path/to/schema.json", manager);

// Relative path
SchemaLoaderFactory.load("./schema.json", manager);

// No protocol prefix
SchemaLoaderFactory.load("/path/to/schema.xml", manager);
```

### 2. Classpath Resources

**Protocol**: `classpath:` or `resource:`

**Examples**:

```java
// classpath protocol
SchemaLoaderFactory.load("classpath:schema.json", manager);

// resource protocol
SchemaLoaderFactory.load("resource:schema.xml", manager);
```

### 3. HTTP/HTTPS

**Protocol**: `http://` or `https://`

**Examples**:

```java
SchemaLoaderFactory.load("https://example.com/schema.json", manager);
SchemaLoaderFactory.load("http://localhost:8080/schema.xml", manager);
```

### 4. Project Directory

**Protocol**: `project:`

**Examples**:

```java
// Load from project root directory
SchemaLoaderFactory.load("project:schema.json", manager);
```

### 5. Git Repository

**Protocol**: `git:`

**Examples**:

```java
// Load from Git repository
SchemaLoaderFactory.load("git:https://github.com/user/repo.git:schema.json", manager);
```

### 6. Maven URL

**Protocol**: `mvn:`

**Examples**:

```java
// Load from Maven repository
SchemaLoaderFactory.load("mvn:com.example:schemas:1.0.0:schema.json", manager);
```

### 7. In-Memory Schema

Use in-memory Schema through Schema registry.

**Examples**:

```java
// Register in-memory Schema
JustdbDriver.registerSchema("my-schema", justdb);

// Access via registry protocol
SchemaLoaderFactory.load("registry:my-schema", manager);
```

## Loading Options

### SchemaLoadConfig

Configures Schema loading behavior.

**Package Path**: `org.verydb.justdb.util.SchemaLoadConfig`

**Core Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `validate` | boolean | Whether to validate Schema |
| `resolveReferences` | boolean | Whether to resolve references |
| `processExtensions` | boolean | Whether to process extensions |
| `failOnError` | boolean | Whether to fail on errors |

**Example**:

```java
SchemaLoadConfig config = new SchemaLoadConfig();
config.setValidate(true);
config.setResolveReferences(true);
config.setProcessExtensions(true);
config.setFailOnError(false);

ISchemaLoader loader = new ManagedSchemaLoader();
Justdb justdb = loader.load(registry, "schema.json", config);
```

### Loading Result

**Loaded<Justdb>** - Encapsulates loading result

```java
public class Loaded<T> {
    public boolean isSuccess();        // Whether successful
    public T getData();               // Get data
    public String getLocation();       // Get location
    public Exception getError();       // Get error
    public String getErrorMessage();   // Get error message
}
```

**Usage Example**:

```java
Loaded<Justdb> result = SchemaLoaderFactory.load("schema.json", manager);

if (result.isSuccess()) {
    Justdb justdb = result.getData();
    System.out.println("Loaded from: " + result.getLocation());
} else {
    System.err.println("Failed to load: " + result.getErrorMessage());
    result.getError().printStackTrace();
}
```

## Code Examples

### Basic Loading

```java
import org.verydb.justdb.JustdbManager;
import org.verydb.justdb.util.schema.SchemaLoaderFactory;
import org.verydb.justdb.cli.Loaded;
import org.verydb.justdb.schema.Justdb;

public class BasicLoading {
    public static void main(String[] args) {
        JustdbManager manager = JustdbManager.getInstance();

        // Load from file
        Loaded<Justdb> result = SchemaLoaderFactory.load("schema.json", manager);

        if (result.isSuccess()) {
            Justdb justdb = result.getData();
            System.out.println("Schema loaded successfully!");
            System.out.println("Tables: " + justdb.getTables().size());
        } else {
            System.err.println("Failed to load schema: " + result.getErrorMessage());
        }
    }
}
```

### Loading from Multiple Sources

```java
import org.verydb.justdb.JustdbManager;
import org.verydb.justdb.util.schema.SchemaLoaderFactory;
import org.verydb.justdb.cli.Loaded;
import org.verydb.justdb.schema.Justdb;
import java.util.List;

public class MultiSourceLoading {
    public static void main(String[] args) {
        JustdbManager manager = JustdbManager.getInstance();

        // Load from file
        Loaded<Justdb> fileResult = SchemaLoaderFactory.load("./schema.json", manager);
        printResult("File", fileResult);

        // Load from classpath
        Loaded<Justdb> classpathResult = SchemaLoaderFactory.load(
            "classpath:default-schema.xml",
            manager
        );
        printResult("Classpath", classpathResult);

        // Load from HTTP
        Loaded<Justdb> httpResult = SchemaLoaderFactory.load(
            "https://example.com/schema.json",
            manager
        );
        printResult("HTTP", httpResult);
    }

    private static void printResult(String source, Loaded<Justdb> result) {
        if (result.isSuccess()) {
            Justdb justdb = result.getData();
            System.out.println(source + " loaded: " + justdb.getTables().size() + " tables");
        } else {
            System.err.println(source + " failed: " + result.getErrorMessage());
        }
    }
}
```

### Directory Scanning

```java
import org.verydb.justdb.JustdbManager;
import org.verydb.justdb.util.schema.SchemaLoaderFactory;
import org.verydb.justdb.cli.Loaded;
import org.verydb.justdb.schema.Justdb;
import java.util.List;

public class DirectoryScan {
    public static void main(String[] args) {
        JustdbManager manager = JustdbManager.getInstance();

        // Scan all Schema files in directory
        List<Loaded<Justdb>> results = SchemaLoaderFactory.loadAll(
            "./schemas",
            null,  // Use default file types
            manager
        );

        System.out.println("Found " + results.size() + " schemas:");

        for (Loaded<Justdb> result : results) {
            if (result.isSuccess()) {
                Justdb justdb = result.getData();
                System.out.println("  - " + justdb.getId() + " (" +
                    justdb.getTables().size() + " tables)");
            }
        }
    }
}
```

### Custom Loader

```java
import org.verydb.justdb.JustdbManager;
import org.verydb.justdb.util.schema.SchemaLocation;
import org.verydb.justdb.cli.Loaded;
import org.verydb.justdb.schema.Justdb;
import java.util.Collections;

public class CustomLoaderExample {
    public static void main(String[] args) {
        // Register custom loader
        SchemaLocation customLoader = new SchemaLocation() {
            @Override
            public boolean supports(String location) {
                return location.startsWith("custom:");
            }

            @Override
            public List<Loaded<Justdb>> load(String location, List<String> fileTypes,
                                            JustdbManager manager) {
                // Custom loading logic
                Justdb justdb = loadFromCustomSource(location);
                return Collections.singletonList(Loaded.success(location, justdb));
            }

            private Justdb loadFromCustomSource(String location) {
                // Implement custom loading logic
                return new Justdb();
            }
        };

        // Register loader
        SchemaLoaderFactory.registerHandler(customLoader);

        // Use custom loader
        JustdbManager manager = JustdbManager.getInstance();
        Loaded<Justdb> result = SchemaLoaderFactory.load("custom:my-schema", manager);

        if (result.isSuccess()) {
            System.out.println("Loaded using custom loader");
        }
    }
}
```

### Format Conversion

```java
import org.verydb.justdb.JustdbManager;
import org.verydb.justdb.util.SchemaLoader;
import org.verydb.justdb.FormatFactory;
import org.verydb.justdb.schema.Justdb;
import java.io.FileOutputStream;

public class FormatConversion {
    public static void main(String[] args) throws Exception {
        JustdbManager manager = JustdbManager.getInstance();

        // Load XML format
        Justdb justdb = SchemaLoader.loadSchema("./schema.xml", manager);

        // Save as JSON format
        try (FileOutputStream fos = new FileOutputStream("./schema.json")) {
            FormatFactory.writeValueByExtension(
                manager.getExtensionPointRegistry(),
                fos,
                "schema.json",
                justdb
            );
        }

        // Save as YAML format
        try (FileOutputStream fos = new FileOutputStream("./schema.yaml")) {
            FormatFactory.writeValueByExtension(
                manager.getExtensionPointRegistry(),
                fos,
                "schema.yaml",
                justdb
            );
        }
    }
}
```

## Advanced Usage

### Reference Resolution

```java
import org.verydb.justdb.util.SchemaLoadConfig;

SchemaLoadConfig config = new SchemaLoadConfig();
config.setResolveReferences(true);

ISchemaLoader loader = new ManagedSchemaLoader();
Justdb justdb = loader.load(registry, "schema.json", config);
```

### Schema Validation

```java
SchemaLoadConfig config = new SchemaLoadConfig();
config.setValidate(true);

// Validation checks:
// - Required fields
// - Data types
// - Referential integrity
// - Naming conventions
```

### Incremental Loading

```java
// Load base Schema
Loaded<Justdb> baseResult = SchemaLoaderFactory.load("base-schema.json", manager);
Justdb baseSchema = baseResult.getData();

// Load extension Schema
Loaded<Justdb> extResult = SchemaLoaderFactory.load("extension-schema.json", manager);
Justdb extSchema = extResult.getData();

// Merge Schemas
baseSchema.getTables().addAll(extSchema.getTables());
```

## Related Documentation

- [Java API Reference](./java-api.md) - Core Java API
- [Schema Deployer](./schema-deployer.md) - Schema deployment details
- [Schema Diff Calculation](./schema-diff.md) - Schema diff calculation details
- [JDBC Driver](./jdbc-driver.md) - JDBC driver usage guide
