---
title: Schema 差异计算
icon: 🔄
description: CanonicalSchemaDiff API 详细参考，用于计算和生成 Schema 差异
order: 6
---

# Schema 差异计算

CanonicalSchemaDiff 提供了 Schema 差异计算功能，用于检测两个 Schema 之间的变更。本文档详细介绍 Schema 差异计算的使用方法。

## 目录

- [差异计算概述](#差异计算概述)
- [变更类型](#变更类型)
- [差异数据结构](#差异数据结构)
- [计算方法](#计算方法)
- [差异生成](#差异生成)
- [代码示例](#代码示例)

## 差异计算概述

CanonicalSchemaDiff 是 JustDB 的核心差异计算组件，用于：

- 比较两个 Schema 的差异
- 检测表、列、索引、约束、序列的变更
- 支持重命名检测（通过 `formerNames`）
- 生成差异 Schema 用于迁移
- 支持数据变更检测

**包路径**: `ai.justdb.justdb.schema.CanonicalSchemaDiff`

### 核心特性

1. **全面的变更检测** - 检测 ADDED、REMOVED、RENAMED、MODIFIED
2. **智能重命名检测** - 通过 `formerNames` 自动识别重命名
3. **多层级比较** - 表、列、索引、约束、序列、数据
4. **过滤支持** - 通过 `tableScopes` 过滤特定表
5. **SQL 生成** - 将差异转换为可执行的 SQL

## 变更类型

**ChangeType** 枚举定义了所有支持的变更类型。

| 类型 | 描述 | 适用对象 |
|------|------|----------|
| `ADDED` | 新增对象 | Table, Column, Index, Constraint, Sequence |
| `REMOVED` | 删除对象 | Table, Column, Index, Constraint, Sequence |
| `RENAMED` | 重命名对象 | Table, Column, Sequence |
| `MODIFIED` | 修改对象 | Table, Column, Sequence |
| `SYNCED` | 数据同步 | Data |

### 变更检测规则

**表级别**:
- `ADDED` - 目标 Schema 中存在，当前 Schema 中不存在
- `REMOVED` - 当前 Schema 中存在，目标 Schema 中不存在
- `RENAMED` - 通过 `formerNames` 匹配到旧名称
- `MODIFIED` - 表名相同，但列/索引/约束有变更

**列级别**:
- `ADDED` - 目标表中存在，当前表中不存在
- `REMOVED` - 当前表中存在，目标表中不存在
- `RENAMED` - 通过 `formerNames` 匹配到旧列名
- `MODIFIED` - 列名相同，但属性（类型、约束等）不同

**索引/约束**:
- `ADDED` - 目标表中存在，当前表中不存在
- `REMOVED` - 当前表中存在，目标表中不存在
- 不支持 RENAMED 和 MODIFIED

## 差异数据结构

### CanonicalSchemaDiff

主差异计算类。

**核心属性**:

```java
public class CanonicalSchemaDiff {
    private final Justdb currentSchema;        // 当前 Schema
    private final Justdb targetSchema;         // 目标 Schema
    private final List<TableChange&gt;> tableChanges;      // 表变更
    private final List<ColumnChange&gt;> columnChanges;    // 列变更
    private final List<IndexChange&gt;> indexChanges;      // 索引变更
    private final List<ConstraintChange&gt;> constraintChanges; // 约束变更
    private final List<SequenceChange&gt;> sequenceChanges;  // 序列变更
    private final List<DataChange&gt;> dataChanges;         // 数据变更
    private final List<TableDataFilterChange&gt;> tableDataFilterChanges; // 数据过滤变更
}
```

### TableChange

表变更信息。

```java
public static class TableChange extends Item {
    private String tableName;      // 新表名
    private ChangeType changeType; // 变更类型
    private List&lt;String&gt; formerNames; // 旧名称列表
    private Table currentTable;    // 当前表
    private Table targetTable;     // 目标表
}
```

### ColumnChange

列变更信息。

```java
public static class ColumnChange extends Item {
    private String tableName;      // 所属表名
    private String columnName;     // 新列名
    private ChangeType changeType; // 变更类型
    private List&lt;String&gt; formerNames; // 旧名称列表
    private Column currentColumn;  // 当前列
    private Column targetColumn;   // 目标列
}
```

### IndexChange

索引变更信息。

```java
public static class IndexChange extends Item {
    private String tableName;      // 所属表名
    private String indexName;      // 索引名
    private ChangeType changeType; // 变更类型 (ADDED/REMOVED)
    private Index currentIndex;    // 当前索引
    private Index targetIndex;     // 目标索引
}
```

### ConstraintChange

约束变更信息。

```java
public static class ConstraintChange extends Item {
    private String tableName;      // 所属表名
    private String constraintName; // 约束名
    private ChangeType changeType; // 变更类型 (ADDED/REMOVED)
    private Constraint currentConstraint; // 当前约束
    private Constraint targetConstraint;  // 目标约束
}
```

### SequenceChange

序列变更信息。

```java
public static class SequenceChange extends Item {
    private String sequenceName;       // 序列名
    private ChangeType changeType;     // 变更类型
    private List&lt;String&gt; formerNames;  // 旧名称列表
    private Sequence currentSequence;  // 当前序列
    private Sequence targetSequence;   // 目标序列
}
```

### DataChange

数据变更信息（用于条件数据迁移）。

```java
public static class DataChange extends Item {
    private String tableName;      // 所属表名
    private String condition;      // 数据条件
    private String module;         // 模块标识
    private String description;    // 详细描述
    private ChangeType changeType; // 变更类型
    private Data currentData;      // 当前数据
    private Data targetData;       // 目标数据
}
```

## 计算方法

### 构造方法

```java
// 创建差异计算器
public CanonicalSchemaDiff(Justdb currentSchema, Justdb targetSchema)

// 空构造器（用于手动构建差异）
public CanonicalSchemaDiff()
```

### calculateAll()

计算所有类型的差异。

```java
public CanonicalSchemaDiff calculateAll()
```

**执行顺序**:
1. `calculateTables()` - 表差异
2. `calculateColumns()` - 列差异
3. `calculateIndexes()` - 索引差异
4. `calculateConstraints()` - 约束差异
5. `calculateSequences()` - 序列差异
6. `calculateDataChanges()` - 数据差异
7. `calculateTableDataFilterChanges()` - 数据过滤差异

**示例**:

```java
CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
diff.calculateAll();

// 获取变更
List<TableChange&gt;> tableChanges = diff.getTableChanges();
List<ColumnChange&gt;> columnChanges = diff.getColumnChanges();
```

### calculateTables()

计算表级差异。

```java
public CanonicalSchemaDiff calculateTables()
```

**检测逻辑**:
1. 通过 `formerNames` 检测 RENAMED
2. 检测 ADDED（目标存在，当前不存在）
3. 检测 REMOVED（当前存在，目标不存在）
4. 同名表后续处理 MODIFIED

### calculateColumns()

计算列级差异。

```java
public CanonicalSchemaDiff calculateColumns()
```

**检测逻辑**:
1. 通过 `formerNames` 检测 RENAMED
2. 检测 ADDED
3. 检测 REMOVED
4. 比较属性检测 MODIFIED（类型、约束、默认值等）

**比较的属性**:
- type (包括 precision 和 scale)
- nullable
- primaryKey
- defaultValue
- autoIncrement

### calculateIndexes()

计算索引差异。

```java
public CanonicalSchemaDiff calculateIndexes()
```

**支持的变更**: ADDED, REMOVED

### calculateConstraints()

计算约束差异。

```java
public CanonicalSchemaDiff calculateConstraints()
```

**支持的变更**: ADDED, REMOVED

**特殊处理**: 检测主键变更（通过列定义）

### calculateSequences()

计算序列差异。

```java
public CanonicalSchemaDiff calculateSequences()
```

**检测逻辑**:
1. 通过 `formerNames` 检测 RENAMED
2. 检测 ADDED
3. 检测 REMOVED
4. 比较参数检测 MODIFIED

**比较的参数**:
- startWith
- incrementBy
- minValue
- maxValue
- cycle
- cache

### calculateDataChanges()

计算数据变更。

```java
public CanonicalSchemaDiff calculateDataChanges()
```

**用途**: 检测条件数据迁移的变更。

### calculateTableDataFilterChanges()

计算表数据过滤变更。

```java
public CanonicalSchemaDiff calculateTableDataFilterChanges()
```

**用途**: 检测 `dataExportStrategy` 和 `dataFilterCondition` 的变更。

## 差异生成

### toDiffSchema()

将差异转换为 Schema 对象。

```java
public Justdb toDiffSchema()
```

**返回**: 包含所有变更的 Schema，每个对象都有 `changeType` 属性。

**示例**:

```java
CanonicalSchemaDiff diff = new CanonicalSchemaDiff(current, target);
diff.calculateAll();

Justdb diffSchema = diff.toDiffSchema();

// 使用 diffSchema 进行部署
SchemaDeployer deployer = new SchemaDeployer(connection);
deployer.deployDiff(diffSchema);
```

### generateDataChangeSql()

生成数据变更 SQL。

```java
public List&lt;String&gt; generateDataChangeSql(String dialect)
```

**参数**:
- `dialect` - 数据库方言（mysql, postgresql 等）

**策略**:
- 有 condition: 精确状态同步（DELETE 超出范围的行 + UPSERT）
- 无 condition: 更新匹配行 + 插入新行 + 处理删除

### generateTableDataFilterChangeSql()

生成数据过滤变更 SQL。

```java
public List&lt;String&gt; generateTableDataFilterChangeSql(String dialect)
```

**策略**: 删除未删除的行，然后根据新过滤条件重新导入。

## 代码示例

### 基本差异计算

```java
import ai.justdb.justdb.schema.*;
import ai.justdb.justdb.util.schema.SchemaLoaderFactory;
import ai.justdb.justdb.JustdbManager;
import ai.justdb.justdb.cli.Loaded;
import java.util.List;

public class BasicDiff {
    public static void main(String[] args) {
        JustdbManager manager = JustdbManager.getInstance();

        // 加载当前 Schema
        Loaded&lt;Justdb&gt; currentResult = SchemaLoaderFactory.load(
            "current-schema.json",
            manager
        );
        Justdb currentSchema = currentResult.getData();

        // 加载目标 Schema
        Loaded&lt;Justdb&gt; targetResult = SchemaLoaderFactory.load(
            "target-schema.json",
            manager
        );
        Justdb targetSchema = targetResult.getData();

        // 计算差异
        CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
        diff.calculateAll();

        // 输出变更
        System.out.println("=== Table Changes ===");
        for (TableChange tc : diff.getTableChanges()) {
            System.out.println(tc.getTableName() + ": " + tc.getChangeType());
        }

        System.out.println("\n=== Column Changes ===");
        for (ColumnChange cc : diff.getColumnChanges()) {
            System.out.println(cc.getTableName() + "." + cc.getColumnName() +
                ": " + cc.getChangeType());
        }
    }
}
```

### 重命名检测

```java
import ai.justdb.justdb.schema.*;
import java.util.Arrays;

public class RenameDetection {
    public static void main(String[] args) {
        // 当前 Schema
        Justdb currentSchema = new Justdb();

        Table userTable = new Table("user");
        userTable.setColumns(Arrays.asList(
            createColumn("id", "BIGINT"),
            createColumn("user_name", "VARCHAR(50)")
        ));
        currentSchema.setTables(Arrays.asList(userTable));

        // 目标 Schema（带 formerNames）
        Justdb targetSchema = new Justdb();

        Table usersTable = new Table("users");
        usersTable.setFormerNames(Arrays.asList("user"));
        usersTable.setColumns(Arrays.asList(
            createColumn("id", "BIGINT"),
            createColumn("username", "VARCHAR(50)")
        ));

        // 设置列的 formerNames
        usersTable.getColumns().get(1).setFormerNames(Arrays.asList("user_name"));

        targetSchema.setTables(Arrays.asList(usersTable));

        // 计算差异
        CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
        diff.calculateAll();

        // 输出结果
        for (TableChange tc : diff.getTableChanges()) {
            System.out.println("Table: " + tc.getTableName() +
                " (" + tc.getFormerNames() + ") -> " + tc.getChangeType());
        }

        for (ColumnChange cc : diff.getColumnChanges()) {
            System.out.println("Column: " + cc.getTableName() + "." +
                cc.getColumnName() + " (" + cc.getFormerNames() + ") -> " +
                cc.getChangeType());
        }
    }

    private static Column createColumn(String name, String type) {
        Column column = new Column();
        column.setName(name);
        column.setType(type);
        return column;
    }
}
```

### 生成迁移 SQL

```java
import ai.justdb.justdb.schema.*;
import ai.justdb.justdb.migration.SchemaMigrationService;
import ai.justdb.justdb.JustdbManager;
import java.util.List;

public class MigrationSqlGeneration {
    public static void main(String[] args) {
        JustdbManager manager = JustdbManager.getInstance();
        Justdb currentSchema = loadSchema("current-schema.json");
        Justdb targetSchema = loadSchema("target-schema.json");

        // 计算差异
        CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
        diff.calculateAll();

        // 生成迁移 SQL
        SchemaMigrationService migrationService =
            new SchemaMigrationService(currentSchema, manager);

        List&lt;String&gt; sqlStatements = migrationService.generateMigrationSql(diff);

        // 输出 SQL
        System.out.println("-- Migration SQL");
        for (String sql : sqlStatements) {
            System.out.println(sql);
            System.out.println();
        }
    }

    private static Justdb loadSchema(String path) {
        // 实现 Schema 加载
        return new Justdb();
    }
}
```

### 表范围过滤

```java
import ai.justdb.justdb.schema.*;
import java.util.List;
import java.util.Map;

public class TableScopeFiltering {
    public static void main(String[] args) {
        Justdb currentSchema = ...;
        Justdb targetSchema = ...;

        // 创建表范围过滤器
        TableScopes scopes = new TableScopes();
        scopes.setIncludes(Arrays.asList("user*", "order*"));
        scopes.setExcludes(Arrays.asList("*_temp", "*_backup"));

        // 过滤表
        Map&lt;String, , Table> currentTables = toTableMap(currentSchema);
        Map&lt;String, , Table> targetTables = toTableMap(targetSchema);

        Map&lt;String, , Table> filteredCurrent =
            CanonicalSchemaDiff.filterByTableScopes(currentTables, scopes);
        Map&lt;String, , Table> filteredTarget =
            CanonicalSchemaDiff.filterByTableScopes(targetTables, scopes);

        // 使用过滤后的表计算差异
        Justdb filteredCurrent = new Justdb();
        filteredCurrent.setTables(new ArrayList<>(filteredCurrent.values()));

        Justdb filteredTarget = new Justdb();
        filteredTarget.setTables(new ArrayList<>(filteredTarget.values()));

        CanonicalSchemaDiff diff = new CanonicalSchemaDiff(filteredCurrent, filteredTarget);
        diff.calculateAll();

        System.out.println("Filtered changes: " + diff.getTableChanges().size());
    }
}
```

### 完整迁移流程

```java
import ai.justdb.justdb.schema.*;
import ai.justdb.justdb.migration.SchemaMigrationService;
import ai.justdb.justdb.SchemaDeployer;
import ai.justdb.justdb.JustdbManager;
import java.sql.Connection;
import java.sql.DriverManager;

public class FullMigration {
    public static void main(String[] args) throws Exception {
        JustdbManager manager = JustdbManager.getInstance();

        // 加载 Schema
        Justdb currentSchema = SchemaLoaderFactory.load(
            "current-schema.json",
            manager
        ).getData();

        Justdb targetSchema = SchemaLoaderFactory.load(
            "target-schema.json",
            manager
        ).getData();

        // 1. 计算差异
        CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
        diff.calculateAll();

        System.out.println("Found " + diff.getTableChanges().size() + " table changes");
        System.out.println("Found " + diff.getColumnChanges().size() + " column changes");

        // 2. 生成迁移 SQL
        SchemaMigrationService migrationService =
            new SchemaMigrationService(currentSchema, manager);

        List&lt;String&gt; sqlStatements = migrationService.generateMigrationSql(diff);

        // 3. 执行迁移
        Connection connection = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/mydb",
            "root",
            "password"
        );

        try {
            int executedCount = migrationService.executeMigrationSql(
                sqlStatements,
                connection
            );

            System.out.println("Executed " + executedCount + " SQL statements");

            // 4. 验证结果
            SchemaDeployer deployer = new SchemaDeployer(connection);
            SchemaDeployer.SchemaVerificationResult result =
                deployer.verifySchema(targetSchema);

            if (result.isSuccess()) {
                System.out.println("Migration completed successfully!");
            } else {
                System.out.println("Migration verification failed:");
                for (String difference : result.getDifferences()) {
                    System.out.println("  - " + difference);
                }
            }
        } finally {
            connection.close();
        }
    }
}
```

### 数据变更检测

```java
import ai.justdb.justdb.schema.*;
import java.util.List;

public class DataChangeDetection {
    public static void main(String[] args) {
        Justdb currentSchema = ...;
        Justdb targetSchema = ...;

        // 计算差异（包括数据变更）
        CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
        diff.calculateAll();

        // 获取数据变更
        List<DataChange&gt;> dataChanges = diff.getDataChanges();

        System.out.println("Data changes: " + dataChanges.size());

        for (DataChange dc : dataChanges) {
            System.out.println("Table: " + dc.getTableName());
            System.out.println("Condition: " + dc.getCondition());
            System.out.println("Change Type: " + dc.getChangeType());
            System.out.println("Module: " + dc.getModule());
            System.out.println();
        }

        // 生成数据变更 SQL
        List&lt;String&gt; dataSql = diff.generateDataChangeSql("mysql");

        System.out.println("Data change SQL:");
        for (String sql : dataSql) {
            System.out.println(sql);
            System.out.println();
        }
    }
}
```

## 高级用法

### 自定义差异比较

```java
// 只计算特定类型的差异
CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);

// 只计算表和列的差异
diff.calculateTables();
diff.calculateColumns();

// 不计算索引和约束
```

### 差异合并

```java
// 合并多个差异
CanonicalSchemaDiff diff1 = ...;
CanonicalSchemaDiff diff2 = ...;

Justdb mergedDiffSchema = new Justdb();
mergedDiffSchema.setTables(Stream.concat(
    diff1.toDiffSchema().getTables().stream(),
    diff2.toDiffSchema().getTables().stream()
).collect(Collectors.toList()));
```

## 最佳实践

### 1. 使用 formerNames 跟踪重命名

```xml
<!-- 目标 Schema -->
<Table name="users" formerNames="user">
  <Column name="username" formerNames="user_name" type="VARCHAR(50)"/>
</Table>
```

### 2. 验证差异后再部署

```java
diff.calculateAll();

if (diff.getTableChanges().isEmpty() &&
    diff.getColumnChanges().isEmpty()) {
    System.out.println("No changes detected");
    return;
}

// 审查变更
for (TableChange tc : diff.getTableChanges()) {
    if (tc.getChangeType() == ChangeType.REMOVED) {
        System.out.println("Warning: Table " + tc.getTableName() + " will be dropped");
    }
}
```

### 3. 使用版本管理

```java
Justdb diffSchema = diff.toDiffSchema();

SchemaDeployer deployer = new SchemaDeployer(connection);
deployer.deployDiffIfNotApplied(
    diffSchema,
    "v1.1.0",
    "Add email column to users"
);
```

## 相关文档

- [Java API 参考](./java-api.md) - 核心 Java API
- [Schema 加载器](./schema-loader.md) - Schema 加载详解
- [Schema 部署器](./schema-deployer.md) - Schema 部署详解
- [JDBC 驱动](./jdbc-driver.md) - JDBC 驱动使用指南
