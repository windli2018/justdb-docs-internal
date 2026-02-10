---
date: 2025-02-11
icon: database
title: JDBC 驱动使用指南
order: 6
category:
  - 快速开始
  - 入门
  - JDBC
tag:
  - 入门
  - JDBC
  - 数据库驱动
---

# JDBC 驱动使用指南

JustDB 提供了完整的 JDBC 驱动实现，支持标准的 JDBC API。你可以像使用其他数据库（MySQL、PostgreSQL）一样使用 JustDB。

## 环境准备

::: tip 环境要求
- **Java**: JDK 1.8 或更高版本
- **依赖**: justdb-core JAR 包
:::

### 添加依赖

#### Maven

```xml
<dependency>
    <groupId>ai.justdb</groupId>
    <artifactId>justdb-core</artifactId>
    <version>1.0.0</version>
</dependency>
```

#### Gradle

```groovy
implementation 'ai.justdb:justdb-core:1.0.0'
```

## JDBC URL 格式

### 基本格式

```
jdbc:justdb:schema-file-path[?parameter=value&...]
```

### URL 示例

```bash
# 文件 schema
jdbc:justdb:/path/to/schema.json

# 带输出文件的 schema（自动保存）
jdbc:justdb:/path/to/schema.json?outputFile=/path/to/output.json

# 带迁移的 schema
jdbc:justdb:/path/to/schema.json?migrate=/path/to/migrate.json

# 同时使用输出文件和迁移
jdbc:justdb:/path/to/schema.json?outputFile=/path/to/output.json&migrate=/path/to/migrate.json

# 内存空 schema
jdbc:justdb:memory:

# 内存加载 schema 文件
jdbc:justdb:memory:/path/to/schema.json

# 注册表（预注册的 schema）
jdbc:justdb:registry:mySchemaId
```

## 连接参数

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| `outputFile` | String | 输出文件路径，用于连接关闭时自动保存 |
| `overwriteFile` | String | outputFile 的别名 |
| `migrate` | String | 迁移 schema 文件路径 |
| `create` | Boolean | 如果文件不存在则创建（默认：false） |
| `default` | String | 默认 schema 名称（仅多 schema 模式） |
| `autoScan` | Boolean | 自动扫描目录中的 schema 文件（多 schema 目录模式） |
| `dialect` | String | SQL 方言用于函数解析（mysql, postgresql, oracle） |

## 输出文件合并功能

### 概述

当指定 `outputFile` 参数时，JDBC 驱动会在创建连接之前自动将输出文件与原始 schema 合并。这样可以保留用户通过 SQL 命令所做的更改（存储在输出文件中），防止在迁移操作中丢失数据。

### 合并流程

```
1. 加载原始 schema（来自 schema 文件）
2. 加载输出文件（如果存在）
3. 将输出文件合并到原始 schema
4. 使用合并后的 schema 创建连接
5. （可选）对合并后的 schema 应用迁移操作
```

### Schema 合并行为

- **表（Tables）**: 输出文件中的表如果不存在于原始 schema，则会被添加
- **列（Columns）**: 输出文件中的列如果不存在于表中，则会被添加
- **视图（Views）**: 输出文件中的视图如果不存在于原始 schema，则会被添加
- **数据（Data）**: 输出文件中的数据会与现有数据合并
- **数据库（Databases）**: 输出文件中的数据库定义如果不存在，则会被添加

### 特殊情况

1. **与 schema 文件相同**: 如果 `outputFile` 与 schema 文件相同，则跳过合并
2. **输出文件不存在**: 连接成功继续（首次运行场景）
3. **合并失败**: 记录警告日志，连接使用原始 schema 继续

### 使用示例

#### 示例 1：基本输出文件合并

```java
// 原始 schema: schema.json 包含 table1
// 输出文件: output.json 包含 table2（用户通过 SQL 创建）
String url = "jdbc:justdb:/path/to/schema.json?outputFile=/path/to/output.json";

try (Connection conn = DriverManager.getConnection(url)) {
    // 合并后的 schema 包含：table1（来自原始）+ table2（来自输出）
    // 用户通过 SQL 所做的更改被保留
}
```

#### 示例 2：输出文件合并与迁移

