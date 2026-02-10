---
title: Chinese Domestic Databases
icon: database
description: Support for Chinese domestic database systems
order: 7
---

# Chinese Domestic Databases Support

JustDB supports multiple Chinese domestic databases, including DM (Dameng), KingBase, GBase, TiDB, OceanBase, and more.

## Supported Chinese Databases

| Database | Vendor | Dialect Compatible | Status |
|----------|--------|-------------------|--------|
| DM (Dameng) | Wuhan Dameng | Oracle-like | Full Support |
| KingBase | KingBase | PostgreSQL-like | Full Support |
| GBase 8s | General Nanjing | Informix-like | Supported |
| TiDB | PingCAP | MySQL Compatible | Full Support |
| OceanBase | Ant Group | MySQL Compatible | Full Support |
| openGauss | Huawei | PostgreSQL-like | Supported |
| GaussDB | Huawei | PostgreSQL-like | Supported |
| TDSQL | Tencent Cloud | MySQL Compatible | Supported |

## DM (Dameng)

### Version Support

| Version | Status |
|---------|--------|
| DM8 | Full Support |
| DM7 | Supported |

### Connection Configuration

**JDBC Driver:**

```xml
<dependency>
    <groupId>com.dameng</groupId>
    <artifactId>DmJdbcDriver18</artifactId>
    <version>8.1.3.62</version>
</dependency>
```

**Connection String:**

```bash
jdbc:dm://{host}[:{port}]
```

**Configuration Example (YAML):**

```yaml
databases:
  production:
    url: jdbc:dm://localhost:5236
    driver: dm.jdbc.driver.DmDriver
    username: SYSDBA
    password: SYSDBA
    dialect: dameng
```

### Data Type Mapping

| JustDB Type | DM Type | Description |
|-------------|---------|-------------|
| INTEGER | INT | Integer |
| BIGINT | BIGINT | Big integer |
| DECIMAL | DECIMAL(p,s) | Exact numeric |
| VARCHAR | VARCHAR2(n) | Variable-length string |
| TEXT | CLOB | Large text |
| TIMESTAMP | TIMESTAMP | Timestamp |
| BLOB | BLOB | Binary data |

### DM-Specific Features

```yaml
tables:
  - name: users
    tablespace: USERS  # Tablespace
    storage:
      initial: 100
      next: 100
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
```

### Generated SQL Example

```sql
CREATE TABLE "users" (
  "id" BIGINT PRIMARY KEY,
  "username" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL
);
```

### Official Documentation

