# JustDB Migrate 系统整合方案

## 文档概述

本文档描述了 JustDB 框架中两套 migrate 方案（SchemaDeployer 和 SchemaMigrationService）的整合设计，以及 DatabaseSchemaExtractor 作为 diff helper 的集成方案。

**版本**: 1.0
**最后更新**: 2026-02-07
**维护者**: Wind Li

---------------------------

## 目录

1. [背景与问题](#1-背景与问题)
2. [当前架构分析](#2-当前架构分析)
3. [整合设计](#3-整合设计)
4. [DatabaseSchemaExtractor 集成](#4-databaseschemaextractor-集成)
5. [核心类设计](#5-核心类设计)
6. [使用示例](#6-使用示例)
7. [迁移路径](#7-迁移路径)
8. [待确认问题](#8-待确认问题)

---------------------------

## 1. 背景与问题

### 1.1 两套 Migrate 方案

JustDB 当前存在两套独立的 migrate 方案：

| 维度 | SchemaDeployer | SchemaMigrationService |
|------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **核心类** | `SchemaDeployer` + `SchemaHistoryManager` | `SchemaMigrationService` + `CanonicalSchemaDiff` |
| **入口** | CLI `justdb migrate up` | JDBC URL `?migrate=...` |
| **版本管理** | 基于 version 的幂等性 | 无版本概念，直接 diff |
| **History 表** | `justdb_schema_history` + `justdb_schema_history_objects` | 无 |
| **SQL 生成** | 直接调用 `DBGenerator.generate*()` | `CanonicalSchemaDiff.toDiffSchema()` → `DBGenerator` |
| **变更检测** | 无（直接应用 schema） | `CanonicalSchemaDiff.calculateAll()` |
| **对象记录** | `recordObjectChange()` 记录到 history_objects | 不记录 |
| **适用场景** | 生产环境部署 | 开发/测试环境快速迁移 |

### 1.2 核心问题

#### 问题 1: SQL 生成逻辑重复

`DiffCommand.generateSql()` 和 `SchemaMigrationService.generateMigrationSql()` 包含完全相同的 SQL 生成逻辑：

```java
// 两处相同的逻辑：
// 1. Process sequences (ADDED/REMOVED/RENAMED/MODIFIED)
// 2. Process tables (ADDED/REMOVED/RENAMED/MODIFIED)
// 3. Process columns/indexes/constraints within MODIFIED tables
// 4. 调用 DBGenerator.generate*() 方法
```

#### 问题 2: History-based Migration 缺少当前 Schema

当使用 History 系统进行迁移时：
- 我们有 `justdb_schema_history` 表记录已应用的版本
- 但我们没有"旧 schema"的定义（只有一个版本号）
- 如果要检测变更，我们需要知道"当前数据库的实际 schema"是什么

#### 问题 3: 职责混乱

- `SchemaDeployer` 同时负责 SQL 生成、执行、History 记录
- `SchemaMigrationService` 也有类似职责
- 两者之间的边界不清晰

---------------------------

## 2. 当前架构分析

### 2.1 SchemaDeployer 系统

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SchemaDeployer 系统                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────────┐     ┌─────────────────────────┐│
│  │ SchemaDeployer│────▶│SchemaHistoryManager│────▶│SchemaHistoryRepository ││
│  │              │     │                  │     │   (Repository接口)      ││
│  │ - deploy()   │     │ - recordSchemaChange()   │                        ││
│  │ - deployDiff()│    │ - isVersionApplied()    │                        ││
│  │ - verify()   │     │ - getAppliedVersions()  │                        ││
│  └──────────────┘     └──────────────────┘     └─────────────────────────┘│
│         │                                           │                      │
│         │                                 ┌────────┴────────┐              │
│         ▼                                 ▼                 ▼              │
│  ┌──────────────┐                   ┌──────────┐    ┌──────────────┐    │
│  │  DBGenerator  │                   │ Database │    │   Memory     │    │
│  │  (SQL 生成)   │                   │ Repository│   │ Repository   │    │
│  └──────────────┘                   └──────────┘    └──────────────┘    │
│                                                                             │
│  History 表结构:                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ justdb_schema_history (主表)                                          │  │
│  │ - installed_rank, version, description, type, script                  │  │
│  │ - installed_by, installed_on, execution_time, success                  │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ justdb_schema_history_objects (对象级别)                               │  │
│  │ - object_type, object_name, schema_version, ddl_statement             │  │
│  │ - checksum, installed_by, installed_on, status_code                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 SchemaMigrationService 系统

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SchemaMigrationService 系统                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                       SchemaMigrationService                           │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │ migrate(currentSchema, migrateSchemaPath, connection)           │  │ │
│  │  │                                                                 │  │ │
│  │  │ 1. calculateDiff(currentSchema, targetSchema)                  │  │ │
│  │  │ 2. generateMigrationSql(diff)                                  │  │ │
│  │  │ 3. executeMigrationSql(sqlStatements, connection)              │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                             │
│                              ▼                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        CanonicalSchemaDiff                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │ calculateAll()                                                   │  │ │
│  │  │  - calculateTables()    (ADDED/REMOVED/RENAMED)               │  │ │
│  │  │  - calculateColumns()   (ADDED/REMOVED/RENAMED/MODIFIED)       │  │ │
│  │  │  - calculateIndexes()   (ADDED/REMOVED)                        │  │ │
│  │  │  - calculateConstraints() (ADDED/REMOVED)                       │  │ │
│  │  │  - calculateSequences()  (ADDED/REMOVED/RENAMED/MODIFIED)      │  │ │
│  │  │  - calculateDataChanges()   (Data 节点条件同步)                  │  │ │
│  │  │  - calculateTableDataFilterChanges() (dataFilter 变更)         │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                       │ │
│  │  toDiffSchema() - 转换为带 changeType 的 Justdb 对象                   │ │
│  │  generateDataChangeSql() - 生成数据变更 SQL                            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                             │
│                              ▼                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                            DBGenerator                                │ │
│  │  - generateCreateTable(), generateDropTable(), generateRenameTable() │ │
│  │  - generateAddColumn(), generateModifyColumn(), ...                  │ │
│  │  - generateCreateIndex(), generateDropIndex()                         │ │
│  │  - generateAddConstraint(), generateDropConstraint()                 │ │
│  │  - generateCreateSequence(), generateDropSequence(), ...             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  注意: 该系统不使用 History 表，直接计算 diff 并执行 SQL                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 代码重叠分析

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SQL 生成逻辑重叠                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DiffCommand.generateSql() (Line 350-481):                                  │
│  ├── Process sequences (ADDED/REMOVED/RENAMED/MODIFIED)                   │
│  ├── Process tables (ADDED/REMOVED/RENAMED/MODIFIED)                       │
│  │   └── Process columns/indexes/constraints within MODIFIED tables        │
│  └── 调用 DBGenerator.generate*() 方法                                      │
│                                                                             │
│  SchemaMigrationService.generateMigrationSql() (Line 134-275):            │
│  ├── Process sequences (ADDED/REMOVED/RENAMED/MODIFIED)                   │
│  ├── Process tables (ADDED/REMOVED/RENAMED/MODIFIED)                       │
│  │   └── Process columns/indexes/constraints within MODIFIED tables        │
│  └── 调用 DBGenerator.generate*() 方法                                      │
│                                                                             │
│  两处逻辑完全相同！需要抽取到 DBGenerator 或新的 SqlGenerationService       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---------------------------

## 3. 整合设计

### 3.1 核心设计原则

1. **分离关注点**: Diff 计算、SQL 生成、History 记录、SQL 执行 四个职责分离
2. **单一数据源**: `CanonicalSchemaDiff` 作为唯一的 Diff 模型
3. **可选 History**: History 作为可插拔的组件，而非强制依赖
4. **统一 SQL 生成**: 抽取重复的 SQL 生成逻辑

### 3.2 新架构设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          整合后的 Migrate 架构                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                          Entry Points                                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐            │ │
│  │  │ MigrateCommand│  │ DiffCommand │  │ JustdbDriver      │            │ │
│  │  │ (CLI migrate) │  │ (CLI diff)  │  │ (JDBC migrate)   │            │ │
│  │  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘            │ │
│  └─────────┼─────────────────┼───────────────────┼───────────────────────┘ │
│            │                 │                   │                         │
│            ▼                 ▼                   ▼                         │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    UnifiedMigrationService                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │ migrate(MigrationContext context)                               │  │ │
│  │  │                                                                 │  │ │
│  │  │ 1. getCurrentSchema()                                           │  │ │
│  │  │    ├── 从 context 获取 / 从 DB 抽取 (可选)                      │  │ │
│  │  │    └── 使用 DbSchemaExtractor                                    │  │ │
│  │  │                                                                 │  │ │
│  │  │ 2. calculateDiff(currentSchema, targetSchema)                  │  │ │
│  │  │    └── 使用 CanonicalSchemaDiff                                   │  │ │
│  │  │                                                                 │  │ │
│  │  │ 3. filterAppliedChanges(diff, historyManager) [可选]           │  │ │
│  │  │    ├── 检查 History 表中已应用的变更                            │  │ │
│  │  │    └── 过滤掉已执行的对象变更                                   │  │ │
│  │  │                                                                 │  │ │
│  │  │ 4. generateSql(filteredDiff, dialect, options)                │  │ │
│  │  │                                                                 │  │ │
│  │  │ 5. executeSql(sqlStatements, connection)                      │  │ │
│  │  │                                                                 │  │ │
│  │  │ 6. recordHistory(migration, historyManager) [可选]             │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                              │
│           ┌──────────────────┼──────────────────┬─────────────────┐         │
│           ▼                  ▼                  ▼                 ▼         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ DiffService  │  │ SqlGenerator  │  │HistoryRecorder│  │ DbSchema     │    │
│  │ (Diff计算)    │  │ (SQL生成)     │  │(History记录)  │  │Extractor     │    │
│  │              │  │              │  │              │  │(DB抽取服务)  │    │
│  │ - calculate  │  │ - generate   │  │ - record    │  │              │    │
│  │   Diff()    │  │   Migration  │  │   Schema()   │  │ - extract()  │    │
│  │              │  │   Sql()      │  │ - record    │  │              │    │
│  │              │  │              │  │   Object()   │  │ - 从真实    │    │
│  │              │  │              │  │ - check      │  │   DB 抽取    │    │
│  │              │  │              │  │   Version()  │  │   schema     │    │
│  │              │  │              │  │              │  │              │    │
│  │              │  │              │  │ - filter     │  │ - 支持缓存  │    │
│  │              │  │              │  │   Applied()  │  │   避免重复   │    │
│  │              │  │              │  │              │  │   抽取       │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                  │                  │                  │         │
│         └──────────────────┼──────────────────┼──────────────────┘         │
│                            ▼                  ▼                           │
│                   ┌──────────────┐    ┌──────────────┐                     │
│                   │DBGenerator   │    │SchemaHistory │                     │
│                   │(已存在)       │    │Repository    │                     │
│                   └──────────────┘    └──────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 组件职责划分

| 组件 | 职责 | 输入 | 输出 |
|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| **DbSchemaExtractor** | 从真实数据库抽取当前 schema | Connection, ExtractOptions | Justdb |
| **DiffService** | 计算 schema 之间的差异 | currentSchema, targetSchema | CanonicalSchemaDiff |
| **SqlGenerator** | 从 diff 生成 SQL | CanonicalSchemaDiff, dialect, options | List\<String\> |
| **HistoryRecorder** | 记录和查询 History | version, diff, sqlStatements | - |
| **UnifiedMigrationService** | 协调所有组件 | MigrationContext | MigrationResult |

---------------------------

## 4. DatabaseSchemaExtractor 集成

### 4.1 问题场景

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        History-based Migration 场景                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  当前状态:                                                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  justdb_schema_history 表                                              │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │ version    | description            | installed_on              │   │ │
│  │  ├─────────────────────────────────────────────────────────────────┤   │ │
│  │  │ 1.0.0      | Initial schema         | 2024-01-01                │   │ │
│  │  │ 1.1.0      | Add user preferences  | 2024-02-01                │   │ │
│  │  │ 1.2.0      | Add audit log         | 2024-03-01                │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  问题: 我们知道版本号是 1.2.0，但不知道这个版本对应的 schema 定义是什么！       │
│                                                                             │
│  新方案: DatabaseSchemaExtractor                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  1. 从真实数据库抽取当前 schema (DatabaseSchemaExtractor)              │ │
│  │  2. 将抽取的 schema 与目标 schema 进行 diff (CanonicalSchemaDiff)      │ │
│  │  3. 只应用未执行的变更                                                │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 DbSchemaExtractor 设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DbSchemaExtractor 架构                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                           DbSchemaExtractor                            │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │ extract(connection, options)                                   │  │ │
│  │  │                                                                 │  │ │
│  │  │ 1. 检查缓存                                                      │  │ │
│  │  │    ├── cacheKey = buildCacheKey(connection, options)           │  │ │
│  │  │    ├── cached = cache.get(cacheKey)                           │  │ │
│  │  │    └── if (cached != null) return cached                       │  │ │
│  │  │                                                                 │  │ │
│  │  │ 2. 执行抽取                                                      │  │ │
│  │  │    ├── config = toExtractConfig(options)                       │  │ │
│  │  │    ├── schema = extractor.extractSchemaWithConfig(connection,  │  │ │
│  │  │    │                                                  config)  │  │ │
│  │  │    └── return schema                                           │  │ │
│  │  │                                                                 │  │ │
│  │  │ 3. 缓存结果                                                      │  │ │
│  │  │    └── cache.put(cacheKey, schema)                             │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                       │ │
│  │  extractTables(connection, tableNames)  // 抽取指定表                 │ │
│  │  invalidateCache(connection)              // 使缓存失效               │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                              │
│                              ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        ExtractOptions                                 │ │
│  │  - tableScopes: TableScopes      // 表范围过滤                        │ │
│  │  - includeIndexes: boolean        // 是否包含索引                      │ │
│  │  - includeConstraints: boolean    // 是否包含约束                      │ │
│  │  - includeData: boolean           // 是否包含数据（通常false）          │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                              │
│                              ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                           SchemaCache                                  │ │
│  │  - 基于 Connection + Options 的缓存                                    │ │
│  │  - 支持手动失效（DDL 执行后）                                          │ │
│  │  - 支持时间过期（可选）                                                │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 与 History 集成

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    History-based Migration 流程                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    UnifiedMigrationService                            │ │
│  │                                                                       │ │
│  │  migrate(MigrationContext) {                                          │ │
│  │      // 1. 获取当前 schema（从 DB 抽取）                               │ │
│  │      Justdb currentSchema = getCurrentSchema(context);                 │ │
│  │      //        └── dbExtractor.extract(connection, options)           │ │
│  │                                                                       │ │
│  │      // 2. 计算差异                                                   │ │
│  │      CanonicalSchemaDiff diff = calculateDiff(currentSchema,          │ │
│  │                                              targetSchema);             │ │
│  │                                                                       │ │
│  │      // 3. 过滤已应用的变更                                           │ │
│  │      diff = historyRecorder.filterAppliedChanges(diff, version);       │ │
│  │      //    └── 基于 history_objects 表移除已应用的变更                  │ │
│  │                                                                       │ │
│  │      // 4. 生成 SQL                                                   │ │
│  │      List&lt;String&gt; sql = generateSql(diff, dialect);                    │ │
│  │                                                                       │ │
│  │      // 5. 执行 SQL                                                   │ │
│  │      executeSql(sql, connection);                                     │ │
│  │                                                                       │ │
│  │      // 6. 使缓存失效 + 记录 History                                   │ │
│  │      dbExtractor.invalidateCache(connection);                          │ │
│  │      historyRecorder.recordMigration(version, diff, sql);              │ │
│  │  }                                                                     │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---------------------------

## 5. 核心类设计

### 5.1 UnifiedMigrationService

```java
/**
 * 统一的迁移服务
 *
 * 职责：
 * 1. 协调 Diff 计算、SQL 生成、SQL 执行、History 记录
 * 2. 提供统一的迁移 API
 * 3. 支持 History 可选配置
 * 4. 支持 DB 抽取作为获取当前 schema 的可选方式
 */
public class UnifiedMigrationService {

    private final DiffService diffService;
    private final SqlGenerator sqlGenerator;
    private final HistoryRecorder historyRecorder;  // 可选
    private final DbSchemaExtractor dbExtractor;    // 可选
    private final JustdbManager justdbManager;

    /**
     * 完整构造函数（生产环境）
     */
    public UnifiedMigrationService(JustdbManager justdbManager,
                                   SchemaHistoryManager historyManager,
                                   DbSchemaExtractor dbExtractor) {
        this.justdbManager = justdbManager;
        this.diffService = new DiffService();
        this.sqlGenerator = new SqlGenerator(justdbManager.getPluginManager());
        this.historyRecorder = historyManager != null
            ? new HistoryRecorder(historyManager)
            : null;
        this.dbExtractor = dbExtractor;
    }

    /**
     * 简化构造函数（开发环境，无 History）
     */
    public UnifiedMigrationService(JustdbManager justdbManager) {
        this(justdbManager, null, null);
    }

    /**
     * 执行迁移
     */
    public MigrationResult migrate(MigrationContext context) {
        // 1. 获取当前 schema（智能选择）
        Justdb currentSchema = getCurrentSchema(context);

        // 2. 计算差异
        CanonicalSchemaDiff diff = diffService.calculateDiff(
            currentSchema,
            context.getTargetSchema()
        );

        // 3. 过滤已应用的变更（如果有 History）
        if (historyRecorder != null && context.isFilterApplied()) {
            diff = historyRecorder.filterAppliedChanges(
                diff,
                context.getVersion()
            );
        }

        // 4. 生成 SQL
        List&lt;String&gt; sqlStatements = sqlGenerator.generateMigrationSql(
            diff,
            context.getDialect(),
            context.getSqlGenerationOptions()
        );

        // 5. 执行 SQL
        if (context.isExecuteSql()) {
            executeSql(sqlStatements, context.getConnection());

            // 使 DB 抽取缓存失效
            if (dbExtractor != null) {
                dbExtractor.invalidateCache(context.getConnection());
            }
        }

        // 6. 记录 History
        if (historyRecorder != null && context.isRecordHistory()) {
            historyRecorder.recordMigration(
                context.getVersion(),
                context.getDescription(),
                sqlStatements,
                diff
            );
        }

        return new MigrationResult(diff, sqlStatements);
    }

    /**
     * 获取当前 schema（智能选择）
     * 优先级: context.currentSchema > DB 抽取 > 异常
     */
    private Justdb getCurrentSchema(MigrationContext context) {
        // 1. 优先使用 context 提供的 schema
        if (context.getCurrentSchema() != null) {
            return context.getCurrentSchema();
        }

        // 2. 尝试从 DB 抽取
        if (dbExtractor != null && context.getConnection() != null) {
            DbSchemaExtractor.ExtractOptions options = new DbSchemaExtractor.ExtractOptions();
            options.setTableScopes(context.getTableScopes());
            return dbExtractor.extract(context.getConnection(), options);
        }

        // 3. 无法获取
        throw new IllegalStateException(
            "Current schema not provided and no DbSchemaExtractor available. " +
            "Please either provide currentSchema or enable DbSchemaExtractor."
        );
    }

    /**
     * 检查版本是否已应用（幂等性支持）
     */
    public boolean isVersionApplied(String version) {
        if (historyRecorder != null) {
            return historyRecorder.isVersionApplied(version);
        }
        return false;
    }
}
```

### 5.2 MigrationContext

```java
/**
 * 迁移上下文 - 封装迁移所需的所有参数
 */
public class MigrationContext {
    // Schema 相关
    private Justdb currentSchema;       // 当前 schema（可选，优先使用）
    private Justdb targetSchema;        // 目标 schema（必需）
    private TableScopes tableScopes;    // 表范围过滤

    // 连接相关
    private Connection connection;      // 数据库连接（执行 SQL 时必需）
    private String dialect;             // 数据库方言

    // History 相关
    private String version;             // 迁移版本（用于 History）
    private String description;         // 迁移描述

    // 选项
    private boolean executeSql = true;         // 是否执行 SQL
    private boolean recordHistory = true;      // 是否记录 History
    private boolean filterApplied = true;      // 是否过滤已应用的变更
    private boolean extractFromDb = false;     // 是否从 DB 抽取当前 schema

    // SQL 生成选项
    private SqlGenerationOptions sqlOptions;

    /**
     * Builder 模式
     */
    public static MigrationContextBuilder builder() {
        return new MigrationContextBuilder();
    }

    public static class MigrationContextBuilder {
        private MigrationContext context = new MigrationContext();

        public MigrationContextBuilder targetSchema(Justdb schema) {
            context.targetSchema = schema;
            return this;
        }

        public MigrationContextBuilder currentSchema(Justdb schema) {
            context.currentSchema = schema;
            return this;
        }

        public MigrationContextBuilder connection(Connection conn) {
            context.connection = conn;
            return this;
        }

        public MigrationContextBuilder dialect(String dialect) {
            context.dialect = dialect;
            return this;
        }

        public MigrationContextBuilder version(String version) {
            context.version = version;
            return this;
        }

        public MigrationContextBuilder description(String description) {
            context.description = description;
            return this;
        }

        public MigrationContextBuilder tableScopes(TableScopes scopes) {
            context.tableScopes = scopes;
            return this;
        }

        public MigrationContextBuilder extractFromDb(boolean extract) {
            context.extractFromDb = extract;
            return this;
        }

        public MigrationContextBuilder filterApplied(boolean filter) {
            context.filterApplied = filter;
            return this;
        }

        public MigrationContextBuilder executeSql(boolean execute) {
            context.executeSql = execute;
            return this;
        }

        public MigrationContextBuilder recordHistory(boolean record) {
            context.recordHistory = record;
            return this;
        }

        public MigrationContext build() {
            if (context.targetSchema == null) {
                throw new IllegalArgumentException("targetSchema is required");
            }
            return context;
        }
    }
}
```

### 5.3 DiffService

```java
/**
 * Diff 计算服务
 *
 * 职责：
 * 1. 计算两个 schema 之间的差异
 * 2. 提供过滤、排序等 Diff 后处理功能
 */
public class DiffService {

    /**
     * 计算 schema 差异
     */
    public CanonicalSchemaDiff calculateDiff(Justdb currentSchema, Justdb targetSchema) {
        CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
        diff.calculateAll();  // tables, columns, indexes, constraints, sequences, data
        return diff;
    }

    /**
     * 计算指定表的差异
     */
    public CanonicalSchemaDiff calculateTableDiff(Justdb currentSchema,
                                                   Justdb targetSchema,
                                                   TableScopes scopes) {
        // 应用表范围过滤后计算 diff
        // ...
    }
}
```

### 5.4 SqlGenerator

```java
/**
 * SQL 生成服务
 *
 * 职责：
 * 1. 从 CanonicalSchemaDiff 生成 SQL
 * 2. 支持多种方言
 * 3. 支持不同的 SQL 生成选项
 */
public class SqlGenerator {

    private final PluginManager pluginManager;

    public SqlGenerator(PluginManager pluginManager) {
        this.pluginManager = pluginManager;
    }

    /**
     * 生成迁移 SQL
     *
     * 整合 DiffCommand.generateSql() 和 SchemaMigrationService.generateMigrationSql()
     * 的重复逻辑
     */
    public List&lt;String&gt; generateMigrationSql(CanonicalSchemaDiff diff,
                                            String dialect,
                                            SqlGenerationOptions options) {
        DBGenerator dbGenerator = new DBGenerator(pluginManager, dialect);
        List&lt;String&gt; sqlStatements = new ArrayList<>();

        // 1. 处理 sequences
        sqlStatements.addAll(generateSequenceSql(diff, dbGenerator));

        // 2. 处理 tables
        sqlStatements.addAll(generateTableSql(diff, dbGenerator, options));

        // 3. 处理 data changes
        sqlStatements.addAll(diff.generateDataChangeSql(dialect));

        // 4. 处理 dataFilter changes
        sqlStatements.addAll(diff.generateTableDataFilterChangeSql(dialect));

        return sqlStatements;
    }

    private List&lt;String&gt; generateSequenceSql(CanonicalSchemaDiff diff,
                                            DBGenerator dbGenerator) {
        List&lt;String&gt; sql = new ArrayList<>();
        if (diff.getSequences() != null) {
            for (Sequence sequence : diff.getSequences()) {
                if (sequence.getChangeType() == null) continue;
                switch (sequence.getChangeType()) {
                    case ADDED:
                        sql.add(dbGenerator.generateCreateSequence(sequence));
                        break;
                    case REMOVED:
                        sql.add(dbGenerator.generateDropSequence(sequence));
                        break;
                    case RENAMED:
                        sql.add(dbGenerator.generateRenameSequence(sequence));
                        break;
                    case MODIFIED:
                        sql.add(dbGenerator.generateModifySequence(sequence));
                        break;
                }
            }
        }
        return sql;
    }

    private List&lt;String&gt; generateTableSql(CanonicalSchemaDiff diff,
                                         DBGenerator dbGenerator,
                                         SqlGenerationOptions options) {
        List&lt;String&gt; sql = new ArrayList<>();
        // 抽取 DiffCommand 和 SchemaMigrationService 中的表处理逻辑
        // ...
        return sql;
    }
}
```

### 5.5 HistoryRecorder

```java
/**
 * History 记录服务
 *
 * 职责：
 * 1. 记录 schema 变更到 history 表
 * 2. 记录对象级别的变更
 * 3. 检查版本是否已应用
 * 4. 过滤已应用的变更
 */
public class HistoryRecorder {

    private final SchemaHistoryManager historyManager;

    public HistoryRecorder(SchemaHistoryManager historyManager) {
        this.historyManager = historyManager;
    }

    /**
     * 记录迁移
     */
    public void recordMigration(String version, String description,
                               List&lt;String&gt; sqlStatements,
                               CanonicalSchemaDiff diff) {
        long startTime = System.currentTimeMillis();

        // 记录 schema 变更
        historyManager.recordSchemaChange(
            version,
            description,
            "DDL",
            String.join("\n", sqlStatements),
            System.getProperty("user.name"),
            (int)(System.currentTimeMillis() - startTime),
            true
        );

        // 记录对象级别的变更
        recordObjectChanges(diff, version);
    }

    /**
     * 记录对象级别的变更
     */
    private void recordObjectChanges(CanonicalSchemaDiff diff, String version) {
        // 记录表变更
        for (TableChange tc : diff.getTableChanges()) {
            historyManager.recordObjectChange(
                "TABLE", tc.getTableName(), version,
                tc.getChangeType().name(),
                getTableDdl(tc)
            );
        }

        // 记录列变更、索引变更、约束变更...
    }

    /**
     * 检查版本是否已应用
     */
    public boolean isVersionApplied(String version) {
        return historyManager.isVersionApplied(version);
    }

    /**
     * 过滤已应用的变更
     *
     * 基于 history_objects 表精确检测，移除已应用的变更
     */
    public CanonicalSchemaDiff filterAppliedChanges(CanonicalSchemaDiff diff,
                                                     String targetVersion) {
        CanonicalSchemaDiff filtered = new CanonicalSchemaDiff(
            diff.getCurrentSchema(),
            diff.getTargetSchema()
        );

        // 获取所有已应用的对象变更
        List<SchemaObjectHistory&gt;> appliedObjects =
            historyManager.getAllObjectChanges();

        // 构建已应用对象的集合
        Set&lt;String&gt; appliedTableChanges = new HashSet<>();
        Set&lt;String&gt; appliedColumnChanges = new HashSet<>();
        // ...

        for (SchemaObjectHistory history : appliedObjects) {
            String key = history.getObjectType() + ":" + history.getObjectName();
            switch (history.getObjectType()) {
                case "TABLE":
                    appliedTableChanges.add(key);
                    break;
                case "COLUMN":
                    appliedColumnChanges.add(key);
                    break;
                // ...
            }
        }

        // 过滤变更
        for (TableChange tc : diff.getTableChanges()) {
            String key = "TABLE:" + tc.getTableName();
            if (!appliedTableChanges.contains(key)) {
                filtered.getTableChanges().add(tc);
            }
        }

        // 类似处理列变更、索引变更...

        return filtered;
    }
}
```

### 5.6 DbSchemaExtractor

```java
/**
 * 数据库 Schema 抽取服务
 *
 * 职责：
 * 1. 从真实数据库抽取当前 schema
 * 2. 支持抽取配置（表过滤、类型过滤等）
 * 3. 支持缓存避免重复抽取
 */
public class DbSchemaExtractor {

    private final DatabaseSchemaExtractor extractor;  // 已存在的类
    private final SchemaCache cache;  // 缓存

    /**
     * 抽取配置
     */
    public static class ExtractOptions {
        private TableScopes tableScopes;
        private boolean includeIndexes = true;
        private boolean includeConstraints = true;
        private boolean includeData = false;
        // getters and setters
    }

    /**
     * 从数据库抽取 schema
     */
    public Justdb extract(Connection connection, ExtractOptions options) {
        // 检查缓存
        String cacheKey = buildCacheKey(connection, options);
        Justdb cached = cache.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        // 执行抽取
        ExtractConfig config = toExtractConfig(options);
        Justdb schema = extractor.extractSchemaWithConfig(connection, config);

        // 缓存结果
        cache.put(cacheKey, schema);

        return schema;
    }

    /**
     * 从数据库抽取特定表的 schema
     */
    public Justdb extractTables(Connection connection, List&lt;String&gt; tableNames) {
        ExtractOptions options = new ExtractOptions();
        options.setTableScopes(toTableScopes(tableNames));
        return extract(connection, options);
    }

    /**
     * 使缓存失效
     */
    public void invalidateCache(Connection connection) {
        cache.invalidate(buildConnectionKey(connection));
    }
}
```

---------------------------

## 6. 使用示例

### 6.1 History-based Migration（从 DB 抽取）

```java
// 场景：生产环境，从 DB 抽取当前 schema，增量迁移
Connection connection = DriverManager.getConnection(url, username, password);

// 创建服务
SchemaHistoryManager historyManager = new SchemaHistoryManager(connection);
DbSchemaExtractor dbExtractor = new DbSchemaExtractor(extractor, cache);
UnifiedMigrationService service = new UnifiedMigrationService(
    justdbManager,
    historyManager,
    dbExtractor  // 启用 DB 抽取
);

// 加载目标 schema
Justdb targetSchema = SchemaLoader.load("schema-v2.0.yaml");

// 执行迁移（自动从 DB 抽取当前 schema）
MigrationContext context = MigrationContext.builder()
    .targetSchema(targetSchema)
    .connection(connection)
    .dialect("mysql")
    .version("2.0.0")
    .description("Upgrade to v2.0.0")
    .extractFromDb(true)      // 启用 DB 抽取
    .filterApplied(true)      // 过滤已应用的变更
    .build();

MigrationResult result = service.migrate(context);

System.out.println("Applied changes: " + result.getDiff().getTableChanges().size());
```

### 6.2 JDBC Migrate Mode（无 History）

```java
// 场景：开发环境，直接 diff 并执行
Connection connection = DriverManager.getConnection(url, username, password);

// 创建服务（无 History）
UnifiedMigrationService service = new UnifiedMigrationService(justdbManager);

// 加载 schema
Justdb currentSchema = getCurrentSchema();  // 从文件加载
Justdb targetSchema = SchemaLoader.load("schema-dev.yaml");

// 执行迁移
MigrationContext context = MigrationContext.builder()
    .currentSchema(currentSchema)  // 提供当前 schema
    .targetSchema(targetSchema)
    .connection(connection)
    .dialect("mysql")
    .filterApplied(false)     // 无 History，不过滤
    .recordHistory(false)     // 不记录 History
    .build();

MigrationResult result = service.migrate(context);
```

### 6.3 CLI Diff（仅生成 SQL）

```java
// 场景：CLI diff 命令，只生成 SQL 不执行
Justdb currentSchema = SchemaLoader.load("schema-v1.yaml");
Justdb targetSchema = SchemaLoader.load("schema-v2.yaml");

UnifiedMigrationService service = new UnifiedMigrationService(justdbManager);

MigrationContext context = MigrationContext.builder()
    .currentSchema(currentSchema)
    .targetSchema(targetSchema)
    .dialect("mysql")
    .executeSql(false)       // 不执行 SQL
    .recordHistory(false)    // 不记录 History
    .build();

MigrationResult result = service.migrate(context);

// 输出 SQL
List&lt;String&gt; sqlStatements = result.getSqlStatements();
for (String sql : sqlStatements) {
    System.out.println(sql);
}
```

### 6.4 表范围过滤

```java
// 场景：只迁移特定表
TableScopes scopes = new TableScopes();
scopes.setIncludes(Arrays.asList("users*", "orders*"));
scopes.setExcludes(Arrays.asList("*_temp"));

MigrationContext context = MigrationContext.builder()
    .targetSchema(targetSchema)
    .connection(connection)
    .dialect("mysql")
    .tableScopes(scopes)      // 表范围过滤
    .extractFromDb(true)
    .build();
```

---------------------------

## 7. 迁移路径

### 阶段 1: 抽取 SQL 生成逻辑（低风险）

```
创建 SqlGenerator 类
  ↓
将 DiffCommand.generateSql() 和 SchemaMigrationService.generateMigrationSql()
中的重复逻辑抽取到 SqlGenerator
  ↓
修改 DiffCommand 和 SchemaMigrationService 使用 SqlGenerator
  ↓
运行测试确保兼容性
```

### 阶段 2: 创建 DB 抽取服务（低风险）

```
创建 DbSchemaExtractor 和 SchemaCache
  ↓
封装 DatabaseSchemaExtractor 的使用
  ↓
添加缓存支持（避免重复抽取）
  ↓
添加单元测试
```

### 阶段 3: 扩展 HistoryRecorder（中风险）

```
在 HistoryRecorder 中添加 filterAppliedChanges() 方法
  ↓
基于 history_objects 表过滤已应用的变更
  ↓
添加集成测试验证过滤逻辑
```

### 阶段 4: 创建统一服务（中风险）

```
创建 DiffService、SqlGenerator、UnifiedMigrationService
  ↓
集成 DbSchemaExtractor 作为获取当前 schema 的可选方式
  ↓
修改 MigrateCommand 使用 UnifiedMigrationService
  ↓
添加集成测试
```

### 阶段 5: 更新 JDBC Driver（低风险）

```
修改 JustdbDriver 使用 UnifiedMigrationService
  ↓
支持从 DB 抽取当前 schema
  ↓
保持向后兼容性
```

### 阶段 6: 废弃旧类（高风险）

```
标记 SchemaDeployer 和 SchemaMigrationService 为 @Deprecated
  ↓
提供迁移文档
  ↓
在下一个主要版本移除旧类
```

---------------------------

## 8. 待确认问题

### 8.1 DB 抽取性能

1. 从大型数据库抽取 schema 可能需要多长时间？
2. 缓存策略应该基于什么？（时间、版本、手动失效？）
3. 是否需要支持增量抽取（只抽取变更的表）？

### 8.2 抽取范围

1. 是否需要支持部分抽取？（如只抽取特定表）
2. 是否需要抽取存储过程、触发器等？
3. 抽取时是否需要考虑表的依赖关系？

### 8.3 History 过滤精度

1. 基于 history_objects 表的过滤是否足够精确？
2. 是否需要考虑同一对象的多次变更？
3. 过滤时是否需要考虑变更顺序？

### 8.4 向后兼容

1. 现有的 SchemaDeployer 和 SchemaMigrationService 是否需要保持可用？
2. 是否需要提供自动迁移工具？
3. 弃用周期设置为多长合适？

### 8.5 其他

1. 是否需要支持 Dry Run 模式（只计算不执行）？
2. 是否需要支持 Rollback 功能？
3. 是否需要支持多租户场景（多个应用共用一个数据库）？

---------------------------

## 附录

### A. 关键类文件清单

| 文件路径 | 说明 | 状态 |
|---------------------------------------------------------------------------------|------------------------------------------------------|------------------------------------------------------|
| `SchemaDeployer.java` | 现有：带 History 的部署器 | 待废弃 |
| `SchemaMigrationService.java` | 现有：不带 History 的迁移服务 | 待废弃 |
| `CanonicalSchemaDiff.java` | 核心：Diff 计算模型 | 保留 |
| `DatabaseSchemaExtractor.java` | 核心：DB 抽取器 | 保留 |
| `UnifiedMigrationService.java` | 新增：统一迁移服务 | 待创建 |
| `DiffService.java` | 新增：Diff 计算服务 | 待创建 |
| `SqlGenerator.java` | 新增：SQL 生成服务 | 待创建 |
| `HistoryRecorder.java` | 新增：History 记录服务 | 待创建 |
| `DbSchemaExtractor.java` | 新增：DB 抽取服务 | 待创建 |
| `MigrationContext.java` | 新增：迁移上下文 | 待创建 |
| `SchemaCache.java` | 新增：Schema 缓存 | 待创建 |

### B. 相关文档

- [Schema 结构设计](../../reference/schema/README.md) - Schema 结构设计

> 注意: 历史文档中引用的部分设计文档（db-migrate-design.md、schema-extractor-architecture.md）已不再维护，请参考最新的架构设计文档。
