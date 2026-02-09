---
icon: puzzle-piece
title: Plugin Development Guide
order: 20
---

# Plugin Development Guide

Guide to developing JustDB plugins for custom databases, templates, and extensions.

## Overview

JustDB plugins extend functionality through:
- **Database Adapters** - Add support for new databases
- **Templates** - Custom SQL generation
- **Extension Points** - Schema extensions
- **Template Helpers** - Custom Handlebars functions
- **Schema Formats** - New serialization formats

## Getting Started

### Prerequisites

- JDK 1.8+
- Maven 3.6+
- Knowledge of the target database
- Understanding of Handlebars templates

### Project Setup

```bash
# Create plugin project
mkdir my-justdb-plugin
cd my-justdb-plugin

# Create Maven structure
mkdir -p src/main/java/com/example/justdb
mkdir -p src/main/resources/META-INF/services

# Create pom.xml
cat > pom.xml << 'EOF'
<project>
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>my-justdb-plugin</artifactId>
    <version>1.0.0</version>

    <dependencies>
        <dependency>
            <groupId>org.verydb.justdb</groupId>
            <artifactId>justdb-core</artifactId>
            <version>1.0.0</version>
            <provided</provided>
        </dependency>
    </dependencies>
</project>
EOF
```

## Database Adapter Plugin

### Step 1: Create Adapter

```java
package com.example.justdb;

import org.verydb.justdb.adapter.*;

public class MyDatabaseAdapter implements DatabaseAdapter {

    @Override
    public String getDialect() {
        return "mydb";
    }

    @Override
    public String getUrlPattern() {
        return "jdbc:mydb://{{host}}:{{port}}/{{database}}";
    }

    @Override
    public String getDriverClass() {
        return "com.example.jdbc.Driver";
    }

    @Override
    public TypeMapping getTypeMapping() {
        return new MyTypeMapping();
    }

    @Override
    public boolean supports(String feature) {
        // Declare supported features
        switch (feature) {
            case "sequences":
                return true;
            case "check-constraint":
                return false;
            default:
                return false;
        }
    }
}
```

### Step 2: Create Type Mapping

```java
package com.example.justdb;

import org.verydb.justdb.adapter.*;

public class MyTypeMapping implements TypeMapping {

    @Override
    public String getSQLType(String javaType) {
        switch (javaType) {
            case "String":
                return "VARCHAR(255)";
            case "Integer":
            case "int":
                return "INTEGER";
            case "Long":
            case "long":
                return "BIGINT";
            case "BigDecimal":
                return "DECIMAL(19,2)";
            case "Boolean":
            case "boolean":
                return "BOOLEAN";
            case "Date":
            case "java.util.Date":
                return "TIMESTAMP";
            case "byte[]":
                return "BLOB";
            default:
                return "VARCHAR(255)";
        }
    }

    @Override
    public String getJavaType(String sqlType) {
        // Reverse mapping
    }
}
```

### Step 3: Register Plugin

```java
package com.example.justdb;

import org.verydb.justdb.plugin.*;

public class MyPlugin implements JustdbPlugin {

    @Override
    public String getId() {
        return "my-plugin";
    }

    @Override
    public String getName() {
        return "My Custom Plugin";
    }

    @Override
    public String getVersion() {
        return "1.0.0";
    }

    @Override
    public DatabaseAdapter[] getDatabaseAdapters() {
        return new DatabaseAdapter[] {
            new MyDatabaseAdapter()
        };
    }
}
```

### Step 4: Register Service

Create `src/main/resources/META-INF/services/org.verydb.justdb.plugin.JustdbPlugin`:

```
com.example.justdb.MyPlugin
```

## Template Plugin

### Create Templates

```java
public class MyTemplates implements JustdbPlugin {

    @Override
    public GenericTemplate[] getTemplates() {
        return new GenericTemplate[] {
            createTableTemplate(),
            dropTableTemplate(),
            indexTemplate()
        };
    }

    private GenericTemplate createTableTemplate() {
        return GenericTemplate.builder()
            .id("create-table")
            .name("create-table")
            .type(TemplateType.SQL)
            .category(TemplateCategory.DB)
            .dialect("mydb")
            .content("""

CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name}} (
{{#each columns}}
  {{name}} {{type}}{{#unless @last}},{{/unless}}
{{/each}}
);

            """)
            .build();
    }
}
```

### Template Inheritance

Reference lineage templates:

```java
private GenericTemplate createTableTemplate() {
    return GenericTemplate.builder()
        .id("create-table")
        .name("create-table")
        .type(TemplateType.SQL)
        .category(TemplateCategory.DB)
        .dialect("mydb")
        .content("{{> create-table-mysql-lineage}}")  // Reuse MySQL template
        .build();
}
```

