---
date: 2024-01-01
icon: rocket
title: Quick Start
order: 1
category:
  - Quick Start
  - Getting Started
tag:
  - getting-started
  - quick-start
---

# Quick Start

Welcome to JustDB! This guide will help you get started with JustDB in 5 minutes.

## What is JustDB?

JustDB is a **WYSIWYG database development suite**. All you need to do is:

1. Declare your desired database structure using XML/YAML/JSON/SQL/TOML
2. JustDB automatically calculates and executes changes
3. Done!

**Core Features**:
- ✅ Declarative Schema definition
- ✅ Automatic diff calculation and migration
- ✅ Support for 30+ databases
- ✅ AI integration
- ✅ JDBC driver
- ✅ Spring Boot integration

## 5-Minute Quick Experience

### Prerequisites

::: tip Requirements
- **Java**: JDK 1.8 or higher
- **Database**: Any supported database (MySQL, PostgreSQL, H2, etc.)
- **Build Tool**: Maven 3.6+ (optional)
:::

### Step 1: Create Your First Schema

#### Quick Start with init Command (Recommended)

The fastest way to get started is using the `init` command:

```bash
# Initialize a new project with default settings
justdb init

# Or specify project name and format
justdb init --project myapp --format yaml

# Include sample data for testing
justdb init --project myapp --with-data
```

This creates a complete schema with sample tables (users, orders, products) that you can use as a starting point.

#### Manual Schema Creation

Create a Schema file:

::: code-tabs
@tab XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- users.xml -->
<Justdb namespace="com.example">
    <Table id="users" name="User Table" comment="Store system user information">
        <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"
                comment="User ID, primary key auto-increment"/>
        <Column name="username" type="VARCHAR(50)" nullable="false"
                comment="Username, cannot be null"/>
        <Column name="email" type="VARCHAR(100)" comment="Email address"/>
        <Column name="created_at" type="TIMESTAMP" nullable="false"
                defaultValueComputed="CURRENT_TIMESTAMP" comment="Creation time"/>
        <Index id="idx_username" unique="true" comment="Unique index on username">
            <IndexColumn name="username"/>
        </Index>
        <Index id="idx_email" unique="true" comment="Unique index on email">
            <IndexColumn name="email"/>
        </Index>
    </Table>
</Justdb>
```

@tab YAML
```yaml
# users.yaml
namespace: com.example
Table:
  - id: users
    name: User Table
    comment: Store system user information
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
        comment: User ID, primary key auto-increment
      - name: username
        type: VARCHAR(50)
        nullable: false
        comment: Username, cannot be null
      - name: email
        type: VARCHAR(100)
        comment: Email address
      - name: created_at
        type: TIMESTAMP
        nullable: false
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: Creation time
    Index:
      - id: idx_username
        columns:
          - username
        unique: true
        comment: Unique index on username
      - id: idx_email
        columns:
          - email
        unique: true
        comment: Unique index on email
```

@tab JSON
```json
{
  "namespace": "com.example",
  "Table": [
    {
      "id": "users",
      "name": "User Table",
      "comment": "Store system user information",
      "Column": [
        {
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true,
          "autoIncrement": true,
          "comment": "User ID, primary key auto-increment"
        },
        {
          "name": "username",
          "type": "VARCHAR(50)",
          "nullable": false,
          "comment": "Username, cannot be null"
        },
        {
          "name": "email",
          "type": "VARCHAR(100)",
          "comment": "Email address"
        },
        {
          "name": "created_at",
          "type": "TIMESTAMP",
          "nullable": false,
          "defaultValueComputed": "CURRENT_TIMESTAMP",
          "comment": "Creation time"
        }
      ],
      "Index": [
        {
          "id": "idx_username",
          "columns": ["username"],
          "unique": true,
          "comment": "Unique index on username"
        },
        {
          "id": "idx_email",
          "columns": ["email"],
          "unique": true,
          "comment": "Unique index on email"
        }
      ]
    }
  ]
}
```

@tab SQL
```sql
-- users.sql
-- JustDB also supports SQL format for Schema definition

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'User ID, primary key auto-increment',
    username VARCHAR(50) NOT NULL COMMENT 'Username, cannot be null',
    email VARCHAR(100) COMMENT 'Email address',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
    UNIQUE KEY idx_username (username) COMMENT 'Unique index on username',
    UNIQUE KEY idx_email (email) COMMENT 'Unique index on email'
) COMMENT 'User Table';
```

@tab TOML
```toml
namespace = "com.example"

[[Table]]
id = "users"
name = "User Table"
comment = "Store system user information"