- [Dameng Database Official Site](https://eco.dameng.com/)
- [Dameng Database Documentation](https://eco.dameng.com/document/dm/zh-cn/start/)
- [Data Type Reference](https://eco.dameng.com/document/dm/zh-cn/sql-dev/dmpl-sql-datatype.html)

## KingBase

### Version Support

| Version | Status |
|---------|--------|
| KingBaseES V8 | Full Support |
| KingBaseES V7 | Supported |

### Connection Configuration

**JDBC Driver:**

```xml
<dependency>
    <groupId>cn.com.kingbase</groupId>
    <artifactId>kingbase8</artifactId>
    <version>9.0.1</version>
</dependency>
```

**Connection String:**

```bash
jdbc:kingbase8://{host}[:{port}]/[{database}]
```

**Configuration Example (YAML):**

```yaml
databases:
  production:
    url: jdbc:kingbase8://localhost:54321/mydb
    driver: com.kingbase8.Driver
    username: system
    password: password
    dialect: kingbase
```

### Data Type Mapping

| JustDB Type | KingBase Type | Description |
|-------------|---------------|-------------|
| INTEGER | INTEGER | Integer |
| BIGINT | BIGINT | Big integer |
| DECIMAL | NUMERIC(p,s) | Exact numeric |
| VARCHAR | VARCHAR(n) | Variable-length string |
| TEXT | TEXT | Large text |
| TIMESTAMP | TIMESTAMP | Timestamp |
| BLOB | BYTEA | Binary data |

### KingBase-Specific Features

```yaml
tables:
  - name: users
    schema: public
    columns:
      - name: id
        type: BIGSERIAL
        primaryKey: true
```

### Generated SQL Example

```sql
CREATE TABLE "users" (
  "id" BIGSERIAL PRIMARY KEY,
  "username" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL
);
```

### Official Documentation

- [KingBase Official Site](https://help.kingbase.com.cn/)
- [Data Type Reference](https://help.kingbase.com.cn/v8/development/sql-plsql/datatype.html)

## GBase (General Nanjing)

### Version Support

| Version | Status | Description |
|---------|--------|-------------|
| GBase 8s | Supported | Informix-like |
| GBase 8a | Supported | Analytical database |

### Connection Configuration

**JDBC Driver:**

```xml
<dependency>
    <groupId>com.gbase</groupId>
    <artifactId>gbasejdbc</artifactId>
    <version>8.8.0</version>
</dependency>
```

**Connection String (GBase 8s):**

```bash
jdbc:gbasedbt-sqli://{host}:{port}/{database}:GBASEDBTSERVER={server}
```

**Configuration Example (YAML):**

```yaml
databases:
  production:
    url: jdbc:gbasedbt-sqli://localhost:9088/mydb:GBASEDBTSERVER=gbase01
    driver: com.gbasedbt.jdbc.Driver
    username: informix
    password: password
    dialect: gbase8s
```

### Data Type Mapping

| JustDB Type | GBase 8s Type | Description |
|-------------|---------------|-------------|
| INTEGER | INTEGER | Integer |
| BIGINT | BIGINT | Big integer |
| DECIMAL | DECIMAL(p,s) | Exact numeric |
| VARCHAR | VARCHAR(n) | Variable-length string |
| TEXT | TEXT | Large text |
| DATETIME | DATETIME | Date time |
| BLOB | BLOB | Binary data |

### Official Documentation

- [GBase Official Site](http://www.gbase.cn/)
- [GBase Documentation](http://www.gbase.cn/community/)

## TiDB

### Version Support

| Version | Status |
|---------|--------|
| TiDB 7.x | Full Support |
| TiDB 6.x | Full Support |
| TiDB 5.x | Full Support |

### Connection Configuration

**JDBC Driver:**

TiDB is compatible with MySQL protocol, uses MySQL JDBC driver.

```xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>8.2.0</version>
</dependency>
```

**Connection String:**

```bash
jdbc:mysql://{host}[:{port}]/[{database}]
```

**Configuration Example (YAML):**

```yaml
databases:
  production:
    url: jdbc:mysql://localhost:4000/mydb
    driver: com.mysql.cj.jdbc.Driver
    username: root
    password: password
    dialect: mysql
```

### Data Type Mapping

TiDB is fully compatible with MySQL data types, refer to [MySQL documentation](./mysql.md).

### TiDB-Specific Features

```yaml
tables:
  - name: users
    engine: InnoDB  # TiDB uses InnoDB
    charset: utf8mb4
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
```

### Known Limitations

1. **No SPATIAL Type Support**: TiDB does not support MySQL's spatial data types
2. **No FULLTEXT Index**: Full-text indexes not yet supported
3. **Partial Function Limitations**: Some MySQL functions may not be fully supported

### Official Documentation

- [TiDB Official Site](https://www.pingcap.com/tidb/)
- [TiDB Documentation](https://docs.pingcap.com/tidb/stable)

## OceanBase

### Version Support

| Version | Status |
|---------|--------|
| OceanBase 4.x | Full Support |
| OceanBase 3.x | Full Support |
| OceanBase 2.x | Supported |

### Connection Configuration

**JDBC Driver:**

OceanBase MySQL mode is compatible with MySQL protocol, uses MySQL JDBC driver.

```xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>8.2.0</version>
</dependency>
```

**Connection String:**

```bash
jdbc:mysql://{host}[:{port}]/[{database}]
```

**Configuration Example (YAML):**

```yaml
databases:
  production:
    url: jdbc:mysql://localhost:2881/mydb
    driver: com.mysql.cj.jdbc.Driver
    username: root@sys
    password: password
    dialect: mysql
```

### Data Type Mapping

OceanBase MySQL mode is fully compatible with MySQL data types, refer to [MySQL documentation](./mysql.md).

### Known Limitations

1. **No SPATIAL Type Support**: OceanBase does not support MySQL's spatial data types
2. **Partial Feature Limitations**: Some MySQL advanced features may not be fully supported

### Official Documentation

- [OceanBase Official Site](https://www.oceanbase.com/)
- [OceanBase Documentation](https://www.oceanbase.com/docs)

## openGauss

### Version Support

| Version | Status |
|---------|--------|
| openGauss 5.x | Supported |
| openGauss 3.x | Supported |

### Connection Configuration

openGauss is compatible with PostgreSQL protocol, uses PostgreSQL JDBC driver.

**Connection String:**

```bash
jdbc:postgresql://{host}[:{port}]/[{database}]
```

**Configuration Example (YAML):**

```yaml
databases:
  production:
    url: jdbc:postgresql://localhost:5432/mydb
    driver: org.postgresql.Driver
    username: opengauss
    password: password
    dialect: postgresql
```

### Data Type Mapping

openGauss is compatible with PostgreSQL data types, refer to [PostgreSQL documentation](./postgresql.md).

### Official Documentation

- [openGauss Official Site](https://opengauss.org/zh/)
- [openGauss Documentation](https://docs-opengauss.osinfra.cn/zh/)

## Feature Comparison

| Feature | DM | KingBase | GBase | TiDB | OceanBase | openGauss |
|---------|:----:|:--------:|:-----:|:----:|:--------:|:---------:|
| **DDL** | | | | | | |
| CREATE TABLE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ALTER TABLE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| DROP TABLE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| CREATE INDEX | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Data Types** | | | | | | |
| INTEGER | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BIGINT | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| VARCHAR | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| TEXT | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| TIMESTAMP | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| BLOB | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Constraints** | | | | | | |
| PRIMARY KEY | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| FOREIGN KEY | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| UNIQUE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| CHECK | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Advanced Features** | | | | | | |
| AUTO_INCREMENT | Sequence | SERIAL | Sequence | ✓ | ✓ | SERIAL |
| IF EXISTS | Partial | ✓ | Partial | ✓ | ✓ | ✓ |
| SCHEMA | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Best Practices

### 1. Choose the Appropriate Dialect

Select the dialect based on the Chinese database's compatibility:

- **DM**: Use `dameng` dialect
- **KingBase**: Use `kingbase` dialect
- **GBase 8s**: Use `gbase8s` dialect
- **TiDB**: Use `mysql` dialect
- **OceanBase**: Use `mysql` dialect
- **openGauss**: Use `postgresql` dialect

### 2. Note Data Type Differences

Data types in different Chinese databases may vary slightly, recommended:

```yaml
# Use generic data types
tables:
  - name: users
    columns:
      - name: id
        type: BIGINT  # Use generic type
      - name: username
        type: VARCHAR(255)  # Not VARCHAR2
      - name: content
        type: TEXT  # Not CLOB
```

### 3. Utilize Compatibility Mode

Some Chinese databases provide compatibility modes:

```yaml
# DM Oracle compatibility mode
databases:
  production:
    url: jdbc:dm://localhost:5236?compatibilityMode=oracle
    dialect: dameng
```

### 4. Test Compatibility

Perform thorough testing before migration:

```bash
# Use JustDB to generate SQL
justdb schema2sql -s schema.yaml -o output.sql -d dameng

# Check generated SQL
cat output.sql
```

## Migration Guide

### Migrate from MySQL to Chinese Databases

1. **TiDB/OceanBase**: Almost zero changes needed
2. **DM/KingBase**: Need to adjust data types and syntax
3. **GBase**: Need to adjust stored procedures and triggers

### Migrate from Oracle to Chinese Databases

1. **DM**: Highly compatible, minimal changes
2. **KingBase**: Need to adjust PL/SQL code
3. **openGauss**: Need to adjust data types and functions

### Migrate from PostgreSQL to Chinese Databases

1. **KingBase**: Highly compatible
2. **openGauss**: Highly compatible
3. **DM**: Need to adjust syntax

## Related Documentation

- [Database Support Overview](./README.md)
- [MySQL Documentation](./mysql.md)
- [PostgreSQL Documentation](./postgresql.md)
- [Oracle Documentation](./oracle.md)
