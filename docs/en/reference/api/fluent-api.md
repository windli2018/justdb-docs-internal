---
icon: code
title: Fluent API
order: 5
category:
  - Reference
  - API Reference
tag:
  - fluent-api
  - builder
  - dsl
---

# Fluent API

JustDB Fluent API is a SQL-style streaming API for programmatically building JustDB database schemas. This API provides type-safe method chaining for defining tables, columns, indexes, and views.

**Package**: `ai.justdb.justdb.fluent`

## Design Goals

1. **SQL-Style Syntax**: Provide a programming experience close to SQL DDL
2. **Type Safety**: Compile-time type checking to reduce runtime errors
3. **Method Chaining**: Fluent API design supporting continuous operations
4. **Backward Compatibility**: Pure addition API, no modifications to existing Schema classes

## Entry Class Schema

Provides static factory methods as API entry points.

```java
import ai.justdb.justdb.fluent.Schema;
import ai.justdb.justdb.schema.Justdb;

// Create named schema
Justdb justdb = Schema.create("mydb");

// Create anonymous schema
Justdb justdb = Schema.create();
```

## SchemaBuilder

Schema-level builder for setting schema properties and creating tables and views.

```java
Schema.create("myapp")
    .namespace("com.example.model")
    .comment("My application database")
    .table("users")
        .column("id").bigInt().primaryKey()
    .build();
```

**Methods**:

| Method | Description |
|--------|-------------|
| `namespace(String ns)` | Set code generation namespace |
| `comment(String comment)` | Set schema comment |
| `table(String tableName)` | Start creating a table |
| `view(String viewName)` | Start creating a view |
| `build()` | Build and return Justdb object |

## TableBuilder

Used to define table structure including columns, indexes, and constraints.

```java
Schema.create("mydb")
    .table("users")
        .comment("Users table")
        .column("id").bigInt().primaryKey().autoIncrement()
        .column("username").varchar(50).notNull()
        .column("email").varchar(100).notNull()
        .index("idx_email").onColumn("email")
    .end()
    .build();
```

**Methods**:

| Method | Description |
|--------|-------------|
| `comment(String comment)` | Set table/column comment (context-aware) |
| `column(String columnName)` | Start creating a column |
| `index(String indexName)` | Start creating an index |
| `primaryKey()` | Mark last column as PK |
| `autoIncrement()` | Enable auto-increment for last column |
| `notNull()` / `nullable()` | Set nullability for last column |
| `defaultValue(String value)` | Set default value for last column |
| `unique()` / `unique(String name)` | Add unique constraint |
| `end()` | End table definition, return SchemaBuilder |
| `build()` | Build and return Justdb object |

## ColumnBuilder

Provides a complete data type DSL for defining column data types.

### Integer Types

```java
.column("id").bigInt()          // BIGINT
.column("count").int_()         // INT
.column("status").smallInt()    // SMALLINT
.column("flag").tinyInt()       // TINYINT
.column("enabled").boolean_()   // BOOLEAN
```

### String Types

```java
.column("name").varchar(255)    // VARCHAR(255)
.column("code").char_(10)       // CHAR(10)
.column("description").text()   // TEXT
```

### Numeric Types

```java
.column("price").decimal(10, 2) // DECIMAL(10,2)
.column("rate").float_()         // FLOAT
.column("score").double_()      // DOUBLE
```

### Date/Time Types

```java
.column("created_at").timestamp() // TIMESTAMP
.column("birth_date").date()      // DATE
.column("event_time").time()      // TIME
```

### Binary Types

```java
.column("data").blob(1024)        // BLOB(1024)
```

### Custom Types

```java
.column("enum_col").type("ENUM('A','B','C')")
.column("json_col").type("JSON")
```

### Constraint Methods

Constraint methods can be called before type methods:

```java
.column("id")
    .primaryKey()
    .autoIncrement()
    .comment("User ID")
    .bigInt()
```

## IndexBuilder

Used to define table indexes.

```java
.table("users")
    .column("id").bigInt().primaryKey()
    .column("email").varchar(100).notNull()
    .column("username").varchar(50).notNull()
    // Single column index
    .index("idx_email").onColumn("email")
    // Multi-column unique index
    .index("idx_user_name").on("email, username").unique()
.end()
```

**Methods**:

