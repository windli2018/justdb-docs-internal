---
title: JDBC 驱动参考
icon: 🔌
description: JustDB JDBC 驱动完整参考，包括连接字符串、支持的功能和使用示例
order: 3
---

# JDBC 驱动参考

JustDB 提供了标准 JDBC 驱动，允许通过 JDBC API 访问 JustDB Schema。本文档详细说明 JDBC 驱动的使用方法。

## 目录

- [驱动概述](#驱动概述)
- [连接字符串](#连接字符串)
- [连接属性](#连接属性)
- [支持的 JDBC 功能](#支持的-jdbc-功能)
- [使用示例](#使用示例)
- [迁移模式](#迁移模式)
- [Schema 注册表](#schema-注册表)
- [限制说明](#限制说明)

## 驱动概述

JustDB JDBC 驱动实现了 JDBC API 的核心功能，支持：

- 标准 JDBC 连接管理
- SQL 查询执行
- PreparedStatement 支持
- 元数据查询
- 事务管理（基础支持）
- 多 Schema 支持

**驱动类**: `ai.justdb.justdb.jdbc.JustdbDriver`

**JDBC URL 前缀**: `jdbc:justdb:`

## 连接字符串

### 单 Schema 连接

基本格式：`jdbc:justdb:schema-file-path[?parameter=value&...]`

**示例**:

```java
// JSON Schema
Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.json");

// XML Schema
Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.xml");

// YAML Schema
Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.yaml");

// 带参数的连接
Connection conn = DriverManager.getConnection(
    "jdbc:justdb:./schema.json?readonly=true&autocommit=false"
);

// 内存 Schema（空）
Connection conn = DriverManager.getConnection("jdbc:justdb:memory:");

// 内存 Schema（从文件加载）
Connection conn = DriverManager.getConnection("jdbc:justdb:memory:schema.json");
```

### 多 Schema 连接

支持同时连接多个 Schema 文件。

**格式**:

1. **隐式命名**（使用文件名作为 Schema 名称）:
   ```
   jdbc:justdb:/path1/schema1.json,/path2/schema2.xml?default=schema1
   ```

2. **显式命名**:
   ```
   jdbc:justdb:schema1=/path1/schema.json,schema2=/path2/schema.xml?default=schema1
   ```

3. **目录扫描**:
   ```
   jdbc:justdb:directory:/path/to/schemas?autoScan=true&default=schema1
   ```

**代码示例**:

```java
// 多 Schema 连接
String url = "jdbc:justdb:schema1=./db1.json,schema2=./db2.json?default=schema1";
Connection conn = DriverManager.getConnection(url);

// 使用不同的 Schema
Statement stmt = conn.createStatement();
stmt.execute("USE schema2");
ResultSet rs = stmt.executeQuery("SELECT * FROM users");
```

## 连接属性

### JDBC 标准属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `user` | String | "" | 用户名（用于日志） |
| `password` | String | "" | 密码（用于日志） |
| `readonly` | boolean | false | 只读模式 |
| `autocommit` | boolean | true | 自动提交 |

### JustDB 扩展属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `outputSchema` | String | ".justdb" | Schema 输出目录 |
| `outputFile` | String | - | Schema 输出文件路径 |
| `create` | boolean | false | Schema 不存在时创建 |
| `migrate` | String | - | 迁移 Schema 文件路径 |
| `default` | String | - | 默认 Schema 名称（多 Schema） |
| `autoScan` | boolean | false | 自动扫描目录 |

**代码示例**:

```java
Properties props = new Properties();
props.setProperty("readonly", "true");
props.setProperty("autocommit", "false");
props.setProperty("user", "admin");
props.setProperty("outputSchema", "./output");

Connection conn = DriverManager.getConnection(
    "jdbc:justdb:./schema.json",
    props
);
```

## 支持的 JDBC 功能

### Connection 接口

| 方法 | 支持 | 说明 |
|------|------|------|
| `createStatement()` | ✅ | 创建 Statement |
| `prepareStatement(String)` | ✅ | 创建 PreparedStatement |
| `prepareCall(String)` | ⚠️ | 部分支持 |
| `getMetaData()` | ✅ | 获取数据库元数据 |
| `commit()` | ✅ | 提交事务 |
| `rollback()` | ✅ | 回滚事务 |
| `setAutoCommit(boolean)` | ✅ | 设置自动提交 |
| `getAutoCommit()` | ✅ | 获取自动提交状态 |
| `close()` | ✅ | 关闭连接 |
| `isClosed()` | ✅ | 检查连接是否关闭 |
| `setReadOnly(boolean)` | ✅ | 设置只读模式 |
| `isReadOnly()` | ✅ | 获取只读状态 |

### Statement 接口

| 方法 | 支持 | 说明 |
|------|------|------|
| `execute(String)` | ✅ | 执行 SQL 语句 |
| `executeQuery(String)` | ✅ | 执行查询 |
| `executeUpdate(String)` | ✅ | 执行更新 |
| `executeBatch()` | ✅ | 批量执行 |
| `addBatch(String)` | ✅ | 添加批处理 |
| `clearBatch()` | ✅ | 清空批处理 |
| `getResultSet()` | ✅ | 获取结果集 |
| `getUpdateCount()` | ✅ | 获取更新计数 |
| `close()` | ✅ | 关闭语句 |

### PreparedStatement 接口

| 方法 | 支持 | 说明 |
|------|------|------|
| `setXxx(int, xxx)` | ✅ | 设置参数 |
| `executeQuery()` | ✅ | 执行查询 |
| `executeUpdate()` | ✅ | 执行更新 |
| `execute()` | ✅ | 执行语句 |
| `getParameterMetaData()` | ✅ | 获取参数元数据 |

### ResultSet 接口

| 方法 | 支持 | 说明 |
|------|------|------|
| `next()` | ✅ | 移动到下一行 |
| `getXxx(String)` | ✅ | 按列名获取值 |
| `getXxx(int)` | ✅ | 按列索引获取值 |
| `findColumn(String)` | ✅ | 查找列索引 |
| `getMetaData()` | ✅ | 获取结果集元数据 |
| `close()` | ✅ | 关闭结果集 |

### DatabaseMetaData 接口

| 方法 | 支持 | 说明 |
|------|------|------|
| `getTables()` | ✅ | 获取表列表 |
| `getColumns()` | ✅ | 获取列信息 |
| `getIndexInfo()` | ✅ | 获取索引信息 |
| `getPrimaryKeys()` | ✅ | 获取主键信息 |
| `getDatabaseProductName()` | ✅ | 获取数据库名称 |
| `getDatabaseProductVersion()` | ✅ | 获取数据库版本 |

## 使用示例

### 基本查询

```java
import java.sql.*;

public class BasicQuery {
    public static void main(String[] args) throws SQLException {
        // 建立连接
        Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.json");

        // 创建 Statement
        Statement stmt = conn.createStatement();

        // 执行查询
        ResultSet rs = stmt.executeQuery("SELECT * FROM users");

        // 处理结果
        while (rs.next()) {
            Long id = rs.getLong("id");
            String username = rs.getString("username");
            String email = rs.getString("email");
            System.out.println(id + ": " + username + " (" + email + ")");
        }

        // 关闭资源
        rs.close();
        stmt.close();
        conn.close();
    }
}
```

### PreparedStatement

```java
import java.sql.*;

public class PreparedStatementExample {
    public static void main(String[] args) throws SQLException {
        Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.json");

        // 使用 PreparedStatement
        String sql = "SELECT * FROM users WHERE username = ? AND status = ?";
        PreparedStatement pstmt = conn.prepareStatement(sql);

        pstmt.setString(1, "admin");
        pstmt.setString(2, "active");

        ResultSet rs = pstmt.executeQuery();

        while (rs.next()) {
            System.out.println("User: " + rs.getString("username"));
        }

        rs.close();
        pstmt.close();
        conn.close();
    }
}
```

### 事务处理

```java
import java.sql.*;

public class TransactionExample {
    public static void main(String[] args) throws SQLException {
        Connection conn = DriverManager.getConnection(
            "jdbc:justdb:./schema.json?autocommit=false"
        );

        try {
            // 关闭自动提交
            conn.setAutoCommit(false);

            // 执行多个操作
            Statement stmt = conn.createStatement();

            stmt.executeUpdate("INSERT INTO users (username, email) VALUES ('user1', 'user1@example.com')");
            stmt.executeUpdate("INSERT INTO users (username, email) VALUES ('user2', 'user2@example.com')");

            // 提交事务
            conn.commit();

            stmt.close();
        } catch (SQLException e) {
            // 回滚事务
            conn.rollback();
            throw e;
        } finally {
            conn.close();
        }
    }
}
```

### 批量操作

```java
import java.sql.*;

public class BatchExample {
    public static void main(String[] args) throws SQLException {
        Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.json");

        Statement stmt = conn.createStatement();

        // 添加批处理
        stmt.addBatch("INSERT INTO users (username, email) VALUES ('user1', 'user1@example.com')");
        stmt.addBatch("INSERT INTO users (username, email) VALUES ('user2', 'user2@example.com')");
        stmt.addBatch("INSERT INTO users (username, email) VALUES ('user3', 'user3@example.com')");

        // 执行批处理
        int[] counts = stmt.executeBatch();

        System.out.println("Affected rows: " + Arrays.toString(counts));

        stmt.close();
        conn.close();
    }
}
```

### 元数据查询

```java
import java.sql.*;

public class MetadataExample {
    public static void main(String[] args) throws SQLException {
        Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.json");

        DatabaseMetaData metaData = conn.getMetaData();

        // 获取表信息
        ResultSet tables = metaData.getTables(null, null, "%", new String[]{"TABLE"});
        while (tables.next()) {
            String tableName = tables.getString("TABLE_NAME");
            System.out.println("Table: " + tableName);
        }

        // 获取列信息
        ResultSet columns = metaData.getColumns(null, null, "users", "%");
        while (columns.next()) {
            String columnName = columns.getString("COLUMN_NAME");
            String columnType = columns.getString("TYPE_NAME");
            int columnSize = columns.getInt("COLUMN_SIZE");
            System.out.println("Column: " + columnName + " " + columnType + "(" + columnSize + ")");
        }

        conn.close();
    }
}
```

## 迁移模式

JustDB JDBC 驱动支持自动 Schema 迁移，通过 `migrate` 参数指定目标 Schema。

**迁移流程**:

1. 加载当前 Schema
2. 加载目标 Schema
3. 计算差异
4. 生成迁移 SQL
5. 执行迁移
6. 更新到目标 Schema

**连接字符串示例**:

```java
String url = "jdbc:justdb:./current-schema.json?migrate=./target-schema.json";
Connection conn = DriverManager.getConnection(url);
```

**完整示例**:

```java
import java.sql.*;

public class MigrationExample {
    public static void main(String[] args) throws SQLException {
        // 创建包含迁移的连接
        String url = "jdbc:justdb:./v1/schema.json?migrate=./v2/schema.json";
        Connection conn = DriverManager.getConnection(url);

        // 迁移自动完成，可以使用新的 Schema 结构
        Statement stmt = conn.createStatement();

        // 使用 v2 中新增的列
        ResultSet rs = stmt.executeQuery("SELECT id, username, email, new_column FROM users");

        while (rs.next()) {
            System.out.println(rs.getString("username"));
        }

        conn.close();
    }
}
```

## Schema 注册表

Schema 注册表允许在内存中注册 Schema，然后通过 JDBC URL 引用。

### 注册 Schema

```java
import ai.justdb.justdb.jdbc.JustdbDriver;
import ai.justdb.justdb.schema.Justdb;
import ai.justdb.justdb.schema.Table;
import ai.justdb.justdb.schema.Column;
import java.sql.*;

public class RegistryExample {
    public static void main(String[] args) throws SQLException {
        // 创建内存 Schema
        Justdb justdb = new Justdb();
        justdb.setId("in-memory-users");

        Table usersTable = new Table("users");
        Column idColumn = new Column();
        idColumn.setName("id");
        idColumn.setType("BIGINT");
        idColumn.setPrimaryKey(true);

        Column nameColumn = new Column();
        nameColumn.setName("username");
        nameColumn.setType("VARCHAR(50)");

        usersTable.setColumns(Arrays.asList(idColumn, nameColumn));
        justdb.setTables(Arrays.asList(usersTable));

        // 注册 Schema
        JustdbDriver.registerSchema("my-schema", justdb);

        // 使用注册的 Schema
        Connection conn = DriverManager.getConnection("jdbc:justdb:registry:my-schema");

        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT * FROM users");

        while (rs.next()) {
            System.out.println(rs.getString("username"));
        }

        conn.close();

        // 注销 Schema（可选）
        JustdbDriver.unregisterSchema("my-schema");
    }
}
```

### Schema 注册表 API

| 方法 | 描述 |
|------|------|
| `registerSchema(String id, Justdb schema)` | 注册 Schema |
| `unregisterSchema(String id)` | 注销 Schema |
| `getRegisteredSchema(String id)` | 获取注册的 Schema |
| `isSchemaRegistered(String id)` | 检查 Schema 是否已注册 |
| `getRegisteredSchemaIds()` | 获取所有注册的 Schema ID |
| `clearRegistry()` | 清空注册表 |

## 限制说明

### JDBC 兼容性

JustDB JDBC 驱动**不是完全 JDBC 兼容**的。以下限制需要注意：

1. **事务支持**: 仅支持基础的事务管理，不支持高级特性如 savepoint
2. **存储过程**: 不支持 `prepareCall()` 和存储过程调用
3. **结果集类型**: 仅支持 `TYPE_FORWARD_ONLY` 结果集
4. **并发控制**: 不支持并发修改和行级锁
5. **SQL 语法**: 支持 JustDB 支持的 SQL 语法子集

### 性能考虑

1. **内存使用**: 数据加载到内存中，不适合大数据量场景
2. **并发**: 多线程访问需要外部同步
3. **持久化**: 数据变更需要手动触发保存

### 功能限制

1. **数据库函数**: 支持有限的 SQL 函数集
2. **连接池**: 不支持连接池
3. **分布式事务**: 不支持 XA 事务

## 最佳实践

### 1. 资源管理

```java
try (Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.json");
     Statement stmt = conn.createStatement();
     ResultSet rs = stmt.executeQuery("SELECT * FROM users")) {

    while (rs.next()) {
        // 处理结果
    }
} // 自动关闭资源
```

### 2. 错误处理

```java
try (Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.json")) {
    conn.setAutoCommit(false);

    try (Statement stmt = conn.createStatement()) {
        // 执行操作
        stmt.executeUpdate("INSERT INTO users ...");

        conn.commit();
    } catch (SQLException e) {
        conn.rollback();
        throw e;
    }
}
```

### 3. Schema 管理

```java
// 使用 try-with-resources 确保资源释放
try (Connection conn = DriverManager.getConnection("jdbc:justdb:./schema.json")) {
    // 使用连接
}
```

## 相关文档

- [Java API 参考](./java-api.md) - 核心 Java API
- [Schema 加载器](./schema-loader.md) - Schema 加载详解
- [Schema 部署器](./schema-deployer.md) - Schema 部署详解
- [Schema 差异计算](./schema-diff.md) - Schema 差异计算详解
