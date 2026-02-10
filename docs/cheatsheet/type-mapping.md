# Type 类型映射速查

类型映射（Type Mapping）是 JustDB 跨数据库兼容性的核心机制，处理不同数据库间的类型转换。

## 快速示例

### 基本类型映射

```xml
<plugin id="mysql">
    <typeMappings>
        <TypeMapping dbType="VARCHAR" javaType="String" jdbcType="VARCHAR"/>
        <TypeMapping dbType="INT" javaType="Integer" jdbcType="INTEGER"/>
        <TypeMapping dbType="BIGINT" javaType="Long" jdbcType="BIGINT"/>
        <TypeMapping dbType="DATETIME" javaType="LocalDateTime" jdbcType="TIMESTAMP"/>
    </typeMappings>
</plugin>
```

### 字符串类型

```xml
<Column name="username" type="VARCHAR(50)"/>
<Column name="content" type="TEXT"/>
<Column name="summary" type="CHAR(100)"/>
```

## 常用场景

### 场景 1: 跨数据库兼容类型

| 通用类型 | MySQL | PostgreSQL | Oracle | SQL Server |
|---------|-------|------------|--------|------------|
| `VARCHAR(255)` | `VARCHAR(255)` | `VARCHAR(255)` | `VARCHAR2(255)` | `NVARCHAR(255)` |
| `TEXT` | `TEXT` | `TEXT` | `CLOB` | `NVARCHAR(MAX)` |
| `BIGINT` | `BIGINT` | `BIGINT` | `NUMBER(19)` | `BIGINT` |
| `DATETIME` | `DATETIME` | `TIMESTAMP` | `TIMESTAMP` | `DATETIME2` |
| `BOOLEAN` | `TINYINT(1)` | `BOOLEAN` | `NUMBER(1)` | `BIT` |

### 场景 2: 数值类型

```xml
<!-- 整数 -->
<Column name="age" type="INT"/>
<Column name="count" type="BIGINT"/>
<Column name="small" type="SMALLINT"/>
<Column name="tiny" type="TINYINT"/>

<!-- 小数 -->
<Column name="price" type="DECIMAL(10,2)"/>
<Column name="rate" type="FLOAT"/>
<Column name="ratio" type="DOUBLE"/>
```

### 场景 3: 日期时间类型

```xml
<!-- 日期时间 -->
<Column name="created_at" type="DATETIME"/>
<Column name="birth_date" type="DATE"/>
<Column name="meeting_time" type="TIME"/>
<Column name="timestamp" type="TIMESTAMP"/>

<!-- 特定数据库 -->
<Column name="created_at" type="TIMESTAMP WITH TIME ZONE"/>  <!-- PostgreSQL -->
```

### 场景 4: JSON 类型

```xml
<!-- MySQL 5.7+ -->
<Column name="metadata" type="JSON"/>

<!-- PostgreSQL -->
<Column name="metadata" type="JSONB"/>

<!-- Oracle -->
<Column name="metadata" type="CLOB"/>

<!-- SQLite -->
<Column name="metadata" type="TEXT"/>
```

## 数据库类型对照表

### 字符串类型

| MySQL | PostgreSQL | Oracle | SQL Server | SQLite | Java Type |
|-------|------------|--------|------------|--------|-----------|
| `CHAR(n)` | `CHAR(n)` | `CHAR(n)` | `CHAR(n)` | `TEXT` | `String` |
| `VARCHAR(n)` | `VARCHAR(n)` | `VARCHAR2(n)` | `NVARCHAR(n)` | `TEXT` | `String` |
| `TEXT` | `TEXT` | `CLOB` | `NVARCHAR(MAX)` | `TEXT` | `String` |
| `TINYTEXT` | `TEXT` | `CLOB` | `NVARCHAR(MAX)` | `TEXT` | `String` |
| `MEDIUMTEXT` | `TEXT` | `CLOB` | `NVARCHAR(MAX)` | `TEXT` | `String` |
| `LONGTEXT` | `TEXT` | `CLOB` | `NVARCHAR(MAX)` | `TEXT` | `String` |

### 数值类型

