---
title: Template Inheritance Mechanism
icon: sitemap
order: 3
category: Design Docs
tags:
  - template
  - inheritance
  - plugin
---

# Template Inheritance Mechanism

## Overview

The JustDB template system supports multi-level inheritance and overriding, allowing plugins to override templates at any level for flexible template customization.

## Inheritance Hierarchy

### Three-Layer Inheritance Structure

```
sql-standard-root (Base Layer)
    ├── Lineage templates
    └── Common templates

mysql/postgresql/etc. (Dialect Layer)
    └── Reference or override base layer templates

custom-plugin (Extension Layer)
    └── Override dialect layer templates
```

### Inheritance Example

```xml
<!-- 1. sql-standard-root defines lineage templates -->
<plugin id="sql-standard-root">
    <templates>
        <template id="create-table-mysql-lineage" type="SQL" category="db">
            <content>
                CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name-spec}} (
                    {{> columns}}
                );
            </content>
        </template>
    </templates>
</plugin>

<!-- 2. mysql plugin references lineage template -->
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
    <templates>
        <template id="create-table" type="SQL" category="db">
            <content>{{> create-table-mysql-lineage}}</content>
        </template>
    </templates>
</plugin>

<!-- 3. custom-plugin overrides mysql template -->
<plugin id="custom-mysql" dialect="mysql" ref-id="mysql">
    <templates>
        <template id="create-table" type="SQL" category="db">
            <content>
                -- Custom CREATE TABLE logic
                CREATE TABLE {{#if @root.idempotent}}IF NOT EXISTS {{/if}}{{> table-name-spec}} (
                    {{> columns}}
                ) ENGINE=InnoDB;
            </content>
        </template>
    </templates>
</plugin>
```

## Template Override Rules

### Override Strategy

| Override Layer | Description | Example |
|----------------|-------------|---------|
| Main Entry Layer | Override conditional routing logic | `drop-table` |
| Operation Layer | Override specific operation implementation | `drop-table-raw` |
| Intermediate Layer | Add custom logic | `drop-table-mysql` |
| Lineage Layer | Define shared syntax | `drop-table-mysql-lineage` |

### Override Examples

```xml
<!-- Strategy 1: Override main entry, add custom routing logic -->
<template id="drop-table">
  <content>
    {{#if @root.customLogic}}
        -- Custom logic
        {{> custom-drop-table}}
    {{else if @root.safeDrop}}
        {{> rename-table}}
    {{else}}
        {{> drop-table-raw}}
    {{/if}}
  </content>
</template>

<!-- Strategy 2: Override operation layer, provide specific implementation -->
<template id="rename-table">
  <content>
    -- MySQL-specific optimized RENAME
    RENAME TABLE {{> table-name-spec ..}} TO {{> table-name-spec-safe}};
  </content>
</template>

<!-- Strategy 3: No override, use lineage template -->
<!-- MySQL plugin doesn't define drop-table, automatically uses sql-standard-root's conditional routing -->
```

## Plugin References (ref-id)

### ref-id Mechanism

```xml
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
    <!-- Inherits all templates from sql-standard-root -->
</plugin>
```

### Inheritance Behavior

- Child plugins can access all templates from parent plugins
- Child plugins can override parent plugin templates
- Unoverridden templates automatically use parent plugin definitions

### Multi-level Inheritance

```xml
<plugin id="base-plugin">
    <!-- Base templates -->
</plugin>

<plugin id="mysql-base" ref-id="base-plugin">
    <!-- MySQL common templates -->
</plugin>

<plugin id="mysql-8.0" ref-id="mysql-base">
    <!-- MySQL 8.0 specific templates -->
</plugin>
```

## Template Injection

### injectBefore

Inject before a specified template:

```xml
<template id="custom-create-table" injectBefore="create-table">
    <content>
        -- SQL to execute before CREATE TABLE
        SET @sql_mode = 'STRICT_TRANS_TABLES';
    </content>
</template>
```

### injectAfter

Inject after a specified template:

