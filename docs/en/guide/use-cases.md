---
icon: rocket
date: 2024-01-01
title: Use Cases
order: 4
category:
  - Guide
  - Scenarios
tag:
  - scenarios
  - examples
  - practices
---

# Use Cases

JustDB is suitable for various database development scenarios, from simple personal projects to complex enterprise applications. Below are typical use cases and best practices.

## 1. Agile Development Teams

### Scenario Description

Rapidly iterating web applications that frequently need to add new tables, modify fields, and adjust indexes.

### Pain Points

- Hand-writing SQL scripts is time-consuming and error-prone
- Need to manage many migration script files
- Script conflicts easily occur with multiple collaborators
- Schema change documentation maintenance is difficult

### JustDB Solution

```yaml
# schema/users.yaml
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
      - name: avatar
        type: VARCHAR(500)  # New field
```

```bash
# Developer modifies Schema
vim schema/users.yaml

# Apply changes
justdb migrate

# Git commit
git add schema/users.yaml
git commit -m "Add user avatar field"
git push

# Team members pull and execute
justdb migrate
```

**Benefits**:
- Change time reduced from 10 minutes to 2 minutes
- No need to maintain migration script versions
- Simple Git conflict resolution
- Schema as documentation

## 2. Microservices Architecture

### Scenario Description

Each microservice independently manages its own database, requiring version control and independent deployment.

### Pain Points

- Each service needs independent database migration strategy
- Database schemas may be inconsistent between services
- Database migration easily fails during deployment
- Difficult to track each service's schema version

### JustDB Solution

```
user-service/
├── src/main/resources/
│   └── justdb/
│       └── users.yaml
├── pom.xml
└── application.yml

order-service/
├── src/main/resources/
│   └── justdb/
│       └── orders.yaml
├── pom.xml
└── application.yml
```

```yaml
# user-service/application.yml
justdb:
  enabled: true
  locations: classpath:justdb
  baseline-on-migrate: true  # Baseline version management
```

```java
// user-service auto-migrates user database on startup
@SpringBootApplication
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
        // User database has been auto-migrated to latest state
    }
}
```

**Benefits**:
- Each service independently manages schema
- Auto baseline version management
- Auto execute migration on deployment
- Clear schema version traceability

## 3. Multi-Environment Consistency

### Scenario Description

Development, testing, staging, and production environments need to maintain consistent database structure.

### Pain Points

- Schemas easily differ across environments
- Manual SQL script execution easily遗漏
- Difficult data migration between environments
- High production deployment risk

### JustDB Solution

```yaml
# config/dev.yaml
database:
  url: jdbc:mysql://dev-db:3306/myapp
  username: dev_user
  password: dev_pass

# config/test.yaml
database:
  url: jdbc:mysql://test-db:3306/myapp
  username: test_user
  password: test_pass

# config/prod.yaml
database:
  url: jdbc:mysql://prod-db:3306/myapp
  username: prod_user
  password: ${DB_PASSWORD}  # Read from environment variable
```

```bash
# Development environment
justdb migrate -c config/dev.yaml

# Test environment
justdb migrate -c config/test.yaml

# Production environment (preview first)
justdb migrate -c config/prod.yaml --dry-run

# Execute after confirmation
justdb migrate -c config/prod.yaml
```

**Benefits**:
- All environments use the same schema definition
- Preview generated SQL before changes
- Reduce production deployment risk
- Simple and fast environment switching

## 4. Database Documentation

### Scenario Description

Need to maintain database design documentation for team reference.

### Pain Points

- Database documentation out of sync with actual schema
- Extra work required to maintain documentation
- Difficult for new members to understand database structure
- Visual diagrams need manual updates

### JustDB Solution

```yaml
# Schema as documentation
Table:
  - id: orders
    name: 订单表
    comment: |
      Store all order information, including order status, amount, customer info, etc.
      Order status flow: pending -> paid -> shipped -> completed
    Column:
      - name: order_no
        comment: Order number, format: YYYYMMDD + sequence
      - name: customer_id
        comment: Customer ID, references customers.id
      - name: total_amount
        comment: Order total amount (unit: cents)
      - name: status
        comment: Order status: pending/paid/shipped/completed
```

