# JustDB History 服务工作原理分析

## 文档概述

本文档详细分析 JustDB History 服务的当前工作原理，包括架构设计、数据模型、核心流程和使用方式。

**版本**: 1.0
**最后更新**: 2026-02-07
**维护者**: Wind Li

---------------------------

## 目录

1. [架构概述](#1-架构概述)
2. [数据模型](#2-数据模型)
3. [核心组件](#3-核心组件)
4. [工作流程](#4-工作流程)
5. [两种 History 实现对比](#5-两种-history-实现对比)
6. [关键方法分析](#6-关键方法分析)
7. [与 SchemaDeployer 的集成](#7-与-schemadeployer-的集成)
8. [设计特点与权衡](#8-设计特点与权衡)

---------------------------

## 1. 架构概述

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           History 服务架构                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        SchemaHistoryManager                             │ │
│  │  (门面类 - History 管理器)                                                  │ │
│  │                                                                       │ │
│  │  - recordSchemaChange()          → SchemaHistoryRepository           │ │
│  │  - recordObjectChange()          → 委托给 Database 实现             │ │
│  │  - isVersionApplied()            → 查询版本状态                   │ │
│  │  - getAppliedVersions()          → 获取已应用版本列表               │ │
│  │  - getObjectChangesByVersion()   → 获取版本的对象变更              │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                    │                                       │
│  ┌─────────────────────────────────┼─────────────────────────────────────┐ │
│  │                                 ▼                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │              SchemaHistoryRepository (接口)                   │  │ │
│  │  │                                                               │  │ │
│  │  │  + recordSchemaChange(version, description, type, script...)    │  │ │
│  │  │  + isVersionApplied(version)                                  │  │ │
│  │  │  + getAppliedVersions()                                      │  │ │
│  │  │  + getLatestAppliedVersion()                                 │  │ │
│  │  │  + getObjectChangesByVersion(version)                        │  │ │
│  │  │  + isObjectApplied(objectId)                                 │  │ │
│  │  │  + validateObjectWithChecksum(objectId, checksum)            │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                                    │                                       │
│  └────────────────────────────────────┼───────────────────────────────┘ │
│                                       │                                       │
│         ┌─────────────────────────────┴──────────────────┐                  │
│         ▼                                                     ▼                  │
│  ┌──────────────────────────────┐   ┌──────────────────────────────────┐  │
│  │ DatabaseSchemaHistoryRepository │   │ DatabaseSchemaObjectHistoryRepository │  │
│  │ (主表 Repository)              │   │ (对象表 Repository)                  │  │
│  │                                │   │                                      │  │
│  │ - justdb_schema_history      │   │ - justdb_schema_history_objects   │  │
│  │                                │   │                                      │  │
│  │ 记录版本级别的变更              │   │ 记录对象级别的变更                  │  │
│  └────────────────────────────────┘   └──────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        存储层 (数据库表)                                  │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │              justdb_schema_history (主表)                       │  │ │
│  │  │  ┌─────────────────────────────────────────────────────────────┐  │  │ │
│  │  │  │ installed_rank INT      | 安装顺序（自增）               │  │  │ │
│  │  │  │ version VARCHAR(50)     | 版本号（如 "1.0.0"）        │  │  │ │
│  │  │  │ description VARCHAR(200) | 描述                          │  │  │ │
│  │  │  │ type VARCHAR(20)        | 类型（SQL/DDL/DML/CONFIG）    │  │  │ │
│  │  │  │ script TEXT             | 变更脚本内容                  │  │  │ │
│  │  │  │ checksum INT            | 校验和（SHA256）              │  │  │ │
│  │  │  │ installed_by VARCHAR(100)| 安装者                       │  │  │ │
│  │  │  │ installed_on TIMESTAMP  | 安装时间                      │  │  │ │
│  │  │  │ execution_time INT      | 执行时间（毫秒）               │  │  │ │
│  │  │  │ success BOOLEAN         | 是否成功                       │  │  │ │
│  │  │  └─────────────────────────────────────────────────────────────┘  │  │ │
│  │  │  索引: idx_<table>_version, idx_<table>_success, idx_<table>_installed_on │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │         justdb_schema_history_objects (对象表)                  │  │ │
│  │  │  ┌─────────────────────────────────────────────────────────────┐  │  │ │
│  │  │  │ id BIGINT AUTO_INCREMENT | 主键（自增）                  │  │  │ │
│  │  │  │ object_type VARCHAR(50)  | 对象类型（TABLE/COLUMN/INDEX） │  │  │ │
│  │  │  │ object_name VARCHAR(200) | 对象名称（如 "users"）        │  │  │ │
│  │  │  │ schema_version VARCHAR(50)| 所属版本（关联主表）         │  │  │ │
│  │  │  │ description VARCHAR(200) | 操作类型（CREATE/ALTER/DROP）  │  │  │ │
│  │  │  │ ddl_statement TEXT       | DDL 语句                      │  │  │ │
│  │  │  │ checksum VARCHAR(64)     | 校验和（SHA256）              │  │  │ │
│  │  │  │ installed_by VARCHAR(100)| 安装者                       │  │  │ │
│  │  │  │ installed_on TIMESTAMP  | 安装时间                      │  │  │ │
│  │  │  │ execution_time INT      | 执行时间（毫秒）               │  │  │ │
│  │  │  │ success BOOLEAN         | 是否成功                       │  │  │ │
│  │  │  │ status_code VARCHAR(50)  | 状态码（SUCCESS/ERROR）       │  │  │ │
│  │  │  └─────────────────────────────────────────────────────────────┘  │  │ │
│  │  │  索引: idx_<table>_obj_name, idx_<table>_obj_version, idx_<table>_obj_status │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  参考 Flyway 的 flyway_schema_history 表设计，增加了对象级别的细粒度跟踪          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 设计原则

1. **Repository 模式**: 数据访问层抽象，支持多种存储后端
2. **两级 History**: 版本级别（主表）+ 对象级别（对象表）
3. **幂等性支持**: 通过 `isVersionApplied()` 实现重复执行安全
4. **checksum 校验**: 支持基于 SHA256 的变更校验

---------------------------

## 2. 数据模型

### 2.1 SchemaHistory (主表实体)

```java
public class SchemaHistory {
    private Integer installedRank;      // 安装顺序（主键）
    private String version;             // 版本号（如 "1.0.0"）
    private String objectId;            // 对象 ID（未使用）
    private String description;         // 描述
    private String type;                // 类型（SQL/DDL/DML/CONFIG）
    private String script;              // 变更脚本内容
    private String checksum;            // 校验和（SHA256）
    private String installedBy;        // 安装者
    private LocalDateTime installedOn; // 安装时间
    private Integer executionTime;      // 执行时间（毫秒）
    private Boolean success;            // 是否成功
    private String statusCode;         // 状态码（SUCCESS/CHECKSUM_ERROR/EXECUTION_ERROR）
}
```

### 2.2 SchemaObjectHistory (对象表实体)

```java
public class SchemaObjectHistory {
    private Long id;                    // 主键（自增）
    private String objectType;          // 对象类型（TABLE/COLUMN/INDEX/CONSTRAINT/SEQUENCE）
    private String objectName;          // 对象名称（如 "users", "users.id"）
    private String schemaVersion;       // 所属版本（关联主表）
    private String actionType;         // 操作类型（CREATE/ALTER/DROP/ADD/MODIFY/RENAME）
    private String ddlStatement;        // DDL 语句

    // 扩展字段（新增）
    private String description;         // 描述（存储 actionType）
    private String checksum;            // 校验和（SHA256）
    private Integer executionTime;      // 执行时间
    private Boolean success;            // 是否成功
    private String statusCode;         // 状态码
    private String installedBy;        // 安装者
    private LocalDateTime installedOn; // 安装时间
}
```

### 2.3 表结构 SQL

#### 主表创建 SQL

```sql
CREATE TABLE IF NOT EXISTS justdb_schema_history (
  installed_rank INT NOT NULL,
  version VARCHAR(50),
  description VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL,
  script TEXT NOT NULL,
  checksum INT,
  installed_by VARCHAR(100) NOT NULL,
  installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  execution_time INT NOT NULL,
  success BOOLEAN NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_justdb_schema_history_version
  ON justdb_schema_history(version);
CREATE INDEX IF NOT EXISTS idx_justdb_schema_history_success
  ON justdb_schema_history(success);
CREATE INDEX IF NOT EXISTS idx_justdb_schema_history_installed_on
  ON justdb_schema_history(installed_on);
```

#### 对象表创建 SQL

```sql
CREATE TABLE IF NOT EXISTS justdb_schema_history_objects (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  object_type VARCHAR(50) NOT NULL,
  object_name VARCHAR(200) NOT NULL,
  schema_version VARCHAR(50) NOT NULL,
  description VARCHAR(200) NOT NULL,
  ddl_statement TEXT,
  checksum VARCHAR(64),
  installed_by VARCHAR(100) NOT NULL,
  installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  execution_time INT NOT NULL,
  success BOOLEAN NOT NULL,
  status_code VARCHAR(50)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_justdb_schema_history_obj_name
  ON justdb_schema_history_objects(object_name);
CREATE INDEX IF NOT EXISTS idx_justdb_schema_history_obj_version
  ON justdb_schema_history_objects(schema_version);
CREATE INDEX IF NOT EXISTS idx_justdb_schema_history_obj_status
  ON justdb_schema_history_objects(status_code);
```

---------------------------

## 3. 核心组件

### 3.1 组件层次结构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           组件层次结构                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    SchemaHistoryManager                               │ │
│  │                    (门面类 - Facade)                                  │ │
│  │                                                                       │ │
│  │  职责:                                                                  │ │
│  │  - 提供 History 管理的统一入口                                          │ │
│  │  - 支持多种 Repository 实现（通过构造函数）                              │ │
│  │  - 提供便捷方法（getAllHistory, getObjectChangesByVersion）                 │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                           │
│           ┌───────────────────┼───────────────────┐                       │
│           ▼                   ▼                   ▼                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │Repository接口    │  │DatabaseSchema   │  │MemorySchema     │         │
│  │                  │  │HistoryRepository │  │HistoryRepository │         │
│  │+ save()          │  │                  │  │                  │         │
│  │+ findById()      │  │+ recordSchema()  │  │+ save()          │         │
│  │+ findAll()        │  │+ isVersionApplied()│  │+ findById()      │         │
│  │+ deleteById()     │  │+ getAppliedVersions│  │+ findAll()        │         │
│  │+ existsById()     │  │+ ...             │  │+ ...             │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│           │                                  │                                │         │
│           └───────────────────┬──────────────────┘                                │
│                               ▼                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                  SchemaObjectHistoryRepository (接口)                 │ │
│  │                                                                       │ │
│  │  + recordObjectChange()                                             │ │
│  │  + findBySchemaVersion()                                            │ │
│  │  + findByObjectTypeAndName()                                       │ │
│  │  + findByActionType()                                               │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                           │
│                              ▼                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │            DatabaseSchemaObjectHistoryRepository                     │ │
│  │                                                                       │ │
│  │  + recordObjectChange() - 简化版（默认值填充）                        │ │
│  │  + recordFullObjectChange() - 完整版（所有参数）                      │ │
│  │  + findBySchemaVersion() - 查询指定版本的所有对象变更                 │ │
│  │  + findByObjectTypeAndName() - 查询指定对象的变更历史                   │ │
│  │  + findByActionType() - 查询指定操作类型的变更                         │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 SchemaHistoryManager (门面类)

**核心职责**:
1. 统一的 History 管理入口
2. 支持多种 Repository 实现
3. 提供便捷的查询方法

**构造函数**:

```java
// 1. 传统构造函数 - 使用 DatabaseSchemaHistoryRepository
public SchemaHistoryManager(Connection connection) {
    this(connection, DEFAULT_HISTORY_TABLE_NAME);
}

public SchemaHistoryManager(Connection connection, String historyTableName) {
    DatabaseSchemaHistoryRepository dbRepository =
        new DatabaseSchemaHistoryRepository(connection, historyTableName);
    this.schemaHistoryRepository = dbRepository;
    this.schemaObjectHistoryRepository = dbRepository.getObjectHistoryRepository();

    // 初始化 History 表
    if (dbRepository instanceof DatabaseSchemaHistoryRepository) {
        try {
            dbRepository.initializeHistoryTables();
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize history tables", e);
        }
    }
}

// 2. 基于 Repository 的构造函数
public SchemaHistoryManager(SchemaHistoryRepository schemaHistoryRepository) {
    this.schemaHistoryRepository = schemaHistoryRepository;
    // 如果是 Database 实现，获取其关联的 Object Repository
    if (schemaHistoryRepository instanceof DatabaseSchemaHistoryRepository) {
        this.schemaObjectHistoryRepository =
            ((DatabaseSchemaHistoryRepository) schemaHistoryRepository).getObjectHistoryRepository();
    }
}

// 3. 基于 PluginManager 的构造函数（支持扩展）
public SchemaHistoryManager(PluginManager pluginManager, String repositoryId, Object... params) {
    Class<? extends SchemaHistoryRepository> repoClass = pluginManager.getSchemaHistoryRepository(repositoryId);
    if (repoClass == null) {
        throw new IllegalArgumentException("SchemaHistoryRepository not found for ID: " + repositoryId);
    }

    try {
        // 根据参数类型创建 Repository 实例
        if (params.length > 0 && params[0] instanceof Connection) {
            Connection connection = (Connection) params[0];
            String tableName = params.length > 1 ? (String) params[1] : DEFAULT_HISTORY_TABLE_NAME;

            if (DatabaseSchemaHistoryRepository.class.isAssignableFrom(repoClass)) {
                DatabaseSchemaHistoryRepository dbRepository =
                    (DatabaseSchemaHistoryRepository) repoClass
                        .getConstructor(Connection.class, String.class)
                        .newInstance(connection, tableName);
                this.schemaHistoryRepository = dbRepository;
                this.schemaObjectHistoryRepository = dbRepository.getObjectHistoryRepository();

                dbRepository.initializeHistoryTables();
            } else {
                this.schemaHistoryRepository = repoClass.newInstance();
            }
        } else {
            this.schemaHistoryRepository = repoClass.newInstance();
        }
    } catch (Exception e) {
        throw new RuntimeException("Failed to instantiate SchemaHistoryRepository: " + repositoryId, e);
    }
}
```

**核心方法**:

```java
// 记录 Schema 变更
public void recordSchemaChange(String version, String description, String type,
                             String script, String installedBy, int executionTime, boolean success) {
    schemaHistoryRepository.recordSchemaChange(version, description, type,
            script, installedBy, executionTime, success);
}

// 记录对象变更（简化版）
public void recordObjectChange(String objectType, String objectName, String schemaVersion,
                             String actionType, String ddlStatement) {
    if (schemaObjectHistoryRepository != null) {
        schemaObjectHistoryRepository.recordObjectChange(objectType, objectName, schemaVersion,
                actionType, ddlStatement);
    }
}

// 检查版本是否已应用
public boolean isVersionApplied(String version) {
    return schemaHistoryRepository.isVersionApplied(version);
}

// 获取已应用的版本列表
public List<String> getAppliedVersions() {
    return schemaHistoryRepository.getAppliedVersions();
}

// 获取最新应用的版本
public String getLatestAppliedVersion() {
    return schemaHistoryRepository.getLatestAppliedVersion();
}

// 获取版本的所有对象变更
public List<SchemaObjectHistory> getObjectChangesByVersion(String version) {
    return schemaHistoryRepository.getObjectChangesByVersion(version);
}

// 获取所有 History 记录
public List<SchemaHistory> getAllHistory() {
    return schemaHistoryRepository.findAll();
}

// 验证 History 完整性
public boolean validateHistory() {
    return schemaHistoryRepository.validateHistory();
}
```

---------------------------

## 4. 工作流程

### 4.1 初始化流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        History 表初始化流程                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │              SchemaDeployer/SchemaHistoryManager 构造                  │ │
│  │                                                                       │ │
│  │  new SchemaDeployer(Connection)                                       │ │
│  │    │                                                                   │ │
│  │    └──> new SchemaHistoryManager(connection)                          │ │
│  │            │                                                           │ │
│  │            ├──> new DatabaseSchemaHistoryRepository(connection)        │ │
│  │            │                                                           │ │
│  │            ├──> new DatabaseSchemaObjectHistoryRepository(connection)  │ │
│  │            │                                                           │ │
│  │            └──> initializeHistoryTables()                               │ │
│  │                    │                                                   │ │
│  │                    ▼                                                   │ │
│  │         ┌─────────────────────────────────────────────────────────┐   │ │
│  │         │  CREATE TABLE IF NOT EXISTS justdb_schema_history (...)│   │ │
│  │         │  CREATE TABLE IF NOT EXISTS justdb_schema_history_objects │   │ │
│  │         │  CREATE INDEX idx_justdb_schema_history_version      │   │ │
│  │         │  CREATE INDEX idx_justdb_schema_history_success      │   │ │
│  │         │  CREATE INDEX idx_justdb_schema_history_installed_on │   │ │
│  │         │  CREATE INDEX idx_justdb_schema_history_obj_name     │   │ │
│  │         │  CREATE INDEX idx_justdb_schema_history_obj_version  │   │ │
│  │         │  CREATE INDEX idx_justdb_schema_history_obj_status   │   │ │
│  │         └─────────────────────────────────────────────────────────┘   │ │
│  │                                                                       │ │
│  │  History 表创建完成，可以开始记录变更                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 记录变更流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        变更记录流程                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    SchemaDeployer.deploy()                              │ │
│  │                                                                       │ │
│  │  long startTime = System.currentTimeMillis();                           │ │
│  │  String version = currentVersion;                                    │ │
│  │  String description = "JustDB schema deployment";                      │ │
│  │                                                                       │ │
│  │  try {                                                                │ │
│  │      // 1. 应用 Schema                                                  │ │
│  │      applySchema(expected);                                           │ │
│  │                                                                       │ │
│  │      // 2. 记录成功                                                     │ │
│  │      long executionTime = System.currentTimeMillis() - startTime;       │ │
│  │      recordMigration(version, description, "JustDB schema deployment", │ │
│  │                       (int) executionTime, true);                        │ │
│  │  } catch (SQLException e) {                                            │ │
│  │      // 3. 记录失败                                                     │ │
│  │      long executionTime = System.currentTimeMillis() - startTime;       │ │
│  │      recordMigration(version, description, "JustDB schema deployment", │ │
│  │                       (int) executionTime, false);                       │ │
│  │      throw e;                                                          │ │
│  │  }                                                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                              │
│                              ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    SchemaDeployer.recordMigration()                     │ │
│  │                                                                       │ │
│  │  private void recordMigration(String version, String description,     │ │
│  │                           String script, int executionTime,   │ │
│  │                           boolean success) {                     │ │
│  │      if (historyManager != null && trackHistory) {                     │ │
│  │          historyManager.recordSchemaChange(version, description,     │ │
│ |              "DDL", script,                                          │ │
│  │              System.getProperty("user.name"), executionTime, success);│ │
│  │      }                                                                 │ │
│  │  }                                                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                              │
│                              ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │            SchemaHistoryManager.recordSchemaChange()                   │ │
│  │                                                                       │ │
│  │  public void recordSchemaChange(String version, String description,    │ │
│  │                               String type, String script,            │ │
│  │                               String installedBy, int executionTime,│ │
│  │                               boolean success) {                  │ │
│  │      schemaHistoryRepository.recordSchemaChange(                     │ │
│  │          version, description, type, script,                             │ │
│  │          installedBy, executionTime, success                            │ │
│  │      );                                                                 │ │
│  │  }                                                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                              │
│                              ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │      DatabaseSchemaHistoryRepository.recordSchemaChange()            │ │
│  │                                                                       │ │
│  │  String insertSql = String.format(                                   │ │
│  │      "INSERT INTO %s (installed_rank, version, description, type, " +   │ │
│  │      "script, installed_by, execution_time, success) VALUES (" +         │ │
│  │      "(SELECT COALESCE(MAX(installed_rank), 0) + 1 FROM " +                 │ │
│  │      "(SELECT installed_rank FROM %s) AS temp), " +                         │ │
│  │      "?, ?, ?, ?, ?, ?, ?)",                                              │ │
│  │      historyTableName, historyTableName                                  │ │
│  │  );                                                                   │ │
│  │                                                                       │ │
│  │  关键点: installed_rank 使用子查询自动递增，确保顺序正确                 │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  同时记录对象级别的变更:                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  SchemaDeployer 执行 DDL 时:                                            │ │
│  │                                                                       │ │
│  │  createTable(table) {                                                   │ │
│  │      String sql = dbGenerator.generateCreateTable(table);                │ │
│  │      executeSql(sql);                                                   │ │
│  │      recordObjectChange("TABLE", table.getName(), "CREATE", sql);     │ │
│  │  }                                                                    │ │
│  │                                                                       │ │
│  │  dropTable(tableName) {                                                 │ │
│  │      String sql = "DROP TABLE IF EXISTS `" + tableName + "`;           │ │
│  │      executeSql(sql);                                                   │
│  │      recordObjectChange("TABLE", tableName, "DROP", sql);             │ │
│  │  }                                                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 幂等性检查流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        幂等性检查流程                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  场景：SchemaDeployer.deployIfNotApplied(schema, "1.0.0", description)         │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │              SchemaDeployer.deployIfNotApplied()                       │ │
│  │                                                                       │ │
│  │  if (historyManager != null && historyManager.isVersionApplied(version)) { │ │
│  │      // 版本已应用，跳过                                                 │ │
│  │      log.info("Version {} already applied, skipping migration", version);│ │
│  │      return false;                                                     │ │
│  │  }                                                                    │ │
│  │                                                                       │ │
│  │  // 执行部署                                                           │
│  │  withVersion(version).deploy(schema);                                  │ │
│  │  return true;                                                          │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                              │
│                              ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │            SchemaHistoryManager.isVersionApplied()                      │ │
│  │                                                                       │ │
│  │  public boolean isVersionApplied(String version) {                     │ │
│  │      return schemaHistoryRepository.isVersionApplied(version);          │ │
│  │  }                                                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                              │
│                              ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │       DatabaseSchemaHistoryRepository.isVersionApplied()               │ │
│  │                                                                       │ │
│  │  String selectSql = String.format(                                    │ │
│  │      "SELECT COUNT(*) FROM %s WHERE version = ? AND success = TRUE",      │ │
│  │      historyTableName                                                   │ │
│  │  );                                                                  │ │
│  │                                                                       │ │
│  │  try (PreparedStatement stmt = connection.prepareStatement(selectSql)) {│ │
│  │      stmt.setString(1, version);                                       │ │
│  │      try (ResultSet rs = stmt.executeQuery()) {                        │ │
│  │          if (rs.next()) {                                             │ │
│  │              return rs.getInt(1) > 0;  // 有成功记录即表示已应用        │ │
│  │          }                                                            │ │
│  │      }                                                                │ │
│  │  }                                                                    │ │
│  │  return false;                                                         │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---------------------------

## 5. 两种 History 实现对比

### 5.1 DatabaseSchemaHistoryRepository (数据库存储)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DatabaseSchemaHistoryRepository                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  存储位置: 数据库表                                                        │
│  - justdb_schema_history (主表)                                          │
│  - justdb_schema_history_objects (对象表)                                │
│                                                                             │
│  优点:                                                                     │
│  - 持久化存储，数据库重启不丢失                                           │
│  - 支持事务一致性                                                       │
│  - 支持分布式部署                                                       │
│  - 可以通过 SQL 查询分析                                                 │
│                                                                             │
│  缺点:                                                                     │
│  - 需要数据库连接                                                         │
│  - 依赖数据库可用性                                                       │
│  - 增加 DDL 开销                                                         │
│                                                                             │
│  适用场景: 生产环境                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 AiSchemaHistoryManager (文件系统存储)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AiSchemaHistoryManager                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  存储位置: 文件系统                                                        │
│  - ~/.justdb/<project-name>/YYYYMMDD-HHmmss-tag.json                   │
│                                                                             │
│  示例:                                                                     │
│  - ~/.justdb/myapp/20240207-143000-initial.json                          │
│  - ~/.justdb/myapp/20240207-143120-snapshot.json                        │
│  - ~/.justdb/myapp/20240207-143230-snapshot.json                        │
│                                                                             │
│  优点:                                                                     │
│  - 不需要数据库连接                                                       │
│  - 适合开发/测试环境                                                     │
│  - 可以直接查看 JSON 文件                                                  │
│  - 自动清理（基于 limit）                                                  │
│                                                                             │
│  缺点:                                                                     │
│  - 不支持事务一致性                                                       │
│  - 不适合分布式部署                                                       │
│  - 文件数量可能很大                                                       │
│                                                                             │
│  特性:                                                                     │
│  - 自动裁剪（elimination-based pruning）                                 │
│  - 保留最新的 N 个快照                                                     │
│  - 按时间戳命名                                                          │
│                                                                             │
│  适用场景:                                                               │
│  - AI 会话期间的 Schema 快照管理                                           │
│  - 开发/测试环境                                                         │
│  - 不需要持久化的临时场景                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 对比表

| 特性 | DatabaseSchemaHistoryRepository | AiSchemaHistoryManager |
|------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **存储位置** | 数据库表 | 文件系统 |
| **数据粒度** | 版本级别 + 对象级别 | Schema 完整快照 |
| **持久化** | 持久化 | 临时（可清理） |
| **事务支持** | 是 | 否 |
| **分布式** | 是 | 否 |
| **查询能力** | SQL 查询 | 文件系统遍历 |
| **自动清理** | 手动 | 自动（limit 机制） |
| **适用场景** | 生产环境 | AI 会话/开发环境 |

---------------------------

## 6. 关键方法分析

### 6.1 recordSchemaChange - 版本级变更记录

```java
/**
 * 记录一次完整的 Schema 变更
 *
 * @param version 版本号（如 "1.0.0"）
 * @param description 描述（如 "Add user preferences table"）
 * @param type 类型（SQL/DDL/DML/CONFIG）
 * @param script 变更脚本内容
 * @param installedBy 安装者
 * @param executionTime 执行时间（毫秒）
 * @param success 是否成功
 */
public void recordSchemaChange(String version, String description, String type,
                             String script, String installedBy, int executionTime,
                             boolean success) {

    // 构造 INSERT SQL
    String insertSql = String.format(
        "INSERT INTO %s (installed_rank, version, description, type, script, " +
        "installed_by, execution_time, success) VALUES (" +
        "(SELECT COALESCE(MAX(installed_rank), 0) + 1 FROM (SELECT installed_rank FROM %s) AS temp), " +
        "?, ?, ?, ?, ?, ?, ?)",
        historyTableName, historyTableName
    );

    // 关键点：
    // 1. installed_rank 使用子查询自动递增，保证顺序
    // 2. 即使执行失败也会记录（success=false）
    // 3. 支持并发（MAX + 1 是原子操作）

    try (PreparedStatement stmt = connection.prepareStatement(insertSql)) {
        stmt.setString(1, version);
        stmt.setString(2, description);
        stmt.setString(3, type);
        stmt.setString(4, script);
        stmt.setString(5, installedBy != null ? installedBy : System.getProperty("user.name", "unknown"));
        stmt.setInt(6, executionTime);
        stmt.setBoolean(7, success);

        stmt.executeUpdate();
    } catch (SQLException e) {
        throw new RuntimeException("Failed to record schema change", e);
    }
}
```

**设计要点**:
- `installed_rank` 自增逻辑：`(SELECT COALESCE(MAX(installed_rank), 0) + 1 FROM ...)`
- 记录失败也执行（便于故障排查）
- 默认 `installedBy` 为系统用户名

### 6.2 recordObjectChange - 对象级变更记录

```java
/**
 * 记录单个数据库对象的变更
 *
 * @param objectType 对象类型（TABLE/COLUMN/INDEX/CONSTRAINT/SEQUENCE）
 * @param objectName 对象名称（如 "users" 或 "users.id"）
 * @param schemaVersion 所属版本号
 * @param actionType 操作类型（CREATE/ALTER/DROP/ADD/MODIFY/RENAME）
 * @param ddlStatement DDL 语句
 */
public void recordObjectChange(String objectType, String objectName, String schemaVersion,
                             String actionType, String ddlStatement) {
    String tableName = historyTableName + "_objects";  // 对象表名
    String insertSql = String.format(
        "INSERT INTO %s (object_type, object_name, schema_version, description, ddl_statement, " +
        "installed_by, execution_time, success, status_code) " +
        "VALUES (?, ?, ?, ?, ?, ?, 0, true, 'SUCCESS')",
        tableName
    );

    try (PreparedStatement stmt = connection.prepareStatement(insertSql)) {
        stmt.setString(1, objectType);
        stmt.setString(2, objectName);
        stmt.setString(3, schemaVersion);
        stmt.setString(4, actionType);  // 存储在 description 字段
        stmt.setString(5, ddlStatement);
        stmt.setString(6, System.getProperty("user.name", "unknown"));

        stmt.executeUpdate();
    } catch (SQLException e) {
        throw new RuntimeException("Failed to record object change", e);
    }
}
```

**设计要点**:
- 简化版：使用默认值填充（execution_time=0, success=true, status_code='SUCCESS'）
- `actionType` 存储在 `description` 字段（字段名语义不匹配）
- 对象表名为主表名加 `_objects` 后缀

### 6.3 isVersionApplied - 版本幂等性检查

```java
/**
 * 检查指定版本是否已成功应用
 *
 * @param version 版本号
 * @return true 如果版本已成功应用
 */
public boolean isVersionApplied(String version) {
    String selectSql = String.format(
        "SELECT COUNT(*) FROM %s WHERE version = ? AND success = TRUE",
        historyTableName
    );

    try (PreparedStatement stmt = connection.prepareStatement(selectSql)) {
        stmt.setString(1, version);
        try (ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                return rs.getInt(1) > 0;  // 有成功记录即表示已应用
            }
        }
    } catch (SQLException e) {
        throw new RuntimeException("Failed to check if version is applied", e);
    }

    return false;
}
```

**设计要点**:
- 只检查 `success = TRUE` 的记录
- 忽略失败记录（即使有记录但 success=false，也返回 false）
- 支持重新执行失败版本（只需相同 version 再次执行）

### 6.4 getObjectChangesByVersion - 获取版本的对象变更

```java
/**
 * 获取指定版本的所有对象变更记录
 *
 * @param version 版本号
 * @return 对象变更列表
 */
public List<SchemaObjectHistory> getObjectChangesByVersion(String version) {
    try {
        return objectHistoryRepository.findBySchemaVersion(version);
    } catch (Exception e) {
        throw new RuntimeException("Failed to get object changes by version", e);
    }
}

public List<SchemaObjectHistory> findBySchemaVersion(String schemaVersion) {
    List<SchemaObjectHistory> changes = new ArrayList<>();
    String selectSql = String.format(
        "SELECT id, object_type, object_name, schema_version, description, ddl_statement, " +
        "checksum, installed_by, installed_on, execution_time, success, status_code " +
        "FROM %s WHERE schema_version = ? ORDER BY installed_on",
        historyTableName
    );

    try (PreparedStatement stmt = connection.prepareStatement(selectSql)) {
        stmt.setString(1, schemaVersion);
        try (ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                SchemaObjectHistory change = new SchemaObjectHistory();
                // ... 映射所有字段
                changes.add(change);
            }
        }
    } catch (SQLException e) {
        throw new RuntimeException("Failed to find object changes by schema version", e);
    }

    return changes;
}
```

**设计要点**:
- 通过 `schema_version` 字段关联主表
- 按 `installed_on` 排序（执行顺序）
- 返回完整的对象变更历史

---------------------------

## 7. 与 SchemaDeployer 的集成

### 7.1 SchemaDeployer 如何使用 History

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  SchemaDeployer 与 History 的集成                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        SchemaDeployer                                 │ │
│  │                                                                       │ │
│  │  private Connection connection;                                         │ │
│  │  private DBGenerator dbGenerator;                                     │ │
│  │  private String databaseType;                                          │ │
│  │  private SchemaHistoryManager historyManager;  // ← History 集成点        │ │
│  │  private String currentVersion;                                        │ │
│  │  private boolean trackHistory = true;                                   │ │
│  │                                                                       │ │
│  │  // 构造函数                                                          │ │
│  │  public SchemaDeployer(Connection connection, boolean trackHistory) {   │ │
│  │      this.connection = connection;                                     │ │
│  │      this.trackHistory = trackHistory && connection != null;           │ │
│  │      this.databaseType = detectDatabaseType();                       │ │ │
│  │      this.dbGenerator = new DBGenerator(...);                          │ │
│  │      if (this.trackHistory) {                                        │ │
│  │          this.historyManager = new SchemaHistoryManager(connection);     │ │
│  │          this.historyManager.initializeHistoryTables();             │ │
│  │      }                                                                 │ │
│  │  }                                                                     │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                           │
│                              ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                     deploy() / deployDiff()                             │ │
│  │                                                                       │ │ │
│  │  long startTime = System.currentTimeMillis();                           │ │ │
│ │  String version = currentVersion;                                    │ │ │
││ │                                                                       │ │ │
│ │  try {                                                                │ │ │
│  │      // 1. 执行 DDL                                                     │ │ │ │
│  │      applySchema(expected);                                           │ │ │ │
│  │      applyTableDiff(diffTable);                                       │ │ │ │
│ │                                                                       │ │ │ │
│  │      // 2. 记录 History（只记录一次）                                    │ │ │ │
│  │      long executionTime = System.currentTimeMillis() - startTime;      │ │ │
│  │      recordMigration(version, description, script,                    │ │ │ │
│  │                       (int) executionTime, true);                         │ │ │ │
│  │                                                                       │ │ │ │
│  │  } catch (SQLException e) {                                            │ │ │ │
│  │      // 记录失败                                                       │ │ │ │
│  │      long executionTime = System.currentTimeMillis() - startTime;      │ │ │ │ │
│  │      recordMigration(version, description, script,                    │ │ │ │ │
│ │ │                       (int) executionTime, false);                        │ │ │ │ │
│  │      throw e;                                                          │ │ │ │
│  │  }                                                                    │ │ │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                           │
│                              ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      recordMigration()                                   │ │
│  │                                                                       │ │ │
│  │  private void recordMigration(String version, String description,     │ │ │
│  │                           String script, int executionTime,   │ │ │ │
│ │ │                           boolean success) {                     │ │ │ │
│  │      if (historyManager != null && trackHistory) {                     │ │ │ │
│  │          historyManager.recordSchemaChange(version, description,     │ │ │ │
│  │ │              "DDL", script,                                          │ │ │ │ │
│  │ │ │              System.getProperty("user.name"), executionTime, success);│ │ │ │ │
│  │      }                                                                 │ │ │ │
│  │  }                                                                    │ │ │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                              │                                           │
│                              ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      recordObjectChange()                                │ │ │
│  │                                                                       │ │ │ │
│  │  // 每次 DDL 执行后记录对象级变更                                         │ │ │ │
│  │  private void recordObjectChange(String objectType, String objectName, │ │ │ │
│  │ │                             String actionType, String ddlStatement) {│ │ │ │
│  │ │      if (historyManager != null && trackHistory && currentVersion != null) {│ │ │ │
│  │ │          historyManager.recordObjectChange(objectType, objectName,     │ │ │ │ │
│  │ │ │                                          currentVersion, actionType,│ │ │ │ │
│  │ │ │                                          ddlStatement);        │ │ │ │ │
│  │ │      }                                                                 │ │ │ │
│  │  }                                                                    │ │ │ │
│  │                                                                       │ │ │ │
│  │  // 使用示例:                                                           │ │ │ │ │
│  │  createTable(table) {                                                   │ │ │ │
│  │      String sql = dbGenerator.generateCreateTable(table);                │ │ │ │ │
│  │      executeSql(sql);                                                   │ │ │ │ │
│  │      recordObjectChange("TABLE", table.getName(), "CREATE", sql);     │ │ │ │ │
│  │  }                                                                    │ │ │ │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 完整的迁移流程示例

```
1. 用户执行: justdb migrate up --schema schema.yaml --version 1.0.0
   │
2. MigrateCommand 创建 SchemaDeployer:
   SchemaDeployer deployer = new SchemaDeployer(connection);
   │
3. SchemaDeployer 初始化 History:
   ├──> new SchemaHistoryManager(connection)
   ├──> new DatabaseSchemaHistoryRepository(connection)
   ├──> new DatabaseSchemaObjectHistoryRepository(connection)
   └──> initializeHistoryTables()  // 创建表（如果不存在）
   │
4. 检查版本是否已应用:
   ├──> historyManager.isVersionApplied("1.0.0")
   └──> 如果已应用，跳过；否则继续
   │
5. 执行部署:
   ├──> deploy(schema)
   │   ├──> applySchema() / applyTableDiff()
   │   │   ├──> 创建 sequences
   │   │   ├──> 创建 tables
   │   │   ├──> 创建 indexes
   │   │   └──> 创建 constraints
   │   │
   │   ├──> 每次执行 DDL 后:
   │   │   ├──> executeSql(sql)
   │   │   └──> recordObjectChange()  // 记录对象变更
   │   │
   │   └──> 全部完成后:
   │       └──> recordMigration()  // 记录版本级变更
   │
6. History 表内容:
   ├──> justdb_schema_history (主表)
   │   │
   │   │   installed_rank │ version │ description              │ type │ script │ success │
   │   │   ┌─────────────┼────────┼─────────────────────────┼─────┼────────┼────────┐
│   │   │   1           │ 1.0.0  │ JustDB schema deployment  │ DDL  │ ...    │ true   │
│   │   │   2           │ 1.1.0  │ Add user preferences  │ DDL  │ ...    │ true   │
│   │   │   ...         │ ...    │ ...                     │ ...  │ ...    │ ...    │
│   │   └─────────────┴────────┴─────────────────────────┴─────┴────────┴────────┘
   │   │
   └──> justdb_schema_history_objects (对象表)
│       │
│       │   id │ object_type │ object_name │ schema_version │ description │ ddl_statement │
│       │   ┌───┴─────────────┼────────────┼───────────────┼─────────────┼───────────────┤
│       │   │ 1 │ TABLE       │ users       │ 1.0.0         │ CREATE      │ CREATE TABLE... │
│       │   │ 2 │ COLUMN      │ users.id    │ 1.0.0         │ ADDED       │ ALTER TABLE... │
│       │   │ 3 │ INDEX       │ idx_email  │ 1.0.0         │ ADDED       │ CREATE INDEX... │
│       │   │ 4 │ TABLE       │ orders      │ 1.1.0         │ CREATE      │ CREATE TABLE... │
│       │   │ 5 │ COLUMN      │ orders.user_id│ 1.1.0         │ ADDED       │ ALTER TABLE... │
│       │   │ ... │ ...         │ ...         │ ...           │ ...          │
│       │   └───┴─────────────┴────────────┴───────────────┴─────────────┴───────────────┘
│
```

---------------------------

## 8. 设计特点与权衡

### 8.1 优点

1. **两级 History 设计**
   - 主表记录版本级别信息（幂等性检查）
   - 对象表记录细粒度变更（支持对象级别的查询和过滤）

2. **Repository 模式**
   - 数据访问层抽象
   - 支持多种存储后端（数据库、内存、文件系统）
   - 易于扩展和测试

3. **自动初始化**
   - 表不存在时自动创建
   - 索引自动创建
   - 降低使用门槛

4. **Flyway 兼容设计**
   - 表结构参考 Flyway 的 `flyway_schema_history`
   - 便于从 Flyway 迁移

### 8.2 可改进点

1. **字段语义不匹配**
   - 对象表的 `description` 字段存储 `actionType`
   - 建议重命名字段或添加 `action_type` 字段

2. **checksum 功能不完整**
   - SchemaHistory.checksum 字段未使用（类型为 INT）
   - 应改为 VARCHAR(64) 存储 SHA256

3. **installed_rank 依赖子查询**
   - 每次插入都需要子查询
   - 可以使用序列或计数器优化

4. **缺少回滚支持**
   - 没有内置的回滚机制
   - 需要手动管理

5. **对象变更记录不完整**
   - `recordObjectChange()` 简化版缺少关键信息
   - 建议统一使用完整版

### 8.3 设计权衡

| 方面 | 当前设计 | 替代方案 | 权衡说明 |
|------------------------------------------------------|---------------------------------------------------------------------------------|---------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| **History 表粒度** | 两级（版本+对象） | 单级（只有版本）或三级（版本+子版本+对象） | 两级设计在易用性和细粒度之间取得平衡 |
| **installed_rank 生成** | 子查询 `MAX+1` | 序列/计数器 | 子查询简单但性能略差，序列更高效但增加复杂度 |
| **checksum 类型** | INT | VARCHAR(64) | INT 不够精确，VARCHAR 更适合 SHA256 |
| **对象 action 存储** | `description` 字段 | 专用 `action_type` 字段 | 当前设计利用现有字段，但语义不清 |
| **失败处理** | 记录失败但不回滚 | 自动回滚 | 自动回滚更安全但实现复杂 |

---------------------------

## 附录

### A. 关键类文件清单

| 文件路径 | 说明 |
|---------------------------------------------------------------------------------|------------------------------------------------------|
| `SchemaHistoryManager.java` | History 管理门面类 |
| `DatabaseSchemaHistoryRepository.java` | 数据库 History 实现（主表） |
| `DatabaseSchemaObjectHistoryRepository.java` | 数据库 History 实现（对象表） |
| `SchemaHistory.java` | 主表实体类 |
| `SchemaObjectHistory.java` | 对象表实体类 |
| `SchemaHistoryRepository.java` | Repository 接口 |
| `SchemaObjectHistoryRepository.java` | 对象 Repository 接口 |
| `Repository.java` | 通用 Repository 接口 |
| `AiSchemaHistoryManager.java` | AI 文件系统 History 实现 |

### B. 相关文档

- [迁移系统概述](/design/migration-system/overview.md) - 迁移系统概述
- [Hash-based History](./hash-based-history.md) - Hash History 设计

### C. History 表完整 DDL

```sql
-- 主表
CREATE TABLE IF NOT EXISTS justdb_schema_history (
    installed_rank INT NOT NULL,
    version VARCHAR(50),
    description VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    script TEXT,
    checksum INT,
    installed_by VARCHAR(100) NOT NULL,
    installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time INT NOT NULL,
    success BOOLEAN NOT NULL
);

-- 对象表
CREATE TABLE IF NOT EXISTS justdb_schema_history_objects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    object_type VARCHAR(50) NOT NULL,
    object_name VARCHAR(200) NOT NULL,
    schema_version VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    ddl_statement TEXT,
    checksum VARCHAR(64),
    installed_by VARCHAR(100) NOT NULL,
    installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time INT NOT NULL,
    success BOOLEAN NOT NULL,
    status_code VARCHAR(50)
);

-- 主表索引
CREATE INDEX IF NOT EXISTS idx_justdb_schema_history_version
    ON justdb_schema_history(version);
CREATE INDEX IF NOT EXISTS idx_justdb_schema_history_success
    ON justdb_schema_history(success);
CREATE INDEX IF NOT EXISTS idx_justdb_schema_history_installed_on
    ON justdb_schema_history(installed_on);

-- 对象表索引
CREATE INDEX IF NOT EXISTS idx_justdb_schema_history_obj_name
    ON justdb_schema_history_objects(object_name);
CREATE INDEX IF NOT EXISTS idx_justdb_schema_history_obj_version
    ON justdb_schema_history_objects(schema_version);
CREATE INDEX IF NOT EXISTS idx_justdb_schema_history_obj_status
    ON justdb_schema_history_objects(status_code);
```
