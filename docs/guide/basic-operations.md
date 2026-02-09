---
icon: list-check
title: 基本操作
order: 6
category:
  - 指南
  - 操作
tag:
  - 操作
  - CRUD
  - SQL
---

# 基本操作

JustDB 提供了一套完整的数据库操作 API，让你能够轻松执行常见的数据库操作。

## CRUD 操作

### 创建（Create）

使用 JDBC 驱动执行插入操作：

```java
try (Connection conn = DriverManager.getConnection(
        "jdbc:justdb:schema.yaml",
        null,
        null);
     Statement stmt = conn.createStatement()) {

    // 执行插入
    int rows = stmt.executeUpdate(
        "INSERT INTO users (username, email) VALUES ('alice', 'alice@example.com')"
    );

    System.out.println("插入行数: " + rows);
}
```

使用参数化查询：

```java
String sql = "INSERT INTO users (username, email) VALUES (?, ?)";

try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
    pstmt.setString(1, "bob");
    pstmt.setString(2, "bob@example.com");

    int rows = pstmt.executeUpdate();
    System.out.println("插入行数: " + rows);
}
```

### 读取（Read）

查询单个用户：

```java
try (Statement stmt = conn.createStatement();
     ResultSet rs = stmt.executeQuery("SELECT * FROM users WHERE id = 1")) {

    if (rs.next()) {
        long id = rs.getLong("id");
        String username = rs.getString("username");
        String email = rs.getString("email");

        System.out.println("用户: " + username + ", 邮箱: " + email);
    }
}
```

查询所有用户：

```java
try (Statement stmt = conn.createStatement();
     ResultSet rs = stmt.executeQuery("SELECT * FROM users")) {

    while (rs.next()) {
        String username = rs.getString("username");
        System.out.println("用户: " + username);
    }
}
```

### 更新（Update）

```java
try (Statement stmt = conn.createStatement()) {
    int rows = stmt.executeUpdate(
        "UPDATE users SET email = 'newemail@example.com' WHERE username = 'alice'"
    );
    System.out.println("更新行数: " + rows);
}
```

### 删除（Delete）

```java
try (Statement stmt = conn.createStatement()) {
    int rows = stmt.executeUpdate(
        "DELETE FROM users WHERE username = 'bob'"
    );
    System.out.println("删除行数: " + rows);
}
```

## 批量操作

### 批量插入

```java
conn.setAutoCommit(false);

try (PreparedStatement pstmt = conn.prepareStatement(
        "INSERT INTO users (username, email) VALUES (?, ?)")) {

    for (int i = 0; i < 1000; i++) {
        pstmt.setString(1, "user" + i);
        pstmt.setString(2, "user" + i + "@example.com");
        pstmt.addBatch();

        if (i % 100 == 0) {
            pstmt.executeBatch();
        }
    }

    pstmt.executeBatch();
    conn.commit();
} catch (Exception e) {
    conn.rollback();
    throw e;
}
```

### 批量更新

```java
conn.setAutoCommit(false);

try (PreparedStatement pstmt = conn.prepareStatement(
        "UPDATE users SET email = ? WHERE id = ?")) {

    for (User user : usersToUpdate) {
        pstmt.setString(1, user.getEmail());
        pstmt.setLong(2, user.getId());
        pstmt.addBatch();
    }

    int[] results = pstmt.executeBatch();
    conn.commit();
}
```

## 事务处理

### 基本事务

```java
conn.setAutoCommit(false);

try {
    // 执行多个操作
    stmt.executeUpdate("INSERT INTO orders (user_id, amount) VALUES (1, 100)");
    stmt.executeUpdate("UPDATE users SET balance = balance - 100 WHERE id = 1");

    // 提交事务
    conn.commit();
} catch (SQLException e) {
    // 回滚事务
    conn.rollback();
    throw e;
}
```

### 保存点（Savepoint）

