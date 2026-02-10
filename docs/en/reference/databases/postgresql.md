# PostgreSQL Database Support

JustDB provides complete PostgreSQL database support, including the latest versions of PostgreSQL and its derivative databases.

## Version Support

| Version | Status | Notes |
|---------|--------|-------|
| PostgreSQL 16.x | Full Support | Latest stable version |
| PostgreSQL 15.x | Full Support | Stable version |
| PostgreSQL 14.x | Full Support | Stable version |
| PostgreSQL 13.x | Full Support | Stable version |
| PostgreSQL 12.x | Full Support | Basic functionality support |
| PostgreSQL 11.x | Supported | Basic functionality support |

## Derivative Database Support

JustDB supports the following derivative databases through PostgreSQL protocol:

| Database | Description |
|----------|-------------|
| TimescaleDB | Time-series database extension |
| Greenplum | Massively parallel processing database |
| Redshift | AWS data warehouse |
| CockroachDB | Distributed SQL database |
| YugabyteDB | Distributed SQL database |
| EDB | Enterprise PostgreSQL |
| Citus | PostgreSQL distributed extension |
| Yellowbrick | Data warehouse platform |

## Connection Configuration

### JDBC Driver

```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <version>42.7.2</version>
</dependency>
```

### Connection String

```bash
# Basic format
jdbc:postgresql://{host}[:{port}]/[{database}]

# Examples
jdbc:postgresql://localhost:5432/mydb
jdbc:postgresql://192.168.1.100:5432/mydb
```

### Configuration Examples

**YAML:**
```yaml
databases:
  production:
    url: jdbc:postgresql://localhost:5432/mydb
    driver: org.postgresql.Driver
    username: postgres
    password: secret
    dialect: postgresql
    schema: public
```

**JSON:**
```json
{
  "databases": {
    "production": {
      "url": "jdbc:postgresql://localhost:5432/mydb",
      "driver": "org.postgresql.Driver",
      "username": "postgres",
      "password": "secret",
      "dialect": "postgresql"
    }
  }
}
```

**XML:**
```xml
<databases>
  <database id="production">
    <url>jdbc:postgresql://localhost:5432/mydb</url>
    <driver>org.postgresql.Driver</driver>
    <username>postgres</username>
    <password>secret</password>
    <dialect>postgresql</dialect>
  </database>
</databases>
```

## Data Type Mapping

### Numeric Types

| JustDB Type | PostgreSQL Type | JDBC Type | Java Type | Description |
|-------------|-----------------|-----------|-----------|-------------|
| SMALLINT | SMALLINT | SMALLINT | Integer | 2-byte integer |
| INTEGER | INTEGER | INTEGER | Integer | 4-byte integer |
| BIGINT | BIGINT | BIGINT | Long | 8-byte integer |
| DECIMAL | NUMERIC | NUMERIC | BigDecimal | Exact numeric |
| REAL | REAL | FLOAT | Float | Single-precision float (6-digit precision) |
| DOUBLE | DOUBLE PRECISION | DOUBLE | Double | Double-precision float (15-digit precision) |
| SERIAL | SERIAL | INTEGER | Integer | Auto-increment integer |
| BIGSERIAL | BIGSERIAL | BIGINT | Long | Auto-increment big integer |
| MONEY | MONEY | NUMERIC | BigDecimal | Currency type |

### String Types

| JustDB Type | PostgreSQL Type | JDBC Type | Java Type | Description |
|-------------|-----------------|-----------|-----------|-------------|
| CHAR | CHAR(n) | CHAR | String | Fixed-length string |
| VARCHAR | VARCHAR(n) | VARCHAR | String | Variable-length string |
| TEXT | TEXT | LONGVARCHAR | String | Unlimited length text |
| NAME | NAME | VARCHAR | String | Identifier type (64 characters) |

### Date/Time Types

| JustDB Type | PostgreSQL Type | JDBC Type | Java Type | Description |
|-------------|-----------------|-----------|-----------|-------------|
| DATE | DATE | DATE | Date | Date |
| TIME | TIME(n) | TIME | Time | Time (optional precision) |
| TIMESTAMP | TIMESTAMP | TIMESTAMP | Timestamp | Timestamp (no timezone) |
| TIMESTAMPTZ | TIMESTAMPTZ | TIMESTAMPTZ | Timestamp | Timestamp (with timezone) |
| INTERVAL | INTERVAL | VARCHAR | String | Time interval |

### Binary Types

| JustDB Type | PostgreSQL Type | JDBC Type | Java Type | Description |
|-------------|-----------------|-----------|-----------|-------------|
| BYTEA | BYTEA | BINARY | byte[] | Variable-length binary |

### JSON Types

| JustDB Type | PostgreSQL Type | JDBC Type | Java Type | Description |
|-------------|-----------------|-----------|-----------|-------------|
| JSON | JSON | OTHER | String | JSON text |
| JSONB | JSONB | OTHER | String | JSON binary (recommended) |

