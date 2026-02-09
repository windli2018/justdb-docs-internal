---
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

JustDB is a **WYSIWYG database development kit**. All you need to do is:

1. Declare your desired database structure using YAML/JSON/XML
2. JustDB automatically calculates and executes changes
3. Done!

**Core Features**:
- ✅ Declarative schema definition
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

Create a file `users.yaml`:

```yaml
id: myapp
namespace: com.example
Table:
  - name: users
    comment: User table
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
        comment: User ID, primary key auto-increment
      - name: username
        type: VARCHAR(50)
        nullable: false
        comment: Username, cannot be empty
      - name: email
        type: VARCHAR(100)
        comment: Email address
      - name: created_at
        type: TIMESTAMP
        nullable: false
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: Creation time
    Index:
      - name: idx_username
        columns:
          - username
        unique: true
        comment: Unique username index
      - name: idx_email
        columns:
          - email
        unique: true
        comment: Unique email index
```

### Step 2: Deploy to Database

#### Method 1: Using Java API

```java
import org.verydb.justdb.FormatFactory;
import org.verydb.justdb.SchemaDeployer;
import org.verydb.justdb.schema.Justdb;

import java.sql.Connection;
import java.sql.DriverManager;

public class QuickStart {
    public static void main(String[] args) throws Exception {
        // Load schema
        Justdb schema = FormatFactory.loadFromFile("users.yaml");

        // Connect to database
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/myapp", "root", "password")) {

            // Deploy schema
            SchemaDeployer deployer = new SchemaDeployer(conn);
            deployer.deploy(schema);

            System.out.println("Database deployed successfully!");
        }
    }
}
```

#### Method 2: Using CLI Tool

```bash
# Specify file directly
justdb migrate users.yaml

# Or use auto-discovery (put file in justdb/ directory)
mkdir justdb
mv users.yaml justdb/
justdb migrate
```

#### Method 3: Using Spring Boot

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

Connect to the database to verify the table was created:

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

### Add New Column

Modify `users.yaml`:

```yaml
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

### Rename Column

Use `formerNames` to identify the old name:

```yaml
Column:
  - name: user_name           # New name
    formerNames: [username]   # Old name
    type: VARCHAR(50)
    nullable: false
```

Execute migration:

```bash
justdb migrate

# JustDB automatically generates:
# ALTER TABLE users CHANGE COLUMN username user_name VARCHAR(50) NOT NULL;
```

## Create Schema Quickly with AI

```bash
# Start interactive mode
justdb

# Use AI to create table
> /ai create a product table with product ID, name, price, stock, category ID and status

# AI will generate schema and load it automatically
# You can directly /migrate to deploy
```

## Multi-Format Support

JustDB supports multiple formats. Choose the one that suits you best:

<VPCard
  title="YAML"
  desc="Human-friendly configuration format, recommended"
/>

<VPCard
  title="JSON"
  desc="Machine-readable data exchange format"
/>

<VPCard
  title="XML"
  desc="Enterprise configuration format"
/>

<CodeGroup>
<CodeGroupItem title="YAML">
```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```
</CodeGroupItem>

<CodeGroupItem title="JSON">
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
</CodeGroupItem>

<CodeGroupItem title="XML">
```xml
<Justdb>
  <Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
  </Table>
</Justdb>
```
</CodeGroupItem>
</CodeGroup>

## Common Commands

```bash
# Deploy schema
justdb migrate

# Preview changes (don't execute)
justdb migrate --dry-run

# Validate schema
justdb validate

# Format conversion
justdb convert -f yaml -t json schema.yaml > schema.json

# Extract schema from database
justdb db2schema -u jdbc:mysql://localhost:3306/myapp -o schema.yaml

# Generate documentation
justdb doc -f markdown -o DATABASE.md

# AI assistant
justdb ai "create an orders table"
```

## Next Steps

### Deep Dive

<VPCard
  title="First Schema"
  desc="Learn schema definition syntax in depth"
  link="/en/getting-started/first-schema.html"
/>

<VPCard
  title="Migration Basics"
  desc="Understand schema migration mechanism in detail"
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
  desc="Understand JustDB's core concepts"
  link="/en/guide/what-is-justdb.html"
/>

<VPCard
  title="Why JustDB"
  desc="Compare with other tools and understand JustDB advantages"
  link="/en/guide/why-justdb.html"
/>

## Get Help

- **Documentation**: [https://verydb.github.io/justdb](https://verydb.github.io/justdb)
- **GitHub**: [https://github.com/verydb/justdb](https://github.com/verydb/justdb)
- **Issue Tracker**: [GitHub Issues](https://github.com/verydb/justdb/issues)