```java
Savepoint savepoint = null;

try {
    conn.setAutoCommit(false);

    stmt.executeUpdate("INSERT INTO orders ...");
    savepoint = conn.setSavepoint("after_order");

    stmt.executeUpdate("UPDATE inventory ...");

    conn.commit();
} catch (SQLException e) {
    if (savepoint != null) {
        conn.rollback(savepoint);
        // 可以从保存点继续执行
    } else {
        conn.rollback();
    }
}
```

## 连接管理

### 使用连接池

```java
// HikariCP 配置
HikariConfig config = new HikariConfig();
config.setJdbcUrl("jdbc:justdb:schema.yaml");
config.setMaximumPoolSize(10);

HikariDataSource dataSource = new HikariDataSource(config);

try (Connection conn = dataSource.getConnection()) {
    // 执行操作
}
```

### 连接属性

```java
// 设置连接属性
Properties props = new Properties();
props.setProperty("user", "username");
props.setProperty("password", "password");
props.setProperty("schema", "myapp");

try (Connection conn = DriverManager.getConnection(
        "jdbc:justdb:schema.yaml",
        props)) {
    // 执行操作
}
```

## 元数据查询

### 获取表信息

```java
DatabaseMetaData meta = conn.getMetaData();

// 获取所有表
try (ResultSet rs = meta.getTables(null, null, "%", new String[]{"TABLE"})) {
    while (rs.next()) {
        String tableName = rs.getString("TABLE_NAME");
        System.out.println("表: " + tableName);
    }
}
```

### 获取列信息

```java
try (ResultSet rs = meta.getColumns(null, null, "users", null)) {
    while (rs.next()) {
        String columnName = rs.getString("COLUMN_NAME");
        String columnType = rs.getString("TYPE_NAME");
        int columnSize = rs.getInt("COLUMN_SIZE");

        System.out.println("列: " + columnName + ", 类型: " + columnType);
    }
}
```

### 获取主键信息

```java
try (ResultSet rs = meta.getPrimaryKeys(null, null, "users")) {
    while (rs.next()) {
        String pkName = rs.getString("PK_NAME");
        String columnName = rs.getString("COLUMN_NAME");
        System.out.println("主键: " + columnName);
    }
}
```

## 错误处理

### 处理 SQL 异常

```java
try {
    stmt.executeUpdate("INSERT INTO users ...");
} catch (SQLException e) {
    // 获取错误信息
    String message = e.getMessage();
    int errorCode = e.getErrorCode();
    String sqlState = e.getSQLState();

    System.err.println("SQL 错误: " + message);
    System.err.println("错误代码: " + errorCode);
    System.err.println("SQL 状态: " + sqlState);

    // 处理特定错误
    if (errorCode == 1062) {
        System.err.println("违反唯一约束");
    } else if (errorCode == 1452) {
        System.err.println("违反外键约束");
    }

    throw e;
}
```

### 重试机制

```java
int maxRetries = 3;
int attempt = 0;
boolean success = false;

while (!success && attempt < maxRetries) {
    try {
        stmt.executeUpdate("INSERT INTO users ...");
        success = true;
    } catch (SQLException e) {
        attempt++;
        if (attempt >= maxRetries) {
            throw e;
        }
        // 等待后重试
        Thread.sleep(1000 * attempt);
    }
}
```

## 性能优化

### 使用索引

```sql
-- 确保 WHERE 子句中的列有索引
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_email ON users(email);
```

### 查询优化

```java
// 只选择需要的列
String sql = "SELECT id, username FROM users WHERE status = ?";

// 使用 LIMIT 限制结果
String sql = "SELECT * FROM users LIMIT 100";

// 避免使用 SELECT *
String sql = "SELECT id, username, email FROM users";
```

## 下一步

<VPCard
  title="Schema 演进"
  desc="学习如何管理 Schema 的变化"
  link="/guide/schema-evolution.html"
/>

<VPCard
  title="迁移策略"
  desc="了解数据库迁移的最佳实践"
  link="/guide/migration-strategies.html"
/>

<VPCard
  title="性能优化"
  desc="优化数据库性能"
  link="/guide/performance.html"
/>
