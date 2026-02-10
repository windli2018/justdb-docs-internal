---
title: Lifecycle Hooks Cheatsheet
icon: bolt
---

# Lifecycle Hooks

Lifecycle hooks allow injecting custom SQL scripts at different stages of DDL execution.

## Quick Examples

### Basic Hook Usage

```xml
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>

    <!-- Execute after creation -->
    <afterCreates>
        <ConditionalSqlScript>
            <content>INSERT INTO users (id, username) VALUES (1, 'admin')</content>
        </ConditionalSqlScript>
    </afterCreates>

    <!-- Execute before drop -->
    <beforeDrops>
        <ConditionalSqlScript>
            <content>DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users)</content>
        </ConditionalSqlScript>
    </beforeDrops>
</Table>
```

### Multiple Hook Combination

```xml
<Table name="orders">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="order_no" type="VARCHAR(50)"/>

    <!-- Before create: check if table exists -->
    <beforeCreates>
        <ConditionalSqlScript>
            <content>-- Check if table exists</content>
        </ConditionalSqlScript>
    </beforeCreates>

    <!-- After create: create index -->
    <afterCreates>
        <ConditionalSqlScript dbms="mysql">
            <content>CREATE INDEX idx_order_no ON orders(order_no)</content>
        </ConditionalSqlScript>
        <ConditionalSqlScript dbms="postgresql">
            <content>CREATE INDEX idx_order_no ON orders(order_no)</content>
        </ConditionalSqlScript>
    </afterCreates>

    <!-- Before alter: backup data -->
    <beforeAlters>
        <ConditionalSqlScript>
            <content>CREATE TABLE orders_backup AS SELECT * FROM orders</content>
        </ConditionalSqlScript>
    </beforeAlters>

    <!-- After alter: update trigger -->
    <afterAlters>
        <ConditionalSqlScript>
            <content>DROP TRIGGER IF EXISTS trg_orders_update</content>
        </ConditionalSqlScript>
    </afterAlters>

    <!-- After add: initialize data -->
    <afterAdds>
        <ConditionalSqlScript>
            <content>INSERT INTO order_sequences (name, value) VALUES ('order_no', 1000)</content>
        </ConditionalSqlScript>
    </afterAdds>

    <!-- After drop: cleanup related tables -->
    <afterDrops>
        <ConditionalSqlScript>
            <content>DROP TABLE IF EXISTS order_items</content>
        </ConditionalSqlScript>
    </afterDrops>
</Table>
```

## Hook Types

| Hook | Execution Time | Use Cases |
|------|----------------|-----------|
| `beforeCreates` | Before table creation | Check prerequisites, create dependencies |
| `afterCreates` | After table creation | Create indexes, initialize data |
| `beforeAlters` | Before table modification | Backup data, check compatibility |
| `afterAlters` | After table modification | Update triggers, rebuild indexes |
| `beforeDrops` | Before table deletion | Delete dependencies, cleanup foreign keys |
| `afterDrops` | After table deletion | Cleanup related tables, delete sequences |
| `beforeAdds` | Before column addition | Check constraints, prepare data |
| `afterAdds` | After column addition | Set defaults, update data |

## Common Scenarios

### Scenario 1: Initialize Seed Data

```xml
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>

    <afterCreates>
        <ConditionalSqlScript>
            <content>INSERT INTO users (id, username) VALUES (1, 'admin'), (2, 'system')</content>
        </ConditionalSqlScript>
    </afterCreates>
</Table>
```

### Scenario 2: Database-Specific Syntax

```xml
<Table name="events">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="event_time" type="TIMESTAMP"/>

    <afterCreates>
        <!-- MySQL specific -->
        <ConditionalSqlScript dbms="mysql">
            <content>CREATE TRIGGER trg_events_insert BEFORE INSERT ON events FOR EACH ROW SET NEW.event_time = NOW()</content>
        </ConditionalSqlScript>

        <!-- PostgreSQL specific -->
        <ConditionalSqlScript dbms="postgresql">
            <content>CREATE FUNCTION trg_events_insert() RETURNS TRIGGER AS $$ BEGIN NEW.event_time := NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_events_insert BEFORE INSERT ON events FOR EACH ROW EXECUTE FUNCTION trg_events_insert()</content>
        </ConditionalSqlScript>

        <!-- Oracle specific -->
        <ConditionalSqlScript dbms="oracle">
            <content>CREATE OR REPLACE TRIGGER trg_events_insert BEFORE INSERT ON events FOR EACH ROW BEGIN :NEW.event_time := SYSTIMESTAMP; END;</content>
        </ConditionalSqlScript>
    </afterCreates>
</Table>
```

### Scenario 3: Foreign Key Dependencies

```xml
<Table name="user_roles">
    <Column name="user_id" type="BIGINT"/>
    <Column name="role_id" type="BIGINT"/>

    <!-- Before drop: delete related data first -->
    <beforeDrops>
        <ConditionalSqlScript>
            <content>DELETE FROM user_permissions WHERE user_role_id IN (SELECT id FROM user_roles)</content>
        </ConditionalSqlScript>
    </beforeDrops>
</Table>
```

### Scenario 4: Indexes and Constraints

