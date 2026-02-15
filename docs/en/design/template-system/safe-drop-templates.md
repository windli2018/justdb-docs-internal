# Column Safe Drop Strategy Design Document

## 1. Design Goals

Provide two safe column drop strategies for databases that support RENAME COLUMN:
1. **rename mode**: Directly rename the column (MySQL 8.0+, PostgreSQL, SQL Server)
2. **copy-drop mode**: Add new column → copy data → drop old column

## 2. Multi-Value Design for @root.safeDrop

Share `TemplateRootContext.KEY_SAFE_DROP`, distinguishing different strategies through values:

| @root.safeDrop Value | Behavior |
|---------------------|----------|
| `false` or `null` | Don't use safe drop, execute original DROP |
| `true` or `"rename"` | Use rename mode (default) |
| `"copy-drop"` | Use copy-drop mode |

### 2.1 Design Advantages

1. **Reduce context variables**: No need to add `KEY_SAFE_DROP_COLUMN_MODE`
2. **Backward compatible**: `true` still represents the default rename mode
3. **Extensible**: More strategies can be added in the future

### 2.2 Java Implementation

```java
// GeneralContextParams.java
public class GeneralContextParams {
    // safeDrop can be Boolean or String
    private Object safeDrop = false;

    // Get safeDrop mode string
    public String getSafeDropMode() {
        if (safeDrop == null) {
            return null;
        }
        if (safeDrop instanceof Boolean) {
            return ((Boolean) safeDrop) ? "rename" : null;
        }
        return safeDrop.toString();
    }

    // Backward compatible getSafeDrop()
    public Boolean getSafeDrop() {
        if (safeDrop == null) {
            return false;
        }
        if (safeDrop instanceof Boolean) {
            return (Boolean) safeDrop;
        }
        // Non-empty string means safe drop is enabled
        return !safeDrop.toString().isEmpty();
    }

    // Fluent API
    public GeneralContextParams safeDropRename() {
        this.safeDrop = "rename";
        return this;
    }

    public GeneralContextParams safeDropCopyDrop() {
        this.safeDrop = "copy-drop";
        return this;
    }
}
```

### 2.3 TemplateExecutor Setup

```java
// TemplateExecutor.java
// Set safeDrop value (can be Boolean or String)
builder.put(TemplateRootContext.KEY_SAFE_DROP, idempotentParams.getSafeDrop());
```

## 3. Template Structure Design

### 3.1 Main Entry Template (drop-column)

Defined in `sql-standard-root`:

```xml
<!-- Main entry: Route based on @root.safeDrop value -->
<template id="drop-column" name="drop-column" type="SQL" category="db">
  <content>{{#if @root.safeDrop}}
    {{#ifCond @root.safeDrop "eq" "copy-drop"}}
      {{> drop-column-copy-data}}
    {{else}}
      {{> rename-column}}
    {{/ifCond}}
  {{else}}
    {{> drop-column-raw}}
  {{/if}}</content>
</template>
```

### 3.2 copy-drop Lineage Templates

Defined in `sql-standard-root`:

```xml
<!-- ==================== COPY-DROP COLUMN Templates ==================== -->

<!-- MySQL lineage: ADD COLUMN + UPDATE + DROP COLUMN -->
<template id="drop-column-copy-data-mysql-lineage" name="drop-column-copy-data-mysql-lineage" type="SQL" category="db">
  <content>-- Step 1: Add backup column
ALTER TABLE {{> table-name-spec ..}} ADD COLUMN {{> column-name @root.newcolumn}} {{> column-type ..}}{{#unless this.nullable}} NOT{{/unless}} NULL{{#if this.defaultValue}} DEFAULT {{this.defaultValue}}{{/if}};
-- Step 2: Copy data
UPDATE {{> table-name-spec ..}} SET {{> column-name @root.newcolumn}} = {{> column-name ..}};
-- Step 3: Drop original column
ALTER TABLE {{> table-name-spec ..}} DROP COLUMN {{> column-name ..}};</content>
</template>

<!-- PostgreSQL lineage -->
<template id="drop-column-copy-data-postgres-lineage" name="drop-column-copy-data-postgres-lineage" type="SQL" category="db">
  <content>-- Step 1: Add backup column
ALTER TABLE {{> table-name-spec ..}} ADD COLUMN {{> column-name @root.newcolumn}} {{> column-type ..}}{{#unless this.nullable}} NOT{{/unless}} NULL{{#if this.defaultValue}} DEFAULT {{this.defaultValue}}{{/if}};
-- Step 2: Copy data
UPDATE {{> table-name-spec ..}} SET {{> column-name @root.newcolumn}} = {{> column-name ..}};
-- Step 3: Drop original column
ALTER TABLE {{> table-name-spec ..}} DROP COLUMN {{> column-name ..}};</content>
</template>

<!-- SQL Server lineage -->
<template id="drop-column-copy-data-sqlserver-lineage" name="drop-column-copy-data-sqlserver-lineage" type="SQL" category="db">
  <content>-- Step 1: Add backup column
ALTER TABLE {{> table-name-spec ..}} ADD {{> column-name @root.newcolumn}} {{> column-type ..}}{{#unless this.nullable}} NOT{{/unless}} NULL{{#if this.defaultValue}} DEFAULT {{this.defaultValue}}{{/if}};
-- Step 2: Copy data
UPDATE {{> table-name-spec ..}} SET {{> column-name @root.newcolumn}} = {{> column-name ..}};
-- Step 3: Drop original column
ALTER TABLE {{> table-name-spec ..}} DROP COLUMN {{> column-name ..}};</content>
</template>
```

### 3.3 Plugin Implementations

MySQL Plugin:

```xml
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
  <templates>
    <!-- drop-column-raw: Reference lineage template -->
    <template id="drop-column-raw" name="drop-column-raw" type="SQL" category="db">
      <content>{{> drop-column-raw-mysql-lineage}}</content>
    </template>

    <!-- rename-column: Reference lineage template -->
    <template id="rename-column" name="rename-column" type="SQL" category="db">
      <content>{{> rename-column-mysql-lineage}}</content>
    </template>

    <!-- drop-column-copy-data: Reference lineage template -->
    <template id="drop-column-copy-data" name="drop-column-copy-data" type="SQL" category="db">
      <content>{{> drop-column-copy-data-mysql-lineage}}</content>
    </template>
  </templates>
</plugin>
```

PostgreSQL Plugin:

```xml
<plugin id="postgresql" dialect="postgresql" ref-id="sql-standard-root">
  <templates>
    <template id="drop-column-raw" name="drop-column-raw" type="SQL" category="db">
      <content>{{> drop-column-raw-postgres-lineage}}</content>
    </template>

    <template id="rename-column" name="rename-column" type="SQL" category="db">
      <content>{{> rename-column-postgres-lineage}}</content>
    </template>

    <template id="drop-column-copy-data" name="drop-column-copy-data" type="SQL" category="db">
      <content>{{> drop-column-copy-data-postgres-lineage}}</content>
    </template>
  </templates>
</plugin>
```

SQL Server Plugin:

```xml
<plugin id="sqlserver" dialect="sqlserver" ref-id="sql-standard-root">
  <templates>
    <template id="drop-column-raw" name="drop-column-raw" type="SQL" category="db">
      <content>{{> drop-column-raw-sqlserver-lineage}}</content>
    </template>

    <template id="rename-column" name="rename-column" type="SQL" category="db">
      <content>{{> rename-column-sqlserver-lineage}}</content>
    </template>

    <template id="drop-column-copy-data" name="drop-column-copy-data" type="SQL" category="db">
      <content>{{> drop-column-copy-data-sqlserver-lineage}}</content>
    </template>
  </templates>
</plugin>
```

## 4. Usage Examples

### 4.1 rename Mode (Default)

```java
// Method 1: Use true
GeneralContextParams params = new GeneralContextParams()
    .safeDrop(true);

// Method 2: Use "rename"
GeneralContextParams params = new GeneralContextParams()
    .safeDropRename();

DBGenerator generator = new DBGenerator(justdbManager, "mysql");
String sql = generator.dropColumn(column, params);

// Output (MySQL):
// ALTER TABLE `user` RENAME COLUMN `email` TO `email_deleted_20250206132500`
```