## Extension Point Plugin

### Define Extension Attributes

```java
@ExtensionPoint(
    target = "Table",
    attributes = {
        @ExtensionAttribute(
            name = "storageEngine",
            type = "string",
            defaultValue = "InnoDB"
        ),
        @ExtensionAttribute(
            name = "compression",
            type = "string"
        ),
        @ExtensionAttribute(
            name = "partitionBy",
            type = "string"
        )
    }
)
public class MySQLTableExtensions {

    // Validation logic
    public void validateStorageEngine(String engine) {
        if (!Arrays.asList("InnoDB", "MyISAM", "Memory").contains(engine)) {
            throw new IllegalArgumentException("Invalid storage engine: " + engine);
        }
    }
}
```

### Use in Schema

```yaml
Table:
  - name: users
    storageEngine: InnoDB     # Extension
    compression: ZLIB          # Extension
    Column:
      - name: id
        type: BIGINT
```

## Template Helper Plugin

### Create Helpers

```java
@TemplateHelper({
    "quoteIdentifier",  // Quote SQL identifiers
    "escapeLiteral",     // Escape SQL literals
    "formatDate"         // Format dates for SQL
})
public class MyTemplateHelpers {

    public CharSequence quoteIdentifier(Options options) {
        String identifier = options.param(0, String.class);
        return "\"" + identifier + "\"";  // Use double quotes
    }

    public CharSequence escapeLiteral(Options options) {
        String literal = options.param(0, String.class);
        return literal.replace("'", "''");
    }

    public CharSequence formatDate(Options options) {
        Date date = options.param(0, Date.class);
        String format = options.param(1, String.class);
        // Format date according to format string
    }
}
```

### Use in Templates

```handlebars
{{quoteIdentifier column_name}}  -- "column_name"

{{escapeLiteral user's input}}   -- user''s input

{{formatDate currentDate "YYYY-MM-DD"}}  -- '2024-01-15'
```

## Schema Format Plugin

### Implement Format Loader

```java
public class CustomFormatLoader implements SchemaFormat {

    @Override
    public String getId() {
        return "custom";
    }

    @Override
    public Justdb load(InputStream input) throws IOException {
        // Parse custom format
        BufferedReader reader = new BufferedReader(new InputStreamReader(input));
        Justdb schema = new Justdb();

        // Parse logic
        String line;
        while ((line = reader.readLine()) != null) {
            // Parse line and populate schema
        }

        return schema;
    }

    @Override
    public void save(Justdb schema, OutputStream output) throws IOException {
        // Serialize schema to custom format
    }
}
```

### Register Format

```java
public class MyPlugin implements JustdbPlugin {

    @Override
    public SchemaFormat[] getFormats() {
        return new SchemaFormat[] {
            new CustomFormatLoader()
        };
    }
}
```

## Testing Plugins

### Unit Tests

```java
@Test
public void testDatabaseAdapter() {
    MyDatabaseAdapter adapter = new MyDatabaseAdapter();

    assertEquals("mydb", adapter.getDialect());
    assertTrue(adapter.supports("sequences"));
    assertFalse(adapter.supports("check-constraint"));
}

@Test
public void testTypeMapping() {
    MyTypeMapping mapping = new MyTypeMapping();

    assertEquals("INTEGER", mapping.getSQLType("int"));
    assertEquals("BIGINT", mapping.getSQLType("Long"));
}
```

### Integration Tests

```java
@Test
public void testPluginLoading() {
    PluginManager manager = PluginManager.getInstance();
    manager.loadPlugins();

    DatabaseAdapter adapter = manager.getDatabaseAdapter("mydb");
    assertNotNull(adapter);
    assertEquals("mydb", adapter.getDialect());
}
```

## Best Practices

1. **Idempotent Operations** - Make plugins safe to run multiple times
2. **Error Handling** - Provide clear error messages
3. **Documentation** - Document all public APIs
4. **Testing** - Test on real databases when possible
5. **Version Compatibility** - Declare minimum JustDB version
6. **Resource Management** - Close resources properly

## Publishing Plugins

### Package Plugin

```bash
mvn clean package
# Output: target/my-justdb-plugin-1.0.0.jar
```

### Distribute

1. **Maven Central** - For public plugins
2. **GitHub Releases** - For distribution
3. **Local JAR** - Copy to JustDB lib directory

### Usage

Users add your plugin as a dependency:

```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>my-justdb-plugin</artifactId>
    <version>1.0.0</version>
</dependency>
```

JustDB automatically discovers your plugin via ServiceLoader.

## Next Steps

- **[Architecture Decision Records](../architecture-decisions/)** - Design decisions
- **[Template System](/design/template-system/)** - Template details
- **[API Reference](/reference/api/)** - Programmatic API