```xml
<template id="custom-index" injectAfter="create-table">
    <content>
        -- Create index after CREATE TABLE
        CREATE INDEX idx_users_email ON users(email);
    </content>
</template>
```

### injectReplace

Replace a specified template:

```xml
<template id="custom-drop" injectReplace="drop-table">
    <content>
        -- Custom DROP TABLE logic
        DROP TABLE IF EXISTS {{> table-name-spec}} CASCADE;
    </content>
</template>
```

## Template Lookup Order

### execute() Method Flow

```java
public String execute(String name, TemplateRootContext context) {
    String dbType = context.getDbType();

    // 1. Try most precise match
    Template template = findTemplate(name, "db", "SQL", dbType);
    if (template != null) return render(template, context);

    // 2. Try type-level match
    template = findTemplate(name, "db", "SQL", null);
    if (template != null) return render(template, context);

    // 3. Try category match
    template = findTemplate(name, "db", null, null);
    if (template != null) return render(template, context);

    // 4. Try global match
    template = findTemplate(name, null, null, null);
    if (template != null) return render(template, context);

    throw new TemplateNotFoundException(name);
}
```

### Lookup Priority

```
1. (name + category + type + dialect)     ← Highest priority
2. (name + category + type)
3. (name + category)
4. (name)                                  ← Lowest priority
```

## Practical Application Scenarios

### Scenario 1: Adding Dialect-Specific Syntax

```xml
<!-- PostgreSQL needs AFTER COLUMN syntax -->
<template id="add-column" dialect="postgresql">
    <content>
        ALTER TABLE {{> table-name-spec ..}}
        ADD COLUMN {{> column-spec this}};
    </content>
</template>
```

### Scenario 2: Overriding Common Logic

```xml
<!-- Oracle doesn't support IF EXISTS -->
<template id="drop-table" dialect="oracle">
    <content>
        DECLARE
            table_count NUMBER;
        BEGIN
            SELECT COUNT(*) INTO table_count
            FROM user_tables
            WHERE table_name = UPPER('{{this.name}}');

            IF table_count > 0 THEN
                EXECUTE IMMEDIATE 'DROP TABLE {{this.name}}';
            END IF;
        END;
    </content>
</template>
```

### Scenario 3: Adding Performance Optimizations

```xml
<!-- MySQL 8.0 uses RENAME INDEX optimization -->
<template id="rename-index" dialect="mysql">
    <content>
        {{#if (version @root.dbType '>=8.0')}}
            RENAME INDEX {{this.oldName}} TO {{this.newName}};
        {{else}}
            -- Old version uses DROP + CREATE
            DROP INDEX {{this.oldName}};
            CREATE INDEX {{this.newName}} ON {{> table-name-spec ..}}({{this.columns}});
        {{/if}}
    </content>
</template>
```

## Best Practices

### 1. Prioritize Using Lineage Templates

```xml
<!-- Good practice: Use lineage templates -->
<template id="create-table">
    <content>{{> create-table-mysql-lineage}}</content>
</template>

<!-- Avoid: Repeating definitions in each plugin -->
<template id="create-table">
    <content>CREATE TABLE ...</content>
</template>
```

### 2. Only Override Differences

```xml
<!-- Good practice: Only override the parts that need modification -->
<template id="modify-column" dialect="mysql">
    <content>ALTER TABLE ... MODIFY COLUMN ...;</content>
</template>

<!-- Avoid: Redefining the entire template -->
```

### 3. Keep Template Hierarchy Clear

```xml
<!-- Good practice: Clear hierarchy structure -->
sql-standard-root (lineage templates)
  └── mysql (dialect templates)
      └── custom-mysql (extension templates)

<!-- Avoid: Flat structure, all templates at the same level -->
```

### 4. Use Template References

```xml
<!-- Good practice: Reference shared templates -->
{{> table-name-spec}}
{{> column-spec}}
{{> index-spec}}

<!-- Avoid: Duplicate definitions in each template -->
```

## Related Documentation

- [Template System Overview](./overview.md)
- [Handlebars Template Syntax](./handlebars-templates.md)
- [Lineage Template System](./lineage-templates.md)
