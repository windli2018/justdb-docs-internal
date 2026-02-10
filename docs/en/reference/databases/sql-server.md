# Microsoft SQL Server Database Support

JustDB provides complete Microsoft SQL Server database support, including SQL Server 2012 and above.

## Version Support

| Version | Status | Notes |
|---------|--------|-------|
| SQL Server 2022 | Full Support | Latest version |
| SQL Server 2019 | Full Support | Long-term support version |
| SQL Server 2017 | Full Support | Stable version |
| SQL Server 2016 | Full Support | Stable version |
| SQL Server 2014 | Full Support | Basic functionality support |
| Azure SQL Database | Full Support | Cloud database version |

## Connection Configuration

### JDBC Driver

```xml
<dependency>
    <groupId>com.microsoft.sqlserver</groupId>
    <artifactId>mssql-jdbc</artifactId>
    <version>13.2.1.jre11</version>
</dependency>
```

### Connection String

```bash
# Basic format
jdbc:sqlserver://{host}[:{port}][;databaseName={database}]

# Examples
jdbc:sqlserver://localhost:1433;databaseName=mydb
jdbc:sqlserver://192.168.1.100:1433;databaseName=mydb

# Using instance name
jdbc:sqlserver://{host}\\{instanceName};databaseName={database}

# Integrated security (Windows authentication)
jdbc:sqlserver://{host};databaseName={database};integratedSecurity=true
```

### Configuration Examples

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

## Data Type Mapping

### Numeric Types

| JustDB Type | SQL Server Type | JDBC Type | Java Type | Description |
|-------------|-----------------|-----------|-----------|-------------|
| TINYINT | TINYINT | TINYINT | Integer | 1-byte integer (0-255) |
| SMALLINT | SMALLINT | SMALLINT | Integer | 2-byte integer |
| INTEGER | INT | INTEGER | Integer | 4-byte integer |
| BIGINT | BIGINT | BIGINT | Long | 8-byte integer |
| DECIMAL | DECIMAL(p,s) | DECIMAL | BigDecimal | Exact numeric |
| NUMERIC | NUMERIC(p,s) | NUMERIC | BigDecimal | Exact numeric |
| FLOAT | FLOAT(n) | FLOAT | Double | Floating point |
| DOUBLE | FLOAT(53) | DOUBLE | Double | Double precision (same as REAL) |
| REAL | REAL | FLOAT | Float | Single precision (24-bit precision) |
| MONEY | MONEY | DECIMAL | BigDecimal | Currency type |
| SMALLMONEY | SMALLMONEY | DECIMAL | BigDecimal | Small currency type |

### String Types

| JustDB Type | SQL Server Type | JDBC Type | Java Type | Description |
|-------------|-----------------|-----------|-----------|-------------|
| CHAR | CHAR(n) | CHAR | String | Fixed-length string |
| VARCHAR | VARCHAR(n) | VARCHAR | String | Variable-length string |
| VARCHAR(MAX) | VARCHAR(MAX) | LONGVARCHAR | String | Large text (2GB) |
| TEXT | TEXT | LONGVARCHAR | String | Long text (deprecated) |
| NCHAR | NCHAR(n) | NCHAR | String | Unicode fixed-length |
| NVARCHAR | NVARCHAR(n) | NVARCHAR | String | Unicode variable-length |
| NVARCHAR(MAX) | NVARCHAR(MAX) | LONGNVARCHAR | String | Unicode large text |

### Date/Time Types

| JustDB Type | SQL Server Type | JDBC Type | Java Type | Description |
|-------------|-----------------|-----------|-----------|-------------|
| DATE | DATE | DATE | Date | Date |
| TIME | TIME(n) | TIME | Time | Time |
| DATETIME | DATETIME | TIMESTAMP | Timestamp | Date and time (1753-9999) |
| DATETIME2 | DATETIME2(n) | TIMESTAMP | Timestamp | Date and time (more precise) |
| SMALLDATETIME | SMALLDATETIME | TIMESTAMP | Timestamp | Small date and time (precision to minute) |
| DATETIMEOFFSET | DATETIMEOFFSET(n) | TIMESTAMP_WITH_TIMEZONE | Timestamp | Date and time with timezone |
| TIMESTAMP | TIMESTAMP | BINARY | byte[] | Row version (not timestamp) |

### Binary Types

