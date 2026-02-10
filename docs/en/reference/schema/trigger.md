---
icon: lightning
title: Trigger Definition
order: 10
category:
  - Reference
  - Schema Definition
tag:
  - trigger
  - schema
  - database
---

# Trigger Definition

Trigger is a database object that automatically executes in response to certain events on a particular table or view. JustDB provides complete Trigger definition support.

## Trigger Properties

### Core Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | Trigger name |
| `id` | String | No | Trigger ID, used for reference |
| `comment` | String | No | Trigger comment |
| `tableName` | String | Yes | Associated table name |
| `events` | List<TriggerEvent&gt;> | Yes | Trigger events |
| `timing` | TriggerTiming | Yes | Trigger timing |
| `body` | String | Yes | Trigger body (SQL/PL-SQL) |
| `forEach` | ForEachType | No | Trigger scope (ROW/STATEMENT) |
| `condition` | String | No | Trigger condition (WHEN clause) |
| `changeType` | ChangeType | No | Change type |
| `formerNames` | List&lt;String&gt; | No | Old name list |

### TriggerEvent (Events)

| Event | Description |
|-------|-------------|
| `INSERT` | Triggered when inserting data |
| `UPDATE` | Triggered when updating data |
| `DELETE` | Triggered when deleting data |
| `TRUNCATE` | Triggered when truncating table (PostgreSQL) |

### TriggerTiming (Timing)

| Timing | Description |
|--------|-------------|
| `BEFORE` | Execute before the operation |
| `AFTER` | Execute after the operation |
| `INSTEAD_OF` | Execute instead of the operation (views) |

### ForEachType (Scope)

| Type | Description |
|------|-------------|
| `ROW` | Trigger fires for each affected row |
| `STATEMENT` | Trigger fires once per statement |

## Format Examples

### XML Format

```xml
<Justdb xmlns="http://www.verydb.org/schema">
    <!-- Insert trigger -->
    <Trigger name="trg_users_insert_audit"
             tableName="users"
             comment="User insert audit trigger"
             events="INSERT"
             timing="BEFORE"
             forEach="ROW">
        <body><![CDATA[
            INSERT INTO users_audit (user_id, action, action_time)
            VALUES (NEW.id, 'INSERT', NOW());
        ]]></body>
    </Trigger>

    <!-- Update trigger -->
    <Trigger name="trg_users_update_audit"
             tableName="users"
             comment="User update audit trigger"
             events="UPDATE"
             timing="AFTER"
             forEach="ROW">
        <body><![CDATA[
            INSERT INTO users_audit (user_id, action, action_time, old_values, new_values)
            VALUES (NEW.id, 'UPDATE', NOW(),
                    JSON_REMOVE(JSON_OBJECT(OLD.*), '$.password'),
                    JSON_REMOVE(JSON_OBJECT(NEW.*), '$.password'));
        ]]></body>
    </Trigger>

    <!-- Delete trigger with condition -->
    <Trigger name="trg_orders_delete_check"
             tableName="orders"
             comment="Prevent deletion of shipped orders"
             events="DELETE"
             timing="BEFORE"
             forEach="ROW">
        <condition>NEW.status = 'shipped'</condition>
        <body><![CDATA[
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot delete shipped orders';
        ]]></body>
    </Trigger>
</Justdb>
```

### YAML Format

```yaml
Trigger:
  - name: trg_users_insert_audit
    tableName: users
    comment: User insert audit trigger
    events:
      - INSERT
    timing: BEFORE
    forEach: ROW
    body: |
      INSERT INTO users_audit (user_id, action, action_time)
      VALUES (NEW.id, 'INSERT', NOW());

  - name: trg_users_update_audit
    tableName: users
    comment: User update audit trigger
    events:
      - UPDATE
    timing: AFTER
    forEach: ROW
    body: |
      INSERT INTO users_audit (user_id, action, action_time, old_values, new_values)
      VALUES (NEW.id, 'UPDATE', NOW(),
              JSON_REMOVE(JSON_OBJECT(OLD.*), '$.password'),
              JSON_REMOVE(JSON_OBJECT(NEW.*), '$.password'));

  - name: trg_orders_delete_check
    tableName: orders
    comment: Prevent deletion of shipped orders
    events:
      - DELETE
    timing: BEFORE
    forEach: ROW
    condition: NEW.status = 'shipped'
    body: |
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot delete shipped orders';
```

### JSON Format

