# MySQL Database Support

JustDB provides complete MySQL database support, including MySQL 5.x and MySQL 8.x versions.

## Version Support

| Version | Status | Notes |
|---------|--------|-------|
| MySQL 8.x | Full Support | Recommended, supports all features |
| MySQL 5.7 | Full Support | Stable version |
| MySQL 5.6 | Supported | Basic functionality support |
| MySQL 5.5 | Supported | Basic functionality support |

## Connection Configuration

### JDBC Driver

```xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>8.2.0</version>
</dependency>
```

### Connection String

```bash
# Basic format
jdbc:mysql://{host}[:{port}]/[{database}]

# Examples
jdbc:mysql://localhost:3306/mydb
jdbc:mysql://192.168.1.100:3306/mydb
```

### Configuration Examples

**YAML:**
```yaml
databases:
  production:
    url: jdbc:mysql://localhost:3306/mydb
    driver: com.mysql.cj.jdbc.Driver
    username: root
    password: secret
    dialect: mysql
    properties:
      useSSL: false
      characterEncoding: utf8mb4
      serverTimezone: Asia/Shanghai
```

**JSON:**
```json
{
  "databases": {
    "production": {
      "url": "jdbc:mysql://localhost:3306/mydb",
      "driver": "com.mysql.cj.jdbc.Driver",
      "username": "root",
      "password": "secret",
      "dialect": "mysql"
    }
  }
}
```

**XML:**
```xml
<databases>
  <database id="production">
    <url>jdbc:mysql://localhost:3306/mydb</url>
    <driver>com.mysql.cj.jdbc.Driver</driver>
    <username>root</username>
    <password>secret</password>
    <dialect>mysql</dialect>
  </database>
</databases>
```

## Data Type Mapping

### Numeric Types

| JustDB Type | MySQL Type | JDBC Type | Java Type | Description |
|-------------|------------|-----------|-----------|-------------|
| TINYINT | TINYINT | TINYINT | Integer | 1-byte integer |
| SMALLINT | SMALLINT | SMALLINT | Integer | 2-byte integer |
| INTEGER | INT | INTEGER | Integer | 4-byte integer |
| BIGINT | BIGINT | BIGINT | Long | 8-byte integer |
| DECIMAL | DECIMAL | DECIMAL | BigDecimal | Exact numeric |
| FLOAT | FLOAT | FLOAT | Double | Single-precision float |
| DOUBLE | DOUBLE | DOUBLE | Double | Double-precision float |
| BIT | BIT | BIT | Integer | Bit type |

### String Types

| JustDB Type | MySQL Type | JDBC Type | Java Type | Description |
|-------------|------------|-----------|-----------|-------------|
| CHAR | CHAR | CHAR | String | Fixed-length string |
| VARCHAR | VARCHAR | VARCHAR | String | Variable-length string |
| TEXT | TEXT | LONGVARCHAR | String | Long text (64KB) |
| MEDIUMTEXT | MEDIUMTEXT | LONGVARCHAR | String | Medium text (16MB) |
| LONGTEXT | LONGTEXT | LONGVARCHAR | String | Long text (4GB) |
| TINYTEXT | TINYTEXT | VARCHAR | String | Short text (255B) |

### Date/Time Types

| JustDB Type | MySQL Type | JDBC Type | Java Type | Description |
|-------------|------------|-----------|-----------|-------------|
| DATE | DATE | DATE | Date | Date |
| TIME | TIME | TIME | Time | Time |
| TIMESTAMP | TIMESTAMP | TIMESTAMP | Timestamp | Timestamp |
| DATETIME | DATETIME | TIMESTAMP | Timestamp | Date and time |
| YEAR | YEAR | DATE | Integer | Year |

### Binary Types

