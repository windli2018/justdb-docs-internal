---
title: Type Mapping Cheatsheet
icon: bolt
---

# Type Mapping

Type mapping is JustDB's core mechanism for cross-database compatibility, handling type conversions between different databases.

## Quick Examples

### Basic Type Mapping

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

### String Types

```xml
<Column name="username" type="VARCHAR(50)"/>
<Column name="content" type="TEXT"/>
<Column name="summary" type="CHAR(100)"/>
```

## Common Scenarios

### Scenario 1: Cross-Database Compatible Types

| Generic Type | MySQL | PostgreSQL | Oracle | SQL Server |
|-------------|-------|------------|--------|------------|
| `VARCHAR(255)` | `VARCHAR(255)` | `VARCHAR(255)` | `VARCHAR2(255)` | `NVARCHAR(255)` |
| `TEXT` | `TEXT` | `TEXT` | `CLOB` | `NVARCHAR(MAX)` |
| `BIGINT` | `BIGINT` | `BIGINT` | `NUMBER(19)` | `BIGINT` |
| `DATETIME` | `DATETIME` | `TIMESTAMP` | `TIMESTAMP` | `DATETIME2` |
| `BOOLEAN` | `TINYINT(1)` | `BOOLEAN` | `NUMBER(1)` | `BIT` |

### Scenario 2: Numeric Types

```xml
<!-- Integers -->
<Column name="age" type="INT"/>
<Column name="count" type="BIGINT"/>
<Column name="small" type="SMALLINT"/>
<Column name="tiny" type="TINYINT"/>

<!-- Decimals -->
<Column name="price" type="DECIMAL(10,2)"/>
<Column name="rate" type="FLOAT"/>
<Column name="ratio" type="DOUBLE"/>
```

### Scenario 3: Date-Time Types

```xml
<!-- Date-time -->
<Column name="created_at" type="DATETIME"/>
<Column name="birth_date" type="DATE"/>
<Column name="meeting_time" type="TIME"/>
<Column name="timestamp" type="TIMESTAMP"/>

<!-- Database-specific -->
<Column name="created_at" type="TIMESTAMP WITH TIME ZONE"/>  <!-- PostgreSQL -->
```

### Scenario 4: JSON Types

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

## Database Type Reference

### String Types

| MySQL | PostgreSQL | Oracle | SQL Server | SQLite | Java Type |
|-------|------------|--------|------------|--------|-----------|
| `CHAR(n)` | `CHAR(n)` | `CHAR(n)` | `CHAR(n)` | `TEXT` | `String` |
| `VARCHAR(n)` | `VARCHAR(n)` | `VARCHAR2(n)` | `NVARCHAR(n)` | `TEXT` | `String` |
| `TEXT` | `TEXT` | `CLOB` | `NVARCHAR(MAX)` | `TEXT` | `String` |
| `TINYTEXT` | `TEXT` | `CLOB` | `NVARCHAR(MAX)` | `TEXT` | `String` |
| `MEDIUMTEXT` | `TEXT` | `CLOB` | `NVARCHAR(MAX)` | `TEXT` | `String` |
| `LONGTEXT` | `TEXT` | `CLOB` | `NVARCHAR(MAX)` | `TEXT` | `String` |

### Numeric Types

| MySQL | PostgreSQL | Oracle | SQL Server | SQLite | Java Type |
|-------|------------|--------|------------|--------|-----------|
| `TINYINT` | `SMALLINT` | `NUMBER(3)` | `TINYINT` | `INTEGER` | `Byte` |
| `SMALLINT` | `SMALLINT` | `NUMBER(5)` | `SMALLINT` | `INTEGER` | `Short` |
| `INT` | `INTEGER` | `NUMBER(10)` | `INT` | `INTEGER` | `Integer` |
| `BIGINT` | `BIGINT` | `NUMBER(19)` | `BIGINT` | `INTEGER` | `Long` |
| `DECIMAL(p,s)` | `NUMERIC(p,s)` | `NUMBER(p,s)` | `DECIMAL(p,s)` | `REAL` | `BigDecimal` |
| `FLOAT` | `REAL` | `BINARY_FLOAT` | `FLOAT` | `REAL` | `Float` |
| `DOUBLE` | `DOUBLE PRECISION` | `BINARY_DOUBLE` | `FLOAT` | `REAL` | `Double` |

### Date-Time Types

| MySQL | PostgreSQL | Oracle | SQL Server | SQLite | Java Type |
|-------|------------|--------|------------|--------|-----------|
| `DATE` | `DATE` | `DATE` | `DATE` | `TEXT` | `LocalDate` |
| `TIME` | `TIME` | `TIMESTAMP` | `TIME` | `TEXT` | `LocalTime` |
| `DATETIME` | `TIMESTAMP` | `TIMESTAMP` | `DATETIME2` | `TEXT` | `LocalDateTime` |
| `TIMESTAMP` | `TIMESTAMP` | `TIMESTAMP` | `DATETIME2` | `TEXT` | `Timestamp` |