```java
// 原始 schema: schema.json 包含 table1 和列（id, name）
// 输出文件: output.json 包含 table1 和额外列（email）- 用户通过 SQL 添加
// 迁移 schema: migrate.json 包含 table1 和额外列（status）- schema 演进
String url = "jdbc:justdb:/path/to/schema.json" +
             "?outputFile=/path/to/output.json" +
             "&migrate=/path/to/migrate.json";

try (Connection conn = DriverManager.getConnection(url)) {
    // 流程：
    // 1. 加载 schema.json (table1: id, name)
    // 2. 合并 output.json (table1: id, name, email)
    // 3. 应用 migrate.json (table1: id, name, email, status)
    // 结果：table1 包含所有列（id, name, email, status）
}
```

#### 示例 3：关闭时自动保存

```java
String url = "jdbc:justdb:/path/to/schema.json?outputFile=/path/to/output.json";

try (Connection conn = DriverManager.getConnection(url)) {
    Statement stmt = conn.createStatement();

    // 用户通过 SQL 创建新表
    stmt.execute("CREATE TABLE user_settings (id BIGINT PRIMARY KEY, theme VARCHAR(50))");

    // 插入数据
    stmt.execute("INSERT INTO user_settings (id, theme) VALUES (1, 'dark')");

} // 连接关闭触发自动保存到 output.json
// output.json 现在包含 user_settings 表和数据
```

### 连接属性方式

你也可以使用连接属性指定输出文件：

```java
Properties props = new Properties();
props.setProperty("justdb.outputFile", "/path/to/output.json");

try (Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.json", props)) {
    // 带输出文件合并的连接
}
```

## 迁移与输出文件

### 目的

输出文件合并功能旨在与迁移操作无缝协作：

1. **保留用户更改**: 通过 SQL 添加的表/列保存在输出文件中
2. **Schema 演进**: 迁移操作应用来自迁移 schema 的 schema 更改
3. **无数据丢失**: 用户更改在迁移前被合并，然后迁移添加其更改

### 完整流程

```
┌─────────────────┐
│  原始 Schema    │  (基础 schema 定义)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  输出文件        │  (用户通过 SQL 的更改 - 如果存在则合并)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  合并的 Schema  │  (原始 + 输出文件)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  迁移 Schema    │  (应用演化更改)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  最终 Schema    │  (保留的用户更改 + schema 演进)
└─────────────────┘
```

### 最佳实践

1. **分离输出文件**: 使用与原始 schema 不同的文件作为输出
2. **版本控制**: 将原始 schema 提交到版本控制，保留输出文件用于运行时更改
3. **迁移前备份**: 输出文件保留用户更改，但在主要迁移前仍建议备份
4. **测试迁移**: 在应用到生产环境之前，在开发环境中测试迁移操作

## 基本用法

### 创建连接

```java
// 基本连接
try (Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.json")) {
    // 使用连接
}

// 带输出文件的连接
try (Connection conn = DriverManager.getConnection(
        "jdbc:justdb:/path/to/schema.json?outputFile=/path/to/output.json")) {
    // 使用连接
}

// 使用 Properties
Properties props = new Properties();
props.setProperty("user", "username");
props.setProperty("password", "password");

try (Connection conn = DriverManager.getConnection(
        "jdbc:justdb:/path/to/schema.json", props)) {
    // 使用连接
}
```

### 执行 SQL

```java
try (Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.json");
     Statement stmt = conn.createStatement()) {

    // 创建表
    stmt.execute("CREATE TABLE users (id BIGINT PRIMARY KEY, name VARCHAR(255))");

    // 插入数据
    stmt.execute("INSERT INTO users (id, name) VALUES (1, 'John Doe')");

    // 查询数据
    try (ResultSet rs = stmt.executeQuery("SELECT * FROM users")) {
        while (rs.next()) {
            long id = rs.getLong("id");
            String name = rs.getString("name");
            System.out.println("User: " + id + " - " + name);
        }
    }
}
```

### 使用 PreparedStatement

```java
try (Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.json");
     PreparedStatement pstmt = conn.prepareStatement(
             "INSERT INTO users (id, name, email) VALUES (?, ?, ?)")) {

    pstmt.setLong(1, 1);
    pstmt.setString(2, "John Doe");
    pstmt.setString(3, "john@example.com");
    pstmt.executeUpdate();
}
```

### 批量操作

```java
try (Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.json");
     Statement stmt = conn.createStatement()) {

    // 添加批量语句
    stmt.addBatch("CREATE TABLE users (id BIGINT PRIMARY KEY, name VARCHAR(255))");
    stmt.addBatch("CREATE INDEX idx_users_id ON users(id)");
    stmt.addBatch("INSERT INTO users (id, name) VALUES (1, 'John Doe')");

    // 执行批量
    int[] results = stmt.executeBatch();
}
```

