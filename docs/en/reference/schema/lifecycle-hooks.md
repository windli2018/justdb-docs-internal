---
icon: git-commit
title: Lifecycle Hooks
order: 13
category:
  - Reference
  - Schema Definition
tag:
  - lifecycle
  - hooks
  - schema
---

# Lifecycle Hooks

Lifecycle hooks allow executing custom SQL statements before and after DDL (Data Definition Language) operations. Hooks provide a flexible way to extend JustDB functionality, implementing database-specific logic or custom operations.

## Hook Types

| Hook | Execution Timing | Applicable Objects |
|------|------------------|-------------------|
| `beforeCreates` | Before CREATE TABLE/VIEW/INDEX | Table, View, Index |
| `afterCreates` | After CREATE TABLE/VIEW/INDEX | Table, View, Index |
| `beforeDrops` | Before DROP TABLE/VIEW/INDEX | Table, View, Index |
| `afterDrops` | After DROP TABLE/VIEW/INDEX | Table, View, Index |
| `beforeAlters` | Before ALTER TABLE/VIEW/COLUMN | Table, View, Column |
| `afterAlters` | After ALTER TABLE/VIEW/COLUMN | Table, View, Column |
| `beforeAdds` | Before ADD COLUMN/INDEX/CONSTRAINT | Table, View |
| `afterAdds` | After ADD COLUMN/INDEX/CONSTRAINT | Table, View |

## ConditionalSqlScript Structure

Hooks use `ConditionalSqlScript` to define conditional SQL scripts:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `content` | String | Yes | SQL script content |
| `dbms` | List<String> | No | Applicable database list |
| `condition` | String | No | Execution condition expression |

## Basic Examples

### Simple Hook

```yaml
Table:
  - name: users
    comment: User table
    afterCreates:
      - content: |
          CREATE INDEX idx_users_created_at
          ON users(created_at);
```

### Conditional Hook

Execute different SQL based on database type:

```yaml
Table:
  - name: users
    afterCreates:
      - dbms: [postgresql]
        content: |
          CREATE INDEX CONCURRENTLY idx_users_email
          ON users(email);

      - dbms: [mysql]
        content: |
          CREATE INDEX idx_users_email
          ON users(email);
```

## Table-Level Hooks

### beforeCreates / afterCreates

Execute SQL before and after creating table:

```yaml
Table:
  - name: users
    beforeCreates:
      - content: |
          -- Pre-creation check
          SELECT COUNT(*) FROM information_schema.tables
          WHERE table_name = 'users_backup';

    afterCreates:
      - content: |
          -- Initialize data after creation
          INSERT INTO users (username, email, status)
          VALUES ('admin', 'admin@example.com', 'active');

          -- Create additional index
          CREATE INDEX idx_users_status
          ON users(status);
```

### beforeDrops / afterDrops

Execute SQL before and after dropping table:

```yaml
Table:
  - name: users
    beforeDrops:
      - content: |
          -- Backup data before drop
          CREATE TABLE users_backup AS
          SELECT * FROM users;

    afterDrops:
      - content: |
          -- Cleanup after drop
          DROP TABLE IF EXISTS users_backup;
```

### beforeAlters / afterAlters

Execute SQL before and after modifying table:

```yaml
Table:
  - name: users
    beforeAlters:
      - content: |
          -- Lock table before modification
          LOCK TABLES users WRITE;

    afterAlters:
      - content: |
          -- Unlock after modification
          UNLOCK TABLES;
```

### beforeAdds / afterAdds

Execute SQL before and after adding child objects:

```yaml
Table:
  - name: users
    Column:
      - name: status
        type: VARCHAR(20)
        defaultValue: 'active'

    afterAdds:
      - content: |
          -- Update existing data after adding column
          UPDATE users
          SET status = 'active'
          WHERE status IS NULL;
```

## Column-Level Hooks

Columns also support lifecycle hooks:

```yaml
Table:
  - name: users
    Column:
      - name: email
        type: VARCHAR(100)
        afterAlters:
          - content: |
              -- Update data after column modification
              UPDATE users
              SET email = LOWER(email)
              WHERE email IS NOT NULL
                AND email != LOWER(email);
```

## Database-Specific Hooks

### PostgreSQL Specific Hooks

```yaml
Table:
  - name: users
    afterCreates:
      - dbms: [postgresql, timescaledb]
        content: |
          -- Create concurrent index
          CREATE INDEX CONCURRENTLY idx_users_username
          ON users(LOWER(username));

          -- Create partial index
          CREATE INDEX idx_users_active
          ON users(created_at)
          WHERE status = 'active';

      - dbms: [postgresql]
        content: |
          -- Create trigger function
          CREATE OR REPLACE FUNCTION update_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          -- Create trigger
          CREATE TRIGGER trg_users_update_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at();
```

### MySQL Specific Hooks

```yaml
Table:
  - name: products
    afterCreates:
      - dbms: [mysql, mariadb]
        content: |
          -- Create full-text index
          CREATE FULLTEXT INDEX ft_products_search
          ON products(name, description);

          -- Create spatial index
          CREATE SPATIAL INDEX idx_products_location
          ON products(location);
```

