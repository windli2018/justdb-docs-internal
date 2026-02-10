# SQL Server 数据库支持

JustDB 提供完整的 Microsoft SQL Server 数据库支持，包括 SQL Server 2012 及以上版本。

## 版本支持

| 版本 | 状态 | 说明 |
|------|------|------|
| SQL Server 2022 | 完全支持 | 最新版本 |
| SQL Server 2019 | 完全支持 | 长期支持版本 |
| SQL Server 2017 | 完全支持 | 稳定版本 |
| SQL Server 2016 | 完全支持 | 稳定版本 |
| SQL Server 2014 | 完全支持 | 基本功能支持 |
| Azure SQL Database | 完全支持 | 云数据库版本 |

## 连接配置

### JDBC 驱动

```xml
<dependency>
    <groupId>com.microsoft.sqlserver</groupId>
    <artifactId>mssql-jdbc</artifactId>
    <version>13.2.1.jre11</version>
</dependency>
```

### 连接字符串

```bash
# 基本格式
jdbc:sqlserver://{host}[:{port}][;databaseName={database}]

# 示例
jdbc:sqlserver://localhost:1433;databaseName=mydb
jdbc:sqlserver://192.168.1.100:1433;databaseName=mydb

# 使用实例名
jdbc:sqlserver://{host}\\{instanceName};databaseName={database}

# 集成安全性 (Windows 认证)
jdbc:sqlserver://{host};databaseName={database};integratedSecurity=true
```

### 配置示例

**YAML:**
```yaml
databases:
  production:
    url: jdbc:sqlserver://localhost:1433;databaseName=mydb
    driver: com.microsoft.sqlserver.jdbc.SQLServerDriver
    username: sa
    password: YourPassword123
    dialect: sqlserver
```

**JSON:**
```json
{
  "databases": {
    "production": {
      "url": "jdbc:sqlserver://localhost:1433;databaseName=mydb",
      "driver": "com.microsoft.sqlserver.jdbc.SQLServerDriver",
      "username": "sa",
      "password": "YourPassword123",
      "dialect": "sqlserver"
    }
  }
}
```

**XML:**
```xml
<databases>
  <database id="production">
    <url>jdbc:sqlserver://localhost:1433;databaseName=mydb</url>
    <driver>com.microsoft.sqlserver.jdbc.SQLServerDriver</driver>
    <username>sa</username>
    <password>YourPassword123</password>
    <dialect>sqlserver</dialect>
  </database>
</databases>
```

## 数据类型映射

### 数值类型

| JustDB 类型 | SQL Server 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-----------------|-----------|-----------|------|
| TINYINT | TINYINT | TINYINT | Integer | 1 字节整数 (0-255) |
| SMALLINT | SMALLINT | SMALLINT | Integer | 2 字节整数 |
| INTEGER | INT | INTEGER | Integer | 4 字节整数 |
| BIGINT | BIGINT | BIGINT | Long | 8 字节整数 |
| DECIMAL | DECIMAL(p,s) | DECIMAL | BigDecimal | 精确数值 |
| NUMERIC | NUMERIC(p,s) | NUMERIC | BigDecimal | 精确数值 |
| FLOAT | FLOAT(n) | FLOAT | Double | 浮点数 |
| DOUBLE | FLOAT(53) | DOUBLE | Double | 双精度 (同 REAL) |
| REAL | REAL | FLOAT | Float | 单精度 (24 位精度) |
| MONEY | MONEY | DECIMAL | BigDecimal | 货币类型 |
| SMALLMONEY | SMALLMONEY | DECIMAL | BigDecimal | 小货币类型 |

### 字符串类型

| JustDB 类型 | SQL Server 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-----------------|-----------|-----------|------|
| CHAR | CHAR(n) | CHAR | String | 固定长度字符串 |
| VARCHAR | VARCHAR(n) | VARCHAR | String | 可变长度字符串 |
| VARCHAR(MAX) | VARCHAR(MAX) | LONGVARCHAR | String | 大文本 (2GB) |
| TEXT | TEXT | LONGVARCHAR | String | 长文本 (已废弃) |
| NCHAR | NCHAR(n) | NCHAR | String | Unicode 固定长度 |
| NVARCHAR | NVARCHAR(n) | NVARCHAR | String | Unicode 可变长度 |
| NVARCHAR(MAX) | NVARCHAR(MAX) | LONGNVARCHAR | String | Unicode 大文本 |

### 日期时间类型

| JustDB 类型 | SQL Server 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-----------------|-----------|-----------|------|
| DATE | DATE | DATE | Date | 日期 |
| TIME | TIME(n) | TIME | Time | 时间 |
| DATETIME | DATETIME | TIMESTAMP | Timestamp | 日期时间 (1753-9999) |
| DATETIME2 | DATETIME2(n) | TIMESTAMP | Timestamp | 日期时间 (更精确) |
| SMALLDATETIME | SMALLDATETIME | TIMESTAMP | Timestamp | 小日期时间 (精度到分钟) |
| DATETIMEOFFSET | DATETIMEOFFSET(n) | TIMESTAMP_WITH_TIMEZONE | Timestamp | 日期时间带时区 |
| TIMESTAMP | TIMESTAMP | BINARY | byte[] | 行版本号 (非时间戳) |

### 二进制类型

