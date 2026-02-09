---
icon: database
title: Database Support
order: 5
---

# Database Reference

Database support and configuration for JustDB.

## Supported Databases

### MySQL Family

| Database | Dialect | Support Level |
|----------|---------|---------------|
| MySQL | `mysql` | Full |
| MariaDB | `mariadb` | Full |
| TiDB | `tidb` | Full |
| GBase | `gbase` | Full |

**Features:**
- Auto-increment columns
- Foreign keys with cascading
- Indexes (BTREE, HASH, FULLTEXT)
- Views
- Stored procedures

**Connection URL:**
```bash
jdbc:mysql://{{host}}:{{port}}/{{database}}
```

### PostgreSQL Family

| Database | Dialect | Support Level |
|----------|---------|---------------|
| PostgreSQL | `postgresql` | Full |
| Redshift | `redshift` | Basic |
| TimescaleDB | `timescaledb` | Full |
| KingBase | `kingbase` | Full |

**Features:**
- Sequences
- Serial columns
- Foreign keys
- Indexes (BTREE, HASH, GiST, GIN)
- Arrays, JSONB
- Extensions

**Connection URL:**
```bash
jdbc:postgresql://{{host}}:{{port}}/{{database}}
```

### Oracle Family

| Database | Dialect | Support Level |
|----------|---------|---------------|
| Oracle | `oracle` | Full |
| DB2 | `db2` | Full |
| Derby | `derby` | Basic |
| HSQLDB | `hsqldb` | Basic |
| Dameng | `dameng` | Full |

**Features:**
- Sequences
- Synonyms
- Packages
- Materialized views
- PL/SQL

**Connection URL:**
```bash
jdbc:oracle:thin:@{{host}}:{{port}}:{{database}}
```

### SQL Server

| Database | Dialect | Support Level |
|----------|---------|---------------|
| SQL Server | `sqlserver` | Full |

**Features:**
- Identity columns
- Foreign keys
- Indexes (clustered, non-clustered)
- Views
- Stored procedures
- Triggers

**Connection URL:**
```bash
jdbc:sqlserver://{{host}}:{{port}};databaseName={{database}}
```

### SQLite Family

| Database | Dialect | Support Level |
|----------|---------|---------------|
| SQLite | `sqlite` | Full |
| H2 | `h2` | Full |

**Features:**
- Auto-increment
- Foreign keys
- Indexes
- Views
- Triggers

**Connection URL:**
```bash
jdbc:sqlite:{{database}}
jdbc:h2:{{database}}
```

## Type Mappings

### Common Types

| Java Type | MySQL | PostgreSQL | Oracle | SQL Server | SQLite |
|-----------|-------|------------|--------|------------|---------|
| `String` | VARCHAR | VARCHAR | VARCHAR2 | NVARCHAR | TEXT |
| `int` | INT | INTEGER | NUMBER | INT | INTEGER |
| `long` | BIGINT | BIGINT | NUMBER | BIGINT | INTEGER |
| `double` | DOUBLE | DOUBLE PRECISION | BINARY_DOUBLE | FLOAT | REAL |
| `boolean` | TINYINT(1) | BOOLEAN | NUMBER(1) | BIT | INTEGER |
| `Date` | DATETIME | TIMESTAMP | DATE | DATETIME | TEXT |
| `byte[]` | BLOB | BYTEA | BLOB | VARBINARY | BLOB |
| `BigDecimal` | DECIMAL | NUMERIC | NUMBER | DECIMAL | REAL |

## Database-Specific Features

### MySQL

**Engine:**
```yaml
Table:
  - name: users
    engine: InnoDB
    rowFormat: COMPRESSED
```

**Auto-increment:**
```yaml
Column:
  - name: id
    type: BIGINT
    autoIncrement: true
```

### PostgreSQL

**Sequences:**
```yaml
Sequence:
  - name: users_id_seq
    startWith: 1000
```

**Serial columns:**
```yaml
Column:
  - name: id
    type: SERIAL
```

### Oracle

**Sequences:**
```yaml
Sequence:
  - name: users_seq
    startWith: 1
    incrementBy: 1
```

**Triggers:**
```yaml
Table:
  - name: users
    beforeInserts:
      - sql: |
          BEGIN
            SELECT users_seq.NEXTVAL INTO :NEW.id FROM DUAL;
          END;
```

### SQL Server

**Identity:**
```yaml
Column:
  - name: id
    type: INT
    identity: true
    identityStart: 1
    identityIncrement: 1
```

## Configuration

### Dialect Configuration

```yaml
# justdb-config.yaml
database:
  dialect: mysql
  url: jdbc:mysql://localhost:3306/myapp
  username: root
  password: password

# Override default type mapping
database:
  dialect: postgresql
  typeMapping:
    String: VARCHAR(255)
    Integer: INTEGER
    Long: BIGINT
```

### URL Parameters

```yaml
database:
  # MySQL with parameters
  url: jdbc:mysql://localhost:3306/myapp?useSSL=false&serverTimezone=UTC

  # PostgreSQL with parameters
  url: jdbc:postgresql://localhost:5432/myapp?sslmode=disable

  # Oracle with TNS
  url: jdbc:oracle:thin:@localhost:1521:ORCL
```

## Best Practices

### 1. Choose Appropriate Types

```yaml
# Good: Appropriate size
Column:
  - name: username
    type: VARCHAR(50)

# Bad: Unnecessarily large
Column:
  - name: username
    type: TEXT
```

### 2. Use Constraints

```yaml
Column:
  - name: email
    type: VARCHAR(255)
    nullable: false
    unique: true
```

### 3. Add Comments

```yaml
Table:
  - name: users
    comment: "User account information"

Column:
  - name: id
    type: BIGINT
    comment: "Primary key"
```

### 4. Index Appropriately

```yaml
Index:
  - name: idx_username
    columns: [username]
    unique: true

  - name: idx_email_status
    columns: [email, status]
```

## Next Steps

- **[Quick Start](/getting-started/)** - Get started quickly
- **[Schema Reference](/reference/schema/)** - Schema definitions
- **[CLI Reference](/reference/cli/)** - Command-line tools