### Oracle Specific Hooks

```yaml
Table:
  - name: users
    afterCreates:
      - dbms: [oracle]
        content: |
          -- Create sequence
          CREATE SEQUENCE seq_users_id
          START WITH 1
          INCREMENT BY 1
          NOCACHE;

          -- Create trigger
          CREATE OR REPLACE TRIGGER trg_users_bi
          BEFORE INSERT ON users
          FOR EACH ROW
          BEGIN
            IF :NEW.id IS NULL THEN
              SELECT seq_users_id.NEXTVAL INTO :NEW.id FROM dual;
            END IF;
          END;
          /
```

## Advanced Usage

### Multi-Stage Hooks

Combine multiple hooks to implement complex logic:

```yaml
Table:
  - name: orders
    beforeCreates:
      - content: |
          -- Stage 1: Create auxiliary table
          CREATE TABLE IF NOT EXISTS order_archive LIKE orders;

    afterCreates:
      - content: |
          -- Stage 2: Create trigger
          CREATE TRIGGER trg_orders_archive
          AFTER UPDATE ON orders
          FOR EACH ROW
          WHEN NEW.status = 'completed'
          BEGIN
            INSERT INTO order_archive VALUES (OLD.*);
          END;

      - content: |
          -- Stage 3: Create event scheduler (MySQL)
          CREATE EVENT evt_cleanup_old_orders
          ON SCHEDULE EVERY 1 DAY
          DO
            DELETE FROM orders
            WHERE status = 'completed'
              AND updated_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### Conditional Execution

Execute hooks based on conditions:

```yaml
Table:
  - name: users
    afterCreates:
      - condition: "@root.environment == 'production'"
        content: |
          -- Create only in production
          CREATE INDEX idx_users_created_at
          ON users(created_at);

      - condition: "@root.environment == 'development'"
        content: |
          -- Create only in development
          CREATE INDEX idx_users_all
          ON users(username, email, status);
```

### Hook Chains

Multiple hooks execute in sequence:

```yaml
Table:
  - name: products
    afterCreates:
      # Hook 1: Create basic index
      - content: |
          CREATE INDEX idx_products_name
          ON products(name);

      # Hook 2: Create full-text index
      - dbms: [mysql]
        content: |
          CREATE FULLTEXT INDEX ft_products_search
          ON products(name, description);

      # Hook 3: Create statistics table
      - content: |
          CREATE TABLE IF NOT EXISTS product_stats AS
          SELECT
            category_id,
            COUNT(*) AS product_count,
            AVG(price) AS avg_price
          FROM products
          GROUP BY category_id;
