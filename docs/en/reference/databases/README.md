---
icon: database
title: Database Support Overview
order: 30
category:
  - Reference
  - Databases
tag:
  - database
  - support
---

# Database Support Overview

JustDB supports 30+ database platforms, providing automatic SQL generation and dialect-specific optimizations.

## Supported Databases

### Fully Supported

| Database | Versions | Status | Notes |
|----------|----------|--------|-------|
| **MySQL** | 5.7+, 8.0+ | ✓ Stable | Full support |
| **MariaDB** | 10.3+ | ✓ Stable | MySQL-compatible |
| **PostgreSQL** | 11+, 12+, 13+, 14+ | ✓ Stable | Full support |
| **Oracle** | 11g, 12c, 19c, 21c | ✓ Stable | Enterprise features |
| **SQL Server** | 2017+, 2019+, 2022 | ✓ Stable | Full support |
| **SQLite** | 3.x | ✓ Stable | Embedded database |
| **H2** | 2.x | ✓ Stable | Development/testing |
| **HSQLDB** | 2.x | ✓ Stable | Embedded database |

### Extended Support

| Database | Versions | Status | Notes |
|----------|----------|--------|-------|
| **DB2** | 9.7+ | ✓ Supported | IBM DB2 |
| **Derby** | 10.x | ✓ Supported | Apache Derby |
| **Informix** | 12.x | ✓ Supported | IBM Informix |
| **Sybase** | 16.x | ✓ Supported | SAP Sybase |
| **TimescaleDB** | 1.x, 2.x | ✓ Supported | PostgreSQL extension |
| **CockroachDB** | 20.x+ | ✓ Supported | PostgreSQL-compatible |
| **Redshift** | Latest | ✓ Supported | Amazon Redshift |
| **TiDB** | 5.x+ | ✓ Supported | MySQL-compatible |
| **GBase** | 8a | ✓ Supported | MySQL-compatible |
| **KingBase** | V8 | ✓ Supported | PostgreSQL-compatible |
| **DM** (Dameng) | 8 | ✓ Supported | Oracle-compatible |
| **OceanBase** | 2.x, 3.x | ✓ Supported | MySQL/Oracle mode |
| **GaiaDB** | Latest | ✓ Supported | MySQL-compatible |

## Database Lineage

JustDB groups databases by lineage for efficient template sharing:

### MySQL Lineage
- MySQL, MariaDB, TiDB, GBase, OceanBase (MySQL mode), GaiaDB

**Characteristics**:
- Backtick identifiers
- AUTO_INCREMENT syntax
- InnoDB storage engine

### PostgreSQL Lineage
- PostgreSQL, TimescaleDB, CockroachDB, Redshift, KingBase

**Characteristics**:
- Double quote identifiers
- SERIAL/BIGSERIAL for auto-increment
- No inline auto-increment

### ANSI SQL Lineage
- Oracle, DB2, Derby, HSQLDB, Dameng

**Characteristics**:
- ANSI SQL standard syntax
- IDENTITY for auto-increment
- Case-insensitive identifiers

### SQL Server Lineage
- SQL Server

**Characteristics**:
- Bracket identifiers [ ]
- IDENTITY syntax
- NVARCHAR for Unicode

### SQLite Lineage
- SQLite

**Characteristics**:
- Lightweight syntax
- AUTOINCREMENT keyword
- Limited ALTER TABLE support

## Feature Support Matrix

| Feature | MySQL | PostgreSQL | Oracle | SQL Server | SQLite | H2 |
|---------|-------|------------|--------|------------|--------|-----|
| Tables | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Columns | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Indexes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Foreign Keys | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Views | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Triggers | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Stored Procedures | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| Sequences | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| Auto Increment | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Comments | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Schemas | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |

## Type Mapping

JustDB automatically maps database-agnostic types to database-specific types:

### Common Types

