---
icon: database
title: 数据库适配器开发
order: 2
category:
  - 插件开发
  - 开发指南
tag:
  - 数据库适配器
  - JDBC
  - 插件
---

# 数据库适配器开发

数据库适配器 (DatabaseAdapter) 是插件的核心组件，负责定义数据库的连接方式、类型映射和 SQL 特性。

## DatabaseAdapter 结构

```java
public class DatabaseAdapter {
    private String dbType;           // 数据库类型标识
    private String name;             // 数据库名称
    private String driverClass;      // JDBC 驱动类
    private List<UrlPattern&gt;> urlPatterns;  // URL 匹配模式
    private List<TypeMapping&gt;> typeMappings; // 类型映射
    private List<SqlFeature&gt;> features;      // SQL 特性
}
```

## 基本配置

### 定义适配器

```xml
<adapters>
    <DatabaseAdapter dbType="mydb" name="My Database">
        <!-- JDBC 驱动 -->
        <driverClass>com.example.jdbc.Driver</driverClass>

        <!-- URL 模式 -->
        <urlPatterns>
            <UrlPattern>jdbc:mydb://*</urlPatterns>
            <UrlPattern>jdbc:mydb:thin://*</urlPatterns>
        </urlPatterns>

        <!-- 类型映射 -->
        <typeMappings>
            <TypeMapping logicalType="INTEGER" physicalType="INTEGER" jdbcType="INTEGER"/>
            <TypeMapping logicalType="VARCHAR" physicalType="VARCHAR" jdbcType="VARCHAR"/>
            <!-- ... -->
        </typeMappings>

        <!-- SQL 特性 -->
        <features>
            <SqlFeature name="IDENTIFIER_QUOTE" value="`"/>
            <SqlFeature name="SUPPORTS_IF_NOT_EXISTS" value="true"/>
        </features>
    </DatabaseAdapter>
</adapters>
```

### URL 模式

URL 模式用于自动识别数据库类型：

| 模式 | 说明 | 示例 |
|------|------|------|
| `jdbc:mysql://*` | MySQL | `jdbc:mysql://localhost:3306/db` |
| `jdbc:postgresql://*` | PostgreSQL | `jdbc:postgresql://localhost/db` |
| `jdbc:h2:*` | H2 | `jdbc:h2:mem:testdb` |

### 编程方式定义

```java
DatabaseAdapter adapter = new DatabaseAdapter();
adapter.setDbType("mydb");
adapter.setName("My Database");
adapter.setDriverClass("com.example.jdbc.Driver");

// URL 模式
List<UrlPattern&gt;> patterns = new ArrayList<>();
patterns.add(new UrlPattern("jdbc:mydb://*"));
patterns.add(new UrlPattern("jdbc:mydb:thin://*"));
adapter.setUrlPatterns(patterns);

// 类型映射
List<TypeMapping&gt;> mappings = new ArrayList<>();
mappings.add(new TypeMapping("INTEGER", "INTEGER", "INTEGER"));
mappings.add(new TypeMapping("VARCHAR", "VARCHAR", "VARCHAR"));
adapter.setTypeMappings(mappings);
```

## 类型映射

### 逻辑类型到物理类型

JustDB 使用逻辑类型抽象，适配器将其转换为数据库特定类型：

```xml
<typeMappings>
    <!-- 基本类型 -->
    <TypeMapping logicalType="INTEGER" physicalType="INT" jdbcType="INTEGER"/>
    <TypeMapping logicalType="BIGINT" physicalType="BIGINT" jdbcType="BIGINT"/>
    <TypeMapping logicalType="VARCHAR" physicalType="VARCHAR" jdbcType="VARCHAR"/>

    <!-- 带参数的类型 -->
    <TypeMapping logicalType="VARCHAR(%d)"
                  physicalType="VARCHAR(%d)"
                  jdbcType="VARCHAR"/>

    <!-- 类型族 -->
    <TypeMapping logicalType="TEXT"
                  physicalType="LONGTEXT"
                  jdbcType="LONGVARCHAR"/>
</typeMappings>
```

### 常用类型映射

| 逻辑类型 | MySQL | PostgreSQL | Oracle |
|----------|-------|------------|--------|
| INTEGER | INT | INTEGER | INTEGER |
| BIGINT | BIGINT | BIGINT | NUMBER(19) |
| VARCHAR | VARCHAR | VARCHAR | VARCHAR2 |
| TEXT | LONGTEXT | TEXT | CLOB |
| TIMESTAMP | TIMESTAMP | TIMESTAMP | TIMESTAMP |
| BOOLEAN | TINYINT(1) | BOOLEAN | NUMBER(1) |

## SQL 特性