| MySQL | PostgreSQL | Oracle | SQL Server | SQLite | Java Type |
|-------|------------|--------|------------|--------|-----------|
| `TINYINT` | `SMALLINT` | `NUMBER(3)` | `TINYINT` | `INTEGER` | `Byte` |
| `SMALLINT` | `SMALLINT` | `NUMBER(5)` | `SMALLINT` | `INTEGER` | `Short` |
| `INT` | `INTEGER` | `NUMBER(10)` | `INT` | `INTEGER` | `Integer` |
| `BIGINT` | `BIGINT` | `NUMBER(19)` | `BIGINT` | `INTEGER` | `Long` |
| `DECIMAL(p,s)` | `NUMERIC(p,s)` | `NUMBER(p,s)` | `DECIMAL(p,s)` | `REAL` | `BigDecimal` |
| `FLOAT` | `REAL` | `BINARY_FLOAT` | `FLOAT` | `REAL` | `Float` |
| `DOUBLE` | `DOUBLE PRECISION` | `BINARY_DOUBLE` | `FLOAT` | `REAL` | `Double` |

### 日期时间类型

| MySQL | PostgreSQL | Oracle | SQL Server | SQLite | Java Type |
|-------|------------|--------|------------|--------|-----------|
| `DATE` | `DATE` | `DATE` | `DATE` | `TEXT` | `LocalDate` |
| `TIME` | `TIME` | `TIMESTAMP` | `TIME` | `TEXT` | `LocalTime` |
| `DATETIME` | `TIMESTAMP` | `TIMESTAMP` | `DATETIME2` | `TEXT` | `LocalDateTime` |
| `TIMESTAMP` | `TIMESTAMP` | `TIMESTAMP` | `DATETIME2` | `TEXT` | `Timestamp` |

### 二进制类型

| MySQL | PostgreSQL | Oracle | SQL Server | SQLite | Java Type |
|-------|------------|--------|------------|--------|-----------|
| `BINARY(n)` | `BYTEA` | `RAW(n)` | `BINARY(n)` | `BLOB` | `byte[]` |
| `VARBINARY(n)` | `BYTEA` | `RAW(n)` | `VARBINARY(n)` | `BLOB` | `byte[]` |
| `BLOB` | `BYTEA` | `BLOB` | `VARBINARY(MAX)` | `BLOB` | `byte[]` |

## 自定义类型映射

### 添加 PostgreSQL 特有类型

```xml
<plugin id="postgresql">
    <typeMappings>
        <TypeMapping dbType="JSONB" javaType="String" jdbcType="OTHER"/>
        <TypeMapping dbType="UUID" javaType="java.util.UUID" jdbcType="OTHER"/>
        <TypeMapping dbType="INET" javaType="String" jdbcType="VARCHAR"/>
        <TypeMapping dbType="CIDR" javaType="String" jdbcType="VARCHAR"/>
        <TypeMapping dbType="MACADDR" javaType="String" jdbcType="VARCHAR"/>
        <TypeMapping dbType="TSVECTOR" javaType="String" jdbcType="OTHER"/>
        <TypeMapping dbType="HSTORE" javaType="Map<String,String>" jdbcType="OTHER"/>
    </typeMappings>
</plugin>
```

### 添加 MySQL 特有类型

```xml
<plugin id="mysql">
    <typeMappings>
        <TypeMapping dbType="JSON" javaType="String" jdbcType="VARCHAR"/>
        <TypeMapping dbType="ENUM" javaType="String" jdbcType="VARCHAR"/>
        <TypeMapping dbType="SET" javaType="String" jdbcType="VARCHAR"/>
        <TypeMapping dbType="YEAR" javaType="Integer" jdbcType="SMALLINT"/>
        <TypeMapping dbType="BIT" javaType="Boolean" jdbcType="BIT"/>
    </typeMappings>
</plugin>
```

### 添加 Oracle 特有类型

```xml
<plugin id="oracle">
    <typeMappings>
        <TypeMapping dbType="ROWID" javaType="String" jdbcType="VARCHAR"/>
        <TypeMapping dbType="UROWID" javaType="String" jdbcType="VARCHAR"/>
        <TypeMapping dbType="XMLTYPE" javaType="String" jdbcType="SQLXML"/>
        <TypeMapping dbType="ANYDATA" javaType="Object" jdbcType="OTHER"/>
    </typeMappings>
</plugin>
```