| JustDB Type | SQL Server Type | JDBC Type | Java Type | Description |
|-------------|-----------------|-----------|-----------|-------------|
| BINARY | BINARY(n) | BINARY | byte[] | Fixed-length binary |
| VARBINARY | VARBINARY(n) | VARBINARY | byte[] | Variable-length binary |
| VARBINARY(MAX) | VARBINARY(MAX) | LONGVARBINARY | byte[] | Large binary (2GB) |
| IMAGE | IMAGE | LONGVARBINARY | byte[] | Binary large object (deprecated) |

### Unique Identifier Types

| JustDB Type | SQL Server Type | JDBC Type | Java Type | Description |
|-------------|-----------------|-----------|-----------|-------------|
| UNIQUEIDENTIFIER | UNIQUEIDENTIFIER | CHAR | String/UUID | Globally unique identifier |

### XML Types

| JustDB Type | SQL Server Type | JDBC Type | Java Type | Description |
|-------------|-----------------|-----------|-----------|-------------|
| XML | XML | LONGVARCHAR | String | XML data |

### Spatial Types

| JustDB Type | SQL Server Type | JDBC Type | Java Type | Description |
|-------------|-----------------|-----------|-----------|-------------|
| GEOMETRY | GEOMETRY | VARBINARY | byte[] | Planar spatial data |
| GEOGRAPHY | GEOGRAPHY | VARBINARY | byte[] | Geographic spatial data |

## SQL Server-Specific Features

### IDENTITY (Auto-Increment Column)

```yaml
tables:
  - name: users
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true  # Generates IDENTITY(1,1)
```

### Schema Support

```yaml
tables:
  - name: users
    schema: dbo
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
```

### Computed Column

```yaml
tables:
  - name: users
    columns:
      - name: full_name
        type: NVARCHAR(200)
        computed: true
        expression: "[first_name] + ' ' + [last_name]"
```

### Default Constraint

```yaml
tables:
  - name: users
    columns:
      - name: created_at
        type: DATETIME2
        defaultValueComputed: "GETDATE()"
```

## Generated SQL Examples

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
-- Add column
ALTER TABLE [users] ADD [status] NVARCHAR(50) NOT NULL DEFAULT 'active';

-- Modify column type
ALTER TABLE [users] ALTER COLUMN [email] NVARCHAR(500) NOT NULL;

-- Rename column (using sp_rename)
EXEC sp_rename '[users].[username]', 'login_name', 'COLUMN';

-- Drop column
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

### Rename Table

```sql
EXEC sp_rename '[users]', 'users_new';
```

## Known Limitations

### Unsupported Features

1. **Column Comments**: SQL Server uses extended properties to store comments, requires special handling
2. **Table Options**: Some MySQL-specific table options don't apply
3. **ENUM Type**: SQL Server doesn't have enum type, use CHECK constraints instead

### Data Type Limitations

1. **TEXT/NTEXT**: Replaced by VARCHAR(MAX)/NVARCHAR(MAX)
2. **IMAGE**: Replaced by VARBINARY(MAX)
3. **TIMESTAMP**: SQL Server's TIMESTAMP is a row version, not a timestamp type

### Compatibility Notes

1. **SQL Server 2012 and below**: Some new features not supported
2. **Azure SQL**: Some feature limitations
3. **IDENTITY Seed**: Requires restart to reset

## Best Practices

### 1. Use NVARCHAR for Unicode Storage

```yaml
tables:
  - name: users
    columns:
      - name: username
        type: NVARCHAR(255)  # Supports multi-language characters
```

### 2. Use DATETIME2 Instead of DATETIME

```yaml
tables:
  - name: users
    columns:
      - name: created_at
        type: DATETIME2  # More precise range
```

### 3. Use VARCHAR(MAX) for Large Text

```yaml
tables:
  - name: posts
    columns:
      - name: content
        type: VARCHAR(MAX)  # Replaces TEXT
```

### 4. Use Schema to Organize Tables

```yaml
tables:
  - name: users
    schema: dbo  # Or custom schema
```

### 5. Use CHECK Constraints for Enumerations

```yaml
tables:
  - name: users
    constraints:
      - type: CHECK
        name: chk_status
        checkExpression: "status IN ('active', 'inactive', 'pending')"
```

### 6. Use UNIQUEIDENTIFIER as GUID

```yaml
tables:
  - name: users
    columns:
      - name: guid
        type: UNIQUEIDENTIFIER
        defaultValueComputed: "NEWID()"
```

## Azure SQL Database

JustDB also supports Azure SQL Database, configuration similar to SQL Server:

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

## Related Documentation

- [SQL Server Official Documentation](https://learn.microsoft.com/en-us/sql/)
- [SQL Server Data Type Reference](https://learn.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql)
- [Database Support Overview](./README.md)
