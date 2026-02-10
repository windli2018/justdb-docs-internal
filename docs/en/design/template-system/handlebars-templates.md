---
title: Handlebars Template Syntax
icon: code
order: 2
category: Design Docs
tags:
  - template
  - handlebars
  - syntax
---

# Handlebars Template Syntax

## Overview

The JustDB template system is based on the Handlebars template engine, providing rich syntax support for dynamic SQL generation.

## Basic Syntax

### Variable Output

```handlebars
{{variable}}
{{table.name}}
{{column.type}}
```

### Comments

```handlebars
{{!-- This is a comment and will not appear in the output --}}
```

### HTML Escaping

```handlebars
{{&variable}}  <!-- Unescaped -->
{{{variable}}} <!-- Unescaped -->
```

## Conditional Rendering

### if Condition

```handlebars
{{#if condition}}
  <!-- Rendered when condition is true -->
{{/if}}
```

### if-else Condition

```handlebars
{{#if condition}}
  <!-- Rendered when condition is true -->
{{else}}
  <!-- Rendered when condition is false -->
{{/if}}
```

### unless Condition (Negation)

```handlebars
{{#unless condition}}
  <!-- Rendered when condition is false -->
{{/unless}}
```

### Practical Examples

```handlebars
<!-- Idempotent mode -->
CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name}} (
    {{> columns}}
);

<!-- Conditional rendering for column attributes -->
{{#if column.nullable}}
    NULL
{{else}}
    NOT NULL
{{/if}}

<!-- Default value -->
{{#if column.defaultValue}}
    DEFAULT {{column.defaultValue}}
{{/if}}
```

## Loop Rendering

### each Loop

```handlebars
{{#each items}}
  {{this}}
{{/each}}
```

### Loop with Index

```handlebars
{{#each columns}}
  {{@index}}: {{this.name}}
{{/each}}
```

### Nested Loops

```handlebars
{{#each tables}}
  -- Table: {{this.name}}
  {{#each this.columns}}
    -- Column: {{this.name}}
  {{/each}}
{{/each}}
```

### Practical Examples

```handlebars
<!-- Generate column definitions -->
{{#each columns}}
    {{> column-spec}}{{#unless @last}},{{/unless}}
{{/each}}

<!-- Output:
id BIGINT PRIMARY KEY,
username VARCHAR(50) NOT NULL,
email VARCHAR(100) NOT NULL
-->
```

## Loop Helper Variables

| Variable | Description |
|----------|-------------|
| `@index` | Current index (starting from 0) |
| `@first` | Whether it's the first element |
| `@last` | Whether it's the last element |
| `@key` | Current key name (when iterating over objects) |

### Usage Example

```handlebars
{{#each columns}}
    {{@index}}: {{this.name}}
    {{#if @first}}
        -- First column
    {{/if}}
    {{#if @last}}
        -- Last column
    {{/if}}
{{/each}}
```

## Context Access

### Current Context

```handlebars
{{this.name}}
{{this.type}}
```

### Root Context

```handlebars
{{@root.dbType}}
{{@root.idempotent}}
{{@root.safeDrop}}
```

### Parent Context

```handlebars
{{> table-name ..}}  <!-- Use parent context -->
```

### Path Access

```handlebars
{{table.name}}
{{table.columns.[0].name}}
{{this.@root.idempotent}}
```

## Custom Helpers

### Registering a Helper

```java
TemplateHelper helper = new TemplateHelper();
helper.setName("eq");
helper.setFunction("ai.justdb.justdb.template.helper.EqualityHelper.eq");

pluginManager.registerHelper(helper);
```

### Using a Helper

```handlebars
{{#if (eq this.type "VARCHAR")}}
    VARCHAR
{{else}}
    {{this.type}}
{{/if}}
```

### Common Built-in Helpers

| Helper | Description | Example |
|--------|-------------|---------|
| `eq` | Equal to | `{{#if (eq a b)}}` |
| `ne` | Not equal to | `{{#if (ne a b)}}` |
| `gt` | Greater than | `{{#if (gt a b)}}` |
| `lt` | Less than | `{{#if (lt a b)}}` |
| `and` | Logical AND | `{{#if (and a b)}}` |
| `or` | Logical OR | `{{#if (or a b)}}` |
| `not` | Logical NOT | `{{#if (not a)}}` |

## Template References

### Basic Reference

```handlebars
{{> template-name}}
```

### Passing Context

```handlebars
{{> template-name context}}
```

### Passing Parameters

```handlebars
{{> table-name table=@root.newtable}}
```

## Practical Application Examples

### CREATE TABLE Template

```handlebars
CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name}} (
{{#each columns}}
    {{> column-spec}}{{#unless @last}},{{/unless}}
{{/each}}
{{#if indexes}}
    ,
{{#each indexes}}
    {{> index-spec}}{{#unless @last}},{{/unless}}
{{/each}}
{{/if}}
){{#if this.engine}} ENGINE={{this.engine}}{{/if}}{{#if this.charset}} CHARSET={{this.charset}}{{/if}};
```

### ALTER TABLE Template

```handlebars
ALTER TABLE {{> table-name ..}}
{{#if this.newName}}
    RENAME TO {{> table-name this}}
{{else}}
    {{#each columns}}
        {{#if this.added}}
            ADD COLUMN {{> column-spec this}},
        {{/if}}
        {{#if this.modified}}
            MODIFY COLUMN {{> column-spec this}},
        {{/if}}
        {{#if this.dropped}}
            DROP COLUMN {{> name-spec this.name}},
        {{/if}}
    {{/each}}
{{/if}};
```

### DROP TABLE Template

```handlebars
{{#if @root.safeDrop}}
    {{> rename-table}}
{{else}}
    DROP TABLE {{#if @root.idempotent}}IF EXISTS {{/if}}{{> table-name}};
{{/if}}
```

## Best Practices

### 1. Use Template References

```handlebars
<!-- Good practice: Use template references -->
{{> table-name}}

<!-- Avoid: Duplicate code -->
`{{this.schema}}`.`{{this.name}}`
```

### 2. Keep Templates Concise

```handlebars
<!-- Good practice: Break down into small templates -->
{{> column-spec}}
{{> index-spec}}
{{> constraint-spec}}

<!-- Avoid: Single large template -->
<!-- CREATE TABLE (...) ... (lots of code) -->
```

### 3. Use Conditional Rendering

```handlebars
<!-- Good practice: Conditional rendering -->
{{#if @root.idempotent}}IF NOT EXISTS {{/if}}

<!-- Avoid: Multiple templates -->
<!-- create-table-idempotent and create-table-normal -->
```

### 4. Add Explanatory Comments

```handlebars
{{!-- MySQL uses AUTO_INCREMENT --}}
{{#if (eq @root.dbType "mysql")}}
    AUTO_INCREMENT
{{/if}}
```

## Related Documentation

- [Template System Overview](./overview.md)
- [Template Inheritance Mechanism](./template-inheritance.md)
- [Lineage Template System](./lineage-templates.md)