```json
{
  "Trigger": [
    {
      "name": "trg_users_insert_audit",
      "tableName": "users",
      "comment": "User insert audit trigger",
      "events": ["INSERT"],
      "timing": "BEFORE",
      "forEach": "ROW",
      "body": "INSERT INTO users_audit (user_id, action, action_time)\nVALUES (NEW.id, 'INSERT', NOW());"
    },
    {
      "name": "trg_users_update_audit",
      "tableName": "users",
      "comment": "User update audit trigger",
      "events": ["UPDATE"],
      "timing": "AFTER",
      "forEach": "ROW",
      "body": "INSERT INTO users_audit (user_id, action, action_time, old_values, new_values)\nVALUES (NEW.id, 'UPDATE', NOW(),\n        JSON_REMOVE(JSON_OBJECT(OLD.*), '$.password'),\n        JSON_REMOVE(JSON_OBJECT(NEW.*), '$.password'));"
    }
  ]
}
```

## Common Trigger Scenarios

### 1. Audit Logging

```yaml
Trigger:
  - name: trg_users_audit
    tableName: users
    events: [INSERT, UPDATE, DELETE]
    timing: AFTER
    forEach: ROW
    body: |
      INSERT INTO users_audit (
        table_name, operation, user_id,
        old_data, new_data, changed_by, changed_at
      )
      VALUES (
        'users',
        CASE
          WHEN INSERTING THEN 'INSERT'
          WHEN UPDATING THEN 'UPDATE'
          WHEN DELETING THEN 'DELETE'
        END,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN DELETING THEN TO_JSON(OLD) ELSE NULL END,
        CASE WHEN INSERTING OR UPDATING THEN TO_JSON(NEW) ELSE NULL END,
        CURRENT_USER,
        NOW()
      );
```

### 2. Auto-update Timestamp

```yaml
Trigger:
  - name: trg_entities_update_timestamp
    tableName: entities
    events: [UPDATE]
    timing: BEFORE
    forEach: ROW
    body: |
      SET NEW.updated_at = NOW();
```

### 3. Data Validation

```yaml
Trigger:
  - name: trg_orders_validate_status
    tableName: orders
    events: [UPDATE]
    timing: BEFORE
    forEach: ROW
    condition: |
      NEW.status <> OLD.status
      AND NEW.status IN ('cancelled', 'refunded')
    body: |
      IF OLD.status NOT IN ('pending', 'paid') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Can only cancel pending or paid orders';
      END IF;
```

### 4. Derived Data Maintenance

```yaml
Trigger:
  - name: trg_order_items_update_total
    tableName: order_items
    events: [INSERT, UPDATE, DELETE]
    timing: AFTER
    forEach: ROW
    body: |
      UPDATE orders
      SET total_amount = (
        SELECT COALESCE(SUM(quantity * unit_price), 0)
        FROM order_items
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
      )
      WHERE id = COALESCE(NEW.order_id, OLD.order_id);
```

### 5. Cascading Operations

```yaml
Trigger:
  - name: trg_users_delete_cascade
    tableName: users
    events: [DELETE]
    timing: BEFORE
    forEach: ROW
    body: |
      -- Delete related user data
      DELETE FROM user_sessions WHERE user_id = OLD.id;
      DELETE FROM user_preferences WHERE user_id = OLD.id;
      DELETE FROM user_notifications WHERE user_id = OLD.id;
```

### 6. Soft Delete

```yaml
Trigger:
  - name: trg_entities_soft_delete
    tableName: entities
    events: [DELETE]
    timing: BEFORE
    forEach: ROW
    body: |
      -- Convert DELETE to UPDATE (soft delete)
      UPDATE entities
      SET deleted = true,
          deleted_at = NOW(),
          deleted_by = CURRENT_USER
      WHERE id = OLD.id;
      -- Cancel actual delete
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Soft delete performed';
```

## Database-Specific Support

### MySQL Triggers

```yaml
Trigger:
  - name: trg_products_update_stock
    tableName: order_items
    events: [INSERT]
    timing: AFTER
    forEach: ROW
    body: |
      UPDATE products
      SET stock_quantity = stock_quantity - NEW.quantity
      WHERE id = NEW.product_id;
```

**MySQL syntax characteristics:**
- Use `NEW` and `OLD` to reference row values
- No INSTEAD OF triggers
- No trigger for multiple events (need separate triggers)

### PostgreSQL Triggers

