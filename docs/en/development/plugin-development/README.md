---
icon: puzzle-piece
title: Plugin Development Overview
order: 61
---

# Plugin Development Overview

JustDB's plugin system allows developers to extend its functionality, including adding new database support, custom SQL templates, extension point definitions, and more.

## What is a Plugin?

A plugin is a packaged unit containing the following extensions:

```
JustdbPlugin
├── DatabaseAdapter[]     # Database adapters
├── GenericTemplate[]     # SQL/code generation templates
├── ExtensionPoint[]      # Extension point definitions
├── TemplateHelper[]      # Handlebars helper functions
└── SchemaFormat[]        # Schema serialization formats
```

## Plugin Types

### 1. Built-in Plugins

Built-in plugins are located in `justdb-core/src/main/resources/default-plugins.xml` and are automatically loaded:

- `sql-standard-root` - SQL standard root plugin
- `mysql` - MySQL support
- `postgresql` - PostgreSQL support
- `oracle` - Oracle support
- And 20+ other database plugins

### 2. External Plugins

External plugins are provided through JAR packages and discovered using Java ServiceLoader:

```
META-INF/services/org.verydb.justdb.plugin.JustdbPlugin
```

## Plugin Discovery Mechanism

### Loading Order

1. **Built-in plugins**: Loaded from `default-plugins.xml`
2. **External plugins**: Discovered via ServiceLoader from classpath
3. **User plugins**: Registered from configuration files or programmatically

### Plugin Inheritance

Plugins can inherit templates and configuration from other plugins:

```xml
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
    <!-- Inherits templates from sql-standard-root -->
</plugin>
```

## Development Scenarios

### Scenario 1: Add New Database Support

Add adapters, JDBC drivers, and SQL templates for a new database.

### Scenario 2: Custom SQL Templates

Override default templates to customize SQL generation logic.

### Scenario 3: Extend Schema Attributes

Add database-specific table or column properties.

### Scenario 4: Custom Serialization Format

Support new schema file formats (like HOCON, Properties).

## Quick Start

### Create Plugin Project

```bash
# Create Maven project
mvn archetype:generate -DgroupId=com.example \
    -DartifactId=justdb-myplugin \
    -DarchetypeArtifactId=maven-archetype-quickstart

cd justdb-myplugin
```

### Configure Dependency

```xml
<dependencies>
    <dependency>
        <groupId>org.verydb.justdb</groupId>
        <artifactId>justdb-core</artifactId>
        <version>1.0.0</version>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

### Implement Plugin Class

```java
package com.example.justdb;

import org.verydb.justdb.plugin.*;

public class MyDatabasePlugin extends JustdbPlugin {
    @Override
    public String getId() {
        return "my-database";
    }

    @Override
    public String getName() {
        return "My Database Plugin";
    }

    @Override
    public DatabaseAdapter[] getDatabaseAdapters() {
        return new DatabaseAdapter[] {
            createAdapter()
        };
    }

    private DatabaseAdapter createAdapter() {
        DatabaseAdapter adapter = new DatabaseAdapter();
        adapter.setDbType("mydb");
        adapter.setDriverClass("com.example.jdbc.Driver");
        adapter.setUrlPattern("jdbc:mydb://*");
        return adapter;
    }
}
```

### Register Plugin

Create `META-INF/services/org.verydb.justdb.plugin.JustdbPlugin`:

```
com.example.justdb.MyDatabasePlugin
```

## Plugin Configuration

### XML Method

In `default-plugins.xml` or custom plugin files:

```xml
<plugin id="my-plugin" version="1.0.0" name="My Plugin">
    <adapters>
        <DatabaseAdapter dbType="mydb" driverClass="com.example.Driver">
            <urlPatterns>
                <UrlPattern>jdbc:mydb://*</urlPatterns>
            </urlPatterns>
        </DatabaseAdapter>
    </adapters>
    <templates>
        <template id="create-table" name="create-table" type="SQL" category="db">
            <content>CREATE TABLE {{name}} (...)</content>
        </template>
    </templates>
</plugin>
```

### Programmatic Method

```java
JustdbManager manager = JustdbManager.getInstance();

// Create plugin
JustdbPlugin plugin = new JustdbPlugin();
plugin.setId("my-plugin");

// Register
manager.getPluginManager().registerPlugin(plugin);
```

## Next Steps

- [Database Adapter Development](./database-adapter.md) - Add new database support *(Coming soon)*
- [Custom Templates](./custom-templates.md) - Create SQL templates *(Coming soon)*
- [Extension Point Development](./extension-points.md) - Define extension attributes *(Coming soon)*
- [Template Helper Functions](./template-helpers.md) - Write Handlebars helper functions *(Coming soon)*
- [Schema Format Development](./schema-formats.md) - Support new file formats *(Coming soon)*
