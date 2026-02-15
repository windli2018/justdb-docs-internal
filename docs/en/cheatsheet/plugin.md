---
title: Plugin Extension Cheatsheet
icon: bolt
---

# Plugin Extension

Plugin is JustDB's core extension mechanism, supporting custom database adapters, SQL templates, type mappings, and more.

## Quick Examples

### Minimal Plugin Configuration

```xml
<plugin id="custom-db" version="1.0.0" name="Custom Database">
    <!-- Database adapter -->
    <databaseAdapters>
        <DatabaseAdapter id="custom-db">
            <urlPattern>jdbc:custom-db://.*</urlPattern>
            <driverClass>com.custom.jdbc.Driver</driverClass>
        </DatabaseAdapter>
    </databaseAdapters>

    <!-- Type mappings -->
    <typeMappings>
        <TypeMapping dbType="VARCHAR512" javaType="String" jdbcType="VARCHAR"/>
    </typeMappings>
</plugin>
```

### Custom SQL Template

```xml
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
    <templates>
        <template id="create-table" name="create-table" type="SQL" category="db">
            <content>{{> create-table-mysql-lineage}}</content>
        </template>
    </templates>
</plugin>
```

## Common Scenarios

### Scenario 1: Add Database Support

```xml
<plugin id="clickhouse" version="1.0.0" name="ClickHouse">
    <databaseAdapters>
        <DatabaseAdapter id="clickhouse">
            <urlPattern>jdbc:clickhouse://.*</urlPattern>
            <driverClass>com.clickhouse.jdbc.ClickHouseDriver</driverClass>
            <connectionProperties>
                <property name="socket_timeout" value="30000"/>
            </connectionProperties>
        </DatabaseAdapter>
    </databaseAdapters>

    <typeMappings>
        <TypeMapping dbType="String" javaType="String" jdbcType="VARCHAR"/>
        <TypeMapping dbType="UInt32" javaType="Long" jdbcType="BIGINT"/>
        <TypeMapping dbType="DateTime" javaType="LocalDateTime" jdbcType="TIMESTAMP"/>
    </typeMappings>

    <functionMappings>
        <FunctionMapping name="now" template="now()"/>
        <FunctionMapping name="date_add" template="addDays({0}, {1})"/>
    </functionMappings>
</plugin>
```

### Scenario 2: Custom Type Mapping

```xml
<plugin id="postgres-custom" version="1.0.0">
    <typeMappings>
        <!-- PostgreSQL-specific types -->
        <TypeMapping dbType="JSONB" javaType="String" jdbcType="OTHER"/>
        <TypeMapping dbType="UUID" javaType="java.util.UUID" jdbcType="OTHER"/>
        <TypeMapping dbType="INET" javaType="String" jdbcType="VARCHAR"/>

        <!-- Custom types -->
        <TypeMapping dbType="money" javaType="java.math.BigDecimal" jdbcType="DECIMAL"/>
    </typeMappings>
</plugin>
```

### Scenario 3: Custom Template Helper

```xml
<plugin id="custom-helpers">
    <templateHelpers>
        <TemplateHelper name="encrypt">
            <parameter>value</parameter>
            <code>AES_ENCRYPT({{value}}, '${secret_key}')</code>
        </TemplateHelper>

        <TemplateHelper name="formatDate">
            <parameter>date</parameter>
            <parameter>format</parameter>
            <code>DATE_FORMAT({{date}}, '{{format}}')</code>
        </TemplateHelper>
    </templateHelpers>
</plugin>
```

### Scenario 4: Extension Point Definition

```xml
<plugin id="mysql-extensions">
    <extensionPoints>
        <!-- MySQL table engine -->
        <ExtensionPoint id="table-engine" target="Table">
            <ExtensionAttribute name="engine" type="String" defaultValue="InnoDB"/>
            <ExtensionAttribute name="row_format" type="String"/>
            <ExtensionAttribute name="charset" type="String" defaultValue="utf8mb4"/>
        </ExtensionPoint>

        <!-- MySQL partitioning -->
        <ExtensionPoint id="partition" target="Table">
            <ExtensionAttribute name="partitionBy" type="String"/>
            <ExtensionAttribute name="partitions" type="Integer"/>
        </ExtensionPoint>
    </extensionPoints>
</plugin>
```

## Plugin Structure

```xml
<plugin id="plugin-id" version="1.0.0" name="Plugin Name" ref-id="parent-plugin">
    <!-- 1. Database adapters -->
    <databaseAdapters>...</databaseAdapters>

    <!-- 2. Type mappings -->
    <typeMappings>...</typeMappings>

    <!-- 3. Function mappings -->
    <functionMappings>...</functionMappings>

    <!-- 4. SQL templates -->
    <templates>...</templates>

    <!-- 5. Template helpers -->
    <templateHelpers>...</templateHelpers>

    <!-- 6. Extension points -->
    <extensionPoints>...</extensionPoints>

    <!-- 7. Schema formats -->
    <schemaFormats>...</schemaFormats>
</plugin>
```

## Template System

### Template Inheritance

```xml
<!-- Parent plugin: define common templates -->
<plugin id="sql-standard-root">
    <templates>
        <template id="create-table-mysql-lineage" name="create-table-mysql-lineage">
            <content>CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name-spec}} (...)</content>
        </template>
    </templates>
</plugin>

<!-- Child plugin: reference parent template -->
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
    <templates>
        <template id="create-table">
            <content>{{> create-table-mysql-lineage}}</content>
        </template>
    </templates>
</plugin>
```

### Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `@root.dbType` | Database type | `mysql`, `postgresql` |
| `@root.idempotent` | Idempotent mode | `true/false` |
| `@root.safeDrop` | Safe drop mode | `true/false` |
| `{{this}}` | Current object | Table, Column, etc. |
| `{{@root.justdbManager}}` | JustDB Manager | Manager instance |

### Template Reference Syntax

```handlebars
<!-- Use current context -->
{{> template-name}}

<!-- Use parent context -->
{{> template-name ..}}

<!-- Conditional rendering -->
{{#if this.primaryKey}}PRIMARY KEY{{/if}}

<!-- Loop -->
{{#each this.columns}}
  {{name}} {{type}}{{#unless @last}},{{/unless}}
{{/each}}
```

## Type Mapping

### Basic Type Mapping

```xml
<typeMappings>
    <TypeMapping dbType="VARCHAR" javaType="String" jdbcType="VARCHAR"/>
    <TypeMapping dbType="INT" javaType="Integer" jdbcType="INTEGER"/>
    <TypeMapping dbType="BIGINT" javaType="Long" jdbcType="BIGINT"/>
    <TypeMapping dbType="DECIMAL" javaType="BigDecimal" jdbcType="DECIMAL"/>
    <TypeMapping dbType="DATETIME" javaType="LocalDateTime" jdbcType="TIMESTAMP"/>
</typeMappings>
```

### Complex Type Mapping

```xml
<typeMappings>
    <!-- Array types -->
    <TypeMapping dbType="TEXT[]" javaType="String[]" jdbcType="ARRAY"/>

    <!-- JSON types -->
    <TypeMapping dbType="JSON" javaType="String" jdbcType="VARCHAR"/>

    <!-- Enum types -->
    <TypeMapping dbType="ENUM" javaType="String" jdbcType="VARCHAR">
        <parameters>
            <parameter name="values" value="A,B,C"/>
        </parameters>
    </TypeMapping>
</typeMappings>
```

## Extension Points

### Table Extension Point

```xml
<ExtensionPoint id="mysql-table" target="Table">
    <ExtensionAttribute name="engine" type="String" defaultValue="InnoDB"/>
    <ExtensionAttribute name="charset" type="String" defaultValue="utf8mb4"/>
    <ExtensionAttribute name="collate" type="String" defaultValue="utf8mb4_unicode_ci"/>
    <ExtensionAttribute name="row_format" type="String"/>
</ExtensionPoint>
```

**Usage**:

```xml
<Table name="users" engine="InnoDB" charset="utf8mb4" row_format="COMPRESSED">
    ...
</Table>
```

### Column Extension Point

```xml
<ExtensionPoint id="mysql-column" target="Column">
    <ExtensionAttribute name="unsigned" type="Boolean" defaultValue="false"/>
    <ExtensionAttribute name="zerofill" type="Boolean" defaultValue="false"/>
    <ExtensionAttribute name="characterSet" type="String"/>
    <ExtensionAttribute name="collation" type="String"/>
</ExtensionPoint>
```

**Usage**:

```xml
<Column name="age" type="INT" unsigned="true" zerofill="true"/>
```

## Plugin Discovery

### Built-in Plugins

`default-plugins.xml` is loaded automatically.

### External Plugins

Load via JAR:

```
META-INF/services/ai.justdb.justdb.plugin.JustdbPlugin
```

## Important Notes

### 1. Plugin ID Uniqueness

```xml
<!-- ❌ Error: duplicate ID -->
<plugin id="mysql"/>
<plugin id="mysql"/>

<!-- ✅ Correct: unique ID -->
<plugin id="mysql"/>
<plugin id="mysql-extensions"/>
```

### 2. Template Reference Order

```xml
<!-- Parent plugin must be defined first -->
<plugin id="root">
    <template id="base">...</template>
</plugin>

<!-- Child plugin can reference -->
<plugin id="child" ref-id="root">
    <template id="derived">{{> base}}</template>
</plugin>
```

### 3. Dialect Conflicts

```xml
<!-- ❌ Error: same dialect -->
<plugin id="mysql1" dialect="mysql"/>
<plugin id="mysql2" dialect="mysql"/>

<!-- ✅ Correct: use ref-id inheritance -->
<plugin id="mysql-base" dialect="mysql"/>
<plugin id="mysql-ext" ref-id="mysql-base"/>
```

## Advanced Techniques

### Technique 1: Conditional Templates

```handlebars
{{#if (eq @root.dbType "mysql")}}
    ENGINE=InnoDB
{{else if (eq @root.dbType "postgresql")}}
    WITH (OIDS=FALSE)
{{/if}}
```

### Technique 2: Custom Helper

```xml
<TemplateHelper name="quote">
    <parameter>value</parameter>
    <code>{{#if (eq @root.dbType "mysql")}}`{{value}}`{{else}}"{{value}}"{{/if}}</code>
</TemplateHelper>
```

### Technique 3: Template Injection

```xml
<GenericTemplate id="custom-index" injectAfter="create-table">
    CREATE INDEX {{#if @root.idempotent}}IF NOT EXISTS {{/if}}idx_{{name}} ON {{name}}({{columns}});
</GenericTemplate>
```

## Reference Links

- [Plugin Development Guide](../../development/plugin-development/)
- [Template System Design](../../design/template-system/)
- [API Reference](../../reference/api/)