[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true
autoIncrement = true
comment = "User ID, primary key auto-increment"

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"
nullable = false
comment = "Username, cannot be null"

[[Table.Column]]
name = "email"
type = "VARCHAR(100)"
comment = "Email address"

[[Table.Column]]
name = "created_at"
type = "TIMESTAMP"
nullable = false
defaultValueComputed = "CURRENT_TIMESTAMP"
comment = "Creation time"

[[Table.Index]]
id = "idx_username"
unique = true
comment = "Unique index on username"

[[Table.Index.IndexColumn]]
name = "username"

[[Table.Index]]
id = "idx_email"
unique = true
comment = "Unique index on email"

[[Table.Index.IndexColumn]]
name = "email"
```
:::

### Step 2: Deploy to Database

#### Option 1: Using Java API

```java
import ai.justdb.justdb.FormatFactory;
import ai.justdb.justdb.SchemaDeployer;
import ai.justdb.justdb.schema.Justdb;

import java.sql.Connection;
import java.sql.DriverManager;

public class QuickStart {
    public static void main(String[] args) throws Exception {
        // Load Schema
        Justdb schema = FormatFactory.loadFromFile("users.xml");

        // Connect to database
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/myapp", "root", "password")) {

            // Deploy Schema
            SchemaDeployer deployer = new SchemaDeployer(conn);
            deployer.deploy(schema);

            System.out.println("Database deployed successfully!");
        }
    }
}
```

#### Option 2: Using CLI Tool

```bash
# Specify file directly
justdb migrate users.xml

# Or use auto-discovery (place files in justdb/ directory)
mkdir justdb
mv users.xml justdb/
justdb migrate
```

#### Option 3: Using Spring Boot

```yaml
# application.yml
justdb:
  enabled: true
  locations: classpath:justdb
  dry-run: false

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myapp
    username: root
    password: password
```

```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        // Database has been automatically migrated!
    }
}
```

### Step 3: Verify Results

Connect to the database and verify the table was created:

```sql
mysql> USE myapp;
mysql> SHOW TABLES;
+----------------+
| Tables_in_myapp |
+----------------+
| users           |
+----------------+

mysql> DESC users;
+-------------+--------------+------+-----+---------+----------------+
| Field       | Type         | Null | Key | Default | Extra          |
+-------------+--------------+------+-----+---------+----------------+
| id          | bigint(20)   | NO   | PRI | NULL    | auto_increment |
| username    | varchar(50)  | NO   | MUL | NULL    |                |
| email       | varchar(100) | YES  | MUL | NULL    |                |
| created_at  | timestamp    | NO   |     | CURRENT_TIMESTAMP |                |
+-------------+--------------+------+-----+---------+----------------+
```

## Incremental Migration

### Adding a New Column

Modify the Schema file:

::: code-tabs
@tab XML
```xml
<!-- users.xml -->
<Table id="users">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="username" type="VARCHAR(50)" nullable="false"/>
    <Column name="email" type="VARCHAR(100)"/>
    <Column name="phone" type="VARCHAR(20)" comment="Contact number"/> <!-- New -->
    <Column name="created_at" type="TIMESTAMP" nullable="false"
            defaultValueComputed="CURRENT_TIMESTAMP"/>
</Table>
```

@tab YAML
```yaml
# users.yaml
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
  - name: phone              # New
    type: VARCHAR(20)        # New
    comment: Contact number  # New
  - name: created_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP
```

@tab JSON
```json
{
  "Column": [
    {"name": "id", "type": "BIGINT", "primaryKey": true, "autoIncrement": true},
    {"name": "username", "type": "VARCHAR(50)", "nullable": false},
    {"name": "email", "type": "VARCHAR(100)"},
    {"name": "phone", "type": "VARCHAR(20)", "comment": "Contact number"},
    {"name": "created_at", "type": "TIMESTAMP", "nullable": false, "defaultValueComputed": "CURRENT_TIMESTAMP"}
  ]
}
```

@tab SQL
```sql
-- users.sql - Modified - added phone field
-- JustDB parses SQL format Schema definition and calculates diff

