# Serial Auto-Increment Cheatsheet

Serial (auto-increment) columns are used to automatically generate unique identifiers, commonly used for primary key columns.

## Quick Examples

### MySQL Auto-Increment

```xml
<Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
```

Generated SQL:

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT
);
```

### PostgreSQL SERIAL

```xml
<Column name="id" type="BIGINT" primaryKey="true" serial="true"/>
```

Generated SQL:

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY
);

CREATE SEQUENCE users_id_seq OWNED BY users.id;
ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq');
```

## Common Scenarios

### Scenario 1: Composite Primary Key with Auto-Increment

```xml
<Table name="order_items">
    <Column name="order_id" type="BIGINT" primaryKey="true"/>
    <Column name="line_no" type="INT" primaryKey="true" autoIncrement="true"/>
    <Column name="product_id" type="BIGINT"/>
</Table>
```

### Scenario 2: Specify Starting Value

```xml
<Table name="users">
    <Column name="id" type="INT" primaryKey="true" autoIncrement="true"/>
    <Data table="users">
        <Row id="1001" username="admin"/>
    </Data>
</Table>
```

### Scenario 3: PostgreSQL Sequence Configuration

```xml
<Sequence name="user_id_seq" startWith="1000" incrementBy="1" cache="20"/>

<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true" defaultValue="nextval('user_id_seq')"/>
</Table>
```

## Database Support

| Database | Attribute | Syntax |
|----------|-----------|--------|
| MySQL | `autoIncrement="true"` | `AUTO_INCREMENT` |
| PostgreSQL | `serial="true"` | `SERIAL` / `BIGSERIAL` |
| SQL Server | `autoIncrement="true"` | `IDENTITY(1,1)` |
| Oracle | `defaultValue="sequence_name.NEXTVAL"` | Sequence |
| SQLite | `autoIncrement="true"` | `AUTOINCREMENT` |
| H2 | `autoIncrement="true"` | `AUTO_INCREMENT` |

## Attribute Reference

| Attribute | Type | Description | Database Restrictions |
|-----------|------|-------------|----------------------|
| `autoIncrement` | Boolean | Enable auto-increment | MySQL, SQL Server, SQLite, H2 |
| `serial` | Boolean | Use SERIAL type | PostgreSQL |
| `primaryKey` | Boolean | Primary key constraint | All databases |
| `startWith` | Integer | Starting value (Sequence only) | PostgreSQL, Oracle |

## Important Notes

### 1. Only One Auto-Increment Column Per Table

```xml
<!-- ❌ Error: Multiple auto-increment columns -->
<Table name="users">
    <Column name="id" type="BIGINT" autoIncrement="true"/>
    <Column name="seq" type="BIGINT" autoIncrement="true"/>
</Table>

<!-- ✅ Correct: Use Sequence -->
<Sequence name="custom_seq" startWith="1"/>
<Table name="users">
    <Column name="id" type="BIGINT" autoIncrement="true"/>
    <Column name="seq" type="BIGINT" defaultValue="nextval('custom_seq')"/>
</Table>
```

### 2. Auto-Increment Column Must Be a Key

```xml
<!-- ❌ Error: Auto-increment column is not a key -->
<Table name="logs">
    <Column name="id" type="BIGINT" autoIncrement="true"/>
    <Column name="message" type="TEXT"/>
</Table>

<!-- ✅ Correct: Set as primary key -->
<Table name="logs">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="message" type="TEXT"/>
</Table>
```

### 3. PostgreSQL SERIAL Automatically Creates Sequence

```xml
<!-- Using serial="true" automatically creates sequence -->
<Column name="id" type="BIGINT" serial="true"/>

<!-- Equivalent to manual creation -->
<Sequence name="table_id_seq"/>
<Column name="id" type="BIGINT" defaultValue="nextval('table_id_seq')"/>
```

### 4. Cross-Database Compatibility

```xml
<!-- Approach 1: Use autoIncrement (recommended) -->
<!-- MySQL: AUTO_INCREMENT, PostgreSQL: Ignored, requires manual sequence -->
<Column name="id" type="BIGINT" autoIncrement="true"/>

<!-- Approach 2: Use database-specific templates -->
<Column name="id" type="BIGINT">
    <!-- MySQL template handles autoIncrement -->
</Column>
```

## Advanced Techniques

### Technique 1: Shared Sequence

```xml
<Sequence name="global_seq" incrementBy="1" cache="100"/>

<Table name="users">
    <Column name="id" type="BIGINT" defaultValue="nextval('global_seq')"/>
</Table>

<Table name="orders">
    <Column name="id" type="BIGINT" defaultValue="nextval('global_seq')"/>
</Table>
```

### Technique 2: Reset Sequence Value

```xml
<!-- Reset via Data -->
<Data table="users">
    <Row id="1000" username="admin"/>  <!-- Next starts from 1001 -->
</Data>
```

### Technique 3: Cyclic Sequence

```xml
<Sequence name="cyclic_seq"
          startWith="1"
          maxValue="9999"
          cycle="true"/>
```

## Reference Links

- [Column Reference](../../reference/schema/column.md)
- [Sequence Reference](../../reference/schema/sequence.md)
- [Database Support](../../reference/databases/)