| Method | Description |
|--------|-------------|
| `on(String columnNames)` | Set index columns (comma-separated for multiple) |
| `onColumn(String columnName)` | Set single column index |
| `unique()` | Mark as unique index |
| `type(String type)` | Set index type (BTREE, HASH, FULLTEXT, SPATIAL) |
| `comment(String comment)` | Set index comment |
| `end()` | End index definition, return SchemaBuilder |
| `build()` | Build and return Justdb object |

## ViewBuilder

Used to define database views.

```java
Schema.create("mydb")
    .table("users")
        .column("id").bigInt().primaryKey()
        .column("username").varchar(50).notNull()
    .end()
    .view("active_users")
        .comment("Active users view")
        .as("SELECT * FROM users WHERE deleted = 0")
    .build();
```

**Methods**:

| Method | Description |
|--------|-------------|
| `comment(String comment)` | Set view comment |
| `as(String selectSql)` | Set SELECT query and add to schema |

## Usage Examples

### Example 1: Basic Table Creation

```java
Justdb justdb = Schema.create("mydb")
    .table("users")
        .column("id").bigInt().primaryKey().autoIncrement()
        .column("username").varchar(50).notNull()
        .column("email").varchar(100).notNull()
        .column("created_at").timestamp().defaultValue("CURRENT_TIMESTAMP")
    .build();
```

### Example 2: Multiple Tables

```java
Justdb justdb = Schema.create("ecommerce")
    .table("users")
        .column("id").bigInt().primaryKey().autoIncrement()
        .column("username").varchar(50).notNull()
        .column("email").varchar(100).notNull()
        .index("idx_email").onColumn("email")
    .end()
    .table("orders")
        .column("id").bigInt().primaryKey().autoIncrement()
        .column("user_id").bigInt().notNull()
        .column("total").decimal(10, 2).defaultValue("0")
        .column("created_at").timestamp().defaultValue("CURRENT_TIMESTAMP")
    .build();
```

### Example 3: Full Features (Tables, Indexes, Views)

```java
Justdb justdb = Schema.create("blog_app")
    .namespace("com.example.model")
    .comment("Blog application database")
    .table("users")
        .comment("Users table")
        .column("id").bigInt().primaryKey().autoIncrement().comment("User ID")
        .column("username").varchar(50).notNull()
        .column("email").varchar(100).notNull().unique("uk_email")
        .column("created_at").timestamp().defaultValue("CURRENT_TIMESTAMP")
        .index("idx_email").onColumn("email")
    .end()
    .table("posts")
        .comment("Posts table")
        .column("id").bigInt().primaryKey().autoIncrement()
        .column("user_id").bigInt().notNull()
        .column("title").varchar(200).notNull()
        .column("content").text()
        .column("created_at").timestamp().defaultValue("CURRENT_TIMESTAMP")
    .end()
    .view("user_posts")
        .comment("User posts view")
        .as("SELECT u.id, u.username, p.title, p.created_at " +
            "FROM users u JOIN posts p ON u.id = p.user_id")
    .build();
```

### Example 4: All Data Types

```java
Justdb justdb = Schema.create("types_demo")
    .table("data_types")
        // Integer types
        .column("id").bigInt().primaryKey()
        .column("count").int_().defaultValue("0")
        .column("status").smallInt()
        .column("flag").boolean_()

        // String types
        .column("name").varchar(255).notNull()
        .column("description").text()
        .column("code").char_(10)

        // Numeric types
        .column("price").decimal(10, 2)
        .column("rate").float_()
        .column("score").double_()

        // Date/Time types
        .column("created_at").timestamp().defaultValue("CURRENT_TIMESTAMP")
        .column("birth_date").date()
        .column("event_time").time()

        // Binary types
        .column("data").blob(1024)
    .build();
```

## API Flow Diagram

```
Schema
  │
  ├─> Schema.create(name)
  │     │
  │     └─> SchemaBuilder
  │           │
  │           ├─> table(name) ────> TableBuilder
  │           │                          │
  │           │                          ├─> column(name) ──> ColumnBuilder ──> (type method) ──> TableBuilder
  │           │                          │
  │           │                          ├─> index(name) ───> IndexBuilder ──> end() ──> SchemaBuilder
  │           │                          │
  │           │                          ├─> end() ───────────────────────────────────> SchemaBuilder
  │           │                          │
  │           │                          └─> build() ──────────────────────────────────> Justdb
  │           │
  │           ├─> view(name) ────> ViewBuilder ──> as(sql) ──────────────────> SchemaBuilder
  │           │
  │           └─> build() ────────────────────────────────────────────────────────> Justdb
  │
  └─> create()
           │
           └─> SchemaBuilder (anonymous schema)
```

