# JustDB History Service Architecture Analysis

## Document Overview

This document provides a detailed analysis of the JustDB History service's current working principles, including architectural design, data model, core processes, and usage.

**Version**: 1.0
**Last Updated**: 2026-02-07
**Maintainer**: Wind Li

---------------------------

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Model](#2-data-model)
3. [Core Components](#3-core-components)
4. [Workflow](#4-workflow)
5. [Two History Implementations Comparison](#5-two-history-implementations-comparison)
6. [Key Method Analysis](#6-key-method-analysis)
7. [Integration with SchemaDeployer](#7-integration-with-schemadeployer)

---------------------------

## 1. Architecture Overview

### 1.1 Overall Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    History Service Architecture             │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │           SchemaHistoryManager (Facade)               │  │
│  │  - recordSchemaChange()                               │  │
│  │  - recordObjectChange()                               │  │
│  │  - isVersionApplied()                                 │  │
│  │  - getAppliedVersions()                               │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────┴───────────────────────────────┐  │
│  │          SchemaHistoryRepository (Interface)          │  │
│  │  + recordSchemaChange(version, description, type...)  │  │
│  │  + isVersionApplied(version)                          │  │
│  │  + getAppliedVersions()                              │  │
│  │  + getObjectChangesByVersion(version)                │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                  │
│       ┌──────────────────┴──────────────────┐                │
│       ▼                                       ▼                │
│  ┌─────────────────┐              ┌─────────────────┐         │
│  │DatabaseSchema   │              │DatabaseSchema   │         │
│  │HistoryRepository│              │ObjectHistory     │         │
│  │                 │              │Repository        │         │
│  │justdb_schema_   │              │justdb_schema_    │         │
│  │history          │              │history_objects   │         │
│  └─────────────────┘              └─────────────────┘         │
│                                                             │
│  Storage Layer (Database Tables)                            │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles

1. **Repository Pattern**: Data access layer abstraction supporting multiple storage backends
2. **Two-Level History**: Version level (main table) + object level (object table)
3. **Idempotency Support**: Via `isVersionApplied()` for safe re-execution
4. **Checksum Validation**: SHA256-based change validation

---------------------------

## 2. Data Model

### 2.1 SchemaHistory (Main Table Entity)

```java
public class SchemaHistory {
    private Integer installedRank;      // Installation order (primary key)
    private String version;             // Version (e.g., "1.0.0")
    private String description;         // Description
    private String type;                // Type (SQL/DDL/DML/CONFIG)
    private String script;              // Change script content
    private String checksum;            // Checksum (SHA256)
    private String installedBy;        // Installed by
    private LocalDateTime installedOn; // Installation time
    private Integer executionTime;      // Execution time (ms)
    private Boolean success;            // Success status
}
```

### 2.2 SchemaObjectHistory (Object Table Entity)

```java
public class SchemaObjectHistory {
    private Long id;                    // Primary key (auto-increment)
    private String objectType;          // Object type (TABLE/COLUMN/INDEX)
    private String objectName;          // Object name (e.g., "users")
    private String schemaVersion;       // Version (links to main table)
    private String actionType;         // Action type (CREATE/ALTER/DROP)
    private String ddlStatement;        // DDL statement
    private String checksum;            // Checksum (SHA256)
    private Integer executionTime;      // Execution time
    private Boolean success;            // Success status
    private LocalDateTime installedOn; // Installation time
}
```

---------------------------

## 3. Core Components

### 3.1 Component Hierarchy

```
SchemaHistoryManager (Facade)
    │
    ├── SchemaHistoryRepository (Interface)
    │   ├── DatabaseSchemaHistoryRepository
    │   └── MemorySchemaHistoryRepository
    │
    └── SchemaObjectHistoryRepository (Interface)
        └── DatabaseSchemaObjectHistoryRepository
```

---------------------------

## 4. Workflow

### 4.1 Initialization Flow

```
SchemaDeployer/SchemaHistoryManager Construction
    │
    └──> new DatabaseSchemaHistoryRepository(connection)
            │
            └──> initializeHistoryTables()
                    │
                    ▼
         ┌─────────────────────────────────┐
         │ CREATE TABLE IF NOT EXISTS     │
         │ justdb_schema_history (...)    │
         │ justdb_schema_history_objects │
         └─────────────────────────────────┘
```

### 4.2 Change Recording Flow

```
SchemaDeployer.deploy()
    │
    ├──> applySchema(expected)
    │
    └──> recordMigration()
            │
            └──> SchemaHistoryManager.recordSchemaChange()
                    │
                    └──> DatabaseSchemaHistoryRepository.recordSchemaChange()
```

---------------------------

## 5. Two History Implementations Comparison

### 5.1 DatabaseSchemaHistoryRepository (Database Storage)

| Feature | Description |
|---------|-------------|
| Storage | Database tables |
| Tables | `justdb_schema_history`, `justdb_schema_history_objects` |
| Pros | Persistent, transactional, distributed |
| Cons | Requires DB connection, DDL overhead |
| Use Case | Production environments |

### 5.2 AiSchemaHistoryManager (File System Storage)

| Feature | Description |
|---------|-------------|
| Storage | File system |
| Location | `~/.justdb/<project-name>/YYYYMMDD-HHmmss-tag.json` |
| Pros | No DB needed, development-friendly |
| Cons | No transaction support, not distributed |
| Use Case | AI sessions, development environments |

### 5.3 Comparison

| Feature | Database | File System |
|---------|----------|-------------|
| Storage Location | Database tables | File system |
| Granularity | Version + Object level | Full Schema snapshots |
| Persistence | Persistent | Temporary |
| Transaction Support | Yes | No |
| Distributed | Yes | No |
| Use Case | Production | Development/AI |

---------------------------

## 6. Key Method Analysis

### 6.1 recordSchemaChange

Records a complete Schema change with version tracking.

### 6.2 recordObjectChange

Records individual database object changes (TABLE/COLUMN/INDEX).

### 6.3 isVersionApplied

Checks if a specific version has been successfully applied (idempotency).

### 6.4 getObjectChangesByVersion

Retrieves all object changes for a specific version.

---------------------------

## 7. Integration with SchemaDeployer

SchemaDeployer uses SchemaHistoryManager to:

1. Check idempotency before deployment
2. Record version-level changes after deployment
3. Record object-level changes during DDL execution

---------------------------

## Appendix

### Key Files

| File Path | Description |
|-----------|-------------|
| `SchemaHistoryManager.java` | History management facade |
| `DatabaseSchemaHistoryRepository.java` | Database history implementation |
| `DatabaseSchemaObjectHistoryRepository.java` | Object history implementation |

### Related Documentation

- [Migration System Overview](/design/migration-system/overview.md)
- [Hash-based History](./hash-based-history.md)
