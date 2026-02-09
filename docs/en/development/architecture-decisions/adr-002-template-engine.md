---
icon: scroll
title: ADR-002 Handlebars Template Engine
order: 2
---

# ADR-002: Handlebars Template Engine

## Status

**Accepted** - 2024-01-20

## Context

JustDB needs to generate SQL for 20+ database systems, each with different:

- SQL syntax variations
- Data type mappings
- Constraint definitions
- Index creation syntax

We considered several approaches:

1. **String concatenation** - Too brittle, hard to maintain
2. **Code generation** - Complex, hard to customize
3. **Template engine** - Flexible, user-extensible

## Decision

Use **Handlebars** as the template engine with multi-level inheritance.

### Template Selection Priority

Templates are selected by specificity (highest to lowest):

1. `(name + category + type + dialect)` - Most specific
   - Example: `create-table-db-mysql`
2. `(name + category + type)` - Type-level
   - Example: `create-table-db`
3. `(name + category, type='')` - Category general
   - Example: `create-table-`
4. `(name, type='' + category='')` - Global general
   - Example: `create-table`

### Lineage Templates

Shared SQL syntax across related databases:

| Lineage | Databases |
|---------|-----------|
| `-mysql-lineage` | MySQL, MariaDB, GBase, TiDB |
| `-postgres-lineage` | PostgreSQL, Redshift, TimescaleDB |
| `-ansi-lineage` | Oracle, DB2, Derby, HSQLDB |
| `-sqlserver-lineage` | SQL Server |
| `-sqlite-lineage` | SQLite, H2 |

### Template Structure

```xml
<plugin id="sql-standard-root">
  <templates>
    <!-- Lineage template (shared) -->
    <template id="create-table-mysql-lineage" name="create-table-mysql-lineage"
             type="SQL" category="db">
      <content>
        CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name}} (
          {{> columns}}
        );
      </content>
    </template>
  </templates>
</plugin>

<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
  <templates>
    <!-- References lineage -->
    <template id="create-table" name="create-table" type="SQL" category="db">
      <content>{{> create-table-mysql-lineage}}</content>
    </template>
  </templates>
</plugin>
```

## Template Context

### Root Variables

```handlebars
{{@root.justdbManager}}  <!-- Manager instance -->
{{@root.dbType}}         <!-- Database dialect -->
{{@root.idempotent}}     <!-- Add IF NOT EXISTS -->
{{@root.safeDrop}}       <!-- Rename instead of drop -->
{{@root.newtable}}       <!-- New table object -->
```

### Built-in Partials

```handlebars
{{> table-name}}         <!-- Quoted table name -->
{{> column-spec}}        <!-- Column definition -->
{{> columns}}            <!-- All columns loop -->
{{> index-columns}}      <!-- Index column list -->
```

## Examples

### Simple Template

```handlebars
CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name}} (
{{#each columns}}
  {{name}} {{type}}{{#if nullable}} NULL{{else}} NOT NULL{{/if}}{{#unless @last}},{{/unless}}
{{/each}}
);
```

### Conditional Template

```handlebars
{{#if primaryKey}}
ALTER TABLE {{> table-name}}
  ADD PRIMARY KEY ({{primaryKey}});
{{/if}}
```

### Loop Template

```handlebars
{{#each indexes}}
CREATE {{#if unique}}UNIQUE {{/if}}INDEX {{name}}
  ON {{> table-name}} ({{#each columns}}{{name}}{{#unless @last}}, {{/unless}}{{/each}});
{{/each}}
```

## Consequences

### Positive

- Users can customize SQL generation
- Multi-database support via templates
- No code changes needed for new databases
- Template inheritance reduces duplication

### Negative

- Learn Handlebars syntax for customization
- Template debugging can be challenging
- Need to understand template priority

### Neutral

- Template compilation adds small overhead
- Templates add another abstraction layer

## Extension Points

Users can extend by:

1. **Custom templates** - Add project-specific templates
2. **Template helpers** - Add custom Handlebars helpers
3. **Template injection** - Inject before/after existing templates
4. **Override templates** - Replace built-in templates

## Related Decisions

- [ADR-001: Alias System](./adr-001-alias-system.html)
- [ADR-003: Lifecycle Hooks](./adr-003-lifecycle-hooks.html)

## References

- [Handlebars Documentation](https://handlebarsjs.com/)
- [Template System](/design/template-system/)