```bash
# Generate documentation
justdb doc -f markdown -o DATABASE.md
justdb doc -f html -o DATABASE.html

# Generate ER diagram (requires graphviz)
justdb erd -o erd.png
```

**Benefits**:
- Schema and documentation always in sync
- Support multiple documentation formats
- Auto-generate visual ER diagrams
- New members quickly understand database structure

## 5. CI/CD Integration

### Scenario Description

Automatically manage database in continuous integration/deployment workflow.

### Pain Points

- Need to manually execute database migration
- Difficult rollback when migration fails
- Cannot auto-validate schema changes
- Complex deployment process

### JustDB Solution

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: testdb
        ports:
          - 3306:3306

    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK
        uses: actions/setup-java@v3
        with:
          java-version: '11'

      - name: Cache Maven packages
        uses: actions/cache@v3
        with:
          path: ~/.m2
          key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}

      - name: Migrate database (dry-run)
        run: justdb migrate --dry-run

      - name: Migrate database
        run: justdb migrate

      - name: Run tests
        run: mvn test

      - name: Validate schema
        run: justdb validate
```

```yaml
# .github/workflows/cd.yml
name: CD

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        run: |
          justdb migrate --dry-run
          justdb migrate
        env:
          DB_URL: ${{ secrets.DB_URL }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
```

**Benefits**:
- Auto execute database migration
- Preview changes before migration
- Auto rollback on failure
- Automated deployment process

## 6. Cross-Database Platform

### Scenario Description

Need to support multiple databases (MySQL, PostgreSQL, Oracle, etc.), or need to switch between different databases.

### Pain Points

- Need to maintain multiple sets of SQL scripts
- SQL dialect differences cause compatibility issues
- High database switching cost
- Need to understand multiple database syntax

### JustDB Solution

```yaml
# One schema definition supports all databases
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true  # Auto-adapt to different databases
      - name: username
        type: VARCHAR(50)
      - name: created_at
        type: TIMESTAMP
        defaultValueComputed: CURRENT_TIMESTAMP
```

```bash
# MySQL
justdb migrate -d mysql

# PostgreSQL
justdb migrate -d postgresql

# Oracle
justdb migrate -d oracle

# JustDB auto-generates SQL for each database
```

**Benefits**:
- One schema supports all databases
- Auto-handle dialect differences
- Zero cost database switching
- Reduced learning cost

## 7. Database Refactoring

### Scenario Description

Need to refactor existing database structure - split large tables, merge small tables, optimize indexes.

### Pain Points

- Need to hand-write complex ALTER TABLE scripts
- Data migration error-prone
- Difficult to rollback refactoring process
- Need downtime for maintenance

### JustDB Solution

```yaml
# Split large table
Table:
  - name: users_profile
    formerNames: [users]  # Renamed from users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
      - name: avatar
        type: VARCHAR(500)
      - name: bio
        type: TEXT

  - name: users_auth
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: user_id
        type: BIGINT
        referencedTable: users_profile
        referencedColumn: id
      - name: password_hash
        type: VARCHAR(255)
      - name: email
        type: VARCHAR(100)
```

```bash
# JustDB auto-generates refactoring SQL
justdb migrate

# Generated SQL:
# 1. CREATE TABLE users_auth ...
# 2. INSERT INTO users_auth SELECT id, password_hash, email FROM users;
# 3. ALTER TABLE users RENAME TO users_profile;
# 4. ALTER TABLE users_auth ADD FOREIGN KEY ...
```

**Benefits**:
- Declarative definition of refactoring target
- Auto-generate refactoring SQL
- Support incremental migration
- Preview change content

## 8. AI-Assisted Development

### Scenario Description

Quickly create and modify database schema through natural language.

### Pain Points

- Unfamiliar with JustDB Schema syntax
- Need to frequently consult documentation
- Low schema design efficiency

### JustDB Solution

```bash
# Start interactive mode
justdb

# Use AI to create table
> /ai Create a product table with product ID, name, price, stock, category ID, and status

# AI generates Schema
Table:
  - name: products
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
      - name: name
        type: VARCHAR(255)
        nullable: false
      - name: price
        type: DECIMAL(10, 2)
        nullable: false
      - name: stock
        type: INT
        defaultValue: 0
      - name: category_id
        type: BIGINT
      - name: status
        type: VARCHAR(20)
        defaultValue: active
    Index:
      - name: idx_category
        columns: [category_id]
      - name: idx_status
        columns: [status]

# Confirm and deploy
> /migrate

# AI optimization suggestions
> /ai Analyze current schema and provide optimization suggestions

# AI returns:
# Suggestion 1: Add fulltext index for products.name to support search
# Suggestion 2: Consider changing products.status to ENUM type
# Suggestion 3: Add check constraint for products.price to ensure non-negative
```

**Benefits**:
- Natural language interaction, lower learning cost
- AI-assisted schema design
- Intelligent optimization suggestions
- Improved development efficiency

## 9. Teaching and Learning

### Scenario Description

Database course teaching or learning database design.

### Pain Points

- Students need to learn complex SQL syntax
- Difficult to set up experimental environment
- Difficult assignment grading and feedback

### JustDB Solution

```yaml
# Student assignment - simple and intuitive
Table:
  - name: students
    Column:
      - name: id
        type: INT
        primaryKey: true
      - name: name
        type: VARCHAR(50)
      - name: grade
        type: DECIMAL(4, 2)
```

```bash
# Student submits assignment
git add homework.yaml
git commit -m "Assignment: Student table design"
git push

# Teacher auto-grading
justdb validate homework.yaml
justdb diff homework.yaml solution.yaml
```

**Benefits**:
- Lower learning barrier
- Focus on design not syntax
- Automated assignment grading
- Easy version control

## 10. Legacy System Migration

### Scenario Description

Migrate legacy system database to new architecture.

### Pain Points

- Complex legacy system schema
- Missing documentation and design specifications
- High migration risk
- Difficult data migration

### JustDB Solution

```bash
# Extract schema from legacy database
justdb db2schema \
    -u jdbc:mysql://legacy-db:3306/oldapp \
    -o legacy-schema.yaml

# Analyze and refactor
vim legacy-schema.yaml

# Generate diff report
justdb diff legacy-schema.yaml new-schema.yaml

# Incremental migration
justdb migrate
```

**Benefits**:
- Auto-extract existing schema
- Visual diff analysis
- Incremental migration
- Reduced migration risk

## Selection Guide

### Recommended for JustDB

<VPCard
  title="✅ Agile Development Teams"
  desc="Need frequent database structure changes"
/>

<VPCard
  title="✅ Microservices Architecture"
  desc="Each service manages database independently"
/>

<VPCard
  title="✅ Multi-Environment Deployment"
  desc="Need to maintain environment consistency"
/>

<VPCard
  title="✅ CI/CD Integration"
  desc="Automated database management"
/>

<VPCard
  title="✅ Cross-Database Platform"
  desc="Need to support multiple databases"
/>

### Scenarios Requiring Evaluation

<VPCard
  title="⚠️ Complex Stored Procedures"
  desc="JustDB focuses on Schema management"
/>

<VPCard
  title="⚠️ Many Existing Scripts"
  desc="Migration cost should be considered"
/>

<VPCard
  title="⚠️ Special Database Features"
  desc="May need plugin extension"
/>

## Next Steps

<VPCard
  title="Quick Start"
  desc="Get started with JustDB in 5 minutes"
  link="/en/getting-started/quick-start.html"
/>

<VPCard
  title="Installation Guide"
  desc="Install and configure JustDB"
  link="/en/getting-started/installation.html"
/>

<VPCard
  title="Spring Boot Integration"
  desc="Use JustDB in Spring Boot"
  link="/en/getting-started/spring-boot-integration.html"
/>
