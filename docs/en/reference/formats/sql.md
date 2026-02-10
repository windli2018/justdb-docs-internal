---
icon: database
title: SQL Format
order: 18
category:
  - Reference
  - Format Support
tag:
  - sql
  - format
  - reverse-engineering
  - jdbc-driver
  - mysql-protocol
---

# SQL Format

JustDB provides comprehensive SQL support through two key technologies:

## 1. JustDB JDBC Driver

JustDB offers a complete JDBC 4.2 compliant driver that enables standard database connectivity:

### Key Features
- **Standard JDBC Interface**: Full JDBC 4.2 compliance
- **Connection Management**: Robust connection handling and pooling
- **Statement Execution**: Support for Statement, PreparedStatement, and CallableStatement
- **Result Set Handling**: Complete ResultSet implementation with metadata support
- **Transaction Management**: ACID transaction support with commit/rollback
- **Batch Operations**: Efficient batch processing capabilities

### Usage Example
```java
// Register and use JustDB JDBC Driver
String url = "jdbc:justdb:file://path/to/schema.yaml";
Properties props = new Properties();
props.setProperty("user", "username");
props.setProperty("password", "password");

Connection conn = DriverManager.getConnection(url, props);
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery("SELECT * FROM users");
```

## 2. JustDB MySQL Protocol Server

JustDB implements MySQL Wire Protocol compatibility, allowing standard MySQL clients to connect seamlessly:

### Key Features
- **MySQL Protocol Compatibility**: Full MySQL 5.7+ protocol support
- **Standard Port**: Runs on port 33206 (non-conflicting with MySQL)
- **Client Compatibility**: Works with MySQL CLI, JDBC drivers, and GUI tools
- **Virtual Tables**: Built-in `information_schema` support for metadata queries
- **Authentication**: MySQL native password authentication
- **SSL/TLS Support**: Secure connections (planned enhancement)

### Usage Example
```bash
# Start MySQL Protocol Server
java -jar justdb-mysql-protocol-1.0.0.jar --port 33206 --schema schema.yaml

# Connect using MySQL client
mysql -h localhost -P 33206 -u user -p

# Connect using MySQL JDBC Driver in applications
String url = "jdbc:mysql://localhost:33206/mydb";
Connection conn = DriverManager.getConnection(url, "user", "password");
```

## Reverse Engineering Capabilities

JustDB supports extracting Schema definitions from existing database DDL statements:

## Reverse Engineering

### Extract Schema from Database

```bash
# Extract from MySQL database
justdb db2schema \
  --url jdbc:mysql://localhost:3306/myapp \
  --user root \
  --password secret \
  --output schema.yaml

# Extract from PostgreSQL database
justdb db2schema \
  --url jdbc:postgresql://localhost:5432/myapp \
  --user postgres \
  --password secret \
  --output schema.yaml
```

### Extract from SQL File

```bash
# Extract from SQL file
justdb sql2schema schema.sql > schema.yaml
```

## Supported SQL Statements

### CREATE TABLE

```sql
-- Input SQL
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Output YAML
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
      - name: username
        type: VARCHAR(50)
        nullable: false
      - name: email
        type: VARCHAR(100)
      - name: created_at
        type: TIMESTAMP
        defaultValueComputed: CURRENT_TIMESTAMP
```

### CREATE INDEX

```sql
-- Input SQL
CREATE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Output YAML
Index:
  - name: idx_users_email
    tableName: users
    columns: [email]
  - name: idx_users_username
    tableName: users
    columns: [username]
    unique: true
```

### ALTER TABLE

```sql
-- Input SQL
ALTER TABLE orders ADD CONSTRAINT fk_orders_user_id
FOREIGN KEY (user_id) REFERENCES users(id);

-- Output YAML
Constraint:
  - name: fk_orders_user_id
    type: FOREIGN_KEY
    tableName: orders
    referencedTable: users
    referencedColumn: id
    columns: [user_id]
```

## Complete Examples

### Input SQL File

```sql
-- User table
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'User ID',
  username VARCHAR(50) NOT NULL COMMENT 'Username',
  email VARCHAR(100) COMMENT 'Email',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Update time'
) COMMENT 'User table';

-- Username unique index
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Email unique index
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Order table
CREATE TABLE orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  order_no VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id)
) COMMENT 'Order table';

-- Order number unique index
CREATE UNIQUE INDEX idx_orders_order_no ON orders(order_no);
```

### Output YAML Schema

```yaml
Table:
  - name: users
    comment: User table
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
        comment: User ID
      - name: username
        type: VARCHAR(50)
        nullable: false
        comment: Username
      - name: email
        type: VARCHAR(100)
        comment: Email
      - name: created_at
        type: TIMESTAMP
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: Creation time
      - name: updated_at
        type: TIMESTAMP
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: Update time
    Index:
      - name: idx_users_username
        columns: [username]
        unique: true
      - name: idx_users_email
        columns: [email]
        unique: true

  - name: orders
    comment: Order table
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
      - name: user_id
        type: BIGINT
        nullable: false
      - name: order_no
        type: VARCHAR(50)
        nullable: false
      - name: status
        type: VARCHAR(20)
        defaultValue: pending
      - name: total_amount
        type: DECIMAL(10,2)
        defaultValue: 0.00
      - name: created_at
        type: TIMESTAMP
        defaultValueComputed: CURRENT_TIMESTAMP
      - name: updated_at
        type: TIMESTAMP
        defaultValueComputed: CURRENT_TIMESTAMP
    Constraint:
      - name: fk_orders_user_id
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        columns: [user_id]
    Index:
      - name: idx_orders_order_no
        columns: [order_no]
        unique: true
```

## Database-Specific Support

### MySQL

```sql
-- MySQL-specific syntax
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### PostgreSQL

```sql
-- PostgreSQL-specific syntax
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

### Oracle

```sql
-- Oracle-specific syntax
CREATE TABLE users (
  id NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY PRIMARY KEY,
  username VARCHAR2(50) NOT NULL,
  email VARCHAR2(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Command-Line Tools

```bash
# Extract from database
justdb db2schema \
  --url jdbc:mysql://localhost:3306/myapp \
  --user root \
  --password secret \
  --output schema.yaml \
  --format yaml

# Specify tables
justdb db2schema \
  --url jdbc:mysql://localhost:3306/myapp \
  --user root \
  --password secret \
  --tables users,orders \
  --output schema.yaml

# Include data
justdb db2schema \
  --url jdbc:mysql://localhost:3306/myapp \
  --user root \
  --password secret \
  --include-data \
  --output schema.yaml
```

## Best Practices

### 1. Regularly Extract Schema

```bash
# Use script to extract regularly
#!/bin/bash
justdb db2schema \
  --url jdbc:mysql://localhost:3306/myapp \
  --user root \
  --password $DB_PASSWORD \
  --output justdb/schema-$(date +%Y%m%d).yaml
```

### 2. Version Control

```bash
# Extract and commit to version control
justdb db2schema ... > schema.yaml
git add schema.yaml
git commit -m "Update schema from database"
```

### 3. Compare Changes

```bash
# Compare database and file differences
justdb diff \
  --database jdbc:mysql://localhost:3306/myapp \
  --file schema.yaml
```

## Related Documentation

- [YAML Format](./yaml.md)
- [Format Support Overview](./README.md)