```yaml
Trigger:
  - name: trg_products_update_stock
    tableName: order_items
    events: [INSERT]
    timing: AFTER
    forEach: ROW
    body: |
      BEGIN
        UPDATE products
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id;
      END;
```

**PostgreSQL syntax characteristics:**
- Trigger body must be a function
- Supports INSTEAD OF triggers (for views)
- Supports constraint triggers
- Multiple events can be combined

PostgreSQL function-based trigger:

```yaml
# First define function
Procedure:
  - name: fn_update_product_stock
    type: FUNCTION
    body: |
      BEGIN
        UPDATE products
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id;
        RETURN NEW;
      END;

# Then define trigger
Trigger:
  - name: trg_products_update_stock
    tableName: order_items
    events: [INSERT]
    timing: AFTER
    forEach: ROW
    body: |
      EXECUTE FUNCTION fn_update_product_stock()
```

### Oracle Triggers

```yaml
Trigger:
  - name: trg_employees_audit
    tableName: employees
    events: [INSERT, UPDATE, DELETE]
    timing: BEFORE
    forEach: ROW
    body: |
      BEGIN
        IF INSERTING THEN
          INSERT INTO employees_audit (
            employee_id, operation, operation_time
          ) VALUES (
            :NEW.employee_id, 'INSERT', SYSDATE
          );
        ELSIF UPDATING THEN
          INSERT INTO employees_audit (
            employee_id, operation, operation_time, old_data, new_data
          ) VALUES (
            :NEW.employee_id, 'UPDATE', SYSDATE,
            TO_LOB(OLD employee_id), TO_LOB(NEW employee_id)
          );
        ELSIF DELETING THEN
          INSERT INTO employees_audit (
            employee_id, operation, operation_time, old_data
          ) VALUES (
            :OLD.employee_id, 'DELETE', SYSDATE,
            TO_LOB(OLD employee_id)
          );
        END IF;
      END;
```

**Oracle syntax characteristics:**
- Use `:NEW` and `:OLD` (with colon)
- Support compound triggers
- Support instead of triggers (for views)
- Rich built-in functions

### SQL Server Triggers

```yaml
Trigger:
  - name: trg_orders_audit
    tableName: orders
    events: [INSERT, UPDATE, DELETE]
    timing: AFTER
    forEach: STATEMENT
    body: |
      DECLARE @operation VARCHAR(10)
      IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @operation = 'UPDATE'
      ELSE IF EXISTS (SELECT * FROM inserted)
        SET @operation = 'INSERT'
      ELSE IF EXISTS (SELECT * FROM deleted)
        SET @operation = 'DELETE'

      INSERT INTO orders_audit (
        order_id, operation, operation_time
      )
      SELECT
        COALESCE(i.id, d.id) as order_id,
        @operation,
        GETDATE()
      FROM inserted i
      FULL OUTER JOIN deleted d ON i.id = d.id
```

**SQL Server syntax characteristics:**
- Use `inserted` and `deleted` pseudo-tables
- Default is STATEMENT level
- Support INSTEAD OF triggers
- Use AFTER instead of FOR

### H2 Database Triggers

```yaml
Trigger:
  - name: trg_audit_log
    tableName: entities
    events: [INSERT, UPDATE, DELETE]
    timing: AFTER
    forEach: ROW
    body: |
      INSERT INTO audit_log (
        table_name, operation, row_id, operation_time
      ) VALUES (
        'entities',
        CASE
          WHEN INSERTING THEN 'INSERT'
          WHEN UPDATING THEN 'UPDATE'
          WHEN DELETING THEN 'DELETE'
        END,
        COALESCE(NEW.id, OLD.id),
        CURRENT_TIMESTAMP
      );
```

**H2 syntax characteristics:**
- Similar to MySQL
- Supports Java-based triggers
- Simple syntax

### SQLite Triggers

```yaml
Trigger:
  - name: trg_users_update_timestamp
    tableName: users
    events: [UPDATE]
    timing: BEFORE
    forEach: ROW
    body: |
      UPDATE users SET updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.id;
```

**SQLite syntax characteristics:**
- No CREATE OR REPLACE TRIGGER
- Simple trigger support
- Need to use UPDATE inside trigger to modify NEW row

## Best Practices

### 1. Use Triggers for Cross-Cutting Concerns

```yaml
# Good: Audit, security, data consistency
Trigger:
  - name: trg_audit_logging
    tableName: sensitive_data
    events: [INSERT, UPDATE, DELETE]
    timing: AFTER
    forEach: ROW
    body: |
      INSERT INTO audit_log (table_name, operation, row_id, user, timestamp)
      VALUES ('sensitive_data', ..., CURRENT_USER, NOW());
```

