---
title: Cheatsheet
icon: bolt
description: Quick reference guides for JustDB core features
---

# Cheatsheet

Quick reference guides for JustDB core features. Each cheatsheet provides concise syntax, common scenarios, and best practices.

## Topics

### [Serial](./serial.md)
Auto-increment columns for generating unique identifiers.

- Syntax for MySQL, PostgreSQL, SQL Server, Oracle, SQLite, H2
- Composite primary keys with auto-increment
- Custom starting values and sequences
- Cross-database compatibility

### [Virtual Column](./virtual-column.md)
Computed columns derived from other columns.

- Expression-based computed columns
- Stored vs virtual column types
- preferColumn for fallback values
- Database-specific implementations

### [Plugin](./plugin.md)
Extending JustDB with custom plugins.

- Database adapters and type mappings
- Custom templates with Handlebars
- Template helpers and extensions
- Plugin development workflow

### [Type Mapping](./type-mapping.md)
Cross-database type conversion mappings.

- MySQL to PostgreSQL mappings
- Oracle to MySQL mappings
- Custom type definitions
- Migration best practices

### [Lifecycle Hooks](./lifecycle-hooks.md)
DDL execution lifecycle hooks.

- beforeCreates, afterCreates, beforeDrops, afterDrops
- beforeAlters, afterAlters, beforeAdds, afterAdds
- Conditional SQL execution
- Database-specific hooks

### [Reference System](./reference-system.md)
Component reuse and inheritance system.

- referenceId for component reuse
- Attribute merging rules
- Cross-file references
- Template inheritance

### [Migration](./migration.md)
Schema migration commands and strategies.

- Schema diff and comparison
- Safe drop vs destructive drop
- Migration with data preservation
- Rollback strategies

## Quick Syntax Reference

### Define a Table with Auto-Increment

```xml
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="username" type="VARCHAR(50)" nullable="false"/>
</Table>
```

### Create a Virtual Column

```xml
<Column name="full_name" type="VARCHAR(101)" virtual="true" stored="true">
    <Expression>CONCAT(first_name, ' ', last_name)</Expression>
</Column>
```

### Add Lifecycle Hook

```xml
<Table name="users">
    <beforeCreates>
        <ConditionalSqlScript dbms="mysql">
            SET @user_count = 0;
        </ConditionalSqlScript>
    </beforeCreates>
</Table>
```

### Use Reference System

```xml
<!-- Define global column -->
<Column id="global_id" name="id" type="BIGINT" primaryKey="true"/>

<!-- Reference in table -->
<Table name="users">
    <Column referenceId="global_id" name="id"/>
</Table>
```

## Database Support Matrix

| Feature | MySQL | PostgreSQL | Oracle | SQL Server | SQLite | H2 |
|---------|-------|------------|--------|------------|--------|-----|
| Auto-Increment | ✅ | ✅ | ⚠️* | ✅ | ✅ | ✅ |
| Virtual Column | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Stored Virtual | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Lifecycle Hooks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

*Oracle requires Sequence + Trigger combination

## Related Documentation

- [Schema Definition](../../reference/schema/)
- [CLI Commands](../../reference/cli/commands.md)
- [Template System](../../design/template-system/)
- [Examples](https://github.com/verydb/justdb/tree/main/examples)