### 事务管理

```java
try (Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.json")) {

    // 禁用自动提交
    conn.setAutoCommit(false);

    try {
        Statement stmt = conn.createStatement();

        stmt.execute("INSERT INTO users (id, name) VALUES (1, 'John Doe')");
        stmt.execute("INSERT INTO user_settings (id, theme) VALUES (1, 'dark')");

        // 提交事务
        conn.commit();

    } catch (SQLException e) {
        // 回滚事务
        conn.rollback();
        throw e;
    }
}
```

## DatabaseMetaData

JustDB JDBC 驱动支持 DatabaseMetaData，可以获取数据库信息：

```java
try (Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.json")) {
    DatabaseMetaData meta = conn.getMetaData();

    // 获取表信息
    try (ResultSet tables = meta.getTables(null, null, "%", new String[]{"TABLE"})) {
        while (tables.next()) {
            String tableName = tables.getString("TABLE_NAME");
            System.out.println("Table: " + tableName);
        }
    }

    // 获取列信息
    try (ResultSet columns = meta.getColumns(null, null, "users", "%")) {
        while (columns.next()) {
            String columnName = columns.getString("COLUMN_NAME");
            String columnType = columns.getString("TYPE_NAME");
            System.out.println("Column: " + columnName + " - " + columnType);
        }
    }
}
```

## 自动保存行为

输出文件在以下场景中自动保存：

1. **数据修改后**（自动提交模式）
2. **提交后**（当自动提交被禁用时）
3. **连接关闭时**（同步保存以确保所有数据被持久化）

### 禁用自动保存

要禁用自动保存，只需不指定 `outputFile` 参数：

```java
// 无自动保存 - 连接关闭时更改丢失
try (Connection conn = DriverManager.getConnection("jdbc:justdb:/path/to/schema.json")) {
    // 更改不会被保存
}
```

## Schema 注册表

对于无需文件 I/O 的内存 schema，使用 schema 注册表：

```java
// 注册 schema
import ai.justdb.justdb.jdbc.JustdbDriver;
import ai.justdb.justdb.schema.Justdb;

Justdb schema = loadYourSchema();
JustdbDriver.registerSchema("mySchema", schema);

// 使用注册的 schema 连接
try (Connection conn = DriverManager.getConnection("jdbc:justdb:registry:mySchema")) {
    // 使用连接
}
```

## 完整示例

### 示例 1：基本的 CRUD 操作

```java
import java.sql.*;

public class JustDBExample {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:justdb:/path/to/schema.json";

        try (Connection conn = DriverManager.getConnection(url)) {
            // 创建表
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("""
                    CREATE TABLE products (
                        id BIGINT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        price DECIMAL(10, 2),
                        stock INT DEFAULT 0
                    )
                """);
            }

            // 插入数据
            try (PreparedStatement pstmt = conn.prepareStatement(
                    "INSERT INTO products (id, name, price, stock) VALUES (?, ?, ?, ?)")) {
                pstmt.setLong(1, 1);
                pstmt.setString(2, "Laptop");
                pstmt.setBigDecimal(3, new BigDecimal("999.99"));
                pstmt.setInt(4, 50);
                pstmt.executeUpdate();
            }

            // 查询数据
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT * FROM products")) {
                while (rs.next()) {
                    System.out.println("Product: " + rs.getString("name") +
                                     ", Price: $" + rs.getBigDecimal("price"));
                }
            }

            // 更新数据
            try (PreparedStatement pstmt = conn.prepareStatement(
                    "UPDATE products SET stock = ? WHERE id = ?")) {
                pstmt.setInt(1, 45);
                pstmt.setLong(2, 1);
                int updated = pstmt.executeUpdate();
                System.out.println("Updated " + updated + " rows");
            }

            // 删除数据
            try (PreparedStatement pstmt = conn.prepareStatement(
                    "DELETE FROM products WHERE id = ?")) {
                pstmt.setLong(1, 1);
                int deleted = pstmt.executeUpdate();
                System.out.println("Deleted " + deleted + " rows");
            }
        }
    }
}
```

### 示例 2：使用输出文件保留用户更改