```xml
<Table name="products">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="name" type="VARCHAR(100)"/>
    <Column name="category" type="VARCHAR(50)"/>
    <Column name="price" type="DECIMAL(10,2)"/>

    <afterCreates>
        <!-- Fulltext index -->
        <ConditionalSqlScript dbms="mysql">
            <content>CREATE FULLTEXT INDEX idx_product_name ON products(name)</content>
        </ConditionalSqlScript>

        <!-- Composite index -->
        <ConditionalSqlScript>
            <content>CREATE INDEX idx_product_category ON products(category, price)</content>
        </ConditionalSqlScript>

        <!-- Partial index (PostgreSQL) -->
        <ConditionalSqlScript dbms="postgresql">
            <content>CREATE INDEX idx_product_active ON products(name) WHERE price > 0</content>
        </ConditionalSqlScript>
    </afterCreates>
</Table>
```

## Conditional Execution

### Database Type Conditions

```xml
<afterCreates>
    <!-- MySQL only -->
    <ConditionalSqlScript dbms="mysql">
        <content>CREATE TRIGGER trg_users_insert ...</content>
    </ConditionalSqlScript>

    <!-- PostgreSQL only -->
    <ConditionalSqlScript dbms="postgresql">
        <content>CREATE FUNCTION trg_users_insert() ...</content>
    </ConditionalSqlScript>

    <!-- Multiple databases (comma-separated) -->
    <ConditionalSqlScript dbms="mysql,postgresql">
        <content>CREATE INDEX idx_users_name ON users(username)</content>
    </ConditionalSqlScript>
</afterCreates>
```

### Version Conditions

```xml
<beforeAlters>
    <!-- MySQL 8.0+ -->
    <ConditionalSqlScript dbms="mysql" dbVersionMin="8.0">
        <content>CREATE INDEX idx_users_json ON users((CAST(metadata->>'$.id' AS UNSIGNED)))</content>
    </ConditionalSqlScript>

    <!-- PostgreSQL 12+ -->
    <ConditionalSqlScript dbms="postgresql" dbVersionMin="12">
        <content>CREATE INDEX idx_users_json ON users USING GIN (metadata jsonb_path_ops)</content>
    </ConditionalSqlScript>
</beforeAlters>
```

### Schema State Conditions

```xml
<beforeAlters>
    <!-- Only when column doesn't exist -->
    <ConditionalSqlScript condition="!columnExists('users','email')">
        <content>ALTER TABLE users ADD COLUMN email VARCHAR(100)</content>
    </ConditionalSqlScript>
</beforeAlters>
```

## Hook Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `content` | String | SQL script content |
| `dbms` | String | Database type (comma-separated for multiple) |
| `dbVersionMin` | String | Minimum database version |
| `dbVersionMax` | String | Maximum database version |
| `condition` | String | Execution condition expression |

## Important Notes

### 1. Hook Execution Order

```
beforeCreates → CREATE TABLE → afterCreates
beforeAlters → ALTER TABLE → afterAlters
beforeAdds → ADD COLUMN → afterAdds
beforeDrops → DROP TABLE → afterDrops
```

### 2. Transaction Management

```xml
<!-- Hooks execute in the same transaction -->
<Table name="users">
    <afterCreates>
        <!-- If this fails, table creation also rolls back -->
        <ConditionalSqlScript>
            <content>INSERT INTO users ...</content>
        </ConditionalSqlScript>
    </afterCreates>
</Table>
```

### 3. Error Handling

```xml
<!-- Use IF EXISTS to avoid errors -->
<beforeDrops>
    <ConditionalSqlScript>
        <content>DROP TRIGGER IF EXISTS trg_users_update</content>
    </ConditionalSqlScript>
</beforeDrops>
```

### 4. Permission Requirements

```xml
<!-- Some operations require special permissions -->
<afterCreates>
    <!-- Creating trigger requires TRIGGER permission -->
    <ConditionalSqlScript>
        <content>CREATE TRIGGER trg_users_insert ...</content>
    </ConditionalSqlScript>

    <!-- Creating sequence requires CREATE SEQUENCE permission -->
    <ConditionalSqlScript>
        <content>CREATE SEQUENCE seq_users_id START WITH 1</content>
    </ConditionalSqlScript>
</afterCreates>
```

## Advanced Techniques

### Technique 1: Dynamic SQL

```xml
<beforeAlters>
    <ConditionalSqlScript>
        <content>
            SET @column_exists = (
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'email'
            );
            SET @sql = IF(@column_exists = 0, 'ALTER TABLE users ADD COLUMN email VARCHAR(100)', 'SELECT "Column exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        </content>
    </ConditionalSqlScript>
</beforeAlters>
```

### Technique 2: Batch Operations

```xml
<afterCreates>
    <ConditionalSqlScript>
        <content>
            INSERT INTO roles (name) VALUES ('admin'), ('user'), ('guest');
            INSERT INTO permissions (name) VALUES ('read'), ('write'), ('delete');
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
            WHERE r.name = 'admin';
        </content>
    </ConditionalSqlScript>
</afterCreates>
```

### Technique 3: Stored Procedure Calls

```xml
<afterCreates>
    <ConditionalSqlScript dbms="mysql">
        <content>CALL init_user_data()</content>
    </ConditionalSqlScript>
    <ConditionalSqlScript dbms="postgresql">
        <content>SELECT init_user_data()</content>
    </ConditionalSqlScript>
    <ConditionalSqlScript dbms="oracle">
        <content>BEGIN init_user_data(); END;</content>
    </ConditionalSqlScript>
</afterCreates>
```

## Reference Links

- [Lifecycle Hooks Detail](../../reference/schema/lifecycle-hooks.md)
- [SQL Reference](../../reference/sql/)
- [Database Scripts](../../reference/scripts/)
