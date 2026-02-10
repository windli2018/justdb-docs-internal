# SQLite Database Support

JustDB provides complete SQLite database support, suitable for embedded scenarios and mobile applications.

## Version Support

| Version | Status | Notes |
|---------|--------|-------|
| SQLite 3.x | Full Support | Recommend using latest version |
| SQLite 3.35.0+ | Full Support | Supports DROP COLUMN |
| SQLite 3.25.0+ | Supported | Supports RENAME COLUMN |

## Connection Configuration

### JDBC Driver

```xml
<dependency>
    <groupId>org.xerial</groupId>
    <artifactId>sqlite-jdbc</artifactId>
    <version>3.42.0.0</version>
</dependency>
```

### Connection String

```bash
# Basic format
jdbc:sqlite:{file}

# Examples
jdbc:sqlite:sample.db
jdbc:sqlite:/path/to/database.db
jdbc:sqlite:C:/data/mydb.db

# In-memory database
jdbc:sqlite::memory:
jdbc:sqlite:memory:
```

### Configuration Examples

**YAML:**
```yaml
databases:
  production:
    url: jdbc:sqlite:./data/mydb.db
    driver: org.sqlite.JDBC
    username: ""
    password: ""
    dialect: sqlite
```

**JSON:**
```json
{
  "databases": {
    "production": {
      "url": "jdbc:sqlite:./data/mydb.db",
      "driver": "org.sqlite.JDBC",
      "username": "",
      "password": "",
      "dialect": "sqlite"
    }
  }
}
```

**XML:**
```xml
<databases>
  <database id="production">
    <url>jdbc:sqlite:./data/mydb.db</url>
    <driver>org.sqlite.JDBC</driver>
    <username></username>
    <password></password>
    <dialect>sqlite</dialect>
  </database>
</databases>
```

## Data Type Mapping

### Numeric Types

| JustDB Type | SQLite Type | JDBC Type | Java Type | Description |
|-------------|-------------|-----------|-----------|-------------|
| INTEGER | INTEGER | INTEGER | Integer/Long | Integer (auto-sizing) |
| BIGINT | INTEGER | BIGINT | Long | Long integer |
| SMALLINT | INTEGER | SMALLINT | Integer | Short integer |
| TINYINT | INTEGER | TINYINT | Integer | Byte integer |
| DECIMAL | REAL | DECIMAL | BigDecimal | Floating point |
| FLOAT | REAL | FLOAT | Double | Floating point |
| DOUBLE | REAL | DOUBLE | Double | Double precision float |
| REAL | REAL | REAL | Double | Floating point |

### String Types

| JustDB Type | SQLite Type | JDBC Type | Java Type | Description |
|-------------|-------------|-----------|-----------|-------------|
| CHAR | TEXT | CHAR | String | String |
| VARCHAR | TEXT | VARCHAR | String | String |
| TEXT | TEXT | LONGVARCHAR | String | Text |
| CLOB | TEXT | CLOB | String | Large text |
| NVARCHAR | TEXT | NVARCHAR | String | Unicode string |
| NCHAR | TEXT | NCHAR | String | Unicode string |

### Date/Time Types

| JustDB Type | SQLite Type | JDBC Type | Java Type | Description |
|-------------|-------------|-----------|-----------|-------------|
| DATE | TEXT | VARCHAR | String | Date string (ISO8601) |
| TIME | TEXT | VARCHAR | String | Time string (ISO8601) |
| TIMESTAMP | TEXT | VARCHAR | String | Timestamp string (ISO8601) |
| DATETIME | TEXT | VARCHAR | String | Date and time string (ISO8601) |

### Binary Types

| JustDB Type | SQLite Type | JDBC Type | Java Type | Description |
|-------------|-------------|-----------|-----------|-------------|
| BINARY | BLOB | BINARY | byte[] | Binary data |
| VARBINARY | BLOB | VARBINARY | byte[] | Binary data |
| BLOB | BLOB | BLOB | byte[] | Binary large object |

### Other Types

| JustDB Type | SQLite Type | JDBC Type | Java Type | Description |
|-------------|-------------|-----------|-----------|-------------|
| BOOLEAN | INTEGER | BIT | Boolean | Boolean (0/1) |
| NUMERIC | NUMERIC | NUMERIC | BigDecimal | Numeric |

## SQLite-Specific Features

### AUTOINCREMENT

SQLite uses AUTOINCREMENT keyword:

```yaml
tables:
  - name: users
    columns:
      - name: id
        type: INTEGER
        primaryKey: true
        autoIncrement: true  # Generates AUTOINCREMENT
```

### WITHOUT ROWID

SQLite supports tables without row ID:

```yaml
tables:
  - name: config
    withoutRowId: true
    columns:
      - name: key
        type: TEXT
        primaryKey: true
      - name: value
        type: TEXT
```

### Temporary Table

```yaml
tables:
  - name: temp_cache
    temporary: true
    columns:
      - name: key
        type: TEXT
        primaryKey: true
```

## Generated SQL Examples

