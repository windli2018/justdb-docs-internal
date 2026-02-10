---
icon: rocket
date: 2024-01-01
title: Getting Started
order: 1
category:
  - Guide
  - Getting Started
tag:
  - getting-started
  - tutorial
---

# Getting Started Guide

Welcome to the JustDB documentation! This guide will help you get started with JustDB database schema management.

## Quick Links

The following guides will help you get started:

<VPCard
  title="Installation"
  desc="Install and configure JustDB"
  link="/getting-started/installation.html"
/>

<VPCard
  title="Quick Start"
  desc="Create your first schema in 5 minutes"
  link="/getting-started/quick-start.html"
/>

<VPCard
  title="First Schema"
  desc="Learn schema definition basics"
  link="/getting-started/first-schema.html"
/>

<VPCard
  title="Migration Basics"
  desc="Understand database migrations"
  link="/getting-started/migration-basics.html"
/>

<VPCard
  title="Common Tasks"
  desc="Frequently used operations"
  link="/getting-started/common-tasks.html"
/>

<VPCard
  title="Spring Boot Integration"
  desc="Use JustDB with Spring Boot"
  link="/getting-started/spring-boot-integration.html"
/>

## What is JustDB?

JustDB is a database-agnostic SQL generation and schema management framework that provides:

- **Declarative Schema Definition** - Define your database structure in YAML, JSON, XML, SQL, or TOML
- **Database Agnostic** - Support for 20+ databases including MySQL, PostgreSQL, Oracle, SQL Server, SQLite, and more
- **Version Control Friendly** - Store schema definitions in Git like code
- **Automated Migration** - Calculate and apply schema changes automatically

## Key Features

### 1. Multiple Schema Formats

Support for 5 different schema definition formats:

::: code-tabs#schema-formats

@tab YAML

```yaml
namespace: com.example
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
  "namespace": "com.example",
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

@tab XML

```xml
<Justdb namespace="com.example">
  <Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
  </Table>
</Justdb>
```

@tab SQL

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY
);
```

@tab TOML

```toml
namespace = "com.example"

[[Table]]
name = "users"

[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true
```

:::

### 2. Smart Schema Evolution

JustDB tracks schema changes and intelligently handles:

- **Renaming Detection** - Automatically detect object renames
- **Type Conversion** - Convert data types with preservation
- **Safe Migration** - Preview changes before execution

### 3. CI/CD Ready

Integrate with your existing CI/CD pipeline:

- GitLab CI
- GitHub Actions
- Jenkins
- Docker & Kubernetes

## Next Steps

Choose your next learning path:

<VPCard
  title="What is JustDB?"
  desc="Understand the core concepts"
  link="/guide/what-is-justdb.html"
/>

<VPCard
  title="Why JustDB?"
  desc="Compare with other tools"
  link="/guide/why-justdb.html"
/>

<VPCard
  title="Installation Guide"
  desc="Install JustDB CLI"
  link="/getting-started/installation.html"
/>