```java
import java.sql.*;

public class JustDBOutputFileExample {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:justdb:/path/to/schema.json?outputFile=/path/to/output.json";

        try (Connection conn = DriverManager.getConnection(url)) {
            Statement stmt = conn.createStatement();

            // 用户通过 SQL 添加新表
            stmt.execute("""
                CREATE TABLE user_preferences (
                    user_id BIGINT PRIMARY KEY,
                    theme VARCHAR(50) DEFAULT 'light',
                    language VARCHAR(10) DEFAULT 'zh',
                    notifications_enabled BOOLEAN DEFAULT true
                )
            """);

            // 插入初始偏好设置
            stmt.execute("""
                INSERT INTO user_preferences (user_id, theme, language, notifications_enabled)
                VALUES (1, 'dark', 'en', true)
            """);

        } // 连接关闭时自动保存到 output.json
          // output.json 现在包含 user_preferences 表和数据

        // 下次连接时，user_preferences 表会被自动加载
        try (Connection conn = DriverManager.getConnection(url)) {
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT * FROM user_preferences");

            while (rs.next()) {
                System.out.println("User " + rs.getLong("user_id") +
                                 " prefers " + rs.getString("theme") + " theme");
            }
        }
    }
}
```

### 示例 3：带迁移的 Schema 演进

```java
import java.sql.*;

public class JustDBMigrationExample {
    public static void main(String[] args) throws Exception {
        // 场景：
        // 1. schema.json 定义基础 users 表（id, name）
        // 2. output.json 包含用户添加的 email 列
        // 3. migrate-v2.json 添加新的 status 列

        String url = "jdbc:justdb:/path/to/schema.json" +
                     "?outputFile=/path/to/output.json" +
                     "&migrate=/path/to/migrate-v2.json";

        try (Connection conn = DriverManager.getConnection(url)) {
            // 查询最终的表结构
            DatabaseMetaData meta = conn.getMetaData();
            ResultSet columns = meta.getColumns(null, null, "users", null);

            System.out.println("Final users table structure:");
            while (columns.next()) {
                System.out.println("  - " + columns.getString("COLUMN_NAME") +
                                 ": " + columns.getString("TYPE_NAME"));
            }
            // 输出：
            // Final users table structure:
            //   - id: BIGINT
            //   - name: VARCHAR
            //   - email: VARCHAR  (来自输出文件)
            //   - status: VARCHAR  (来自迁移)
        }
    }
}
```

## 高级用法

### 多 Schema 支持

```java
// 多 schema URL 格式
String url = "jdbc:justdb:schema1=/path1,schema2=/path2?default=schema1";

try (Connection conn = DriverManager.getConnection(url)) {
    // 使用默认 schema
    // 可以切换到其他 schema
}
```

### 目录扫描

```java
// 自动扫描目录中的所有 schema 文件
String url = "jdbc:justdb:directory:/path/to/schemas?autoScan=true&default=main";

try (Connection conn = DriverManager.getConnection(url)) {
    // 自动加载目录中的所有 schema 文件
}
```

## 常见问题

### Q: 如何查看 JustDB 的日志？

A: JustDB 使用 SLF4J 进行日志记录。配置你的日志框架（如 Logback 或 Log4j2）来显示 `ai.justdb.justdb.jdbc` 包的日志。

```xml
<!-- logback.xml -->
<logger name="ai.justdb.justdb.jdbc" level="DEBUG"/>
```

### Q: 输出文件会覆盖原始 schema 吗？

A: 不会。原始 schema 文件保持不变。输出文件是一个单独的文件，用于保存运行时更改。

### Q: 如何在 Spring Boot 中使用 JustDB JDBC？

A: 参见 [Spring Boot 集成指南](./spring-boot-integration.html)。

### Q: JustDB 支持哪些 SQL 功能？

A: JustDB 支持标准的 SQL DDL 和 DML 操作，包括 CREATE、ALTER、DROP、INSERT、UPDATE、DELETE、SELECT 等。具体支持的功能请参考文档。

## 下一步

<VPCard
  title="Spring Boot 集成"
  desc="在 Spring Boot 项目中使用 JustDB"
  link="/getting-started/spring-boot-integration.html"
/>

<VPCard
  title="迁移基础"
  desc="了解 Schema 迁移的详细机制"
  link="/getting-started/migration-basics.html"
/>

<VPCard
  title="常见任务"
  desc="查看常见的数据库操作示例"
  link="/getting-started/common-tasks.html"
/>