| JustDB Type | MySQL | PostgreSQL | Oracle | SQL Server | SQLite |
|-------------|-------|------------|--------|------------|--------|
| BIGINT | BIGINT | BIGINT | NUMBER(19) | BIGINT | INTEGER |
| INT | INT | INTEGER | NUMBER(10) | INT | INTEGER |
| SMALLINT | SMALLINT | SMALLINT | NUMBER(5) | SMALLINT | SMALLINT |
| TINYINT | TINYINT | SMALLINT | NUMBER(3) | TINYINT | SMALLINT |
| VARCHAR(n) | VARCHAR(n) | VARCHAR(n) | VARCHAR2(n) | NVARCHAR(n) | VARCHAR(n) |
| CHAR(n) | CHAR(n) | CHAR(n) | CHAR(n) | NCHAR(n) | CHAR(n) |
| TEXT | TEXT | TEXT | CLOB | NVARCHAR(MAX) | TEXT |
| DECIMAL(p,s) | DECIMAL(p,s) | DECIMAL(p,s) | NUMBER(p,s) | DECIMAL(p,s) | DECIMAL(p,s) |
| BOOLEAN | TINYINT(1) | BOOLEAN | NUMBER(1) | BIT | INTEGER |
| DATE | DATE | DATE | DATE | DATE | TEXT |
| TIME | TIME | TIME | TIMESTAMP | TIME | TEXT |
| TIMESTAMP | TIMESTAMP | TIMESTAMP | TIMESTAMP | DATETIME2 | TEXT |
| BLOB | LONGBLOB | BYTEA | BLOB | VARBINARY(MAX) | BLOB |
| CLOB | LONGTEXT | TEXT | CLOB | NVARCHAR(MAX) | TEXT |

See individual database documentation for complete type mappings.

## Database-Specific Features

### MySQL/MariaDB

```yaml
Table:
  - name: users
    engine: InnoDB          # MySQL-specific
    charset: utf8mb4
    collation: utf8mb4_unicode_ci
    Column:
      - name: id
        type: BIGINT
        autoIncrement: true
```

### PostgreSQL

```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        autoIncrement: true  # Uses SERIAL
      - name: data
        type: JSONB          # PostgreSQL-specific
```

### Oracle

```yaml
Table:
  - name: users
    schema: MYSCHEMA        # Oracle schema
    Column:
      - name: id
        type: BIGINT
        autoIncrement: true  # Uses IDENTITY
      - name: data
        type: CLOB
```

### SQL Server

```yaml
Table:
  - name: users
    schema: dbo             # SQL Server schema
    Column:
      - name: id
        type: BIGINT
        autoIncrement: true  # Uses IDENTITY
      - name: name
        type: NVARCHAR(100)  # Unicode support
```

## Connection Strings

### MySQL
```
jdbc:mysql://localhost:3306/database
```

### PostgreSQL
```
jdbc:postgresql://localhost:5432/database
```

### Oracle
```
jdbc:oracle:thin:@localhost:1521:ORCL
```

### SQL Server
```
jdbc:sqlserver://localhost:1433;databaseName=database
```

### SQLite
```
jdbc:sqlite:path/to/database.db
```

### H2
```
jdbc:h2:mem:testdb
jdbc:h2:file:/path/to/database
```

## Best Practices

### 1. Use Database-Agnostic Types

```yaml
# Good: Database-agnostic
Column:
  - name: id
    type: BIGINT

# Avoid: Database-specific (unless needed)
Column:
  - name: id
    type: NUMBER(19)  # Oracle-specific
```

### 2. Test on Target Database

```bash
# Validate schema for specific database
justdb validate --dialect postgresql schema.yaml
```

### 3. Use Conditional SQL

```yaml
Table:
  - name: users
    afterCreates:
      - dbms: [postgresql, timescaledb]
        content: CREATE INDEX CONCURRENTLY idx_users_username ON users(username);
      - dbms: mysql
        content: CREATE INDEX idx_users_username ON users(username);
```

## Related Documentation

- [MySQL/MariaDB](./mysql.md) - MySQL specifics *(Coming soon)*
- [PostgreSQL](./postgresql.md) - PostgreSQL specifics *(Coming soon)*
- [Oracle](./oracle.md) - Oracle specifics *(Coming soon)*
- [SQL Server](./sqlserver.md) - SQL Server specifics *(Coming soon)*
- [SQLite](./sqlite.md) - SQLite specifics *(Coming soon)*
- [H2/HSQLDB](./h2.md) - Embedded databases *(Coming soon)*
- [Other Databases](./others.md) - Other supported databases *(Coming soon)*