### 支持的特性

```xml
<features>
    <!-- 标识符引号 -->
    <SqlFeature name="IDENTIFIER_QUOTE" value="`"/>

    <!-- IF NOT EXISTS 支持 -->
    <SqlFeature name="SUPPORTS_IF_NOT_EXISTS" value="true"/>

    <!-- CASCADE 支持 -->
    <SqlFeature name="SUPPORTS_CASCADE" value="true"/>

    <!-- AUTO_INCREMENT 语法 -->
    <SqlFeature name="AUTO_INCREMENT_KEYWORD" value="AUTO_INCREMENT"/>

    <!-- 外键约束 -->
    <SqlFeature name="SUPPORTS_FOREIGN_KEYS" value="true"/>
</features>
```

### 特性列表

| 特性 | 说明 | MySQL | PostgreSQL | Oracle |
|------|------|-------|------------|--------|
| IDENTIFIER_QUOTE | 标识符引号 | ` | " | " |
| SUPPORTS_IF_NOT_EXISTS | 支持 IF NOT EXISTS | true | true | false |
| SUPPORTS_CASCADE | 支持 CASCADE | true | true | true |
| AUTO_INCREMENT_KEYWORD | 自增关键字 | AUTO_INCREMENT | SERIAL | 不支持 |

## 方言特性

### 大小写敏感性

```xml
<DatabaseAdapter dbType="mysql">
    <caseSensitive>true</caseSensitive>
</DatabaseAdapter>
```

### 保留字

```xml
<DatabaseAdapter dbType="mysql">
    <reservedWords>
        <word>SELECT</word>
        <word>INSERT</word>
        <word>UPDATE</word>
        <!-- ... -->
    </reservedWords>
</DatabaseAdapter>
```

## 完整示例

### MySQL 适配器

```xml
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
    <adapters>
        <DatabaseAdapter dbType="mysql" name="MySQL">
            <driverClass>com.mysql.cj.jdbc.Driver</driverClass>
            <urlPatterns>
                <UrlPattern>jdbc:mysql://*</urlPatterns>
                <UrlPattern>jdbc:mysql:replication://*</urlPatterns>
            </urlPatterns>
            <typeMappings>
                <TypeMapping logicalType="INTEGER" physicalType="INT" jdbcType="INTEGER"/>
                <TypeMapping logicalType="BIGINT" physicalType="BIGINT" jdbcType="BIGINT"/>
                <TypeMapping logicalType="VARCHAR(%d)" physicalType="VARCHAR(%d)" jdbcType="VARCHAR"/>
                <TypeMapping logicalType="TEXT" physicalType="LONGTEXT" jdbcType="LONGVARCHAR"/>
                <TypeMapping logicalType="TIMESTAMP" physicalType="TIMESTAMP" jdbcType="TIMESTAMP"/>
            </typeMappings>
            <features>
                <SqlFeature name="IDENTIFIER_QUOTE" value="`"/>
                <SqlFeature name="SUPPORTS_IF_NOT_EXISTS" value="true"/>
                <SqlFeature name="AUTO_INCREMENT_KEYWORD" value="AUTO_INCREMENT"/>
            </features>
        </DatabaseAdapter>
    </adapters>
</plugin>
```

## 测试适配器

### 单元测试

```java
@Test
void testUrlPatternMatching() {
    DatabaseAdapter adapter = createAdapter();
    adapter.setUrlPatterns(Arrays.asList(
        new UrlPattern("jdbc:mysql://*")
    ));

    String url = "jdbc:mysql://localhost:3306/mydb";
    assertTrue(adapter.matches(url));
}

@Test
void testTypeMapping() {
    DatabaseAdapter adapter = createAdapter();
    adapter.setTypeMappings(Arrays.asList(
        new TypeMapping("INTEGER", "INT", "INTEGER")
    ));

    String physicalType = adapter.mapType("INTEGER");
    assertEquals("INT", physicalType);
}
```

### 集成测试

```java
@Testcontainers
class MySQLAdapterIntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0");

    @Test
    void testConnection() throws Exception {
        DatabaseAdapter adapter = getPluginManager()
            .getAdapter("jdbc:mysql://localhost:3306/test");

        try (Connection conn = DriverManager.getConnection(
                mysql.getJdbcUrl(),
                mysql.getUsername(),
                mysql.getPassword())) {

            assertNotNull(adapter);
            assertEquals("mysql", adapter.getDbType());
        }
    }
}
```

## 下一步

- [自定义模板](./custom-templates.md) - 创建 SQL 模板
- [扩展点开发](./extension-points.md) - 定义扩展属性
- [插件开发概述](./README.md) - 返回插件开发概述