### CREATE TABLE

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### ALTER TABLE

```sql
-- Add column (SQLite 3.25.0+)
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';

-- Rename column (SQLite 3.25.0+)
ALTER TABLE users RENAME COLUMN username TO login_name;

-- Drop column (SQLite 3.35.0+)
ALTER TABLE users DROP COLUMN status;

-- Rename table
ALTER TABLE users RENAME TO users_new;
```

### CREATE INDEX

```sql
CREATE INDEX IF NOT EXISTS idx_username ON users (username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email ON users (email);
```

### DROP TABLE

```sql
DROP TABLE IF EXISTS users;
```

## Known Limitations

### ALTER TABLE Limitations

SQLite has limited ALTER TABLE support:

1. **Modify Column Type**: Doesn't support direct column type modification
2. **Drop Column**: SQLite 3.35.0+ only supports DROP COLUMN
3. **Rename Column**: SQLite 3.25.0+ only supports RENAME COLUMN
4. **Add Constraints**: Doesn't support adding constraints via ALTER TABLE

### Data Type Limitations

1. **Weak Typing**: SQLite uses dynamic type system
2. **Date/Time**: No native date/time types, uses TEXT/REAL/INTEGER storage
3. **BOOLEAN**: Uses INTEGER 0/1 to represent

### Other Limitations

1. **Foreign Keys**: Foreign key constraints not enabled by default
2. **Triggers**: Supported but syntax is relatively simple
3. **Views**: Supported but updating views has limitations

## Compatibility Notes

### SQLite Version Differences

| Version | Features |
|---------|----------|
| 3.35.0+ | Supports DROP COLUMN |
| 3.25.0+ | Supports RENAME COLUMN |
| 3.9.0+ | Supports expression indexes |
| 3.8.3+ | Supports CTE (WITH clause) |

## Best Practices

### 1. Enable Foreign Key Constraints

```bash
jdbc:sqlite:mydb.db?foreign_keys=on
```

### 2. Use TEXT for Date/Time Storage

```yaml
tables:
  - name: users
    columns:
      - name: created_at
        type: TEXT  # ISO8601 format string
        defaultValueComputed: "CURRENT_TIMESTAMP"
```

### 3. Use INTEGER as Primary Key

```yaml
tables:
  - name: users
    columns:
      - name: id
        type: INTEGER
        primaryKey: true
        autoIncrement: true
```

### 4. Leverage WITHOUT ROWID for Performance

```yaml
tables:
  - name: config
    withoutRowId: true  # Reduce storage and improve performance
```

### 5. Use Transactions for Performance

```yaml
# JustDB uses transactions by default
databases:
  production:
    url: jdbc:sqlite:mydb.db?journal_mode=WAL
    dialect: sqlite
```

## Use Cases

### 1. Mobile Applications

SQLite is ideal for mobile applications:

```yaml
databases:
  mobile:
    url: jdbc:sqlite:/data/data/com.myapp/files/database.db
    dialect: sqlite
```

### 2. Desktop Applications

Embedded database solution:

```yaml
databases:
  desktop:
    url: jdbc:sqlite:~/Library/Application Support/MyApp/database.db
    dialect: sqlite
```

### 3. Small Websites

Database solution for low-traffic websites:

```yaml
databases:
  web:
    url: jdbc:sqlite:/var/www/myapp/data/database.db
    dialect: sqlite
```

### 4. Testing and Development

Rapid prototype development:

```yaml
databases:
  test:
    url: jdbc:sqlite::memory:
    dialect: sqlite
```

## Performance Optimization

### 1. Use WAL Mode

```bash
jdbc:sqlite:mydb.db?journal_mode=WAL
```

### 2. Adjust Cache Size

```bash
jdbc:sqlite:mydb.db?cache_size=-10000
```

### 3. Disable Synchronization (Test Environment)

```bash
jdbc:sqlite:mydb.db?synchronous=OFF
```

### 4. Use In-Memory Database

```bash
jdbc:sqlite::memory:
```

## Connection Pool Configuration

SQLite recommends single connection or few connections:

```yaml
databases:
  production:
    url: jdbc:sqlite:./data/mydb.db
    dialect: sqlite
    pool:
      maxSize: 1  # SQLite recommends single connection
      minIdle: 1
```

## Migration Recommendations

### From MySQL to SQLite

1. **AUTO_INCREMENT → AUTOINCREMENT**
2. **VARCHAR → TEXT**
3. **DATETIME → TEXT** (ISO8601 format)
4. **BLOB → BLOB** (same)

### From PostgreSQL to SQLite

1. **SERIAL → INTEGER PRIMARY KEY AUTOINCREMENT**
2. **VARCHAR → TEXT**
3. **TIMESTAMP → TEXT** (ISO8601 format)
4. **BOOLEAN → INTEGER**

## Related Documentation

- [SQLite Official Documentation](https://www.sqlite.org/docs.html)
- [SQLite Data Type Reference](https://www.sqlite.org/datatype3.html)
- [Database Support Overview](./README.md)