### Binary Types

| MySQL | PostgreSQL | Oracle | SQL Server | SQLite | Java Type |
|-------|------------|--------|------------|--------|-----------|
| `BINARY(n)` | `BYTEA` | `RAW(n)` | `BINARY(n)` | `BLOB` | `byte[]` |
| `VARBINARY(n)` | `BYTEA` | `RAW(n)` | `VARBINARY(n)` | `BLOB` | `byte[]` |
| `BLOB` | `BYTEA` | `BLOB` | `VARBINARY(MAX)` | `BLOB` | `byte[]` |

## Custom Type Mapping

### Add PostgreSQL-Specific Types

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

### Add MySQL-Specific Types

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

### Add Oracle-Specific Types

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

## Type Conversion Functions

### String to Number

```xml
<Column name="count" type="INT" defaultValue="0"/>
<Column name="price" type="DECIMAL(10,2)" defaultValue="0.00"/>
```

### Date-Time Handling

```xml
<Column name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
<Column name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"/>
```

### Auto Type Inference

JustDB automatically handles these conversions:

| Source Type | Target Type | Conversion Rule |
|-------------|-------------|-----------------|
| `String` | `INT` | `Integer.parseInt()` |
| `String` | `BIGINT` | `Long.parseLong()` |
| `String` | `DECIMAL` | `new BigDecimal()` |
| `String` | `BOOLEAN` | `Boolean.parseBoolean()` |
| `String` | `DATE` | `LocalDate.parse()` |
| `String` | `TIMESTAMP` | `LocalDateTime.parse()` |

## Important Notes

### 1. String Length Limits

```xml
<!-- ✅ Correct: specify length -->
<Column name="username" type="VARCHAR(50)"/>

<!-- ❌ Error: VARCHAR without length (some databases fail) -->
<Column name="username" type="VARCHAR"/>

<!-- ✅ Correct: TEXT requires no length -->
<Column name="content" type="TEXT"/>
```

### 2. Decimal Precision

```xml
<!-- DECIMAL(precision, scale) -->
<!-- precision: total digits, scale: decimal places -->
<Column name="price" type="DECIMAL(10,2)"/>  <!-- Max 99999999.99 -->
<Column name="rate" type="DECIMAL(5,4)"/>   <!-- Max 0.9999 -->
```

### 3. Boolean Type Compatibility

```xml
<!-- MySQL: use TINYINT(1) -->
<Column name="active" type="TINYINT(1)"/>

<!-- PostgreSQL: native BOOLEAN -->
<Column name="active" type="BOOLEAN"/>

<!-- Oracle: use NUMBER(1) -->
<Column name="active" type="NUMBER(1)"/>

<!-- JustDB auto-maps to Java Boolean -->
```

### 4. Timestamp Timezone

```xml
<!-- Without timezone -->
<Column name="created_at" type="TIMESTAMP"/>

<!-- With timezone (PostgreSQL) -->
<Column name="created_at" type="TIMESTAMP WITH TIME ZONE"/>

<!-- Oracle TIMESTAMP WITH TIME ZONE -->
<Column name="created_at" type="TIMESTAMP WITH TIME ZONE"/>
```

## Advanced Techniques

### Technique 1: Custom Type Handler

```java
public class JsonTypeHandler implements TypeHandler {
    @Override
    public void setParameter(PreparedStatement ps, int i, Object parameter, JdbcType jdbcType) throws SQLException {
        // JSON object to string
        ps.setString(i, toJson(parameter));
    }

    @Override
    public Object getResult(ResultSet rs, String columnName) throws SQLException {
        // String to JSON object
        return fromJson(rs.getString(columnName));
    }
}
```

### Technique 2: Enum Types

```xml
<!-- MySQL ENUM -->
<Column name="status" type="ENUM('ACTIVE','INACTIVE','PENDING')"/>

<!-- PostgreSQL ENUM -->
<Column name="status" type="status_type"/>

<!-- Universal approach: VARCHAR + constraint -->
<Column name="status" type="VARCHAR(20)">
    <Constraint type="CHECK" name="chk_status">
        <checkExpression>status IN ('ACTIVE','INACTIVE','PENDING')</checkExpression>
    </Constraint>
</Column>
```

### Technique 3: Array Types

```xml
<!-- PostgreSQL array -->
<Column name="tags" type="TEXT[]"/>

<!-- Universal approach: JSON array -->
<Column name="tags" type="JSON"/>

<!-- Universal approach: comma-separated -->
<Column name="tags" type="VARCHAR(500)"/>
```

## Reference Links

- [Database Support](../../reference/databases/)
- [Plugin Development](../../development/plugin-development/)
- [Column Reference](../../reference/schema/column.md)