```

## Complete Examples

### E-commerce System Lifecycle Hooks

```yaml
Table:
  # User table hooks
  - name: users
    comment: User table
    beforeCreates:
      - content: |
          -- Create backup table
          CREATE TABLE IF NOT EXISTS users_backup LIKE users;

    afterCreates:
      # PostgreSQL specific
      - dbms: [postgresql]
        content: |
          -- Create update timestamp function
          CREATE OR REPLACE FUNCTION update_users_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          -- Create trigger
          CREATE TRIGGER trg_users_update_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_users_updated_at();

          -- Create concurrent index
          CREATE INDEX CONCURRENTLY idx_users_email
          ON users(email);

          -- Create partial index
          CREATE INDEX idx_users_active
          ON users(created_at)
          WHERE status = 'active';

      # MySQL specific
      - dbms: [mysql, mariadb]
        content: |
          -- Create update timestamp trigger
          CREATE TRIGGER trg_users_before_update
          BEFORE UPDATE ON users
          FOR EACH ROW
          SET NEW.updated_at = CURRENT_TIMESTAMP;

          -- Create indexes
          CREATE INDEX idx_users_email
          ON users(email);

          CREATE INDEX idx_users_status
          ON users(status);

      # Initialize admin account
      - content: |
          INSERT INTO users (username, email, password_hash, status)
          VALUES ('admin', 'admin@example.com', '$2a$10$...', 'active');

    beforeDrops:
      - content: |
          -- Backup before drop
          INSERT INTO users_backup
          SELECT * FROM users;

    afterDrops:
      - content: |
          -- Cleanup after drop
          DROP TABLE IF EXISTS users_backup;

  # Order table hooks
  - name: orders
    comment: Order table
    beforeCreates:
      - content: |
          -- Create order archive table
          CREATE TABLE IF NOT EXISTS order_archive (
            LIKE orders INCLUDING ALL
          );

    afterCreates:
      - dbms: [postgresql]
        content: |
          -- Create archive trigger
          CREATE OR REPLACE FUNCTION archive_completed_orders()
          RETURNS TRIGGER AS $$
          BEGIN
            IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
              INSERT INTO order_archive VALUES (NEW.*);
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER trg_orders_archive
          AFTER UPDATE ON orders
          FOR EACH ROW
          EXECUTE FUNCTION archive_completed_orders();

      # Create order number sequence
      - dbms: [postgresql, oracle, h2]
        content: |
          CREATE SEQUENCE seq_order_no
          START WITH 1000
          INCREMENT BY 1;

      # Create event scheduler (MySQL)
      - dbms: [mysql]
        content: |
          CREATE EVENT evt_cleanup_old_orders
          ON SCHEDULE EVERY 1 DAY
          DO
            DELETE FROM orders
            WHERE status = 'completed'
              AND updated_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

  # Product table hooks
  - name: products
    comment: Product table
    afterCreates:
      # MySQL full-text search
      - dbms: [mysql, mariadb]
        content: |
          CREATE FULLTEXT INDEX ft_products_search
          ON products(name, description);

      # Low stock alert trigger
      - dbms: [mysql, mariadb]
        content: |
          CREATE TRIGGER trg_products_low_stock
          AFTER UPDATE ON products
          FOR EACH ROW
          WHEN NEW.stock <= NEW.low_stock_threshold
            AND NEW.stock != OLD.stock
          BEGIN
            INSERT INTO low_stock_alerts (product_id, stock_level, alerted_at)
            VALUES (NEW.id, NEW.stock, NOW());
          END;

      # PostgreSQL full-text search
      - dbms: [postgresql]
        content: |
          -- Add full-text search column
          ALTER TABLE products ADD COLUMN search_vector tsvector;

          -- Create update trigger
          CREATE OR REPLACE FUNCTION products_search_vector_update()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.search_vector :=
              setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
              setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER trg_products_search_vector_update
          BEFORE INSERT OR UPDATE ON products
          FOR EACH ROW
          EXECUTE FUNCTION products_search_vector_update();

          -- Create full-text index
          CREATE INDEX idx_products_search
          ON products USING gin(search_vector);

  # Article table hooks
  - name: articles
    comment: Article table
    afterCreates:
      # Create view count update trigger
      - dbms: [mysql, mariadb]
        content: |
          CREATE TRIGGER trg_articles_view_count
          AFTER INSERT ON article_views
          FOR EACH ROW
          BEGIN
            UPDATE articles
            SET view_count = view_count + 1
            WHERE id = NEW.article_id;
          END;

      # Create publish notification
      - dbms: [postgresql]
        content: |
          CREATE OR REPLACE FUNCTION notify_article_published()
          RETURNS TRIGGER AS $$
          BEGIN
            IF NEW.status = 'published' AND OLD.status != 'published' THEN
              PERFORM pg_notify(
                'article_published',
                json_build_object(
                  'article_id', NEW.id,
                  'title', NEW.title,
                  'author_id', NEW.author_id
                )::text
              );
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER trg_articles_notify_published
          AFTER UPDATE ON articles
          FOR EACH ROW
          EXECUTE FUNCTION notify_article_published();
```

## Best Practices

### 1. Hook Naming Convention

```yaml
# Trigger naming
Trigger:
  - name: trg_{table}_{timing}_{event}  # Standard trigger
  - name: trg_{table}_{purpose}         # Functional trigger

# Examples
Trigger:
  - name: trg_users_before_insert
  - name: trg_orders_archive_completed
```

### 2. Keep Hooks Simple

```yaml
# Good design: Simple hooks
afterCreates:
  - content: |
      CREATE INDEX idx_users_email ON users(email);

# Avoid: Overly complex hooks
# Should be split into multiple simple hooks or implemented in application layer
```

### 3. Use Conditional Execution

```yaml
# Avoid executing on wrong database
afterCreates:
  - dbms: [postgresql]
    content: |
      -- PostgreSQL specific syntax
      CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

### 4. Error Handling

```yaml
# Use exception handling
afterCreates:
  - content: |
      BEGIN
        -- Statements that may fail
        CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
      EXCEPTION WHEN OTHERS THEN
        -- Handle error
        NULL;
      END;
```

### 5. Document Hooks

```yaml
Table:
  - name: orders
    afterCreates:
      - comment: |
          Create order archive trigger:
          - Automatically archives completed orders to order_archive table
          - Only triggers when status changes from non-completed to completed
      - content: |
          CREATE TRIGGER trg_orders_archive ...
```

## Common Questions

### What is the Hook Execution Order?

Hooks execute in the following order:
1. beforeCreates → Main operation → afterCreates
2. beforeDrops → Main operation → afterDrops
3. beforeAlters → Main operation → afterAlters
4. beforeAdds → Main operation → afterAdds

Multiple hooks of the same type execute in definition order.

### How to Debug Hooks?

Use a log table to record hook execution:

```yaml
Table:
  - name: users
    afterCreates:
      - content: |
          INSERT INTO hook_execution_log (hook_name, executed_at)
          VALUES ('afterCreates_users', NOW());
```

### What Happens When a Hook Fails?

Hook execution failure rolls back the entire operation. Ensure hooks are idempotent and have error handling.

### How to Disable Hooks?

Use conditions or comment out hook definitions:

```yaml
afterCreates:
  - condition: "@root.enableHooks == true"
    content: |
      CREATE INDEX idx_users_email ON users(email);
```

## Related Documentation

- [Table Definition](./table.md)
- [Column Definition](./column.md)
- [Trigger Definition](./trigger.md)
- [Stored Procedure Definition](./procedure.md)