ALTER TABLE users ADD COLUMN phone VARCHAR(20) COMMENT 'Contact number';
```

@tab TOML
```toml
[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true
autoIncrement = true

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"
nullable = false

[[Table.Column]]
name = "email"
type = "VARCHAR(100)"

[[Table.Column]]
name = "phone"           # New
type = "VARCHAR(20)"
comment = "Contact number"

[[Table.Column]]
name = "created_at"
type = "TIMESTAMP"
nullable = false
defaultValueComputed = "CURRENT_TIMESTAMP"
```
:::

Execute migration:

```bash
justdb migrate

# Output:
# [INFO] Calculating schema diff...
# [INFO] Adding column: users.phone
# [INFO] JustDB migration completed successfully
```

JustDB automatically generates and executes:

```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20) COMMENT 'Contact number';
```

### Renaming a Column

Use `formerNames` to identify the old name:

::: code-tabs
@tab XML
```xml
<Column name="user_name" formerNames="username" type="VARCHAR(50)" nullable="false"/>
```

@tab YAML
```yaml
Column:
  - name: user_name           # New name
    formerNames: [username]   # Old name
    type: VARCHAR(50)
    nullable: false
```

@tab JSON
```json
{
  "Column": [
    {
      "name": "user_name",
      "formerNames": ["username"],
      "type": "VARCHAR(50)",
      "nullable": false
    }
  ]
}
```

@tab SQL
```sql
-- users.sql - Modified - renamed column
-- JustDB parses SQL format Schema definition and calculates diff

ALTER TABLE users CHANGE COLUMN username user_name VARCHAR(50) NOT NULL COMMENT 'User name';
```

@tab TOML
```toml
[[Table.Column]]
name = "user_name"
formerNames = ["username"]
type = "VARCHAR(50)"
nullable = false
```
:::

Execute migration:

```bash
justdb migrate

# JustDB automatically generates:
# ALTER TABLE users CHANGE COLUMN username user_name VARCHAR(50) NOT NULL;
```

## Using AI to Quickly Create Schema

```bash
# Start interactive mode
justdb

# Use AI to create tables
> /ai Create a product table with product ID, name, price, stock, category ID and status

# AI will generate Schema and load it automatically
# You can directly /migrate to deploy
```

## Multi-Format Support

JustDB supports multiple formats. Choose the one that suits you best:

<VPCard
  title="XML"
  desc="Enterprise configuration format, clear structure, recommended"
/>

<VPCard
  title="YAML"
  desc="Human-friendly configuration format"
/>

<VPCard
  title="JSON"
  desc="Machine-readable data exchange format"
/>

<VPCard
  title="SQL"
  desc="Standard SQL DDL statement format"
/>

<VPCard
  title="TOML"
  desc="Modern application configuration format"
/>

::: code-tabs
@tab XML
```xml
<Justdb>
  <Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
  </Table>
</Justdb>
```

@tab YAML
```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```

@tab JSON
```json
{
  "Table": [
    {
      "name": "users",
      "Column": [
        {
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true
        }
      ]
    }
  ]
}
```

@tab SQL
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY
);
```

@tab TOML
```toml
[[Table]]
name = "users"

[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true
```
:::

## Common Commands

```bash
# Deploy Schema
justdb migrate

# Preview changes (without executing)
justdb migrate --dry-run

# Validate Schema
justdb validate

# Format conversion
justdb convert -f yaml -t json schema.yaml > schema.json

# Extract Schema from database
justdb db2schema -u jdbc:mysql://localhost:3306/myapp -o schema.yaml

# Generate documentation
justdb doc -f markdown -o DATABASE.md

# AI assistant
justdb ai "Create an order table"
```

## Next Steps

### Deep Dive

<VPCard
  title="First Schema"
  desc="Learn Schema definition syntax in depth"
  link="/en/getting-started/first-schema.html"
/>

<VPCard
  title="Migration Basics"
  desc="Understand the detailed mechanism of Schema migration"
  link="/en/getting-started/migration-basics.html"
/>

<VPCard
  title="Spring Boot Integration"
  desc="Using JustDB in Spring Boot projects"
  link="/en/getting-started/spring-boot-integration.html"
/>

### Practical Guides

<VPCard
  title="Common Tasks"
  desc="View common database operation examples"
  link="/en/getting-started/common-tasks.html"
/>

<VPCard
  title="Installation Guide"
  desc="Detailed installation and configuration instructions"
  link="/en/getting-started/installation.html"
/>

### Learn More

<VPCard
  title="What is JustDB"
  desc="Understand the core concepts of JustDB"
  link="/en/guide/what-is-justdb.html"
/>

<VPCard
  title="Why JustDB"
  desc="Compare with other tools and learn JustDB advantages"
  link="/en/guide/why-justdb.html"
/>

## Get Help

- **Documentation**: [https://justdb.github.io/justdb](https://justdb.github.io/justdb)
- **GitHub**: [https://github.com/justdb/justdb](https://github.com/justdb/justdb)
- **Issue Tracker**: [GitHub Issues](https://github.com/justdb/justdb/issues)
