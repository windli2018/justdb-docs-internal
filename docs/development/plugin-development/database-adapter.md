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
    private List&lt;UrlPattern&gt; urlPatterns;  // URL 匹配模式
    private List&lt;TypeMapping&gt; typeMappings; // 类型映射
    private List&lt;SqlFeature&gt; features;      // SQL 特性
}
```

## 基本配置

### 定义适配器

```xml
&lt;adapters&gt;
    &lt;DatabaseAdapter dbType="mydb" name="My Database"&gt;
        &lt;!-- JDBC 驱动 --&gt;
        &lt;driverClass&gt;com.example.jdbc.Driver&lt;/driverClass&gt;

        &lt;!-- URL 模式 --&gt;
        &lt;urlPatterns&gt;
            &lt;UrlPattern&gt;jdbc:mydb://*&lt;/urlPatterns&gt;
            &lt;UrlPattern&gt;jdbc:mydb:thin://*&lt;/urlPatterns&gt;
        &lt;/urlPatterns&gt;

        &lt;!-- 类型映射 --&gt;
        &lt;typeMappings&gt;
            &lt;TypeMapping logicalType="INTEGER" physicalType="INTEGER" jdbcType="INTEGER"/&gt;
            &lt;TypeMapping logicalType="VARCHAR" physicalType="VARCHAR" jdbcType="VARCHAR"/&gt;
            &lt;!-- ... --&gt;
        &lt;/typeMappings&gt;

        &lt;!-- SQL 特性 --&gt;
        &lt;features&gt;
            &lt;SqlFeature name="IDENTIFIER_QUOTE" value="`"/&gt;
            &lt;SqlFeature name="SUPPORTS_IF_NOT_EXISTS" value="true"/&gt;
        &lt;/features&gt;
    &lt;/DatabaseAdapter&gt;
&lt;/adapters&gt;
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
List&lt;UrlPattern&gt; patterns = new ArrayList&lt;&gt;();
patterns.add(new UrlPattern("jdbc:mydb://*"));
patterns.add(new UrlPattern("jdbc:mydb:thin://*"));
adapter.setUrlPatterns(patterns);

// 类型映射
List&lt;TypeMapping&gt; mappings = new ArrayList&lt;&gt;();
mappings.add(new TypeMapping("INTEGER", "INTEGER", "INTEGER"));
mappings.add(new TypeMapping("VARCHAR", "VARCHAR", "VARCHAR"));
adapter.setTypeMappings(mappings);
```

## 类型映射

### 逻辑类型到物理类型

JustDB 使用逻辑类型抽象，适配器将其转换为数据库特定类型：

```xml
&lt;typeMappings&gt;
    &lt;!-- 基本类型 --&gt;
    &lt;TypeMapping logicalType="INTEGER" physicalType="INT" jdbcType="INTEGER"/&gt;
    &lt;TypeMapping logicalType="BIGINT" physicalType="BIGINT" jdbcType="BIGINT"/&gt;
    &lt;TypeMapping logicalType="VARCHAR" physicalType="VARCHAR" jdbcType="VARCHAR"/&gt;

    &lt;!-- 带参数的类型 --&gt;
    <TypeMapping logicalType="VARCHAR(%d)"
                  physicalType="VARCHAR(%d)"
                  jdbcType="VARCHAR"/>

    &lt;!-- 类型族 --&gt;
    <TypeMapping logicalType="TEXT"
                  physicalType="LONGTEXT"
                  jdbcType="LONGVARCHAR"/>
&lt;/typeMappings&gt;
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
&lt;features&gt;
    &lt;!-- 标识符引号 --&gt;
    &lt;SqlFeature name="IDENTIFIER_QUOTE" value="`"/&gt;

    &lt;!-- IF NOT EXISTS 支持 --&gt;
    &lt;SqlFeature name="SUPPORTS_IF_NOT_EXISTS" value="true"/&gt;

    &lt;!-- CASCADE 支持 --&gt;
    &lt;SqlFeature name="SUPPORTS_CASCADE" value="true"/&gt;

    &lt;!-- AUTO_INCREMENT 语法 --&gt;
    &lt;SqlFeature name="AUTO_INCREMENT_KEYWORD" value="AUTO_INCREMENT"/&gt;

    &lt;!-- 外键约束 --&gt;
    &lt;SqlFeature name="SUPPORTS_FOREIGN_KEYS" value="true"/&gt;
&lt;/features&gt;
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
&lt;DatabaseAdapter dbType="mysql"&gt;
    &lt;caseSensitive&gt;true&lt;/caseSensitive&gt;
&lt;/DatabaseAdapter&gt;
```

### 保留字

```xml
&lt;DatabaseAdapter dbType="mysql"&gt;
    &lt;reservedWords&gt;
        &lt;word&gt;SELECT&lt;/word&gt;
        &lt;word&gt;INSERT&lt;/word&gt;
        &lt;word&gt;UPDATE&lt;/word&gt;
        &lt;!-- ... --&gt;
    &lt;/reservedWords&gt;
&lt;/DatabaseAdapter&gt;
```

## 完整示例

### MySQL 适配器

```xml
&lt;plugin id="mysql" dialect="mysql" ref-id="sql-standard-root"&gt;
    &lt;adapters&gt;
        &lt;DatabaseAdapter dbType="mysql" name="MySQL"&gt;
            &lt;driverClass&gt;com.mysql.cj.jdbc.Driver&lt;/driverClass&gt;
            &lt;urlPatterns&gt;
                &lt;UrlPattern&gt;jdbc:mysql://*&lt;/urlPatterns&gt;
                &lt;UrlPattern&gt;jdbc:mysql:replication://*&lt;/urlPatterns&gt;
            &lt;/urlPatterns&gt;
            &lt;typeMappings&gt;
                &lt;TypeMapping logicalType="INTEGER" physicalType="INT" jdbcType="INTEGER"/&gt;
                &lt;TypeMapping logicalType="BIGINT" physicalType="BIGINT" jdbcType="BIGINT"/&gt;
                &lt;TypeMapping logicalType="VARCHAR(%d)" physicalType="VARCHAR(%d)" jdbcType="VARCHAR"/&gt;
                &lt;TypeMapping logicalType="TEXT" physicalType="LONGTEXT" jdbcType="LONGVARCHAR"/&gt;
                &lt;TypeMapping logicalType="TIMESTAMP" physicalType="TIMESTAMP" jdbcType="TIMESTAMP"/&gt;
            &lt;/typeMappings&gt;
            &lt;features&gt;
                &lt;SqlFeature name="IDENTIFIER_QUOTE" value="`"/&gt;
                &lt;SqlFeature name="SUPPORTS_IF_NOT_EXISTS" value="true"/&gt;
                &lt;SqlFeature name="AUTO_INCREMENT_KEYWORD" value="AUTO_INCREMENT"/&gt;
            &lt;/features&gt;
        &lt;/DatabaseAdapter&gt;
    &lt;/adapters&gt;
&lt;/plugin&gt;
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
    static MySQLContainer&lt;?&gt; mysql = new MySQLContainer&lt;&gt;("mysql:8.0");

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
