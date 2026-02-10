---
icon: list-ordered
title: Sequence Definition
order: 9
category:
  - Reference
  - Schema Definition
tag:
  - sequence
  - schema
  - auto-increment
---

# Sequence Definition

Sequence is a database object used to generate unique numeric values. JustDB provides complete Sequence definition support, supporting multiple database types.

## Sequence Properties

### Core Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | String | Yes | Sequence name |
| `id` | String | No | Sequence ID, used for reference |
| `comment` | String | No | Sequence comment |
| `startWith` | Long | No | Start value (default: 1) |
| `incrementBy` | Long | No | Increment step (default: 1) |
| `minValue` | Long | No | Minimum value |
| `maxValue` | Long | No | Maximum value |
| `cycle` | Boolean | No | Whether to cycle after reaching max/min value |
| `cache` | Long | No | Cache size for pre-fetching values |
| `changeType` | ChangeType | No | Change type |
| `formerNames` | List&lt;String&gt; | No | Old name list |
| `beforeCreates` | List<ConditionalSqlScript&gt;> | No | SQL to execute before creation |
| `afterCreates` | List<ConditionalSqlScript&gt;> | No | SQL to execute after creation |
| `beforeDrops` | List<ConditionalSqlScript&gt;> | No | SQL to execute before dropping |
| `afterDrops` | List<ConditionalSqlScript&gt;> | No | SQL to execute after dropping |

## Format Examples

### XML Format

```xml
<Justdb xmlns="http://www.justdb.ai/schema">
    <!-- Basic sequence -->
    <Sequence name="seq_user_id"
              comment="User ID sequence"
              startWith="1"
              incrementBy="1"
              minValue="1"
              maxValue="999999999"
              cycle="false"
              cache="20" />

    <!-- Order ID sequence with large increment -->
    <Sequence name="seq_order_id"
              comment="Order ID sequence"
              startWith="1000"
              incrementBy="10"
              minValue="1000"
              maxValue="999999999"
              cycle="false"
              cache="50" />
</Justdb>
```

### YAML Format

```yaml
Sequence:
  - name: seq_user_id
    comment: User ID sequence
    startWith: 1
    incrementBy: 1
    minValue: 1
    maxValue: 999999999
    cycle: false
    cache: 20

  - name: seq_order_id
    comment: Order ID sequence
    startWith: 1000
    incrementBy: 10
    minValue: 1000
    maxValue: 999999999
    cycle: false
    cache: 50
```

### JSON Format

```json
{
  "Sequence": [
    {
      "name": "seq_user_id",
      "comment": "User ID sequence",
      "startWith": 1,
      "incrementBy": 1,
      "minValue": 1,
      "maxValue": 999999999,
      "cycle": false,
      "cache": 20
    },
    {
      "name": "seq_order_id",
      "comment": "Order ID sequence",
      "startWith": 1000,
      "incrementBy": 10,
      "minValue": 1000,
      "maxValue": 999999999,
      "cycle": false,
      "cache": 50
    }
  ]
}
```

## Database-Specific Support

### PostgreSQL

PostgreSQL provides native SEQUENCE support:

```yaml
Sequence:
  - name: user_id_seq
    startWith: 1
    incrementBy: 1
    minValue: 1
    maxValue: 9223372036854775807
    cycle: false
    cache: 1
```

**Generated SQL:**
```sql
CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    NO CYCLE
    CACHE 1;
```

**Usage:**
```sql
-- Get next value
SELECT nextval('user_id_seq');

-- Get current value
SELECT currval('user_id_seq');

-- Set value
SELECT setval('user_id_seq', 100);
```

### Oracle

Oracle provides native SEQUENCE support:

```yaml
Sequence:
  - name: seq_customer_id
    startWith: 1000
    incrementBy: 1
    minValue: 1000
    maxValue: 999999999999999999999999
    cycle: false
    cache: 20
```

**Generated SQL:**
```sql
CREATE SEQUENCE seq_customer_id
    START WITH 1000
    INCREMENT BY 1
    MINVALUE 1000
    MAXVALUE 999999999999999999999999
    NOCYCLE
    CACHE 20;
```

**Usage:**
```sql
-- Get next value
SELECT seq_customer_id.NEXTVAL FROM dual;

-- Get current value
SELECT seq_customer_id.CURRVAL FROM dual;
```

### MySQL 8.0+

MySQL 8.0+ supports sequence tables:

