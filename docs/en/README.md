---
home: true
title: JustDB
icon: home
titleTemplate: false

heroImage: /logo.png

heroText: JustDB
tagline: What You See Is What You Get Database Development Kit

actions:
  - text: Quick Start
    link: /en/getting-started/
    type: primary

  - text: Project Introduction
    link: /en/guide/what-is-justdb.html
    type: secondary

features:
  - title: Declarative Schema Definition
    details: Define database structures using XML, YAML, JSON, TOML and other formats, with automatic conversion across multiple database dialects
    link: /en/reference/formats/

  - title: Intelligent Diff Migration
    details: Automatically calculate schema differences and generate safe incremental migration scripts
    link: /en/design/migration-system/

  - title: Multi-Database Support
    details: Supports 30+ databases including MySQL, PostgreSQL, Oracle, SQL Server
    link: /en/reference/databases/

  - title: Complete JDBC Driver
    details: Provides JDBC 4.2 standard driver for direct use in applications
    link: /en/reference/api/jdbc-driver.html

  - title: AI Integration
    details: Supports natural language database schema operations and intelligent migration plan generation
    link: /en/reference/ai/

  - title: Plugin System
    details: Flexible plugin architecture supporting custom templates, type mapping and extension points
    link: /en/development/plugin-development/

footer: MIT Licensed | Copyright © 2024-present JustDB Team
---

## What is JustDB?

JustDB is an innovative **What You See Is What You Get database development kit**. Developers only need to write the desired database schema and dictionary data, and the tool will automatically manage and maintain database upgrades, ensuring that database deployment is always completed according to developers' intentions.

### Core Values

- **Simplified Database Development**: Say goodbye to handwritten SQL scripts, use declarative schema definition
- **Version Control Friendly**: Schema files are plain text and can be included in Git version control
- **Cross-Database Compatible**: Define once, support multiple database dialects
- **Intelligent Migration**: Automatically calculate differences and generate safe incremental migration scripts
- **Ready to Use**: Provides complete JDBC driver and Spring Boot integration

### Typical Application Scenarios

- **Microservices Architecture**: Each service independently manages its own database schema
- **Multi-Tenant Systems**: Support sharding and flexible schema evolution
- **CI/CD Integration**: Automated database deployment and upgrade
- **Development Testing**: Quickly set up and reset test databases

## Quick Start

```bash
# Install CLI tool
npm install -g @justdb/cli

# Create first schema
justdb init

# Deploy to database
justdb migrate
```

::: code-tabs
@tab XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="mydb" namespace="com.example">
    <Table id="users" name="User Table">
        <Column id="user_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
        <Column id="user_name" name="username" type="VARCHAR(255)" nullable="false"/>
    </Table>
</Justdb>
```

@tab YAML
```yaml
id: mydb
namespace: com.example
Table:
  - id: users
    name: User Table
    Column:
      - id: user_id
        name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
      - id: user_name
        name: username
        type: VARCHAR(255)
        nullable: false
```

@tab JSON
```json
{
  "id": "mydb",
  "namespace": "com.example",
  "Table": [
    {
      "id": "users",
      "name": "User Table",
      "Column": [
        {
          "id": "user_id",
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true,
          "autoIncrement": true
        },
        {
          "id": "user_name",
          "name": "username",
          "type": "VARCHAR(255)",
          "nullable": false
        }
      ]
    }
  ]
}
```

@tab SQL
```sql
-- schema.sql
-- JustDB also supports SQL format schema definition

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'User ID, primary key auto-increment',
    username VARCHAR(255) NOT NULL COMMENT 'Username, cannot be null'
) COMMENT 'User table';
```

@tab TOML
```toml
id = "mydb"
namespace = "com.example"

[[Table]]
id = "users"
name = "User Table"

[[Table.Column]]
id = "user_id"
name = "id"
type = "BIGINT"
primaryKey = true
autoIncrement = true

[[Table.Column]]
id = "user_name"
name = "username"
type = "VARCHAR(255)"
nullable = false
```

## Next Steps

- [View Quick Start Guide](/en/getting-started/)
- [Explore Reference Documentation](/en/reference/)
- [Read Design Documents](/en/design/)
- [Learn Plugin Development](/en/development/plugin-development/)