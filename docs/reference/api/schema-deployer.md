---
title: Schema 部署器
icon: 🚀
description: SchemaDeployer API 详细参考，用于将 Schema 部署到数据库
order: 5
---

# Schema 部署器

SchemaDeployer 提供了将 JustDB Schema 部署到目标数据库的能力。本文档详细介绍 Schema 部署器的使用方法。

## 目录

- [部署器概述](#部署器概述)
- [构造方法](#构造方法)
- [部署方法](#部署方法)
- [部署选项](#部署选项)
- [生命周期](#生命周期)
- [代码示例](#代码示例)

## 部署概述

SchemaDeployer 是 JustDB 的核心部署组件，负责：

- 创建数据库对象（表、视图、索引、约束等）
- 执行 Schema 变更
- 管理迁移历史
- 验证 Schema 状态

**包路径**: `ai.justdb.justdb.SchemaDeployer`

### 核心特性

1. **数据库自动检测** - 自动识别数据库类型
2. **SQL 生成** - 根据数据库类型生成优化的 SQL
3. **历史跟踪** - 记录所有 Schema 变更
4. **幂等性** - 支持版本检查，避免重复部署
5. **增量更新** - 支持 Schema 差异部署

## 构造方法

SchemaDeployer 提供多种构造方式，支持不同的使用场景。

### 1. 带数据库连接的构造

```java
public SchemaDeployer(Connection connection)
```

创建连接到数据库的部署器，自动检测数据库类型并启用历史跟踪。

**示例**:

```java
Connection connection = DriverManager.getConnection(
    "jdbc:mysql://localhost:3306/mydb"
);

SchemaDeployer deployer = new SchemaDeployer(connection);
```

### 2. 带历史跟踪选项的构造

```java
public SchemaDeployer(Connection connection, boolean trackHistory)
```

创建部署器，可选择是否启用历史跟踪。

**参数**:
- `connection` - 数据库连接
- `trackHistory` - 是否跟踪历史

**示例**:

```java
// 不跟踪历史
SchemaDeployer deployer = new SchemaDeployer(connection, false);

// 跟踪历史
SchemaDeployer deployer = new SchemaDeployer(connection, true);
```

### 3. 带自定义历史管理器的构造

```java
public SchemaDeployer(Connection connection, SchemaHistoryManager historyManager)
```

创建部署器，使用自定义的历史管理器。

**示例**:

```java
SchemaHistoryManager historyManager = new SchemaHistoryManager(connection);
SchemaDeployer deployer = new SchemaDeployer(connection, historyManager);
```

### 4. SQL 生成模式构造

```java
public SchemaDeployer()
public SchemaDeployer(String databaseType)
```

创建仅用于 SQL 生成的部署器（不需要数据库连接）。

**示例**:

```java
// 使用默认数据库类型（MySQL）
SchemaDeployer deployer = new SchemaDeployer();

// 指定数据库类型
SchemaDeployer deployer = new SchemaDeployer("postgresql");
```

## 部署方法

### deploy()

部署完整的 Schema 到数据库。

```java
public void deploy(Justdb expected) throws SQLException
```

**参数**:
- `expected` - 期望的 Schema 定义

**行为**:
1. 处理所有表的 SERIAL 列，生成对应的序列
2. 创建序列
3. 创建表
4. 创建视图
5. 创建索引
6. 创建约束

**示例**:

```java
Justdb justdb = new Justdb();
// ... 设置 Schema

Connection connection = DriverManager.getConnection("jdbc:mysql://localhost:3306/mydb");
SchemaDeployer deployer = new SchemaDeployer(connection);

deployer.deploy(justdb);
```

### deployDiff()

部署 Schema 差异到数据库（增量迁移）。

```java
public void deployDiff(Justdb diffSchema) throws SQLException
```

**参数**:
- `diffSchema` - 包含变更信息的 Schema（每个对象有 changeType 属性）

**变更类型**:
- `ADDED` - 创建新对象
- `REMOVED` - 删除对象
- `RENAMED` - 重命名对象
- `MODIFIED` - 修改对象

**示例**:

```java
// 计算差异
CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
diff.calculateAll();

// 转换为 diff schema
Justdb diffSchema = diff.toDiffSchema();

// 部署差异
SchemaDeployer deployer = new SchemaDeployer(connection);
deployer.deployDiff(diffSchema);
```

### deployIfNotApplied()

带版本检查的部署（幂等）。

```java
public boolean deployIfNotApplied(Justdb schema, String version, String description)
    throws SQLException
```

**参数**:
- `schema` - 要部署的 Schema
- `version` - 版本标识
- `description` - 部署描述

**返回**: `true` - 已部署，`false` - 已跳过

**示例**:

```java
SchemaDeployer deployer = new SchemaDeployer(connection);

boolean deployed = deployer.deployIfNotApplied(
    justdb,
    "v1.0.0",
    "Initial schema deployment"
);

if (deployed) {
    System.out.println("Schema deployed successfully");
} else {
    System.out.println("Schema already at v1.0.0, skipped");
}
```

### deployDiffIfNotApplied()

带版本检查的差异部署。

```java
public boolean deployDiffIfNotApplied(Justdb diffSchema, String version, String description)
    throws SQLException
```

**参数**:
- `diffSchema` - 差异 Schema
- `version` - 版本标识
- `description` - 部署描述

**返回**: `true` - 已部署，`false` - 已跳过

**示例**:

```java
boolean deployed = deployer.deployDiffIfNotApplied(
    diffSchema,
    "v1.1.0",
    "Add email column to users table"
);
```

### withVersion()

设置当前部署的版本（链式调用）。

```java
public SchemaDeployer withVersion(String version)
```

**示例**:

```java
deployer.withVersion("v1.0.0").deploy(justdb);
```

## 部署选项

### 历史管理

**获取历史管理器**:

```java
public SchemaHistoryManager getHistoryManager()
```

**设置历史管理器**:

```java
public void setHistoryManager(SchemaHistoryManager historyManager)
```

**检查版本是否已应用**:

```java
public boolean isVersionApplied(String version)
```

**获取已应用的版本列表**:

```java
public List&lt;String&gt; getAppliedVersions()
```

**获取最新应用的版本**:

```java
public String getLatestAppliedVersion()
```

**检查数据库是否为指定版本**:

```java
public boolean isUpToDate(String version)
```

### SQL 生成

**生成 SQL 脚本**（不执行）:

```java
public List&lt;String&gt; generateScripts(Justdb schema)
```

**示例**:

```java
SchemaDeployer deployer = new SchemaDeployer("mysql");
List&lt;String&gt; scripts = deployer.generateScripts(justdb);

for (String script : scripts) {
    System.out.println(script);
}
```

### Schema 验证

**验证 Schema 是否与数据库匹配**:

```java
public SchemaVerificationResult verifySchema(Justdb expectedSchema)
```

**返回**: `SchemaVerificationResult` - 包含验证结果和详细信息

**示例**:

```java
SchemaDeployer deployer = new SchemaDeployer(connection);
SchemaVerificationResult result = deployer.verifySchema(justdb);

if (result.isSuccess()) {
    System.out.println("Schema verification passed");
} else {
    System.out.println("Schema verification failed:");
    for (String difference : result.getDifferences()) {
        System.out.println("  - " + difference);
    }
}
```

## 生命周期

### 部署流程

```
1. 初始化
   ├─ 检测数据库类型
   ├─ 初始化 DBGenerator
   └─ 初始化历史管理器

2. 预处理
   ├─ 深拷贝表定义
   └─ 预处理列（SERIAL → Sequence）

3. 创建序列
   ├─ 表级序列（从 SERIAL 列生成）
   └─ Schema 级序列

4. 创建表
   ├─ 生成 CREATE TABLE SQL
   ├─ 执行 SQL
   └─ 记录变更

5. 创建视图
6. 创建索引
7. 创建约束

8. 记录历史
   └─ 保存部署记录
```

### 错误处理

```java
try {
    deployer.deploy(justdb);
} catch (SQLException e) {
    // 处理部署失败
    System.err.println("Deployment failed: " + e.getMessage());

    // 检查历史
    SchemaHistoryManager history = deployer.getHistoryManager();
    if (history != null) {
        List&lt;String&gt; appliedVersions = history.getAppliedVersions();
        System.out.println("Applied versions: " + appliedVersions);
    }
}
```

## 代码示例

### 基本部署

```java
import ai.justdb.justdb.SchemaDeployer;
import ai.justdb.justdb.schema.*;
import java.sql.*;
import java.util.Arrays;

public class BasicDeployment {
    public static void main(String[] args) throws SQLException {
        // 创建 Schema
        Justdb justdb = new Justdb();

        Table usersTable = new Table("users");
        usersTable.setComment("用户表");

        Column idColumn = new Column();
        idColumn.setName("id");
        idColumn.setType("BIGINT");
        idColumn.setPrimaryKey(true);
        idColumn.setAutoIncrement(true);

        Column nameColumn = new Column();
        nameColumn.setName("username");
        nameColumn.setType("VARCHAR(50)");
        nameColumn.setNullable(false);

        usersTable.setColumns(Arrays.asList(idColumn, nameColumn));
        justdb.setTables(Arrays.asList(usersTable));

        // 部署到数据库
        Connection connection = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/mydb",
            "root",
            "password"
        );

        SchemaDeployer deployer = new SchemaDeployer(connection);
        deployer.deploy(justdb);

        System.out.println("Schema deployed successfully");

        connection.close();
    }
}
```

### 增量部署

```java
import ai.justdb.justdb.SchemaDeployer;
import ai.justdb.justdb.schema.*;
import java.sql.*;

public class IncrementalDeployment {
    public static void main(String[] args) throws SQLException {
        Connection connection = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/mydb"
        );

        SchemaDeployer deployer = new SchemaDeployer(connection);

        // 创建差异 Schema
        Justdb diffSchema = new Justdb();

        Table tableDiff = new Table("users");
        tableDiff.setChangeType(ChangeType.MODIFIED);

        // 添加新列
        Column emailColumn = new Column();
        emailColumn.setName("email");
        emailColumn.setType("VARCHAR(100)");
        emailColumn.setChangeType(ChangeType.ADDED);

        tableDiff.setColumns(Arrays.asList(emailColumn));
        diffSchema.setTables(Arrays.asList(tableDiff));

        // 部署差异
        deployer.deployDiff(diffSchema);

        System.out.println("Incremental deployment completed");

        connection.close();
    }
}
```

### 版本化部署

```java
import ai.justdb.justdb.SchemaDeployer;
import ai.justdb.justdb.schema.*;
import java.sql.*;

public class VersionedDeployment {
    public static void main(String[] args) throws SQLException {
        Connection connection = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/mydb"
        );

        SchemaDeployer deployer = new SchemaDeployer(connection);

        // 创建 Schema
        Justdb justdb = createSchema();

        // 带版本部署
        boolean deployed = deployer.deployIfNotApplied(
            justdb,
            "v1.0.0",
            "Initial schema deployment"
        );

        if (deployed) {
            System.out.println("Schema v1.0.0 deployed");

            // 检查版本
            String latestVersion = deployer.getLatestAppliedVersion();
            System.out.println("Latest version: " + latestVersion);
        } else {
            System.out.println("Schema v1.0.0 already deployed, skipped");
        }

        connection.close();
    }

    private static Justdb createSchema() {
        Justdb justdb = new Justdb();
        // ... 构建 Schema
        return justdb;
    }
}
```

### SQL 生成模式

```java
import ai.justdb.justdb.SchemaDeployer;
import ai.justdb.justdb.schema.*;
import java.util.*;

public class SqlGeneration {
    public static void main(String[] args) {
        // 创建 Schema
        Justdb justdb = new Justdb();
        // ... 构建 Schema

        // SQL 生成模式（不需要数据库连接）
        SchemaDeployer deployer = new SchemaDeployer("postgresql");

        List&lt;String&gt; scripts = deployer.generateScripts(justdb);

        System.out.println("-- PostgreSQL SQL Scripts");
        System.out.println();

        for (int i = 0; i < scripts.size(); i++) {
            System.out.println("-- Script " + (i + 1));
            System.out.println(scripts.get(i));
            System.out.println();
        }
    }
}
```

### Schema 验证

```java
import ai.justdb.justdb.SchemaDeployer;
import ai.justdb.justdb.SchemaDeployer.SchemaVerificationResult;
import ai.justdb.justdb.schema.*;
import java.sql.*;

public class SchemaVerification {
    public static void main(String[] args) throws SQLException {
        Connection connection = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/mydb"
        );

        SchemaDeployer deployer = new SchemaDeployer(connection);

        // 创建期望的 Schema
        Justdb expectedSchema = createExpectedSchema();

        // 验证 Schema
        SchemaVerificationResult result = deployer.verifySchema(expectedSchema);

        if (result.isSuccess()) {
            System.out.println("✓ Schema verification passed");
        } else {
            System.out.println("✗ Schema verification failed:");
            System.out.println("Messages:");
            for (String message : result.getMessages()) {
                System.out.println("  - " + message);
            }
            System.out.println("Differences:");
            for (String difference : result.getDifferences()) {
                System.out.println("  - " + difference);
            }
        }

        connection.close();
    }

    private static Justdb createExpectedSchema() {
        // 创建期望的 Schema
        return new Justdb();
    }
}
```

### 多数据库支持

```java
import ai.justdb.justdb.SchemaDeployer;
import ai.justdb.justdb.schema.*;
import java.util.*;

public class MultiDatabaseSupport {
    public static void main(String[] args) {
        Justdb justdb = createSchema();

        // 支持的数据库类型
        String[] databases = {"mysql", "postgresql", "oracle", "h2"};

        for (String dbType : databases) {
            System.out.println("=== " + dbType.toUpperCase() + " ===");

            SchemaDeployer deployer = new SchemaDeployer(dbType);
            List&lt;String&gt; scripts = deployer.generateScripts(justdb);

            for (String script : scripts) {
                System.out.println(script);
                System.out.println();
            }
        }
    }

    private static Justdb createSchema() {
        Justdb justdb = new Justdb();
        // ... 构建 Schema
        return justdb;
    }
}
```

## 最佳实践

### 1. 使用版本管理

```java
// 始终使用版本化部署
deployer.withVersion("v1.0.0").deploy(justdb);

// 或使用幂等部署
deployer.deployIfNotApplied(justdb, "v1.0.0", "Initial deployment");
```

### 2. 错误处理

```java
try {
    deployer.deploy(justdb);
} catch (SQLException e) {
    // 记录错误
    log.error("Deployment failed", e);

    // 检查并恢复
    if (deployer.getLatestAppliedVersion() != null) {
        log.info("Last successful version: {}",
            deployer.getLatestAppliedVersion());
    }

    throw e;
}
```

### 3. 部署前验证

```java
// 部署前验证 Schema
SchemaVerificationResult result = deployer.verifySchema(justdb);
if (!result.isSuccess()) {
    throw new IllegalStateException("Schema verification failed: " +
        result.getDifferences());
}

// 验证通过后再部署
deployer.deploy(justdb);
```

### 4. 增量更新

```java
// 使用差异部署进行增量更新
CanonicalSchemaDiff diff = new CanonicalSchemaDiff(current, target);
diff.calculateAll();

Justdb diffSchema = diff.toDiffSchema();
deployer.deployDiffIfNotApplied(diffSchema, "v1.1.0", "Add new features");
```

## 相关文档

- [Java API 参考](./java-api.md) - 核心 Java API
- [Schema 加载器](./schema-loader.md) - Schema 加载详解
- [Schema 差异计算](./schema-diff.md) - Schema 差异计算详解
- [JDBC 驱动](./jdbc-driver.md) - JDBC 驱动使用指南