## Comparison with Traditional Approach

### Traditional Approach (XML Style)

```java
Table table = new Table("users");
table.setComment("Users table");

Column idColumn = new Column("id");
idColumn.setType("BIGINT");
idColumn.setPrimaryKey(true);
idColumn.setAutoIncrement(true);

Column usernameColumn = new Column("username");
usernameColumn.setType("VARCHAR(50)");
usernameColumn.setNullable(false);

List<Column> columns = new ArrayList<>();
columns.add(idColumn);
columns.add(usernameColumn);
table.setColumns(columns);

List<Table> tables = new ArrayList<>();
tables.add(table);

Justdb justdb = new Justdb("mydb", null);
justdb.setTables(tables);
```

### Fluent API Approach

```java
Justdb justdb = Schema.create("mydb")
    .table("users")
        .comment("Users table")
        .column("id").bigInt().primaryKey().autoIncrement()
        .column("username").varchar(50).notNull()
    .build();
```

## Design Patterns

### Type Methods Return TableBuilder

Type methods (`bigInt()`, `varchar()`, etc.) return `TableBuilder`, allowing constraint methods to be chained after setting the type:

```java
.column("id").bigInt().primaryKey().autoIncrement()
```

This is equivalent to:
```java
.column("id").primaryKey().autoIncrement().bigInt()
```

### IndexBuilder Deferred Commit

`on()` and `onColumn()` methods return `IndexBuilder`, allowing continued index configuration:

```java
.index("idx_user_slug")
    .on("user_id, slug")
    .unique()      // Called after on()
    .type("BTREE") // Called after on()
.end()          // Explicitly end index, return SchemaBuilder
```

### end() Method Behavior

- `TableBuilder.end()` - Add table to schema, return `SchemaBuilder`
- `IndexBuilder.end()` - Add index to table, and call `TableBuilder.end()` to complete table
- `ViewBuilder.as()` - Add view to schema, return `SchemaBuilder`

### build() Method Cascade

`IndexBuilder.build()` automatically completes index and table, then builds schema:

```java
.table("users")
    .column("id").bigInt().primaryKey()
    .index("idx_id").onColumn("id")
.build()  // Automatically completes index, table, then builds schema
```

## Naming Conventions

### Method Naming (camelCase)

- Type methods use camelCase: `bigInt()`, `varchar()`, `decimal()`
- Constraint methods use camelCase: `primaryKey()`, `autoIncrement()`, `notNull()`
- Avoid Java keyword conflicts: `int_()`, `char_()`, `float_()`, `boolean_()`

### SQL Terminology

- Use SQL standard terminology: `primaryKey()`, `autoIncrement()`, `notNull()`
- Index uses `on()` instead of `onColumns()`
- View uses `as()` for query definition

## Backward Compatibility

Fluent API is a pure addition and does not affect existing code:

- No modifications to existing Schema classes (`Justdb`, `Table`, `Column`, `View`, `Index`)
- Existing XML/JSON/YAML Schema files continue to work
- Existing `new Table()` / `new Column()` approach continues to work
- Objects created by Fluent API are identical to those created by traditional methods

## Extensibility

To add new data types, add methods in `ColumnBuilder`:

```java
public TableBuilder json() {
    column.setType("JSON");
    return finishColumn();
}
```

To add new index types, add methods in `IndexBuilder`:

```java
public IndexBuilder fulltext() {
    index.setType("FULLTEXT");
    return this;
}
```

## Package Structure

```
ai.justdb.justdb.fluent/
├── Schema.java           # Entry class
├── SchemaBuilder.java    # Schema builder
├── TableBuilder.java     # Table builder (with column constraint methods)
├── ColumnBuilder.java    # Column builder (with type DSL)
├── IndexBuilder.java     # Index builder
├── ViewBuilder.java      # View builder
└── package-info.java     # Package documentation
```

## Test Coverage

Fluent API includes 21 test cases covering:

1. Basic table creation
2. Multiple tables
3. Schema and views
4. All integer types
5. String types
6. Numeric types
7. Date/time types
8. Binary types
9. Custom types
10. Constraints (primaryKey, notNull, nullable, defaultValue)
11. Column comments
12. Single column indexes
13. Multi-column indexes
14. Unique indexes
15. Multiple indexes
16. Table comments
17. Anonymous Schema
18. Index types and comments
19. Complete Schema
20. All data types
21. Constraint order