```yaml
Sequence:
  - name: seq_product_id
    startWith: 1
    incrementBy: 1
    minValue: 1
    maxValue: 9223372036854775807
    cycle: false
    cache: 1000
```

**For MySQL 5.7 and earlier**, use AUTO_INCREMENT instead:
```yaml
Table:
  - name: products
    autoIncrement: 1000
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
```

### SQL Server

SQL Server supports SEQUENCE:

```yaml
Sequence:
  - name: seq_invoice_number
    startWith: 100000
    incrementBy: 1
    minValue: 100000
    maxValue: 999999999
    cycle: false
    cache: 50
```

**Generated SQL:**
```sql
CREATE SEQUENCE seq_invoice_number
    START WITH 100000
    INCREMENT BY 1
    MINVALUE 100000
    MAXVALUE 999999999
    NO CYCLE
    CACHE 50;
```

**Usage:**
```sql
-- Get next value
SELECT NEXT VALUE FOR seq_invoice_number;
```

### H2 Database

H2 supports SEQUENCE:

```yaml
Sequence:
  - name: seq_task_id
    startWith: 1
    incrementBy: 1
    minValue: 1
    maxValue: 9223372036854775807
    cycle: false
    cache: 100
```

**Generated SQL:**
```sql
CREATE SEQUENCE seq_task_id
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    NO CYCLE
    CACHE 100;
```

### SQLite

**SQLite does not support SEQUENCE natively**. Use AUTO_INCREMENT:

```yaml
Table:
  - name: tasks
    Column:
      - name: id
        type: INTEGER
        primaryKey: true
        autoIncrement: true
```

Or use a manual sequence table:
```yaml
Table:
  - name: sequences
    Column:
      - name: name
        type: TEXT
        primaryKey: true
      - name: value
        type: INTEGER
      - name: increment
        type: INTEGER

Data:
  - tableName: sequences
    rows:
      - - "order_id_seq"
        - "1000"
        - "1"
```

## Sequence vs AUTO_INCREMENT

### Use AUTO_INCREMENT When:

1. **Simple primary key** - Table has only one auto-incrementing column
2. **No cross-table sharing** - Each table maintains its own counter
3. **Simplicity** - Don't need special sequence features

```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true  # Simple case
```

### Use SEQUENCE When:

1. **Shared across multiple tables** - Single sequence serves multiple tables
2. **Need special increment rules** - Non-standard increment values
3. **Business requirements** - Specific numbering patterns
4. **Pre-fetching performance** - Use cache to improve performance
5. **Need to query/set values** - Get/set current value anytime

```yaml
Sequence:
  - name: seq_document_id
    startWith: 1000000
    incrementBy: 1
    cycle: false
    cache: 100

Table:
  - name: invoices
    Column:
      - name: id
        type: BIGINT
        defaultValueComputed: "nextval('seq_document_id')"

  - name: receipts
    Column:
      - name: id
        type: BIGINT
        defaultValueComputed: "nextval('seq_document_id')"
```

## Usage Scenarios

### 1. Shared Document Numbering

```yaml
# Shared sequence for all documents
Sequence:
  - name: seq_document_number
    comment: Shared sequence for all document types
    startWith: 100000
    incrementBy: 1
    minValue: 100000
    maxValue: 999999
    cycle: false
    cache: 100

# Multiple tables use the same sequence
Table:
  - name: invoices
    comment: Invoices
    Column:
      - name: invoice_number
        type: INTEGER
        comment: Invoice number
        defaultValueComputed: "nextval('seq_document_number')"

  - name: receipts
    comment: Receipts
    Column:
      - name: receipt_number
        type: INTEGER
        comment: Receipt number
        defaultValueComputed: "nextval('seq_document_number')"
```

### 2. Order Number with Prefix

```yaml
Sequence:
  - name: seq_order_number
    comment: Order number sequence
    startWith: 1
    incrementBy: 1
    maxValue: 99999
    cycle: false

Table:
  - name: orders
    Column:
      - name: order_number
        type: VARCHAR(20)
        comment: Order number (ORD + sequence)
        # Application layer combines prefix: ORD + LPAD(seq, 5, '0')
```

### 3. High-Concurrency Scenario

```yaml
Sequence:
  - name: seq_ticket_id
    comment: Ticket ID sequence for high concurrency
    startWith: 1
    incrementBy: 1
    cache: 1000  # Larger cache for better performance
```

