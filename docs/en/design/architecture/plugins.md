---
icon: plug
title: Plugin Architecture
order: 4
---

# Plugin Architecture

JustDB's plugin system provides extensibility for databases, templates, and more.

## Plugin Overview

JustDB plugins extend functionality through:

1. **Database Adapters** - Support for new databases
2. **Templates** - Custom SQL generation templates
3. **Extension Points** - Schema extension attributes
4. **Template Helpers** - Custom Handlebars helpers
5. **Schema Formats** - Custom serialization formats

## Plugin Interface

```java
public interface JustdbPlugin {
    // Plugin identification
    String getId();
    String getName();
    String getVersion();

    // Components
    DatabaseAdapter[] getDatabaseAdapters();
    GenericTemplate[] getTemplates();
    ExtensionPoint[] getExtensionPoints();
    TemplateHelper[] getHelpers();
    SchemaFormat[] getFormats();
}
```

## Database Adapter

### Interface

```java
public interface DatabaseAdapter {
    String getDialect();                    // e.g., "mysql", "postgresql"
    String getUrlPattern();                 // JDBC URL pattern
    String getDriverClass();                // JDBC driver class
    TypeMapping getTypeMapping();           // Type mappings

    // Feature detection
    boolean supports(String feature);
    boolean requiresAutoIncrementKey();
}
```

### Example

```java
public class MySQLAdapter implements DatabaseAdapter {
    @Override
    public String getDialect() {
        return "mysql";
    }

    @Override
    public String getUrlPattern() {
        return "jdbc:mysql://{{host}}:{{port}}/{{database}}";
    }

    @Override
    public String getDriverClass() {
        return "com.mysql.cj.jdbc.Driver";
    }

    @Override
    public TypeMapping getTypeMapping() {
        return new MySQLTypeMapping();
    }
}
```

## Template System

### Template Hierarchy

Templates are selected based on specificity:

```
Priority 1: (name + category + type + dialect)
Priority 2: (name + category + type)
Priority 3: (name + category, type='')
Priority 4: (name, type='' + category='')
```

### Template Definition

```xml
<template id="create-table" name="create-table" type="SQL" category="db">
  <content>
    CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name}} (
      {{> columns}}
    );
  </content>
</template>
```

### Template Inheritance

```xml
<!-- Lineage template (shared) -->
<template id="create-table-mysql-lineage" name="create-table-mysql-lineage"
         type="SQL" category="db">
  <content>
    CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name}} (
      {{> columns}}
    );
  </content>
</template>

<!-- Reference lineage -->
<template id="create-table" name="create-table" type="SQL" category="db">
  <content>{{> create-table-mysql-lineage}}</content>
</template>
```

## Extension Points

Define custom attributes for schema objects:

```java
@ExtensionPoint(
    target = "Table",
    attributes = {
        @ExtensionAttribute(name = "engine", type = "string", defaultValue = "InnoDB"),
        @ExtensionAttribute(name = "row_format", type = "string")
    }
)
public class MySQLTableExtensions {
    // Validation and processing logic
}
```

### Usage in Schema

```yaml
Table:
  - name: users
    engine: InnoDB        # Custom extension
    row_format: COMPRESSED  # Custom extension
    Column:
      - name: id
        type: BIGINT
```

## Template Helpers

Custom Handlebars helpers:

```java
@TemplateHelper({
    "camelCase",  // Convert to camelCase
    "snakeCase",  // Convert to snake_case
    "pluralize"   // Pluralize words
})
public class StringHelpers {
    public Object camelCase(Options options) {
        String input = options.param(0, String.class);
        return toCamelCase(input);
    }

    // ... other helpers
}
```

### Usage in Templates

```handlebars
{{camelCase table_name}}  <!-- usersTable -->
{{snakeCase ColumnName}}  <!-- column_name -->
{{pluralize item}}        <!-- items -->
```

## Schema Format

Custom serialization format:

```java
public class CustomSchemaFormat implements SchemaFormat {
    @Override
    public String getId() {
        return "custom";
    }

    @Override
    public Justdb load(InputStream input) throws IOException {
        // Parse custom format
    }

    @Override
    public void save(Justdb schema, OutputStream output) throws IOException {
        // Serialize to custom format
    }
}
```

## Plugin Discovery

### Built-in Plugins

Loaded from `default-plugins.xml`:

```java
PluginManager manager = PluginManager.getInstance();
manager.loadBuiltInPlugins();
```

### External Plugins

Discovered via ServiceLoader:

```
META-INF/services/ai.justdb.justdb.plugin.JustdbPlugin
```

```
com.example.MyCustomPlugin
com.example.AnotherPlugin
```

### Runtime Plugins

Programmatically registered:

```java
JustdbPlugin customPlugin = new MyCustomPlugin();
pluginManager.registerPlugin(customPlugin);
```

## Plugin Configuration

### XML Configuration

```xml
<plugin id="my-plugin" version="1.0.0">
  <databaseAdapters>
    <databaseAdapter dialect="mydb">
      <urlPattern>jdbc:mydb://{{host}}/{{database}}</urlPattern>
      <driverClass>com.example.MyDriver</driverClass>
      <typeMapping>com.example.MyTypeMapping</typeMapping>
    </databaseAdapter>
  </databaseAdapters>

  <templates>
    <template id="create-table" name="create-table" type="SQL" category="db">
      <content>...</content>
    </template>
  </templates>
</plugin>
```

### Java Configuration

```java
public class MyPlugin implements JustdbPlugin {
    @Override
    public DatabaseAdapter[] getDatabaseAdapters() {
        return new DatabaseAdapter[] {
            new MyDatabaseAdapter()
        };
    }

    // ... other methods
}
```

## Template Context

### Available Variables

```handlebars
{{@root.justdbManager}}  <!-- Manager instance -->
{{@root.dbType}}         <!-- Database dialect -->
{{@root.idempotent}}     <!-- Idempotent mode -->
{{@root.safeDrop}}       <!-- Safe drop mode -->
{{@root.newtable}}       <!-- New table (for safe drop) -->
```

### Built-in Partials

```handlebars
{{> table-name}}         <!-- Full table name -->
{{> column-spec}}        <!-- Column specification -->
{{> columns}}            <!-- All columns -->
{{> index-spec}}         <!-- Index specification -->
```

## Creating a Plugin

### Step 1: Define Plugin

```java
public class MyPlugin implements JustdbPlugin {
    @Override
    public String getId() {
        return "my-plugin";
    }

    @Override
    public DatabaseAdapter[] getDatabaseAdapters() {
        return new DatabaseAdapter[] {
            new MyAdapter()
        };
    }
}
```

### Step 2: Register Plugin

Create `META-INF/services/ai.justdb.justdb.plugin.JustdbPlugin`:

```
com.example.MyPlugin
```

### Step 3: Package and Deploy

```bash
mvn package
# Output: target/my-plugin-1.0.0.jar

# Copy to JustDB classpath
cp target/my-plugin-1.0.0.jar /path/to/justdb/lib/
```

### Step 4: Use Plugin

```java
PluginManager manager = PluginManager.getInstance();
manager.loadPlugins();  // Discovers your plugin

DatabaseAdapter adapter = manager.getDatabaseAdapter("mydb");
// Use adapter...
```

## Next Steps

- **[Layers](./layers.html)** - Layer architecture
- **[Components](./components.html)** - Component details
- **[Data Flow](./data-flow.html)** - Request/response flow
