# Oracle Database Support

JustDB provides Oracle database support, including Oracle 11g and above.

## Version Support

| Version | Status | Notes |
|---------|--------|-------|
| Oracle 23c | Full Support | Latest version |
| Oracle 21c | Full Support | Long-term support version |
| Oracle 19c | Full Support | Long-term support version |
| Oracle 18c | Full Support | Stable version |
| Oracle 12c | Full Support | Stable version |
| Oracle 11g | Supported | Basic functionality support |

## Connection Configuration

### JDBC Driver

```xml
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc11</artifactId>
    <version>23.2.0.0</version>
</dependency>
```

### Connection String

```bash
# Basic format (Thin mode)
jdbc:oracle:thin:@{host}[:{port}]/[{database}]

# Examples
jdbc:oracle:thin:@localhost:1521/orcl
jdbc:oracle:thin:@192.168.1.100:1521/orcl

# Service Name format
jdbc:oracle:thin:@{host}:{port}/{service_name}

# SID format (legacy)
jdbc:oracle:thin:@{host}:{port}:{sid}

# TNS format
jdbc:oracle:thin:@{tns_alias}
```

### Configuration Examples

**YAML:**
```yaml
databases:
  production:
    url: jdbc:oracle:thin:@localhost:1521/orcl
    driver: oracle.jdbc.OracleDriver
    username: system
    password: oracle
    dialect: oracle
```

**JSON:**
```json
{
  "databases": {
    "production": {
      "url": "jdbc:oracle:thin:@localhost:1521/orcl",
      "driver": "oracle.jdbc.OracleDriver",
      "username": "system",
      "password": "oracle",
      "dialect": "oracle"
    }
  }
}
```

**XML:**
```xml
<databases>
  <database id="production">
    <url>jdbc:oracle:thin:@localhost:1521/orcl</url>
    <driver>oracle.jdbc.OracleDriver</driver>
    <username>system</username>
    <password>oracle</password>
    <dialect>oracle</dialect>
  </database>
</databases>
```

## Data Type Mapping

### Numeric Types

| JustDB Type | Oracle Type | JDBC Type | Java Type | Description |
|-------------|-------------|-----------|-----------|-------------|
| INTEGER | NUMBER(10) | INTEGER | Integer | Integer |
| BIGINT | NUMBER(19) | BIGINT | Long | Long integer |
| SMALLINT | NUMBER(5) | SMALLINT | Integer | Short integer |
| DECIMAL | NUMBER(p,s) | NUMERIC | BigDecimal | Exact numeric |
| FLOAT | FLOAT | FLOAT | Double | Floating point |
| DOUBLE | BINARY_DOUBLE | DOUBLE | Double | Double precision |
| REAL | BINARY_FLOAT | FLOAT | Float | Single precision |
| NUMBER | NUMBER | NUMERIC | BigDecimal | Numeric |

### String Types

| JustDB Type | Oracle Type | JDBC Type | Java Type | Description |
|-------------|-------------|-----------|-----------|-------------|
| CHAR | CHAR(n) | CHAR | String | Fixed-length string |
| VARCHAR | VARCHAR2(n) | VARCHAR | String | Variable-length string |
| VARCHAR2 | VARCHAR2(n) | VARCHAR | String | Variable-length string (recommended) |
| CLOB | CLOB | CLOB | String | Large text |
| LONG | LONG | LONGVARCHAR | String | Long text (deprecated) |
| NVARCHAR | NVARCHAR2(n) | NVARCHAR | String | Unicode string |
| NCHAR | NCHAR(n) | NCHAR | String | Unicode fixed-length |

### Date/Time Types

| JustDB Type | Oracle Type | JDBC Type | Java Type | Description |
|-------------|-------------|-----------|-----------|-------------|
| DATE | DATE | TIMESTAMP | Timestamp | Date and time (includes time) |
| TIMESTAMP | TIMESTAMP | TIMESTAMP | Timestamp | Timestamp |
| TIMESTAMPTZ | TIMESTAMP WITH TIME ZONE | TIMESTAMPTZ | Timestamp | Timestamp (with timezone) |
| TIMESTAMPLTZ | TIMESTAMP WITH LOCAL TIME ZONE | TIMESTAMP | Timestamp | Timestamp (local timezone) |
| INTERVAL | INTERVAL YEAR TO MONTH | VARCHAR | String | Time interval |

### Binary Types

| JustDB Type | Oracle Type | JDBC Type | Java Type | Description |
|-------------|-------------|-----------|-----------|-------------|
| BLOB | BLOB | BLOB | byte[] | Binary large object |
| RAW | RAW(n) | BINARY | byte[] | Fixed-length binary |
| LONG RAW | LONG RAW | LONGVARBINARY | byte[] | Long binary (deprecated) |

### ROWID Types

| JustDB Type | Oracle Type | JDBC Type | Java Type | Description |
|-------------|-------------|-----------|-----------|-------------|
| ROWID | ROWID | ROWID | String | Row identifier |

## Oracle-Specific Features

### Sequences

Oracle uses Sequence to implement auto-increment functionality:

```yaml
sequences:
  - name: user_id_seq
    startWith: 1
    incrementBy: 1
    minValue: 1
    maxValue: 999999999999999999999
    cycle: false
    cache: 20
```

### Tablespaces

```yaml
tables:
  - name: users
    tablespace: USERS
    columns:
      - name: id
        type: INTEGER
        primaryKey: true
```

### Storage Parameters

```yaml
tables:
  - name: users
    storage:
      initial: 100K
      next: 100K
      minExtents: 1
      maxExtents: UNLIMITED
      pctIncrease: 0
```

### Comments

Oracle supports table and column comments:

```yaml
tables:
  - name: users
    comment: "User information table"
    columns:
      - name: email
        type: VARCHAR2(255)
        comment: "User email address"
```

## Generated SQL Examples

### CREATE TABLE

```sql
CREATE TABLE "users" (
  "id" NUMBER(10) PRIMARY KEY,
  "username" VARCHAR2(255) NOT NULL,
  "email" VARCHAR2(255) NOT NULL,
  "created_at" TIMESTAMP DEFAULT SYSTIMESTAMP
);

COMMENT ON TABLE "users" IS 'User information table';
COMMENT ON COLUMN "users"."email" IS 'User email address';
```

### CREATE SEQUENCE

```sql
CREATE SEQUENCE "user_id_seq"
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 999999999999999999999
  NOCYCLE
  CACHE 20;
```

### ALTER TABLE

```sql
-- Add column
ALTER TABLE "users" ADD ("status" VARCHAR2(50) DEFAULT 'active' NOT NULL);

-- Modify column type
ALTER TABLE "users" MODIFY ("email" VARCHAR2(500));

-- Rename column (requires rebuild)
-- Oracle 12c+ supports direct rename
ALTER TABLE "users" RENAME COLUMN "username" TO "login_name";

-- Drop column
ALTER TABLE "users" DROP COLUMN "status";
```

### CREATE INDEX

```sql
CREATE INDEX "idx_username" ON "users" ("username");
CREATE UNIQUE INDEX "idx_email" ON "users" ("email");
```

### DROP TABLE

```sql
-- Oracle doesn't support IF EXISTS
DROP TABLE "users";
```

## Known Limitations

### Unsupported Features

1. **IF EXISTS/IF NOT EXISTS**: Oracle doesn't support these syntaxes, requires manual checking
2. **IDENTITY**: Oracle 12c+ supports IDENTITY columns, but JustDB uses Sequence
3. **CASCADE**: Oracle's CASCADE delete has special rules
4. **RENAME COLUMN**: Oracle 12c+ only supports direct column rename

### Data Type Limitations

1. **VARCHAR**: Oracle recommends using VARCHAR2 instead of VARCHAR
2. **AUTO_INCREMENT**: Oracle doesn't support, need to use Sequence + Trigger
3. **BOOLEAN**: Oracle doesn't have BOOLEAN type, use NUMBER(1) or CHAR(1)

### Other Limitations

1. **Column Rename**: Oracle 11g and below don't support direct column rename
2. **Table Rename**: Requires rebuilding all dependent objects
3. **Modify Column Type**: Some type conversions require special handling

## Best Practices

### 1. Use Sequence for Auto-Increment

```yaml
sequences:
  - name: user_id_seq
    startWith: 1
    incrementBy: 1
    cache: 20

tables:
  - name: users
    columns:
      - name: id
        type: INTEGER
        primaryKey: true
        defaultValueComputed: "user_id_seq.NEXTVAL"
```

### 2. Use VARCHAR2 Instead of VARCHAR

```yaml
tables:
  - name: users
    columns:
      - name: username
        type: VARCHAR2(255)  # Recommended to use VARCHAR2
```

### 3. Use TIMESTAMP Instead of DATE

```yaml
tables:
  - name: users
    columns:
      - name: created_at
        type: TIMESTAMP
        defaultValueComputed: "SYSTIMESTAMP"
```

### 4. Use Tablespaces to Organize Tables

```yaml
tables:
  - name: users
    tablespace: USERS  # Organize tables into different tablespaces
```

### 5. Leverage COMMENT for Documentation

```yaml
tables:
  - name: users
    comment: "User information table"
    columns:
      - name: email
        type: VARCHAR2(255)
        comment: "User email address, used for login and notifications"
```

### 6. Use NVARCHAR2 for Unicode Storage

```yaml
tables:
  - name: users
    columns:
      - name: chinese_name
        type: NVARCHAR2(100)  # Supports multi-language characters
```

## Migration Recommendations

### Migrating from MySQL to Oracle

1. **AUTO_INCREMENT → Sequence**
2. **VARCHAR → VARCHAR2**
3. **TEXT → CLOB**
4. **DATETIME → TIMESTAMP**
5. **TINYINT(1) → NUMBER(1)**

### Migrating from PostgreSQL to Oracle

1. **SERIAL → Sequence**
2. **VARCHAR → VARCHAR2**
3. **JSONB → CLOB** (store JSON string)

## Related Documentation

- [Oracle Official Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/)
- [Oracle Data Type Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Data-Types.html)
- [Database Support Overview](./README.md)