### 4. Cyclical Sequence

```yaml
Sequence:
  - name: seq_rotation_slot
    comment: Rotation slot sequence
    startWith: 1
    incrementBy: 1
    minValue: 1
    maxValue: 10
    cycle: true  # Cycle after reaching max value
    cache: 10
```

### 5. Database Migration

```yaml
# Starting from specified value after migration
Sequence:
  - name: seq_user_id
    comment: User ID sequence
    startWith: 1000000  # Start from 1 million to avoid conflicts with old data
    incrementBy: 1
    minValue: 1000000
    maxValue: 9999999999
    cycle: false
    cache: 100
```

## Performance Optimization

### 1. Use Cache

```yaml
Sequence:
  - name: seq_high_traffic
    cache: 1000  # Pre-fetch 1000 values at a time
```

**Benefits:**
- Reduces database round trips
- Improves high-concurrency performance

**Trade-offs:**
- Values may have gaps on database restart
- Not strictly sequential within cache range

### 2. Choose Appropriate Increment

```yaml
# Distributed system: use larger increment to avoid conflicts
Sequence:
  - name: seq_distributed_id
    startWith: 1
    incrementBy: 1000  # Each node can use different ranges

# Node 1: starts from 1, generates 1, 1001, 2001...
# Node 2: starts from 2, generates 2, 1002, 2002...
```

### 3. Avoid Cycling in Production

```yaml
Sequence:
  - name: seq_production
    cycle: false  # Avoid data duplication from cycling
    maxValue: 999999999999  # Set large enough max value
```

## Best Practices

### 1. Use Descriptive Names

```yaml
# Good: Clear purpose
Sequence:
  - name: seq_customer_id
  - name: seq_order_number
  - name: seq_invoice_id

# Avoid: Too generic
Sequence:
  - name: seq1
  - name: id_seq
  - name: sequence
```

### 2. Set Reasonable Ranges

```yaml
Sequence:
  - name: seq_small_entity
    comment: Limited entity, small number expected
    maxValue: 999999  # 6 digits is enough

  - name: seq_large_entity
    comment: Large entity, high growth expected
    maxValue: 9223372036854775807  # BIGINT max
```

### 3. Add Comments

```yaml
Sequence:
  - name: seq_contract_number
    comment: |
      Contract number sequence for all contract types.
      Format: CT + 7 digits (CT0000001 - CT9999999)
      Shared across contracts and amendments tables.
    startWith: 1
    maxValue: 9999999
```

### 4. Document Usage

```yaml
Sequence:
  - name: seq_batch_id
    comment: Batch ID sequence for batch processing
    # Usage: For batch job IDs
    # Increment: 1
    # Cache: 100 (optimized for batch processing)
    startWith: 1000000
    cache: 100
```

### 5. Use Lifecycle Hooks

```yaml
Sequence:
  - name: seq_transaction_id
    startWith: 1
    incrementBy: 1
    afterCreates:
      - sql: |
          -- Grant usage permission to application role
          GRANT USAGE, SELECT ON seq_transaction_id TO app_role
        dbms: postgresql
```

## Complete Examples

### E-commerce Document Numbering

```yaml
Sequence:
  - name: seq_order_number
    comment: Order number sequence
    startWith: 1000000
    incrementBy: 1
    maxValue: 9999999
    cycle: false
    cache: 100

  - name: seq_invoice_number
    comment: Invoice number sequence
    startWith: 2000000
    incrementBy: 1
    maxValue: 2999999
    cycle: false
    cache: 100

  - name: seq_shipment_number
    comment: Shipment number sequence
    startWith: 3000000
    incrementBy: 1
    maxValue: 3999999
    cycle: false
    cache: 100

Table:
  - name: orders
    Column:
      - name: order_number
        type: INTEGER
        defaultValueComputed: "nextval('seq_order_number')"
        unique: true

  - name: invoices
    Column:
      - name: invoice_number
        type: INTEGER
        defaultValueComputed: "nextval('seq_invoice_number')"
        unique: true

  - name: shipments
    Column:
      - name: shipment_number
        type: INTEGER
        defaultValueComputed: "nextval('seq_shipment_number')"
        unique: true
```

## Related Documentation

- [Table Definition](./table.md)
- [Column Definition](./column.md)
- [Database Support](../databases/README.md)
- [Java API Reference](../api/java-api.md)
