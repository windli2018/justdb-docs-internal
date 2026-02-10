---
date: 2024-01-01
icon: play
title: 5-Minute Quick Start
order: 2
category:
  - Quick Start
  - Getting Started
tag:
  - quick-start
  - getting-started
  - tutorial
---

# Quick Start

This guide will help you get started with JustDB in 5 minutes, from installation to deploying your first Schema.

## Prerequisites

::: tip Before you start
Make sure you have installed:
- **JDK 1.8+**
- **Maven 3.6+** (optional)
- **Any supported database** (MySQL, PostgreSQL, H2, etc.)

If not installed yet, please refer to [Installation Guide](./installation.html)
:::

## Quick Experience

### Option 1: Maven Dependency

```xml
<dependency>
    <groupId>org.verydb.justdb</groupId>
    <artifactId>justdb-core</artifactId>
    <version>1.0.0</version>
</dependency>
```

```java
// QuickStart.java
import org.verydb.justdb.FormatFactory;
import org.verydb.justdb.SchemaDeployer;
import org.verydb.justdb.schema.Justdb;

import java.sql.Connection;
import java.sql.DriverManager;

public class QuickStart {
    public static void main(String[] args) throws Exception {
        // Load Schema
        Justdb schema = FormatFactory.loadFromFile("schema.yaml");

        // Deploy to database
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/myapp", "root", "password")) {
            SchemaDeployer deployer = new SchemaDeployer(conn);
            deployer.deploy(schema);
            System.out.println("Deployment successful!");
        }
    }
}
```

### Option 2: CLI Tool

```bash
# Download and install JustDB CLI
wget https://github.com/verydb/justdb/releases/download/v1.0.0/justdb-1.0.0-linux.tar.gz
tar -xzf justdb-1.0.0-linux.tar.gz
export PATH=$PATH:$PWD/bin

# Verify installation
justdb --version
```

### Option 3: Spring Boot

```xml
<dependency>
    <groupId>org.verydb.justdb</groupId>
    <artifactId>justdb-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

```yaml
# application.yml
justdb:
  enabled: true
  locations: classpath:justdb
```

## Create Your First Schema

Create file `schema.yaml`:

```yaml
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
        comment: User ID
      - name: username
        type: VARCHAR(50)
        nullable: false
        comment: Username
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
        columns: [username]
        unique: true
```

## Deploy Schema

### Using CLI

```bash
# Deploy directly
justdb migrate schema.yaml

# Or preview changes
justdb migrate schema.yaml --dry-run
```

### Using Java API

```bash
# Compile and run
javac -cp justdb-core.jar QuickStart.java
java -cp .:justdb-core.jar QuickStart
```

### Using Spring Boot

```bash
# Put schema.yaml in src/main/resources/justdb/
mkdir -p src/main/resources/justdb
mv schema.yaml src/main/resources/justdb/

# Start application
mvn spring-boot:run
```

## Verify Results

Connect to database and check if tables are created:

```sql
-- MySQL
mysql> USE myapp;
mysql> SHOW TABLES;
mysql> DESC users;

-- PostgreSQL
\c myapp
\dt
\d users

-- H2 (console)
SHOW TABLES;
DESCRIBE users;
```

## Modify Schema

Add a new column:

```yaml
Column:
  - name: id
    type: BIGINT
    primaryKey: true
  - name: username
    type: VARCHAR(50)
  - name: email
    type: VARCHAR(100)
  - name: phone              # New
    type: VARCHAR(20)        # New
  - name: created_at
    type: TIMESTAMP
```

Run migration again:

```bash
justdb migrate
```

JustDB will automatically calculate the diff and only execute the new column addition:

```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
```

## Using AI Assistant

```bash
# Start interactive mode
justdb

# Use AI to create tables
> /ai Create an order table with order number, customer ID, amount and status

# AI generates Schema automatically, confirm and deploy
> /migrate
```

## Multi-Format Support

JustDB supports multiple formats, choose the one that suits you best:

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

@tab Properties
```properties
table.users.name=users
table.users.column.id.name=id
table.users.column.id.type=BIGINT
table.users.column.id.primaryKey=true
```
:::

Format conversion:

```bash
justdb convert -f yaml -t json schema.yaml > schema.json
```

## Common Commands

```bash
# Deploy Schema
justdb migrate

# Preview changes
justdb migrate --dry-run

# Validate Schema
justdb validate

# Extract Schema from database
justdb db2schema -u jdbc:mysql://localhost:3306/myapp -o schema.yaml

# Generate documentation
justdb doc -f markdown -o DATABASE.md

# View help
justdb --help
justdb migrate --help
```

## Next Steps

Congratulations on completing the quick start! You can now:

<VPCard
  title="First Schema"
  desc="Learn Schema definition syntax and best practices in depth"
  link="/en/getting-started/first-schema.html"
/>

<VPCard
  title="Migration Basics"
  desc="Understand the detailed mechanism of Schema migration"
  link="/en/getting-started/migration-basics.html"
/>

<VPCard
  title="Spring Boot Integration"
  desc="Integrate JustDB in Spring Boot projects"
  link="/en/getting-started/spring-boot-integration.html"
/>

<VPCard
  title="Common Tasks"
  desc="View common database operation examples"
  link="/en/getting-started/common-tasks.html"
/>

## Get Help

- **Documentation**: [https://verydb.github.io/justdb](https://verydb.github.io/justdb)
- **GitHub**: [https://github.com/verydb/justdb](https://github.com/verydb/justdb)
- **Issue Tracker**: [GitHub Issues](https://github.com/verydb/justdb/issues)
