---
icon: puzzle-piece
title: Custom Templates
order: 4
---

# Custom Templates

Create and use custom JustDB templates.

## Overview

Custom templates allow you to:
- Extend SQL generation functionality
- Add project-specific patterns
- Override default templates

## Template Locations

### Project Directory

```
myapp/
├── justdb/
│   └── templates/
│       ├── create-table-db-mydb.hbs
│       └── drop-table-db-mydb.hbs
```

### Maven Resources

```
src/main/resources/
└── justdb/
    └── templates/
        └── create-table-db-custom.hbs
```

### External Directory

```yaml
schema:
  templateLocations:
    - /path/to/templates
```

## Template Syntax

### File Name Format

```
{name}-{category}-{type}{-dialect}.hbs
```

| Component | Description | Example |
|-----------|-------------|---------|
| `name` | Template name | `create-table` |
| `category` | Template category | `db`, `java` |
| `type` | Template type | Empty (general) or specific type |
| `dialect` | Database dialect (optional) | `mysql`, `postgresql` |

### Example File Names

```
create-table-db-mysql.hbs       # MySQL table creation
create-index-db-postgresql.hbs   # PostgreSQL index
drop-table-db.hbs                # General table drop
```

## Template Content

### Handlebars Syntax

```handlebars
<!-- create-table-db-mysql.hbs -->
CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name}} (
{{#each columns}}
  {{name}} {{type}}
  {{#if (eq nullable false)}}NOT NULL{{/if}}
  {{#if defaultValue}}DEFAULT {{defaultValue}}{{/if}}
  {{#if comment}}COMMENT '{{comment}}'{{/if}}
  {{#unless @last}},{{/unless}}
{{/each}}
{{#if primaryKey}},
  PRIMARY KEY ({{#each primaryKey}}{{this}}{{#unless @last}}, {{/unless}}{{/each}})
{{/if}}
);
```

## Template Injection

### Injection Positions

- `injectBefore` - Inject before template
- `injectAfter` - Inject after template
- `injectReplace` - Replace template content

### XML Configuration

```xml
<GenericTemplate id="custom-create" name="create-table" type="SQL" category="db"
                 injectAfter="create-table"
                 dialect="mydb">
  <content>
    -- Custom table creation logic
    CREATE TABLE {{> table-name}} (
      {{#each columns}}
      {{name}} {{type}}
      {{#unless @last}},{{/unless}}
      {{/each}}
    ) {{#if comment}}COMMENT '{{comment}}'{{/if}};
  </content>
</GenericTemplate>
```

## Override Default Templates

### Override Database-Specific Template

```
justdb/templates/create-table-db-mysql.hbs
```

This template overrides the default `create-table` + `db` + `mysql` template.

### Override All Database Template

```
justdb/templates/create-table-db.hbs
```

This template overrides all `create-table` + `db` default templates.

## Use Custom Helper

### Define Helper

```java
@TemplateHelper("myCustomHelper")
public class MyHelper {
    public Object apply(Options options) {
        String input = options.param(0, String.class);
        return input.toUpperCase();
    }
}
```

### Use in Template

```handlebars
{{myCustomHelper column_name}}  <!-- COLUMN_NAME -->
```

## Best Practices

1. **Keep it Simple**: Avoid complex logic in templates
2. **Use Partials**: Define reusable template fragments
3. **Conditional Rendering**: Use `{{#if}}` instead of string concatenation
4. **Test Multi-database**: Ensure templates work across all dialects

## Related Documentation

- **[Template Inheritance](./inheritance.html)** - Template inheritance mechanism
- **[Helper Functions](./helpers.html)** - Built-in helper functions
- **[Template System Design](/design/template-system/)** - Design documentation
