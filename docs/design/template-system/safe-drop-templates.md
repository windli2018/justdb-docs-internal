# 列安全删除（Safe Drop Column）策略设计文档

## 一、设计目标

为支持 RENAME COLUMN 的数据库提供两种列安全删除策略：
1. **rename 模式**：直接重命名列（MySQL 8.0+, PostgreSQL, SQL Server）
2. **copy-drop 模式**：添加新列 → 复制数据 → 删除旧列

## 二、@root.safeDrop 的多值设计

共享 `TemplateRootContext.KEY_SAFE_DROP`，通过值来区分不同的策略：

| @root.safeDrop 值 | 行为 |
|-------------------|------|
| `false` 或 `null` | 不使用 safe drop，执行原始 DROP |
| `true` 或 `"rename"` | 使用 rename 模式（默认） |
| `"copy-drop"` | 使用 copy-drop 模式 |

### 2.1 设计优势

1. **减少上下文变量**：不需要新增 `KEY_SAFE_DROP_COLUMN_MODE`
2. **向后兼容**：`true` 仍然表示默认的 rename 模式
3. **可扩展**：未来可以添加更多策略

### 2.2 Java 端实现

```java
// GeneralContextParams.java
public class GeneralContextParams {
    // safeDrop 可以是 Boolean 或 String
    private Object safeDrop = false;

    // 获取 safeDrop 模式字符串
    public String getSafeDropMode() {
        if (safeDrop == null) {
            return null;
        }
        if (safeDrop instanceof Boolean) {
            return ((Boolean) safeDrop) ? "rename" : null;
        }
        return safeDrop.toString();
    }

    // 向后兼容的 getSafeDrop()
    public Boolean getSafeDrop() {
        if (safeDrop == null) {
            return false;
        }
        if (safeDrop instanceof Boolean) {
            return (Boolean) safeDrop;
        }
        // 非空字符串表示启用 safe drop
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

### 2.3 TemplateExecutor 设置

```java
// TemplateExecutor.java
// 设置 safeDrop 值（可以是 Boolean 或 String）
builder.put(TemplateRootContext.KEY_SAFE_DROP, idempotentParams.getSafeDrop());
```

## 三、模板结构设计

### 3.1 主入口模板（drop-column）

在 `sql-standard-root` 中定义：

```xml
<!-- 主入口：根据 @root.safeDrop 的值路由 -->
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

### 3.2 copy-drop 血统模板

在 `sql-standard-root` 中定义：

```xml
<!-- ==================== COPY-DROP COLUMN 模板 ==================== -->

<!-- MySQL lineage: ADD COLUMN + UPDATE + DROP COLUMN -->
<template id="drop-column-copy-data-mysql-lineage" name="drop-column-copy-data-mysql-lineage" type="SQL" category="db">
  <content>-- Step 1: Add backup column
ALTER TABLE {{> table-name ..}} ADD COLUMN {{> column-name @root.newcolumn}} {{> column-type ..}}{{#unless this.nullable}} NOT{{/unless}} NULL{{#if this.defaultValue}} DEFAULT {{this.defaultValue}}{{/if}};
-- Step 2: Copy data
UPDATE {{> table-name ..}} SET {{> column-name @root.newcolumn}} = {{> column-name ..}};
-- Step 3: Drop original column
ALTER TABLE {{> table-name ..}} DROP COLUMN {{> column-name ..}};</content>
</template>

<!-- PostgreSQL lineage -->
<template id="drop-column-copy-data-postgres-lineage" name="drop-column-copy-data-postgres-lineage" type="SQL" category="db">
  <content>-- Step 1: Add backup column
ALTER TABLE {{> table-name ..}} ADD COLUMN {{> column-name @root.newcolumn}} {{> column-type ..}}{{#unless this.nullable}} NOT{{/unless}} NULL{{#if this.defaultValue}} DEFAULT {{this.defaultValue}}{{/if}};
-- Step 2: Copy data
UPDATE {{> table-name ..}} SET {{> column-name @root.newcolumn}} = {{> column-name ..}};
-- Step 3: Drop original column
ALTER TABLE {{> table-name ..}} DROP COLUMN {{> column-name ..}};</content>
</template>

<!-- SQL Server lineage -->
<template id="drop-column-copy-data-sqlserver-lineage" name="drop-column-copy-data-sqlserver-lineage" type="SQL" category="db">
  <content>-- Step 1: Add backup column
ALTER TABLE {{> table-name ..}} ADD {{> column-name @root.newcolumn}} {{> column-type ..}}{{#unless this.nullable}} NOT{{/unless}} NULL{{#if this.defaultValue}} DEFAULT {{this.defaultValue}}{{/if}};
-- Step 2: Copy data
UPDATE {{> table-name ..}} SET {{> column-name @root.newcolumn}} = {{> column-name ..}};
-- Step 3: Drop original column
ALTER TABLE {{> table-name ..}} DROP COLUMN {{> column-name ..}};</content>
</template>
```

### 3.3 各 Plugin 实现

MySQL Plugin:

