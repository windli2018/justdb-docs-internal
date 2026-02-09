---
home: true
title: JustDB
icon: home
titleTemplate: false

heroImage: /logo.png

heroText: JustDB
tagline: WYSIWYG Database Development Kit

actions:
  - text: Quick Start
    link: /en/getting-started/
    type: primary

  - text: Introduction
    link: /en/guide/what-is-justdb.html
    type: secondary

features:
  - title: Declarative Schema Definition
    details: Define database structures using YAML, JSON, XML and other formats with automatic multi-dialect conversion
    link: /en/reference/formats/

  - title: Intelligent Diff Migration
    details: Automatically calculate schema differences and generate safe incremental migration scripts
    link: /en/design/migration-system/

  - title: Multi-Database Support
    details: Support for 30+ databases including MySQL, PostgreSQL, Oracle, SQL Server and more
    link: /en/reference/databases/

  - title: Complete JDBC Driver
    details: Full JDBC 4.2 standard driver for direct use in applications
    link: /en/reference/api/jdbc-driver.html

  - title: AI Integration
    details: Natural language database schema operations with intelligent migration planning
    link: /en/reference/ai/

  - title: Plugin System
    details: Flexible plugin architecture supporting custom templates, type mappings and extension points
    link: /en/development/plugin-development/

footer: MIT Licensed | Copyright © 2024-present JustDB Team
---

## What is JustDB?

JustDB is an innovative **WYSIWYG database development kit**. Developers simply need to declare their desired database schema and dictionary data, and the tool will automatically manage and maintain database upgrades, ensuring database deployment always matches developer intentions.

### Core Values

- **Simplify Database Development**: Say goodbye to handwritten SQL scripts with declarative schema definition
- **Version Control Friendly**: Schema files are plain text that can be managed in Git
- **Cross-Database Compatibility**: Define once, support multiple database dialects
- **Intelligent Migration**: Automatically calculate differences and generate safe incremental migration scripts
- **Ready to Use**: Complete JDBC driver and Spring Boot integration provided

### Typical Use Cases

- **Microservices Architecture**: Each service independently manages its own database schema
- **Multi-Tenant Systems**: Support database sharding with flexible schema evolution
- **CI/CD Integration**: Automated database deployment and upgrades
- **Development & Testing**: Quickly set up and reset test databases

## Quick Start

```bash
# Install CLI tool
npm install -g @justdb/cli

# Create first schema
justdb init

# Deploy to database
justdb migrate
```

<CodeGroup>
<CodeGroupItem title="YAML">

```yaml
id: mydb
namespace: com.example
Table:
  - id: users
    name: users
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

</CodeGroupItem>

<CodeGroupItem title="JSON">

```json
{
  "id": "mydb",
  "namespace": "com.example",
  "Table": [
    {
      "id": "users",
      "name": "users",
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

</CodeGroupItem>
</CodeGroup>

## Next Steps

- [Learn about JustDB's design philosophy](./guide/design-philosophy.md)
- [View quick start guide](./getting-started/)
- [Explore reference documentation](./reference/)
- [Read design documents](./design/)