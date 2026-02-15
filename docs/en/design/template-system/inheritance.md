---
icon: project-diagram
title: Template Inheritance Mechanism
order: 2
---

# Template Inheritance Mechanism

JustDB's template system supports multi-level inheritance, reducing template duplication and improving maintainability.

## Inheritance Hierarchy

Templates are selected by priority (highest to lowest):

```
1. (name + category + type + dialect)  - Most specific
   Example: create-table-db-mysql

2. (name + category + type)           - Type level
   Example: create-table-db

3. (name + category, type='')         - Category general template
   Example: create-table-

4. (name, type='' + category='')      - Global general template
   Example: create-table
```

## Lineage Templates

Lineage templates are shared SQL syntax for related database groups:

| Lineage | Supported Databases |
|---------|-------------------|
| `-mysql-lineage` | MySQL, MariaDB, GBase, TiDB |
| `-postgres-lineage` | PostgreSQL, Redshift, TimescaleDB, KingBase |
| `-ansi-lineage` | Oracle, DB2, Derby, HSQLDB, Dameng |
| `-sqlserver-lineage` | SQL Server |
| `-sqlite-lineage` | SQLite, H2 |

## Template Definition

### Lineage Template (Shared)

```xml
<!-- SQL Standard Root Plugin -->
<plugin id="sql-standard-root">
  <templates>
    <template id="create-table-mysql-lineage" name="create-table-mysql-lineage"
             type="SQL" category="db">
      <content><![CDATA[
CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name-spec}} (
  {{> columns}}
);
      ]]></content>
    </template>
  </templates>
</plugin>
```

### Reference Lineage (Database Plugin)

```xml
<!-- MySQL Plugin -->
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
  <templates>
    <template id="create-table" name="create-table" type="SQL" category="db">
      <content><![CDATA[
{{> create-table-mysql-lineage}}
      ]]></content>
    </template>
  </templates>
</plugin>
```

## Template Reference Syntax

### Basic Reference

```handlebars
<!-- Reference current context -->
{{> template-name}}

<!-- Reference parent context -->
{{> template-name ..}}
```

### Conditional Rendering

```handlebars
{{#if condition}}
  <!-- Show when condition is true -->
{{/if}}

{{#unless condition}}
  <!-- Show when condition is false -->
{{/unless}}
```

### Loop

```handlebars
{{#each items}}
  {{name}}: {{value}}
{{/each}}

{{#each tables}}
  {{> table-spec}}
{{/each}}
```

### Context Variables

```handlebars
{{@root.justdbManager}}  <!-- JustDB manager instance -->
{{@root.dbType}}         <!-- Database type -->
{{@root.idempotent}}     <!-- Idempotent mode -->
{{@root.safeDrop}}       <!-- Safe drop mode -->
{{@root.newtable}}       <!-- New table object (for safe drop) -->
```

## Built-in Partials

### table-name-spec

Generate quoted table name:

```handlebars
{{> table-name-spec}}  -- `users`, "users", [users]
```

### column-spec

Generate column definition:

```handlebars
{{name}} {{type}}{{#if nullable}} NULL{{/if}}{{#unless @last}},{{/unless}}
```

### columns

Iterate all columns:

```handlebars
{{#each columns}}
  {{> column-spec}}
{{/each}}
```

## Template Injection

Content can be injected before or after existing templates:

```xml
<GenericTemplate id="custom-drop" name="custom-drop" type="SQL" category="db"
                 injectAfter="drop-table">
  <content><![CDATA[
DROP TABLE IF EXISTS {{> table-name-spec}} CASCADE;
  ]]></content>
</GenericTemplate>
```

## Best Practices

1. **Use Lineage Templates** - Avoid duplicating same SQL
2. **Keep Templates Simple** - Put complex logic in Helpers
3. **Use Conditionals Properly** - Use `{{#if}}` instead of string concatenation
4. **Test Multi-database** - Ensure templates work in all dialects
5. **Comment Complex Logic** - Help maintainers understand intent

## Related Documentation

- **[Helper Functions](./helpers.html)** - Built-in helper functions
- **[Custom Templates](./custom-templates.html)** - Create custom templates
- **[Template System Design](/design/template-system/)** - Design documentation