## 类型转换函数

### 字符串转数字

```xml
<Column name="count" type="INT" defaultValue="0"/>
<Column name="price" type="DECIMAL(10,2)" defaultValue="0.00"/>
```

### 日期时间处理

```xml
<Column name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
<Column name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"/>
```

### 自动类型推断

JustDB 自动处理以下转换：

| 来源类型 | 目标类型 | 转换规则 |
|---------|---------|---------|
| `String` | `INT` | `Integer.parseInt()` |
| `String` | `BIGINT` | `Long.parseLong()` |
| `String` | `DECIMAL` | `new BigDecimal()` |
| `String` | `BOOLEAN` | `Boolean.parseBoolean()` |
| `String` | `DATE` | `LocalDate.parse()` |
| `String` | `TIMESTAMP` | `LocalDateTime.parse()` |

## 注意事项

### 1. 字符串长度限制

```xml
<!-- ✅ 正确：指定长度 -->
<Column name="username" type="VARCHAR(50)"/>

<!-- ❌ 错误：VARCHAR 无长度（某些数据库报错） -->
<Column name="username" type="VARCHAR"/>

<!-- ✅ 正确：使用 TEXT 无需长度 -->
<Column name="content" type="TEXT"/>
```

### 2. 小数精度

```xml
<!-- DECIMAL(precision, scale) -->
<!-- precision: 总位数, scale: 小数位数 -->
<Column name="price" type="DECIMAL(10,2)"/>  <!-- 最大 99999999.99 -->
<Column name="rate" type="DECIMAL(5,4)"/>   <!-- 最大 0.9999 -->
```

### 3. 布尔类型兼容性

```xml
<!-- MySQL: 使用 TINYINT(1) -->
<Column name="active" type="TINYINT(1)"/>

<!-- PostgreSQL: 原生 BOOLEAN -->
<Column name="active" type="BOOLEAN"/>

<!-- Oracle: 使用 NUMBER(1) -->
<Column name="active" type="NUMBER(1)"/>

<!-- JustDB 自动映射为 Java Boolean -->
```

### 4. 时间戳时区

```xml
<!-- 不带时区 -->
<Column name="created_at" type="TIMESTAMP"/>

<!-- 带时区（PostgreSQL） -->
<Column name="created_at" type="TIMESTAMP WITH TIME ZONE"/>

<!-- Oracle TIMESTAMP WITH TIME ZONE -->
<Column name="created_at" type="TIMESTAMP WITH TIME ZONE"/>
```

## 进阶技巧

### 技巧 1: 自定义类型处理器

```java
public class JsonTypeHandler implements TypeHandler {
    @Override
    public void setParameter(PreparedStatement ps, int i, Object parameter, JdbcType jdbcType) throws SQLException {
        // JSON 对象转字符串
        ps.setString(i, toJson(parameter));
    }

    @Override
    public Object getResult(ResultSet rs, String columnName) throws SQLException {
        // 字符串转 JSON 对象
        return fromJson(rs.getString(columnName));
    }
}
```

### 技巧 2: 枚举类型

```xml
<!-- MySQL ENUM -->
<Column name="status" type="ENUM('ACTIVE','INACTIVE','PENDING')"/>

<!-- PostgreSQL ENUM -->
<Column name="status" type="status_type"/>

<!-- 通用方案：VARCHAR + 约束 -->
<Column name="status" type="VARCHAR(20)">
    <Constraint type="CHECK" name="chk_status">
        <checkExpression>status IN ('ACTIVE','INACTIVE','PENDING')</checkExpression>
    </Constraint>
</Column>
```

### 技巧 3: 数组类型

```xml
<!-- PostgreSQL 数组 -->
<Column name="tags" type="TEXT[]"/>

<!-- 通用方案：JSON 数组 -->
<Column name="tags" type="JSON"/>

<!-- 通用方案：逗号分隔 -->
<Column name="tags" type="VARCHAR(500)"/>
```

## 参考链接

- [数据库支持](../reference/databases/)
- [插件开发](../development/plugin-development/)
- [Column 参考](../reference/schema/column.md)