### 2. Keep Trigger Logic Simple

```yaml
# Good: Simple, single responsibility
Trigger:
  - name: trg_update_timestamp
    tableName: entities
    events: [UPDATE]
    timing: BEFORE
    forEach: ROW
    body: |
      SET NEW.updated_at = NOW();

# Avoid: Complex business logic in triggers
```

### 3. Document Trigger Purpose

```yaml
Trigger:
  - name: trg_inventory_reservation
    tableName: order_items
    comment: |
      Reserve inventory when order is created.
      Updates product stock quantity atomically.
      Prevents overselling.
    events: [INSERT]
    timing: AFTER
    forEach: ROW
    body: |
      UPDATE products
      SET reserved_quantity = reserved_quantity + NEW.quantity,
          available_quantity = stock_quantity - reserved_quantity
      WHERE id = NEW.product_id;
```

### 4. Avoid Recursive Triggers

```yaml
# Bad: Update on same table causes recursive trigger
Trigger:
  - name: trg_recursive_bad
    tableName: users
    events: [UPDATE]
    timing: AFTER
    forEach: ROW
    body: |
      UPDATE users SET last_modified = NOW() WHERE id = NEW.id;

# Good: Use BEFORE timing
Trigger:
  - name: trg_timestamp_good
    tableName: users
    events: [UPDATE]
    timing: BEFORE
    forEach: ROW
    body: |
      SET NEW.last_modified = NOW();
```

### 5. Use Conditional Execution

```yaml
Trigger:
  - name: trg_orders_status_change
    tableName: orders
    events: [UPDATE]
    timing: BEFORE
    forEach: ROW
    condition: NEW.status <> OLD.status
    body: |
      -- Only execute when status actually changes
      INSERT INTO status_history (order_id, old_status, new_status, changed_at)
      VALUES (NEW.id, OLD.status, NEW.status, NOW());
```

## Complete Examples

### Complete Audit System

```yaml
Trigger:
  - name: trg_users_audit
    tableName: users
    events: [INSERT, UPDATE, DELETE]
    timing: AFTER
    forEach: ROW
    body: |
      INSERT INTO users_audit (
        table_name, operation, record_id,
        old_data, new_data, changed_by, changed_at
      )
      VALUES (
        'users',
        CASE
          WHEN INSERTING THEN 'INSERT'
          WHEN UPDATING THEN 'UPDATE'
          WHEN DELETING THEN 'DELETE'
        END,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN DELETING THEN JSON_OBJECT(OLD.*) END,
        CASE WHEN INSERTING OR UPDATING THEN JSON_OBJECT(NEW.*) END,
        CURRENT_USER,
        NOW()
      );

  - name: trg_orders_audit
    tableName: orders
    events: [INSERT, UPDATE, DELETE]
    timing: AFTER
    forEach: ROW
    body: |
      INSERT INTO orders_audit (
        table_name, operation, record_id,
        old_status, new_status, changed_by, changed_at
      )
      VALUES (
        'orders',
        CASE
          WHEN INSERTING THEN 'INSERT'
          WHEN UPDATING THEN 'UPDATE'
          WHEN DELETING THEN 'DELETE'
        END,
        COALESCE(NEW.id, OLD.id),
        OLD.status,
        NEW.status,
        CURRENT_USER,
        NOW()
      );

  - name: trg_products_stock_sync
    tableName: order_items
    events: [INSERT, UPDATE, DELETE]
    timing: AFTER
    forEach: ROW
    body: |
      -- Update product stock after order item changes
      UPDATE products p
      SET stock_quantity = (
        SELECT COALESCE(SUM(
          CASE
            WHEN oi.id = NEW.id OR oi.id = OLD.id THEN
              COALESCE(NEW.quantity, 0) - COALESCE(OLD.quantity, 0)
            ELSE
              oi.quantity
          END
        ), 0)
        FROM order_items oi
        WHERE oi.product_id = p.id
          AND oi.order_id IN (
            SELECT id FROM orders WHERE status NOT IN ('cancelled', 'refunded')
          )
      )
      WHERE p.id = COALESCE(NEW.product_id, OLD.product_id);
```

## Related Documentation

- [Table Definition](./table.md)
- [Procedure Definition](./procedure.md)
- [Lifecycle Hooks](./lifecycle-hooks.md)
- [Database Support](../databases/README.md)
