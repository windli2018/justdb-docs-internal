# JustDB 数据库迁移（DB Migrate）详细设计文档

## 文档概述

本文档详细描述了 JustDB 框架的数据库迁移（DB Migrate）功能设计，包括架构、数据条件过滤、多 Data 节点支持、tableScopes 过滤等核心功能。

**版本**: 1.0
**最后更新**: 2026-02-06
**维护者**: Wind Li

---------------------------

## 目录

1. [概述](#1-概述)
2. [核心架构](#2-核心架构)
3. [CanonicalSchemaDiff 增强](#3-canonicalschemadiff-增强)
4. [Data 节点设计](#4-data-节点设计)
5. [迁移流程](#5-迁移流程)
6. [tableScopes 过滤](#6-tablescopes-过滤)
7. [多 Data 节点场景](#7-多-data-节点场景)
8. [命令行接口](#8-命令行接口)
9. [配置支持](#9-配置支持)
10. [验证机制](#10-验证机制)
11. [设计原则](#11-设计原则)
12. [完整示例](#12-完整示例)

---------------------------

## 1. 概述

### 1.1 功能目标

JustDB Migrate 模式提供动态测试能力，使得：
- migrate 后用户可通过 SQL 修改表和数据
- 重新迁移时数据恢复到 migrate 状态
- 表结构恢复到 migrate 定义的状态
- 支持数据条件过滤，只恢复范围内数据

### 1.2 核心特性

- **统一迁移入口**: 通过 SchemaDiff 计算变更，生成 SQL，执行 SQL
- **tableScopes 过滤**: 按模式过滤要处理的表
- **数据条件过滤**: 通过 `Data.condition` 指定数据范围
- **多 Data 节点**: 同一表可有多个 Data 节点，每个有不同条件
- **逻辑删除优先**: 支持逻辑删除，deleted=true 的行会被逻辑或物理删除

### 1.3 设计约束

- 系统预制数据使用 `Data` 节点管理
- 用户数据通过 SQL 或应用层管理，不受 migrate 影响
- 所有数据迁移逻辑集中在 `CanonicalSchemaDiff`

---------------------------

## 2. 核心架构

### 2.1 统一迁移流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      SchemaDiff                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                   │
│  │   Tables    │    │    Data     │    │  Columns    │                   │
│  │ (tableScopes)│    │ (condition) │    │ (types...)  │                   │
│  └─────────────┘    └─────────────┘    └─────────────┘                   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    calculateAll()                          │  │
│  │  - calculateTables()   [应用 tableScopes]                    │  │
│  │  - calculateColumns()                                       │  │
│  │  - calculateDataChanges() [处理 condition]                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐      │
│  │              generateDataChangeSql()                     │      │
│  │  - 有 condition: DELETE + INSERT                          │      │
│  │  - 无 condition: INSERT 新数据 + 处理 deleted 标记          │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │                    generateSql(dialect)                   │      │
│  │  生成所有 SQL (DDL + DML)                                  │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │                    executeSql()                        │      │
│  │  按顺序执行所有 SQL 语句                                  │      │
│  └─────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 核心类图

```
┌─────────────────────────────────────────────────────────────┐
│                    CanonicalSchemaDiff                     │
├─────────────────────────────────────────────────────────────┤
│ + currentSchema: Justdb                                     │
│ + targetSchema: Justdb                                     │
│ + dataChanges: List&lt;DataChange&gt;                            │
│                                                          │
│ + calculateAll(): CanonicalSchemaDiff                       │
│ + calculateTables(): CanonicalSchemaDiff                       │
│ + calculateColumns(): CanonicalSchemaDiff                      │
│ + calculateDataChanges(): CanonicalSchemaDiff                 │
│                                                          │
│ + generateSql(dialect): List&lt;String&gt;                         │
│ + generateDataChangeSql(dialect): List&lt;String&gt;               │
│                                                          │
│ + detectConditionOverlaps(table, dataNodes): OverlapResult  │
│ + findMatchingDataNode(currentDataNodes, target): Data       │
│ + groupDataByTable(schema): Map&lt;String, List<Data&gt;>          │
│ + filterByTableScopes(tables, scopes): Map&lt;String, Table&gt;   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                        DataChange                           │
├─────────────────────────────────────────────────────────────┤
│ + tableName: String                                        │
│ + condition: String                                        │
│ + module: String                                           │
│ + description: String                                      │
│ + changeType: ChangeType  (ADDED/MODIFIED/REMOVED/SYNCED)      │
│ + currentData: Data                                         │
│ + targetData: Data                                         │
└─────────────────────────────────────────────────────────────┘
```

---------------------------

## 3. CanonicalSchemaDiff 增强

### 3.1 类结构

```java
public class CanonicalSchemaDiff {
    private final Justdb currentSchema;
    private final Justdb targetSchema;

    // 新增：数据变更列表
    private final List&lt;DataChange&gt; dataChanges = new ArrayList&lt;&gt;();

    // ========== 核心方法 ==========

    /**
     * 计算所有变更（包括数据变更）
     */
    public CanonicalSchemaDiff calculateAll();

    /**
     * 计算表变更（应用 tableScopes 过滤）
     */
    public CanonicalSchemaDiff calculateTables();

    /**
     * 计算数据变更（支持多 Data 节点和 condition）
     */
    public CanonicalSchemaDiff calculateDataChanges();

    // ========== SQL 生成 ==========

    /**
     * 生成所有变更的 SQL（DDL + DML）
     */
    public List&lt;String&gt; generateSql(String dialect);

    /**
     * 生成数据变更的 SQL 语句
     */
    public List&lt;String&gt; generateDataChangeSql(String dialect);

    // ========== 辅助方法 ==========

    /**
     * 检测多个 Data 节点之间的条件重叠
     */
    private OverlapDetectionResult detectConditionOverlaps(
        Table table,
        List&lt;Data&gt; dataNodes
    );

    /**
     * 找到匹配的 Data 节点（通过 condition 和 module）
     */
    private Data findMatchingDataNode(
        List&lt;Data&gt; currentDataNodes,
        Data targetData
    );

    /**
     * 将 Data 节点按表名分组
     */
    private Map&lt;String, List<Data&gt;> groupDataByTable(Justdb schema);

    /**
     * 按 tableScopes 过滤表
     */
    private Map&lt;String, Table&gt; filterByTableScopes(
        Map&lt;String, Table&gt; tables,
        TableScopes scopes
    );

    /**
     * 检查表是否在 tableScopes 范围内
     */
    private boolean isTableInScope(String tableName, TableScopes scopes);

    // ========== SQL 生成方法 ==========

    /**
     * 生成精准同步 SQL（有 condition 的 Data 节点）
     * 1. DELETE 匹配 condition 但不匹配主键的行
     * 2. UPDATE 匹配主键的行
     * 3. INSERT schema 中 deleted=false 的行
     */
    private List&lt;String&gt; generateRestorationSql(
        Table table,
        Data data,
        String dialect
    );

    /**
     * 生成默认数据 SQL（无 condition 的 Data 节点）
     * 1. UPDATE 匹配主键的行
     * 2. INSERT 新数据
     * 3. 处理 deleted=true 的行
     */
    private List&lt;String&gt; generateDefaultDataSql(
        Table table,
        Data data,
        String dialect
    );

    private String buildDeleteOutOfScopeSql(
        Table table,
        String condition,
        List&lt;Row&gt; schemaRows,
        String dialect
    );

    private String buildNotEqualsClause(Map&lt;String, Object&gt; primaryKey);

    private String formatValue(Object value);

    private String buildInsertSql(
        Table table,
        Row row,
        String dialect
    );

    private String buildUpsertSql(
        Table table,
        Row row,
        String dialect
    );

    private String buildLogicalDeleteSql(
        Table table,
        Row row,
        String dialect
    );

    private String buildPhysicalDeleteSql(
        Table table,
        Row row,
        String dialect
    );
}
```

### 3.2 DataChange 类

```java
@Getter @Setter
public static class DataChange extends Item {
    private String tableName;
    private String condition;
    private String module;
    private String description;
    private ChangeType changeType;  // ADDED, MODIFIED, REMOVED, SYNCED
    private Data currentData;
    private Data targetData;
}
```

---------------------------

## 4. Data 节点设计

### 4.1 Data 节点结构

```java
public class Data extends SchemaSense {
    @XmlAttribute
    protected String table;           // 目标表名

    @XmlAttribute
    protected String condition;      // 数据条件（SQL WHERE 语法）

    @XmlAttribute
    protected String module;         // 模块标识

    @XmlAttribute
    protected String description;    // 详细描述

    @JsonProperty("Row")
    @XmlElement(name = "Row")
    List&lt;Row&gt; rows = new ArrayList&lt;&gt;();
}
```

### 4.2 有 condition 的 Data 节点

**用途**: 管理活跃的系统预制数据

**migrate 行为**:
- DELETE 匹配 condition 但不匹配主键的行
- INSERT schema 中的行（匹配 condition 的行）

**示例**:

```xml
<Data table="users"
      condition="is_system=1 and deleted=0"
      module="system-users"
      description="系统管理员用户">
  &lt;Row id="1" name="admin" is_system="1" deleted="0"/&gt;
  &lt;Row id="2" name="system" is_system="1" deleted="0"/&gt;
&lt;/Data&gt;
```

### 4.3 无 condition 的 Data 节点

**用途**: 管理默认数据（新数据导入）和已删除数据的清理

**migrate 行为**:
- **更新现有数据**: UPDATE 匹配主键的行，不匹配的行保持不变
- **导入新数据**: INSERT 不在数据库中的行（`deleted=false` 或没有 `deleted` 属性）
- **处理 deleted 标记**: `deleted=true` 的行执行逻辑删除或物理删除

**与有 condition 的 Data 节点的区别**:

| 特性 | 有 condition | 无 condition |
|------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| 现有数据 | DELETE 范围内行不匹配主键的行，更新匹配 id 的行 | 更新匹配 id 的数据（不匹配保留原样） |
| 新数据 | INSERT（deleted=false） | INSERT（deleted=false） |
| deleted=true | 逻辑删除或物理删除 | 逻辑删除或物理删除 |
| 适用场景 | 精准同步状态 | 增加默认数据 + 清理特定数据 |

**示例**:

```xml
<Data table="users"
      module="default-users"
      description="默认用户数据（新数据导入）">
  &lt;!-- 新数据：如果不存在则插入 --&gt;
  &lt;Row id="1" name="admin" deleted="false"/&gt;
  &lt;Row id="2" name="guest" deleted="false"/&gt;
  &lt;!-- 已删除的数据：将被逻辑删除或物理删除 --&gt;
  &lt;Row id="999" name="old_admin" deleted="true"/&gt;
  &lt;Row id="998" name="legacy_system" deleted="true"/&gt;
&lt;/Data&gt;
```

**生成的 SQL**:

```sql
-- UPDATE 匹配主键的行（更新所有字段）
INSERT INTO `users` (`id`, `name`, `deleted`) VALUES (1, 'admin', 0)
ON DUPLICATE KEY UPDATE `name`='admin', `deleted`=0;

INSERT INTO `users` (`id`, `name`, `deleted`) VALUES (2, 'guest', 0)
ON DUPLICATE KEY UPDATE `name`='guest', `deleted`=0;

-- 逻辑删除（表有 deleted 字段）
UPDATE `users` SET `deleted`=1 WHERE `id`=999;
UPDATE `users` SET `deleted`=1 WHERE `id`=998;

-- 或物理删除（表无 deleted 字段）
DELETE FROM `users` WHERE `id`=999;
DELETE FROM `users` WHERE `id`=998;
```

**使用场景**:

1. **默认数据初始化**: 导入系统默认数据（如默认管理员、默认配置）
2. **数据更新**: 更新匹配主键的现有数据
3. **清理旧数据**: 标记为 deleted 的行会被删除
4. **用户数据保留**: 用户添加的不匹配主键的数据不受影响

**设计建议**:
- **推荐**: 用于导入和更新默认/初始数据
- **推荐**: 与有 condition 的 Data 节点配合使用（精准同步 + 默认数据）
- **注意**: 只更新匹配主键的数据，不匹配的数据保持不变

---------------------------

## 5. 迁移流程

### 5.1 完整迁移流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    SchemaMigrationService                   │
│                                                                 │
│  migrate(migrateSchemaPath)                                     │
│    │                                                           │
│    ├──> load current schema from database                    │
│    ├──> load migrate schema from file                          │
│    │                                                           │
│    ├──> CanonicalSchemaDiff diff = new CanonicalSchemaDiff(      │
│    │         currentSchema, migrateSchema)                       │
│    │                                                           │
│    ├──> diff.calculateAll()                                  │
│    │    ├── calculateTables()      [tableScopes 过滤]           │
│    │    ├── calculateColumns()                                   │
│    │    ├── calculateIndexes()                                   │
│    │    ├── calculateConstraints()                               │
│    │    └── calculateDataChanges()  [condition 过滤]           │
    │           ├── 检测条件重叠                                   │
    │           ├── 计算每个 Data 节点的变更                       │
    │           └── 添加到 dataChanges 列表                        │
    │                                                           │
│    ├──> diff.generateSql(dialect)                            │
│    │    ├── generateTableSql()                                │
│    │    ├── generateColumnSql()                               │
│    │    ├── generateIndexSql()                                │
    │    ├── generateConstraintSql()                            │
│    │    └── generateDataChangeSql()  [数据 SQL]              │
    │         ├── 有 condition: DELETE + INSERT                   │
│ │         └── 无 condition: INSERT 新数据 + 处理 deleted        │
    │                                                           │
│    └──> executeSql(sqlStatements)                            │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 数据变更计算流程

```
┌─────────────────────────────────────────────────────────────────┐
│           CanonicalSchemaDiff.calculateDataChanges()            │
│                                                                 │
│  1. 按表分组 Data 节点                                          │
│     Map&lt;String, List<Data&gt;> targetDataByTable =              │
│         groupDataByTable(targetSchema)                         │
│     Map&lt;String, List<Data&gt;> currentDataByTable =             │
│         groupDataByTable(currentSchema)                        │
│                                                                 │
│  2. 对每个表的 Data 节点进行处理                                 │
│     for each (tableName, targetDataNodes) {                       │
│         Table table = findTable(targetSchema, tableName)          │
│                                                                 │
│         // 检测条件重叠                                           │
│         OverlapDetectionResult overlaps =                       │
│             detectConditionOverlaps(table, targetDataNodes)     │
│                                                                 │
│         // 为每个 Data 节点计算变更                               │
│         for each (targetData : targetDataNodes) {                  │
│             if (targetData.isDeleted()) continue;                  │
│                                                                 │
│             Data currentData =                               │
│                 findMatchingDataNode(currentDataNodes, targetData)│
│                                                                 │
│             DataChange change = new DataChange();               │
│             change.setTableName(tableName);                      │
│             change.setTargetData(targetData);                    │
│             change.setCurrentData(currentData);                    │
│             change.setCondition(targetData.getCondition());      │
│                                                                 │
│             // 判断变更类型                                       │
│             if (currentData == null)                            │
│                 change.setChangeType(ADDED);                     │
│             else if (currentData.isDeleted())                   │
│                 change.setChangeType(ADDED);                     │
│             else                                                   │
│                 change.setChangeType(MODIFIED);                  │
│                                                                 │
│             dataChanges.add(change);                             │
│         }                                                         │
│     }                                                             │
│ }                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 SQL 生成流程

```
┌─────────────────────────────────────────────────────────────────┐
│          CanonicalSchemaDiff.generateDataChangeSql()            │
│                                                                 │
│  for each (DataChange in dataChanges) {                           │
│      if (changeType == REMOVED) {                               │
│          // Data 节点被删除，不处理                                  │
│          continue;                                                │
│      }                                                            │
│                                                                 │
│      Data targetData = change.getTargetData();                  │
│      Table table = findTable(targetData.getTableName());          │
│                                                                 │
│      if (targetData.hasCondition()) {                          │
│          // 有 condition：精准同步状态                             │
│          // DELETE 不匹配主键的行，UPDATE 匹配的行，INSERT 新行        │
│          sqlStatements.addAll(                                   │
│              generateRestorationSql(table, targetData, dialect)  │
│          );                                                      │
│      } else {                                                     │
│          // 无 condition：UPDATE 匹配 id 的数据 + INSERT 新数据 + 处理 deleted │
│          sqlStatements.addAll(                                   │
│              generateDefaultDataSql(table, targetData, dialect)   │
│          );                                                      │
│      }                                                            │
│  }                                                                │
│                                                                 │
│  return sqlStatements;                                          │
└─────────────────────────────────────────────────────────────────┘
```

---------------------------

## 6. tableScopes 过滤

### 6.1 tableScopes 结构

```java
@Data
@EqualsAndHashCode(callSuper = true)
public class TableScopes extends ItemScopes {
    @JsonProperty("includes")
    @JsonAlias({"includeTables", "tableIncludes",
               "includeTablePatterns", "table-include-patterns"})
    @Override
    public List&lt;String&gt; getIncludes();

    @JsonProperty("excludes")
    @JsonAlias({"excludeTables", "tableExcludes",
               "excludeTablePatterns", "table-exclude-patterns"})
    @Override
    public List&lt;String&gt; getExcludes();
}
```

### 6.2 过滤逻辑

```
┌─────────────────────────────────────────────────────────────────┐
│              filterByTableScopes(tables, scopes)               │
│                                                                 │
│  if (scopes == null ||                                      │
│      (scopes.getIncludes().isEmpty() &&                          │
│       scopes.getExcludes().isEmpty())) {                        │
│      return tables;  // 无过滤                                   │
│  }                                                            │
│                                                                 │
│  return tables.entrySet().stream()                             │
│      .filter(entry -> isTableInScope(entry.getKey(), scopes))    │
│      .collect(Collectors.toMap(                                │
│          Map.Entry::getKey, Map.Entry::getValue));             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              isTableInScope(tableName, scopes)                    │
│                                                                 │
│  // 1. 先检查 excludes                                            │
│  for (String pattern : scopes.getExcludes()) {                  │
│      if (matchesPattern(tableName, pattern)) {                   │
│          return false;  // 在排除列表中                           │
│      }                                                         │
│  }                                                            │
│                                                                 │
│  // 2. 再检查 includes                                              │
│  if (scopes.getIncludes().isEmpty()) {                           │
│      return true;  // 无 include 限制，包含所有                  │
│  }                                                            │
│  for (String pattern : scopes.getIncludes()) {                   │
│      if (matchesPattern(tableName, pattern)) {                   │
│          return true;   // 在包含列表中                           │
│      }                                                         │
│  }                                                            │
│                                                                 │
│  return false;  // 不在 include 中                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 模式匹配规则

- `*` 匹配任意字符序列
- `?` 匹配单个字符
- 模式转换为正则表达式：`*.replace(".", "\\.").replace("*", ".*")`

**示例**:

| 模式 | 匹配 | 不匹配 |
|------------------------------------------------------|------------------------------------------------------|--------------------------------------------------------|
| `users*` | users, users_active, users_temp | orders, sys_users |
| `*_temp` | users_temp, orders_temp | users, temp_table |
| `*.config` | app.config, system.config | .config, config |

---------------------------

## 7. 多 Data 节点场景

### 7.1 场景 1：同一表，不同类型的数据

```xml
<Data table="dict"
      condition="type='status' and deleted=0"
      module="dict-status"
      description="状态字典数据">
  &lt;Row code="active" label="激活" type="status"/&gt;
  &lt;Row code="inactive" label="停用" type="status"/&gt;
&lt;/Data&gt;

<Data table="dict"
      condition="type='region' and deleted=0"
      module="dict-region"
      description="区域字典数据">
  &lt;Row code="east" label="华东" type="region"/&gt;
  &lt;Row code="west" label="华西" type="region"/&gt;
&lt;/Data&gt;

<Data table="dict"
      condition="type='category' and deleted=0"
      module="dict-category"
      description="分类字典数据">
  &lt;Row code="electronics" label="电子产品" type="category"/&gt;
  &lt;Row code="clothing" label="服装" type="category"/&gt;
&lt;/Data&gt;
```

**migrate 行为**:
- 每个节点独立处理
- SQL 修改 `type='status'` 的数据，重新迁移时只恢复这部分
- `type='region'` 和 `type='category'` 的数据不受影响

### 7.2 场景 2：同一表，不同环境的数据

```xml
<Data table="config"
      condition="env='dev' and deleted=0"
      module="dev-config"
      description="开发环境配置">
  &lt;Row key="debug_mode" value="true" env="dev"/&gt;
&lt;/Data&gt;

<Data table="config"
      condition="env='prod' and deleted=0"
      module="prod-config"
      description="生产环境配置">
  &lt;Row key="debug_mode" value="false" env="prod"/&gt;
&lt;/Data&gt;
```

### 7.3 场景 3：条件重叠（需要检测）

```xml
&lt;!-- 不推荐：条件有重叠 --&gt;
&lt;Data table="users" condition="is_system=1 and deleted=0"&gt;
  &lt;Row id="1" is_system="1" deleted="0" role="admin"/&gt;
&lt;/Data&gt;

&lt;Data table="users" condition="role='admin' and deleted=0"&gt;
  &lt;Row id="1" is_system="1" deleted="0" role="admin"/&gt;
&lt;/Data&gt;
```

**检测结果**:
- id=1 同时匹配两个 Data 节点
- 发出警告日志
- 使用第一个匹配的 Data 节点

---------------------------

## 8. 命令行接口

### 8.1 MigrateCommand 新增参数

| 参数 | 简写 | 描述 |
|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| `--migrate-data-filter` | `-mdf` | 数据过滤条件（WHERE 子句） |
| `--migrate-include-tables` | `-mit` | 包含的表模式（逗号分隔） |
| `--migrate-exclude-tables` | `-met` | 排除的表模式（逗号分隔） |
| `--migrate-validate-data-conditions` | `-mvdc` | 验证 Data 节点条件 |

### 8.2 Db2SchemaCommand 新增参数

| 参数 | 简写 | 描述 |
|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| `--db2schema-multi-data-nodes` | `-dmn` | 提取多个 Data 节点 |
| `--db2schema-data-group-by` | `-dgb` | 按列值分组提取 Data 节点 |

---------------------------

## 9. 配置支持

### 9.1 JustdbConfiguration 新增字段

```java
public class JustdbConfiguration extends UnknownValues {
    // 新增：表过滤模式
    private List&lt;String&gt; includeTablePatterns = new ArrayList&lt;&gt;();
    private List&lt;String&gt; excludeTablePatterns = new ArrayList&lt;&gt;();

    // 新增：数据过滤条件
    private String dataFilter;

    // 新增：验证 Data 节点条件
    private boolean validateDataConditions = false;
}
```

### 9.2 配置文件示例

```yaml
# justdbcfg.yaml

# 表过滤
tableScopes:
  includes:
    - users*
    - orders*
  excludes:
    - *_temp
    - *_bak

# 数据过滤（可选）
dataFilter: "deleted=0 and is_system=1"

# 验证开关
validateDataConditions: true
```

---------------------------

## 10. 验证机制

### 10.1 DataConditionValidator

```java
/**
 * Data 节点条件验证器
 * 验证多个 Data 节点的条件是否合理
 */
public class DataConditionValidator {

    /**
     * 验证单个表的多个 Data 节点
     * @return ValidationResult
     */
    public ValidationResult validate(Table table, List&lt;Data&gt; dataNodes);

    private ValidationResult validateConditionSyntax(Table table, Data data);
    private OverlapDetectionResult detectOverlaps(Table table, List&lt;Data&gt; dataNodes);
    private CoverageResult checkCoverage(Table table, List&lt;Data&gt; dataNodes);
}

public static class ValidationResult {
    private boolean valid = true;
    private List&lt;String&gt; errors = new ArrayList&lt;&gt;();
    private List&lt;String&gt; warnings = new ArrayList&lt;&gt;();
}
```

### 10.2 验证项目

1. **条件语法验证**
   - 条件中的列是否存在于表中
   - 条件语法是否正确

2. **条件重叠检测**
   - 检测同一行是否匹配多个 Data 节点
   - 生成警告信息

3. **条件完整性检查**
   - 检查系统数据是否都被覆盖
   - 识别未覆盖的数据缺口

---------------------------

## 11. 设计原则

### 11.1 核心原则

#### 原则 1：统一迁移入口
**系统只有一个迁移数据的入口，就是 SchemaDiff**

```java
// 唯一的入口
CanonicalSchemaDiff diff = new CanonicalSchemaDiff(current, target);
diff.calculateAll();        // 计算所有变更
List&lt;String&gt; sql = diff.generateSql();  // 生成 SQL
executeSql(sql);               // 执行 SQL
```

#### 原则 2：条件驱动的数据恢复

- **有 condition**: DELETE 范围内行不匹配主键的行，更新匹配 id 的行 + INSERT schema 中 deleted=false 的行（精准同步状态）
- **无 condition**: UPDATE 匹配 id 的数据 + INSERT 新数据 + 处理 `deleted=true` 的行（增加默认数据 + 清理特定数据）

#### 原则 3：系统数据与用户数据分离

- **系统数据**: 使用 `Data` 节点 + `condition` 标记
- **用户数据**: 通过 SQL 或应用层管理

#### 原则 4：逻辑删除优先

- 优先使用逻辑删除（`SET deleted=1`）
- 表无 `deleted` 字段时才使用物理删除

### 11.2 Data 节点设计原则

#### 原则 1：条件互斥性

**推荐**：多个 Data 节点的 condition 应该互斥

```xml
&lt;!-- 好的设计 --&gt;
&lt;Data table="users" condition="user_type='admin' and deleted=0"&gt;
  &lt;Row id="1" user_type="admin"/&gt;
&lt;/Data&gt;
&lt;Data table="users" condition="user_type='guest' and deleted=0"&gt;
  &lt;Row id="2" user_type="guest"/&gt;
&lt;/Data&gt;

&lt;!-- 避免：条件重叠 --&gt;
&lt;Data table="users" condition="deleted=0"&gt;
  &lt;Row id="1" deleted="0"/&gt;
&lt;/Data&gt;
&lt;Data table="users" condition="is_active=1"&gt;
  &lt;Row id="1" is_active="1"/&gt;  &lt;!-- 重叠 --&gt;
&lt;/Data&gt;
```

#### 原则 2：条件完整性

**推荐**：多个 Data 节点的 condition 应该覆盖所有系统数据

#### 原则 3：明确标记

- 使用 `module` 标识模块（如 `system-users`）
- 使用 `description` 添加详细说明
- 同时支持两个字段

#### 原则 4：分模块管理

**不要把所有数据丢到一个 Data 节点里**

按功能模块、数据类型、环境等维度拆分。

---------------------------

## 12. 完整示例

### 12.1 Schema 示例

```xml
&lt;Justdb&gt;
  &lt;!-- tableScopes: 定义表级别过滤 --&gt;
  &lt;tableScopes&gt;
    &lt;includes&gt;
      &lt;include&gt;users*&lt;/include&gt;
      &lt;include&gt;dict*&lt;/include&gt;
      &lt;include&gt;config*&lt;/include&gt;
    &lt;/includes&gt;
    &lt;excludes&gt;
      &lt;exclude&gt;*_temp&lt;/exclude&gt;
      &lt;exclude&gt;*_bak&lt;/exclude&gt;
    &lt;/excludes&gt;
  &lt;/tableScopes&gt;

  &lt;!-- 表定义 --&gt;
  &lt;tables&gt;
    &lt;Table name="users"&gt;
      &lt;columns&gt;
        &lt;Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/&gt;
        &lt;Column name="name" type="VARCHAR(100)" nullable="false"/&gt;
        &lt;Column name="is_system" type="BOOLEAN" defaultValue="false"/&gt;
        &lt;Column name="deleted" type="BOOLEAN" defaultValue="false"/&gt;
        &lt;Column name="env" type="VARCHAR(20)"/&gt;
      &lt;/columns&gt;
    &lt;/Table&gt;

    &lt;Table name="dict"&gt;
      &lt;columns&gt;
        &lt;Column name="code" type="VARCHAR(50)" primaryKey="true"/&gt;
        &lt;Column name="label" type="VARCHAR(100)"/&gt;
        &lt;Column name="type" type="VARCHAR(50)"/&gt;
        &lt;Column name="deleted" type="BOOLEAN" defaultValue="false"/&gt;
      &lt;/columns&gt;
    &lt;/Table&gt;

    &lt;Table name="config"&gt;
      &lt;columns&gt;
        &lt;Column name="key" type="VARCHAR(100)" primaryKey="true"/&gt;
        &lt;Column name="value" type="TEXT"/&gt;
        &lt;Column name="env" type="VARCHAR(20)"/&gt;
        &lt;Column name="deleted" type="BOOLEAN" defaultValue="false"/&gt;
      &lt;/columns&gt;
    &lt;/Table&gt;
  &lt;/tables&gt;

  &lt;!-- 数据定义 --&gt;
  &lt;Datas&gt;
    &lt;!-- users 表：系统管理员（有 condition） --&gt;
    <Data table="users"
          condition="is_system=1 and deleted=0"
          module="system-users"
          description="系统管理员用户，拥有系统级权限">
      &lt;Row id="1" name="admin" is_system="true" deleted="false"/&gt;
      &lt;Row id="2" name="system" is_system="true" deleted="false"/&gt;
    &lt;/Data&gt;

    &lt;!-- users 表：默认用户（无 condition，新数据导入 + 处理 deleted） --&gt;
    <Data table="users"
          module="default-users"
          description="默认用户数据，包括初始用户和需要清理的旧用户">
      &lt;Row id="1" name="admin" deleted="false"/&gt;
      &lt;Row id="2" name="guest" deleted="false"/&gt;
      &lt;Row id="999" name="old_admin" deleted="true"/&gt;
    &lt;/Data&gt;

    &lt;!-- dict 表：按类型分类（多 Data 节点） --&gt;
    <Data table="dict"
          condition="type='status' and deleted=0"
          module="dict-status"
          description="状态字典数据">
      &lt;Row code="active" label="激活" type="status"/&gt;
      &lt;Row code="inactive" label="停用" type="status"/&gt;
    &lt;/Data&gt;

    <Data table="dict"
          condition="type='region' and deleted=0"
          module="dict-region"
          description="区域字典数据">
      &lt;Row code="east" label="华东" type="region"/&gt;
      &lt;Row code="west" label="华西" type="region"/&gt;
    &lt;/Data&gt;

    &lt;!-- config 表：按环境分类（多 Data 节点） --&gt;
    <Data table="config"
          condition="env='dev' and deleted=0"
          module="dev-config"
          description="开发环境配置">
      &lt;Row key="debug_mode" value="true" env="dev"/&gt;
    &lt;/Data&gt;

    <Data table="config"
          condition="env='prod' and deleted=0"
          module="prod-config"
          description="生产环境配置">
      &lt;Row key="debug_mode" value="false" env="prod"/&gt;
    &lt;/Data&gt;
  &lt;/Datas&gt;
&lt;/Justdb&gt;
```

### 12.2 迁移示例

**场景**：用户通过 SQL 修改了数据后，重新迁移

**初始状态**（migrate 后）：
- users 表有系统用户（id=1, 2）
- dict 表有状态和区域数据

**SQL 修改**：
```sql
-- 修改了系统用户
UPDATE users SET name='SuperAdmin' WHERE id=1;

-- 添加了新区域（用户数据，不在任何 Data 节点中）
INSERT INTO dict (code, label, type, deleted)
VALUES ('south', '华南', 'region', 0);

-- 添加了新用户（用户数据）
INSERT INTO users (id, name, is_system, deleted)
VALUES (100, 'Regular User', false, false);
```

**重新迁移**：
```bash
justdb migrate up --migrate-include-tables="users*,dict*,config*"
```

**结果**：
1. `id=1` 的 name 恢复为 'admin'（在 condition 范围内）
2. `id=100` 的用户保留为 'Regular User'（不在任何 condition 范围内）
3. `south` 区域保留（不在任何 Data 节点中，或属于用户添加）
4. `type='status'` 和 `type='region'` 的字典数据保持一致

---------------------------

## 附录

### A. 关键类文件清单

| 文件路径 | 说明 |
|---------------------------------------------------------------------------------|------------------------------------------------------|
| `justdb-core/src/main/java/org/verydb/justdb/schema/CanonicalSchemaDiff.java` | 核心实现 |
| `justdb-core/src/main/java/org/verydb/justdb/schema/Data.java` | Data 节点定义 |
| `justdb-core/src/main/java/org/verydb/justdb/schema/TableScopes.java` | tableScopes 定义 |
| `justdb-core/src/main/java/org/verydb/justdb/migration/SchemaMigrationService.java` | 迁移服务 |
| `justdb-core/src/main/java/org/verydb/justdb/cli/commands/MigrateCommand.java` | 命令行接口 |
| `justdb-core/src/main/java/org/verydb/justdb/jdbc/JustdbDataSource.java` | RowCondition SQL 生成 |
| `justdb-core/src/main/java/org/verydb/justdb/cli/JustdbConfiguration.java` | 配置支持 |
| `justdb-core/src/main/java/org/verydb/justdb/validation/DataConditionValidator.java` | 条件验证器（新增） |

### B. 相关文档

- [Schema 结构设计](../../reference/schema/README.md) - Schema 结构设计
- [模板系统设计](../template-system/README.md) - 模板系统设计