| JustDB Type | MySQL Type | JDBC Type | Java Type | Description |
|-------------|------------|-----------|-----------|-------------|
| BINARY | BINARY | BINARY | byte[] | Fixed-length binary |
| VARBINARY | VARBINARY | VARBINARY | byte[] | Variable-length binary |
| BLOB | BLOB | BLOB | byte[] | Binary large object |
| TINYBLOB | TINYBLOB | BLOB | byte[] | Small binary (255B) |
| MEDIUMBLOB | MEDIUMBLOB | BLOB | byte[] | Medium binary (16MB) |
| LONGBLOB | LONGBLOB | BLOB | byte[] | Long binary (4GB) |

### JSON Types

| JustDB Type | MySQL Type | JDBC Type | Java Type | Description |
|-------------|------------|-----------|-----------|-------------|
| JSON | JSON | OTHER | String | JSON data |

## MySQL-Specific Features

### Table Options

```yaml
tables:
  - name: users
    engine: InnoDB
    charset: utf8mb4
    collation: utf8mb4_unicode_ci
    rowFormat: DYNAMIC
    maxRows: 1000000
    comment: "User table"
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
```

### Storage Engines

MySQL supports multiple storage engines, JustDB supports through extension attributes:

```yaml
tables:
  - name: my_table
    engine: InnoDB  # InnoDB, MyISAM, Memory, CSV, Archive
```

### Charset and Collation

```yaml
tables:
  - name: users
    charset: utf8mb4
    collation: utf8mb4_unicode_ci
```

### AUTO_INCREMENT

```yaml
tables:
  - name: users
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
```

### Index Types

```yaml
tables:
  - name: users
    indexes:
      - name: idx_email
        columns:
          - email
        type: BTREE  # BTREE, HASH, FULLTEXT, SPATIAL
```

## Generated SQL Examples

### CREATE TABLE

```sql
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User table';
```

### ALTER TABLE

```sql
-- Add column
ALTER TABLE `users` ADD COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'active';

-- Modify column
ALTER TABLE `users` MODIFY COLUMN `email` VARCHAR(500) NOT NULL;

-- Rename column
ALTER TABLE `users` RENAME COLUMN `username` TO `login_name`;

-- Drop column
ALTER TABLE `users` DROP COLUMN `status`;
```

### CREATE INDEX

```sql
CREATE INDEX idx_username ON `users` (`username`);
CREATE UNIQUE INDEX idx_email ON `users` (`email`);
```

### DROP TABLE

```sql
DROP TABLE IF EXISTS `users`;
```

## Known Limitations

### Unsupported Features

1. **Spatial Types (SPATIAL)**: MySQL spatial data types (like GEOMETRY, POINT) not fully supported
2. **Fulltext Index**: Basic FULLTEXT index functionality supported, advanced features limited
3. **Partitioned Tables**: Only basic partitioning, complex partition strategies need manual handling

### Compatibility Notes

1. **MySQL 5.5 and below**: Some IF EXISTS/IF NOT EXISTS syntax may not be supported
2. **Charset**: Recommend using utf8mb4 instead of utf8 for full Unicode character support
3. **Time Types**: TIMESTAMP has 2038 problem, recommend using DATETIME

## Best Practices

### 1. Use InnoDB Engine

```yaml
tables:
  - name: my_table
    engine: InnoDB  # Supports transactions, foreign keys, row locking
```

### 2. Set Charset Appropriately

```yaml
tables:
  - name: users
    charset: utf8mb4
    collation: utf8mb4_unicode_ci
```

### 3. Use BIGINT as Primary Key

```yaml
tables:
  - name: users
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
```

### 4. Add Table and Column Comments

```yaml
tables:
  - name: users
    comment: "User information table"
    columns:
      - name: email
        type: VARCHAR(255)
        comment: "User email address"
```

### 5. Use TIMESTAMP Instead of DATETIME

```yaml
tables:
  - name: users
    columns:
      - name: created_at
        type: TIMESTAMP
        defaultValue: "CURRENT_TIMESTAMP"
```

## Related Documentation

- [MySQL Official Documentation](https://dev.mysql.com/doc/)
- [MySQL Data Type Reference](https://dev.mysql.com/doc/refman/8.0/en/data-types.html)
- [Database Support Overview](./README.md)
