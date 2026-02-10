---
icon: scroll
title: ADR-003 DDL Lifecycle Hooks
order: 3
---

# ADR-003: DDL Lifecycle Hooks

## Status

**Accepted** - 2024-01-25

## Context

Database schema deployment requires executing SQL at specific points:

1. **Before creating** objects (prerequisites, dependencies)
2. **After creating** objects (initial data, grants)
3. **Before dropping** objects (data preservation, cleanup)
4. **After dropping** objects (cleanup)
5. **Before altering** objects (validation, preparation)
6. **After altering** objects (data migration, verification)

We need a mechanism to execute custom SQL at these points without modifying the core engine.

## Decision

Implement **lifecycle hooks** on schema objects with conditional execution.

### Hook Types

```java
public class QueryAble {
    // Creation hooks
    protected List<ConditionalSqlScript&gt;> beforeCreates;
    protected List<ConditionalSqlScript&gt;> afterCreates;

    // Drop hooks
    protected List<ConditionalSqlScript&gt;> beforeDrops;
    protected List<ConditionalSqlScript&gt;> afterDrops;

    // Alter hooks
    protected List<ConditionalSqlScript&gt;> beforeAlters;
    protected List<ConditionalSqlScript&gt;> afterAlters;
}
```

### Conditional Execution

Hooks can be conditioned on:

```java
@ConditionalSqlScript(
    dbms = "mysql,postgresql",  // Only for these databases
    version = "8.0+"             // Only for versions 8.0+
)
public class BeforeCreateHook {
    String sql = "CREATE SEQUENCE user_id_seq;";
}
```

### Schema Definition

```xml
<Table name="users">
    <beforeCreate>
        <sql dbms="postgresql">
            CREATE SEQUENCE users_id_seq;
        </sql>
    </beforeCreate>

    <afterCreate>
        <sql>
            INSERT INTO users (id, username) VALUES (1, 'admin');
        </sql>
    </afterCreate>

    <beforeDrop>
        <sql dbms="mysql">
            RENAME TABLE users TO users_backup;
        </sql>
    </beforeDrop>
</Table>
```

### YAML Format

```yaml
Table:
  - name: users
    beforeCreates:
      - dbms: postgresql
        sql: |
          CREATE SEQUENCE users_id_seq;
    afterCreates:
      - sql: |
          INSERT INTO users (id, username) VALUES (1, 'admin');
```

### Hook Execution Order

```
1. beforeCreates (in definition order)
2. CREATE TABLE
3. afterCreates (in definition order)
4. beforeAlters (if modifications)
5. ALTER TABLE
6. afterAlters (if modifications)
7. beforeDrops (if dropping)
8. DROP TABLE
9. afterDrops (if dropping)
```

## Use Cases

### Database-Specific Prerequisites

```yaml
# PostgreSQL requires sequence before table
beforeCreates:
  - dbms: postgresql
    sql: CREATE SEQUENCE user_id_seq;
```

### Initial Data

```yaml
afterCreates:
  - sql: |
      INSERT INTO roles (id, name) VALUES
      (1, 'admin'),
      (2, 'user');
```

### Data Preservation Before Drop

```yaml
beforeDrops:
  - dbms: mysql
    sql: |
      RENAME TABLE users TO users_backup;
      CREATE TABLE users_archive AS SELECT * FROM users;
```

### Post-Migration Data Updates

```yaml
afterAlters:
  - sql: |
      UPDATE users SET status = 'active'
      WHERE status IS NULL;
```

## Implementation

### Hook Execution

```java
public class SchemaDeployer {
    private void executeHooks(List<ConditionalSqlScript&gt;> hooks,
                              QueryAble object,
                              HookType type) {
        for (ConditionalSqlScript hook : hooks) {
            if (hook.matches(currentDatabase, object)) {
                executeSql(hook.getSql());
            }
        }
    }
}
```

### Condition Matching

```java
public class ConditionalSqlScript {
    public boolean matches(DatabaseAdapter adapter, QueryAble object) {
        // Check DBMS
        if (dbms != null && !dbms.contains(adapter.getDialect())) {
            return false;
        }
        // Check version
        if (version != null && !adapter.getVersion().matches(version)) {
            return false;
        }
        return true;
    }
}
```

## Consequences

### Positive

- Extensible without code changes
- Database-specific customizations
- Data seeding integrated with schema
- Safe drop patterns

### Negative

- More complex schema definitions
- Hook execution order matters
- Harder to debug deployment issues

### Neutral

- Hooks add execution time
- Need to track hook state

## Best Practices

1. **Idempotent hooks** - Make hooks safe to run multiple times
2. **Explicit transactions** - Hooks should handle their own transactions
3. **Error handling** - Use `continueOnError` for non-critical hooks
4. **Documentation** - Comment why hook is needed
5. **Testing** - Test hooks on real databases

## Examples

### Grant Permissions

```yaml
afterCreates:
  - dbms: oracle
    sql: |
      GRANT SELECT, INSERT ON users TO app_user;
      GRANT ALL ON users TO admin_user;
```

### Create Triggers

```yaml
afterCreates:
  - sql: |
      CREATE TRIGGER update_timestamp
      BEFORE UPDATE ON users
      FOR EACH ROW
      SET NEW.updated_at = CURRENT_TIMESTAMP;
```

### Validate Data

```yaml
beforeAlters:
  - sql: |
      -- Check if migration is safe
      SELECT COUNT(*) INTO v_count FROM users WHERE email IS NULL;
      IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot alter: NULL emails exist';
      END IF;
```

## Related Decisions

- [ADR-001: Alias System](./adr-001-alias-system.html)
- [ADR-002: Template Engine](./adr-002-template-engine.html)

## References

- [Schema Deployment](/reference/deployment/)
- [Conditional SQL](/reference/conditional-sql/)