### 4.2 copy-drop Mode

```java
GeneralContextParams params = new GeneralContextParams()
    .safeDropCopyDrop()
    .safeDropSuffix("_deleted")
    .safeDropTimestamp(false);

DBGenerator generator = new DBGenerator(justdbManager, "mysql");
String sql = generator.dropColumn(column, params);

// Output (MySQL):
// -- Step 1: Add backup column
// ALTER TABLE `user` ADD COLUMN `email_deleted` VARCHAR(255) NOT NULL DEFAULT '';
// -- Step 2: Copy data
// UPDATE `user` SET `email_deleted` = `email`;
// -- Step 3: Drop original column
// ALTER TABLE `user` DROP COLUMN `email`;
```

### 4.3 Output for Different Databases

| Database | rename Mode | copy-drop Mode |
|----------|-------------|----------------|
| MySQL | `ALTER TABLE t RENAME COLUMN c TO c_deleted` | `ALTER TABLE t ADD COLUMN c_deleted ...; UPDATE t SET c_deleted = c; ALTER TABLE t DROP COLUMN c` |
| PostgreSQL | `ALTER TABLE t RENAME COLUMN c TO c_deleted` | Same as above |
| SQL Server | `EXEC sp_rename 't.c', 'c_deleted', 'COLUMN'` | Same as above |

## 5. Database Support

| Database | RENAME COLUMN Support | Recommended Mode |
|----------|----------------------|------------------|
| MySQL 8.0+ | ✅ | rename |
| MySQL 5.7- | ❌ | copy-drop |
| PostgreSQL | ✅ | rename |
| SQL Server | ✅ | rename |
| Oracle | ❌ | N/A (not applicable) |
| SQLite | ❌ | N/A (not applicable) |

**Note**:
- Databases that don't support RENAME COLUMN (Oracle, SQLite) still fall back to the original DROP
- MySQL 5.7- can use copy-drop mode as an alternative

## 6. Implementation Checklist

### 6.1 Java Code Modifications

- [ ] `GeneralContextParams`: Change `safeDrop` type to `Object`, add `getSafeDropMode()` method
- [ ] `GeneralContextParams`: Add `safeDropRename()` and `safeDropCopyDrop()` fluent API
- [ ] `TemplateRootContext`: No modification needed (shares `KEY_SAFE_DROP`)
- [ ] `TemplateExecutor`: No modification needed (already correctly sets `safeDrop` value)

### 6.2 Template Additions

In `sql-standard-root`:
- [ ] Update `drop-column` main entry template, add copy-drop routing
- [ ] Add `drop-column-copy-data-mysql-lineage`
- [ ] Add `drop-column-copy-data-postgres-lineage`
- [ ] Add `drop-column-copy-data-sqlserver-lineage`

In each Plugin:
- [ ] MySQL: Add `drop-column-copy-data` template
- [ ] PostgreSQL: Add `drop-column-copy-data` template
- [ ] SQL Server: Add `drop-column-copy-data` template

### 6.3 Testing

- [ ] Unit test: `GeneralContextParams.getSafeDropMode()`
- [ ] Integration test: rename mode generates correct SQL
- [ ] Integration test: copy-drop mode generates correct SQL
- [ ] Regression test: Original safe drop functionality is not affected

## 7. Alternative Approaches

### Approach A: Add `KEY_SAFE_DROP_COLUMN_MODE` (Not Recommended)

```java
// Need to add new variable
public static final String KEY_SAFE_DROP_COLUMN_MODE = "safeDropColumnMode";
builder.put(KEY_SAFE_DROP_COLUMN_MODE, idempotentParams.getSafeDropColumnMode());
```

**Disadvantages**:
- Increases the number of context variables
- Templates need to check both `@root.safeDrop` and `@root.safeDropColumnMode`
- More complex code

### Approach B: Share `KEY_SAFE_DROP` (Recommended)

This is the approach adopted in this document, with advantages:
- Reduces context variables
- Simpler template logic
- Backward compatible
- Easy to extend