### Geometric Types

| JustDB Type | PostgreSQL Type | JDBC Type | Java Type | Description |
|-------------|-----------------|-----------|-----------|-------------|
| POINT | POINT | OTHER | PGobject | Point |
| LINE | LINE | OTHER | PGobject | Line |
| LSEG | LSEG | OTHER | PGobject | Line segment |
| BOX | BOX | OTHER | PGobject | Rectangle |
| PATH | PATH | OTHER | PGobject | Path |
| POLYGON | POLYGON | OTHER | PGobject | Polygon |
| CIRCLE | CIRCLE | OTHER | PGobject | Circle |

### Array Types

PostgreSQL supports array types, JustDB supports through extension attributes:

```yaml
tables:
  - name: users
    columns:
      - name: tags
        type: TEXT[]
        comment: "Tag array"
      - name: scores
        type: INTEGER[]
        comment: "Score array"
```

## PostgreSQL-Specific Features

### Schema Support

```yaml
tables:
  - name: users
    schema: myapp
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
```

### Sequences

```yaml
sequences:
  - name: user_id_seq
    startWith: 1
    incrementBy: 1
    minValue: 1
    maxValue: 9223372036854775807
    cycle: false
    cache: 1
```

### Auto-Increment Columns (SERIAL)

```yaml
tables:
  - name: users
    columns:
      - name: id
        type: BIGSERIAL
        primaryKey: true
```

### Unique Constraints

```yaml
tables:
  - name: users
    constraints:
      - type: UNIQUE
        name: uk_email
        columns:
          - email
```

### Check Constraints

```yaml
tables:
  - name: users
    constraints:
      - type: CHECK
        name: chk_age
        checkExpression: "age >= 18"
```

### Foreign Key Constraints

```yaml
tables:
  - name: orders
    constraints:
      - type: FOREIGN_KEY
        name: fk_user
        columns:
          - user_id
        referencedTable: users
        referencedColumn: id
        onDelete: CASCADE
        onUpdate: RESTRICT
```

## Generated SQL Examples

### CREATE TABLE

```sql
CREATE TABLE IF NOT EXISTS "users" (
  "id" BIGSERIAL PRIMARY KEY,
  "username" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uk_email" UNIQUE ("email")
);
```

### ALTER TABLE

```sql
-- Add column
ALTER TABLE "users" ADD COLUMN "status" VARCHAR(50) NOT NULL DEFAULT 'active';

-- Modify column type
ALTER TABLE "users" ALTER COLUMN "email" TYPE VARCHAR(500);

-- Modify column constraint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;

-- Rename column
ALTER TABLE "users" RENAME COLUMN "username" TO "login_name";

-- Drop column
ALTER TABLE "users" DROP COLUMN "status";
```

### CREATE INDEX

```sql
CREATE INDEX IF NOT EXISTS "idx_username" ON "users" ("username");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_email" ON "users" ("email");
```

### CREATE SEQUENCE

```sql
CREATE SEQUENCE "user_id_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 NO CYCLE;
```

### DROP TABLE

```sql
DROP TABLE IF EXISTS "users";
```

## Known Limitations

### Partially Supported Features

1. **Custom Types**: CREATE TYPE and ENUM types require manual handling
2. **Full-text Search**: tsvector and tsquery basic support, but advanced features limited
3. **Table Inheritance**: PostgreSQL table inheritance feature requires manual handling
4. **Partitioned Tables**: Declarative partitioning requires additional configuration

### Data Type Limitations

1. **Geometric Types**: Point, line, polygon and other geometric types have limited support
2. **Range Types**: int4range, tsrange and other range types require special handling
3. **Network Address Types**: inet, cidr, macaddr types require special handling

## Best Practices

### 1. Use TEXT Instead of VARCHAR

```yaml
tables:
  - name: users
    columns:
      - name: bio
        type: TEXT  # TEXT performs well in PostgreSQL
```

### 2. Use JSONB Instead of JSON

```yaml
tables:
  - name: users
    columns:
      - name: metadata
        type: JSONB  # More efficient, supports indexing
```

### 3. Use BIGSERIAL as Primary Key

```yaml
tables:
  - name: users
    columns:
      - name: id
        type: BIGSERIAL
        primaryKey: true
```

### 4. Use SCHEMA to Organize Tables

```yaml
tables:
  - name: users
    schema: myapp  # Use schema to organize tables
```

### 5. Leverage Constraints and Triggers

```yaml
tables:
  - name: users
    constraints:
      - type: CHECK
        name: chk_email_format
        checkExpression: "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'"
```

## Related Documentation

- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Data Type Reference](https://www.postgresql.org/docs/current/datatype.html)
- [Database Support Overview](./README.md)
