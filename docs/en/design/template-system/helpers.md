---
icon: code
title: Template Helper Functions
order: 3
---

# Template Helper Functions

Built-in Handlebars helper functions provided by JustDB.

## String Functions

### camelCase

Convert to camelCase:

```handlebars
{{camelCase table_name}}  <!-- table_name → tableName -->
```

### snakeCase

Convert to snake_case:

```handlebars
{{snakeCase TableName}}  <!-- TableName → table_name -->
```

### kebabCase

Convert to kebab-case:

```handlebars
{{kebabCase TableName}}  <!-- TableName → table-name-spec -->
```

### pascalCase

Convert to PascalCase:

```handlebars
{{pascalCase table_name}}  <!-- table_name → TableName -->
```

### pluralize

Pluralize words:

```handlebars
{{pluralize item}}  <!-- item → items -->
```

### singularize

Singularize words:

```handlebars
{{singularize items}}  <!-- items → item -->
```

## SQL Functions

### quoteIdentifier

Quote identifier (add database-specific quotes):

```handlebars
{{quoteIdentifier column_name}}
-- MySQL: `column_name`
-- PostgreSQL: "column_name"
-- SQL Server: [column_name]
```

### escapeLiteral

Escape string literals:

```handlebars
{{escapeLiteral user's input}}
-- user''s input
```

### formatType

Format data type:

```handlebars
{{formatType type length}}
-- VARCHAR(50)
```

## Conditional Functions

### eq

Equal comparison:

```handlebars
{{#eq type "VARCHAR"}}String type{{/eq}}
```

### ne

Not equal comparison:

```handlebars
{{#ne type "INTEGER"}}Non-integer type{{/ne}}
```

### and

Logical AND:

```handlebars
{{#and (eq type "INTEGER") (eq nullable false)}}Integer and not null{{/and}}
```

### or

Logical OR:

```handlebars
{{#or (eq type "BIGINT") (eq type "INTEGER")}}Integer type{{/or}}
```

### not

Logical NOT:

```handlebars
{{#not nullable}}Not null{{/not}}
```

## Collection Functions

### first

Get first element:

```handlebars
{{first columns}}
```

### last

Get last element:

```handlebars
{{last columns}}
```

### join

Join array elements:

```handlebars
{{join columns ", "}}  <!-- Join column names with commas -->
```

### length

Get array length:

```handlebars
{{length columns}}
```

## Default Value Functions

### default

Provide default value:

```handlebars
{{default comment "No comment"}}
```

### or

Provide alternative value:

```handlebars
{{or comment "No comment"}}
```

## Custom Helper

### Create Custom Helper

```java
@TemplateHelper("formatTimestamp")
public class TimestampHelper {

    public Object apply(Options options) {
        Date date = options.param(0, Date.class);
        String format = options.param(1, String.class);

        SimpleDateFormat sdf = new SimpleDateFormat(format);
        return sdf.format(date);
    }
}
```

### Register Helper

```java
TemplateHelper helper = new TemplateHelper() {
    @Override
    public String getName() {
        return "formatTimestamp";
    }

    @Override
    public Object apply(Object context, Object[] args) {
        // Implementation logic
    }
};

pluginManager.registerHelper(helper);
```

## Usage Examples

### Complex Table Definition

```handlebars
CREATE TABLE {{> table-name-spec}} (
{{#each columns}}
  {{name}} {{formatType type length}}{{#unless @last}},{{/unless}}
{{/each}}
{{#if (eq primaryKey "true")}}
,
  PRIMARY KEY ({{name}})
{{/if}}
);
```

### Conditional Index

```handlebars
{{#if unique}}
CREATE UNIQUE INDEX {{name}}
{{else}}
CREATE INDEX {{name}}
{{/if}}
ON {{> table-name-spec}} ({{join columns ", "}});
```

### Foreign Key Constraint

```handlebars
ALTER TABLE {{> table-name-spec}}
ADD CONSTRAINT {{name}}
FOREIGN KEY ({{foreignKey}})
REFERENCES {{referencedTable}}({{referencedColumn}})
{{#if (eq onDelete "CASCADE")}} ON DELETE CASCADE{{/if}}
{{#if (eq onUpdate "RESTRICT")}} ON UPDATE RESTRICT{{/if}};
```

## Related Documentation

- **[Template Inheritance](./inheritance.html)** - Template inheritance mechanism
- **[Custom Templates](./custom-templates.html)** - Creating custom templates
- **[Template System Design](/design/template-system/)** - Design documentation