```xml
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
  <templates>
    <!-- drop-column-raw: 引用血统模板 -->
    <template id="drop-column-raw" name="drop-column-raw" type="SQL" category="db">
      <content>{{> drop-column-raw-mysql-lineage}}</content>
    </template>

    <!-- rename-column: 引用血统模板 -->
    <template id="rename-column" name="rename-column" type="SQL" category="db">
      <content>{{> rename-column-mysql-lineage}}</content>
    </template>

    <!-- drop-column-copy-data: 引用血统模板 -->
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

## 四、使用示例

### 4.1 rename 模式（默认）

```java
// 方式 1: 使用 true
GeneralContextParams params = new GeneralContextParams()
    .safeDrop(true);

// 方式 2: 使用 "rename"
GeneralContextParams params = new GeneralContextParams()
    .safeDropRename();

DBGenerator generator = new DBGenerator(justdbManager, "mysql");
String sql = generator.dropColumn(column, params);

// 输出（MySQL）：
// ALTER TABLE `user` RENAME COLUMN `email` TO `email_deleted_20250206132500`
```

### 4.2 copy-drop 模式

```java
GeneralContextParams params = new GeneralContextParams()
    .safeDropCopyDrop()
    .safeDropSuffix("_deleted")
    .safeDropTimestamp(false);

DBGenerator generator = new DBGenerator(justdbManager, "mysql");
String sql = generator.dropColumn(column, params);

// 输出（MySQL）：
// -- Step 1: Add backup column
// ALTER TABLE `user` ADD COLUMN `email_deleted` VARCHAR(255) NOT NULL DEFAULT '';
// -- Step 2: Copy data
// UPDATE `user` SET `email_deleted` = `email`;
// -- Step 3: Drop original column
// ALTER TABLE `user` DROP COLUMN `email`;
```

### 4.3 不同数据库的输出

| 数据库 | rename 模式 | copy-drop 模式 |
|--------|-----------|----------------|
| MySQL | `ALTER TABLE t RENAME COLUMN c TO c_deleted` | `ALTER TABLE t ADD COLUMN c_deleted ...; UPDATE t SET c_deleted = c; ALTER TABLE t DROP COLUMN c` |
| PostgreSQL | `ALTER TABLE t RENAME COLUMN c TO c_deleted` | 同上 |
| SQL Server | `EXEC sp_rename 't.c', 'c_deleted', 'COLUMN'` | 同上 |

## 五、数据库支持情况

| 数据库 | RENAME COLUMN 支持 | 推荐模式 |
|--------|-------------------|---------|
| MySQL 8.0+ | ✅ | rename |
| MySQL 5.7- | ❌ | copy-drop |
| PostgreSQL | ✅ | rename |
| SQL Server | ✅ | rename |
| Oracle | ❌ | N/A（不适用） |
| SQLite | ❌ | N/A（不适用） |

**注意**：
- 不支持 RENAME COLUMN 的数据库（Oracle, SQLite）仍然回退到原始 DROP
- MySQL 5.7- 可以使用 copy-drop 模式作为替代方案

## 六、实现清单

### 6.1 Java 代码修改

- [ ] `GeneralContextParams`: 修改 `safeDrop` 类型为 `Object`，添加 `getSafeDropMode()` 方法
- [ ] `GeneralContextParams`: 添加 `safeDropRename()` 和 `safeDropCopyDrop()` fluent API
- [ ] `TemplateRootContext`: 无需修改（共享 `KEY_SAFE_DROP`）
- [ ] `TemplateExecutor`: 无需修改（已经正确设置 `safeDrop` 值）

### 6.2 模板添加

在 `sql-standard-root` 中：
- [ ] 更新 `drop-column` 主入口模板，添加 copy-drop 路由
- [ ] 添加 `drop-column-copy-data-mysql-lineage`
- [ ] 添加 `drop-column-copy-data-postgres-lineage`
- [ ] 添加 `drop-column-copy-data-sqlserver-lineage`

在各 Plugin 中：
- [ ] MySQL: 添加 `drop-column-copy-data` 模板
- [ ] PostgreSQL: 添加 `drop-column-copy-data` 模板
- [ ] SQL Server: 添加 `drop-column-copy-data` 模板

### 6.3 测试

- [ ] 单元测试：`GeneralContextParams.getSafeDropMode()`
- [ ] 集成测试：rename 模式生成正确 SQL
- [ ] 集成测试：copy-drop 模式生成正确 SQL
- [ ] 回归测试：原有 safe drop 功能不受影响

## 七、替代方案

### 方案 A：新增 `KEY_SAFE_DROP_COLUMN_MODE`（不推荐）

```java
// 需要新增变量
public static final String KEY_SAFE_DROP_COLUMN_MODE = "safeDropColumnMode";
builder.put(KEY_SAFE_DROP_COLUMN_MODE, idempotentParams.getSafeDropColumnMode());
```

**缺点**：
- 增加上下文变量数量
- 模板中需要同时检查 `@root.safeDrop` 和 `@root.safeDropColumnMode`
- 代码更复杂

### 方案 B：共享 `KEY_SAFE_DROP`（推荐）

本文档采用的方案，优点：
- 减少上下文变量
- 模板逻辑更简洁
- 向后兼容
- 易于扩展