| JustDB 类型 | SQL Server 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-----------------|-----------|-----------|------|
| BINARY | BINARY(n) | BINARY | byte[] | 固定长度二进制 |
| VARBINARY | VARBINARY(n) | VARBINARY | byte[] | 可变长度二进制 |
| VARBINARY(MAX) | VARBINARY(MAX) | LONGVARBINARY | byte[] | 大二进制 (2GB) |
| IMAGE | IMAGE | LONGVARBINARY | byte[] | 二进制大对象 (已废弃) |

### 唯一标识符类型

| JustDB 类型 | SQL Server 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-----------------|-----------|-----------|------|
| UNIQUEIDENTIFIER | UNIQUEIDENTIFIER | CHAR | String/UUID | 全局唯一标识符 |

### XML 类型

| JustDB 类型 | SQL Server 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-----------------|-----------|-----------|------|
| XML | XML | LONGVARCHAR | String | XML 数据 |

### 空间类型

| JustDB 类型 | SQL Server 类型 | JDBC 类型 | Java 类型 | 说明 |
|-------------|-----------------|-----------|-----------|------|
| GEOMETRY | GEOMETRY | VARBINARY | byte[] | 平面空间数据 |
| GEOGRAPHY | GEOGRAPHY | VARBINARY | byte[] | 地理空间数据 |

## SQL Server 特定功能

### IDENTITY (自增列)

```yaml
tables:
  - name: users
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true  # 生成 IDENTITY(1,1)
```

### Schema 支持

```yaml
tables:
  - name: users
    schema: dbo
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
```

### 计算列

```yaml
tables:
  - name: users
    columns:
      - name: full_name
        type: NVARCHAR(200)
        computed: true
        expression: "[first_name] + ' ' + [last_name]"
```

### 默认约束

```yaml
tables:
  - name: users
    columns:
      - name: created_at
        type: DATETIME2
        defaultValueComputed: "GETDATE()"
```

## 生成的 SQL 示例

### CREATE TABLE

```sql
CREATE TABLE [users] (
  [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
  [username] NVARCHAR(255) NOT NULL,
  [email] NVARCHAR(255) NOT NULL,
  [created_at] DATETIME2 DEFAULT GETDATE()
);
```

### ALTER TABLE

```sql
-- 添加列
ALTER TABLE [users] ADD [status] NVARCHAR(50) NOT NULL DEFAULT 'active';

-- 修改列类型
ALTER TABLE [users] ALTER COLUMN [email] NVARCHAR(500) NOT NULL;

-- 重命名列 (使用 sp_rename)
EXEC sp_rename '[users].[username]', 'login_name', 'COLUMN';

-- 删除列
ALTER TABLE [users] DROP COLUMN [status];
```

### CREATE INDEX

```sql
CREATE INDEX [idx_username] ON [users] ([username]);
CREATE UNIQUE INDEX [idx_email] ON [users] ([email]);
```

### DROP TABLE

```sql
DROP TABLE IF EXISTS [users];
```

### 重命名表

```sql
EXEC sp_rename '[users]', 'users_new';
```

## 已知限制

### 不支持的功能

1. **列注释**: SQL Server 使用扩展属性存储注释，需特殊处理
2. **表选项**: 部分 MySQL 特有的表选项不适用
3. **ENUM 类型**: SQL Server 没有枚举类型，使用 CHECK 约束替代

### 数据类型限制

1. **TEXT/NTEXT**: 已被 VARCHAR(MAX)/NVARCHAR(MAX) 替代
2. **IMAGE**: 已被 VARBINARY(MAX) 替代
3. **TIMESTAMP**: SQL Server 的 TIMESTAMP 是行版本号，非时间戳类型

### 兼容性说明

1. **SQL Server 2012 以下**: 不支持某些新特性
2. **Azure SQL**: 部分功能限制
3. **IDENTITY 种子**: 需要重启才能重置

## 最佳实践

### 1. 使用 NVARCHAR 存储 Unicode

```yaml
tables:
  - name: users
    columns:
      - name: username
        type: NVARCHAR(255)  # 支持多语言字符
```

### 2. 使用 DATETIME2 而非 DATETIME

```yaml
tables:
  - name: users
    columns:
      - name: created_at
        type: DATETIME2  # 更精确的范围
```

### 3. 使用 VARCHAR(MAX) 存储大文本

```yaml
tables:
  - name: posts
    columns:
      - name: content
        type: VARCHAR(MAX)  # 替代 TEXT
```

### 4. 使用 Schema 组织表

```yaml
tables:
  - name: users
    schema: dbo  # 或自定义 schema
```

### 5. 使用 CHECK 约束实现枚举

```yaml
tables:
  - name: users
    constraints:
      - type: CHECK
        name: chk_status
        checkExpression: "status IN ('active', 'inactive', 'pending')"
```

### 6. 使用 UNIQUEIDENTIFIER 作为 GUID

```yaml
tables:
  - name: users
    columns:
      - name: guid
        type: UNIQUEIDENTIFIER
        defaultValueComputed: "NEWID()"
```

## Azure SQL Database

JustDB 也支持 Azure SQL Database，配置与 SQL Server 类似：

```yaml
databases:
  azure:
    url: jdbc:sqlserver://myserver.database.windows.net:1433;databaseName=mydb
    driver: com.microsoft.sqlserver.jdbc.SQLServerDriver
    username: myuser@myserver
    password: MyPassword123
    dialect: sqlserver
    properties:
      encrypt: true
      trustServerCertificate: false
      hostNameInCertificate: "*.database.windows.net"
```

## 相关文档

- [SQL Server 官方文档](https://learn.microsoft.com/en-us/sql/)
- [SQL Server 数据类型参考](https://learn.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql)
- [数据库支持概述](./README.md)
