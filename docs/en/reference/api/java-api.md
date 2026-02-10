---
title: Java API Reference
icon: ☕
description: JustDB core Java API detailed reference, including Schema definition, loading and generation
order: 2
---

# Java API Reference

JustDB provides a complete Java API for defining, loading, generating, and deploying database Schema. This document details the usage of core APIs.

## Table of Contents

- [Schema Definition API](#schema-definition-api)
- [Schema Loading API](#schema-loading-api)
- [SQL Generation API](#sql-generation-api)
- [Code Examples](#code-examples)

## Schema Definition API

### Justdb - Schema Root Container

`Justdb` is the root element of Schema definition, containing all database objects.

**Package Path**: `ai.justdb.justdb.schema.Justdb`

**Core Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `namespace` | String | Namespace, used for code generation |
| `tables` | List<Table&gt;> | Table definition list |
| `views` | List<View&gt;> | View definition list |
| `sequences` | List<Sequence&gt;> | Sequence definition list |
| `indexes` | List<Index&gt;> | Index definition list |
| `constraints` | List<Constraint&gt;> | Constraint definition list |
| `data` | List<Data&gt;> | Data export definition |
| `properties` | List<Property&gt;> | Schema properties |

**Code Example**:

```java
import ai.justdb.justdb.schema.Justdb;
import ai.justdb.justdb.schema.Table;
import ai.justdb.justdb.schema.Column;
import java.util.Arrays;

// Create Schema
Justdb justdb = new Justdb();
justdb.setNamespace("com.example");
justdb.setId("my-schema");

// Create table
Table usersTable = new Table("users");
usersTable.setComment("User table");

justdb.setTables(Arrays.asList(usersTable));
```

### Table - Table Definition

`Table` represents a database table, inherits from `QueryAble`, supports columns, indexes, constraints and other child elements.

**Package Path**: `ai.justdb.justdb.schema.Table`

**Core Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `name` | String | Table name |
| `id` | String | Table ID |
| `comment` | String | Table comment |
| `columns` | List<Column&gt;> | Column definitions |
| `indexes` | List<Index&gt;> | Index definitions |
| `constraints` | List<Constraint&gt;> | Constraint definitions |
| `sequences` | List<Sequence&gt;> | Sequence definitions |
| `engine` | String | Storage engine (MySQL) |
| `charset` | String | Character set |
| `collation` | String | Collation rules |
| `autoIncrement` | Long | Auto-increment start value |
| `changeType` | ChangeType | Change type |
| `formerNames` | List&lt;String&gt; | Old name list |
| `dataExportStrategy` | DataExportStrategy | Data export strategy |
| `dataFilterCondition` | String | Data filter condition |

**Data Export Strategies**:

- `NO_DATA` - Don't export data
- `ALL_DATA` - Export all data
- `PARTIAL_DATA` - Partial data (using dataFilterCondition)
- `DATA_SQL_ONLY` - Export data SQL only

**Code Example**:

```java
// Create table
Table table = new Table("users");
table.setComment("User information table");
table.setEngine("InnoDB");
table.setCharset("utf8mb4");

// Set data export strategy
table.setDataExportStrategy(Table.DataExportStrategy.PARTIAL_DATA);
table.setDataFilterCondition("status = 'active'");
```

### Column - Column Definition

`Column` represents a column in a table, supports all standard data types and constraints.

**Package Path**: `ai.justdb.justdb.schema.Column`

**Core Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `name` | String | Column name |
| `type` | String | Data type |
| `nullable` | Boolean | Whether nullable |
| `primaryKey` | Boolean | Whether primary key |
| `autoIncrement` | Boolean | Whether auto-increment |
| `defaultValue` | String | Default value |
| `comment` | String | Column comment |
| `unique` | Boolean | Whether unique |
| `length` | Integer | Length |
| `precision` | Integer | Precision |
| `scale` | Integer | Decimal places |
| `changeType` | ChangeType | Change type |
| `formerNames` | List&lt;String&gt; | Old name list |

**Supported Data Types**:

- Integer: `TINYINT`, `SMALLINT`, `INT`, `BIGINT`
- Float: `FLOAT`, `DOUBLE`, `DECIMAL`, `NUMERIC`
- String: `CHAR`, `VARCHAR`, `TEXT`, `LONGTEXT`
- Binary: `BINARY`, `VARBINARY`, `BLOB`, `LONGBLOB`
- Date/Time: `DATE`, `TIME`, `DATETIME`, `TIMESTAMP`, `YEAR`
- Other: `BOOLEAN`, `JSON`, `ENUM`

**Code Example**:

```java
// Create column
Column idColumn = new Column();
idColumn.setName("id");
idColumn.setType("BIGINT");
idColumn.setPrimaryKey(true);
idColumn.setAutoIncrement(true);
idColumn.setComment("Primary key ID");

Column nameColumn = new Column();
nameColumn.setName("username");
nameColumn.setType("VARCHAR(50)");
nameColumn.setNullable(false);
nameColumn.setComment("Username");

Column emailColumn = new Column();
emailColumn.setName("email");
emailColumn.setType("VARCHAR(100)");
emailColumn.setUnique(true);
emailColumn.setComment("Email address");
```

### Index - Index Definition

`Index` represents a table index.

**Package Path**: `ai.justdb.justdb.schema.Index`

**Core Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `name` | String | Index name |
| `tableName` | String | Parent table name |
| `columns` | List&lt;String&gt; | Index columns |
| `unique` | Boolean | Whether unique index |
| `type` | String | Index type |
| `comment` | String | Index comment |
| `changeType` | ChangeType | Change type |

**Code Example**:

```java
// Create unique index
Index uniqueIndex = new Index();
uniqueIndex.setName("idx_username");
uniqueIndex.setTableName("users");
uniqueIndex.setColumns(Arrays.asList("username"));
uniqueIndex.setUnique(true);

// Create composite index
Index compositeIndex = new Index();
compositeIndex.setName("idx_email_status");
compositeIndex.setTableName("users");
compositeIndex.setColumns(Arrays.asList("email", "status"));
```

### Constraint - Constraint Definition

`Constraint` represents table constraints, including primary key, foreign key, unique constraint, check constraint, etc.

**Package Path**: `ai.justdb.justdb.schema.Constraint`

**Core Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `name` | String | Constraint name |
| `tableName` | String | Parent table name |
| `type` | ConstraintType | Constraint type |
| `columns` | List&lt;String&gt; | Constraint columns |
| `referencedTable` | String | Referenced table (foreign key) |
| `referencedColumn` | String | Referenced column (foreign key) |
| `checkExpression` | String | Check expression |
| `changeType` | ChangeType | Change type |

**Constraint Types**:

- `PRIMARY_KEY` - Primary key constraint
- `FOREIGN_KEY` - Foreign key constraint
- `UNIQUE` - Unique constraint
- `CHECK` - Check constraint

**Code Example**:

```java
// Create primary key constraint
Constraint pk = new Constraint();
pk.setName("pk_users_id");
pk.setTableName("users");
pk.setType(Constraint.ConstraintType.PRIMARY_KEY);
pk.setColumns(Arrays.asList("id"));

// Create foreign key constraint
Constraint fk = new Constraint();
fk.setName("fk_users_role");
fk.setTableName("users");
fk.setType(Constraint.ConstraintType.FOREIGN_KEY);
fk.setColumns(Arrays.asList("role_id"));
fk.setReferencedTable("roles");
fk.setReferencedColumn("id");

// Create check constraint
Constraint check = new Constraint();
check.setName("chk_users_age");
check.setTableName("users");
check.setType(Constraint.ConstraintType.CHECK);
check.setCheckExpression("age >= 18");
```

### Sequence - Sequence Definition

`Sequence` represents a database sequence.

**Package Path**: `ai.justdb.justdb.schema.Sequence`

**Core Properties**:

| Property | Type | Description |
|----------|------|-------------|
| `name` | String | Sequence name |
| `startWith` | Long | Start value |
| `incrementBy` | Long | Increment |
| `minValue` | Long | Minimum value |
| `maxValue` | Long | Maximum value |
| `cycle` | Boolean | Whether to cycle |
| `cache` | Long | Cache size |
| `changeType` | ChangeType | Change type |
| `formerNames` | List&lt;String&gt; | Old name list |

**Code Example**:

```java
// Create sequence
Sequence sequence = new Sequence();
sequence.setName("seq_user_id");
sequence.setStartWith(1L);
sequence.setIncrementBy(1L);
sequence.setMinValue(1L);
sequence.setMaxValue(999999999L);
sequence.setCycle(false);
```

## Schema Loading API

### SchemaLoaderFactory

Factory class for loading Schema from various sources.

**Package Path**: `ai.justdb.justdb.util.schema.SchemaLoaderFactory`

**Supported Location Protocols**:

- `file://` or empty - File system
- `classpath:` or `resource:` - Classpath resources
- `http://` or `https://` - HTTP/HTTPS URL
- `project:` - Project directory

**Method Signatures**:

```java
public static Loaded&lt;Justdb&gt; load(String location, JustdbManager manager)
public static List<Loaded&gt;<Justdb>> loadAll(String location, List&lt;String&gt; fileTypes, JustdbManager manager)
```

**Code Example**:

```java
JustdbManager manager = JustdbManager.getInstance();

// Load from file
Loaded&lt;Justdb&gt; result = SchemaLoaderFactory.load("schema.json", manager);
if (result.isSuccess()) {
    Justdb justdb = result.getData();
}

// Load from classpath
Loaded&lt;Justdb&gt; result = SchemaLoaderFactory.load("classpath:schema.xml", manager);

// Load from HTTP
Loaded&lt;Justdb&gt; result = SchemaLoaderFactory.load("https://example.com/schema.json", manager);

// Load all Schemas from directory
List<Loaded&gt;<Justdb>> results = SchemaLoaderFactory.loadAll("./schemas", null, manager);
```

### Loaded - Loading Result

Encapsulates Schema loading result.

**Package Path**: `ai.justdb.justdb.cli.Loaded`

**Methods**:

```java
public boolean isSuccess()        // Whether loading succeeded
public Justdb getData()           // Get Schema data
public String getLocation()       // Get loading location
public Exception getError()       // Get error information
```

## SQL Generation API

### DBGenerator

SQL generator, generates database-specific SQL based on Schema.

**Package Path**: `ai.justdb.justdb.generator.DBGenerator`

**Constructor**:

```java
public DBGenerator(PluginManager pluginManager, String dbType)
```

**Supported Methods**:

```java
// Table operations
public String generateCreateTable(Table table)
public String generateDropTable(Table table)
public String generateRenameTable(Table table)

// Column operations
public String generateAddColumn(Table table, Column column)
public String generateDropColumn(Table table, Column column)
public String generateModifyColumn(Table table, Column column)
public String generateRenameColumn(Table table, Column column)

// Index operations
public String generateCreateIndex(Table table, Index index)
public String generateDropIndex(Table table, Index index)

// Constraint operations
public String generateAddConstraint(Table table, Constraint constraint)
public String generateDropConstraint(Table table, Constraint constraint)

// Sequence operations
public String generateCreateSequence(Sequence sequence)
public String generateDropSequence(Sequence sequence)
public String generateRenameSequence(Sequence sequence)
public String generateModifySequence(Sequence sequence)

// View operations
public String generateCreateView(View view)
public String generateDropView(View view)
```

**Code Example**:

```java
JustdbManager manager = JustdbManager.getInstance();
DBGenerator generator = new DBGenerator(manager.getPluginManager(), "mysql");

// Generate CREATE TABLE SQL
Table table = ...; // Table definition
String createTableSql = generator.generateCreateTable(table);
System.out.println(createTableSql);

// Generate ADD COLUMN SQL
Column column = ...; // Column definition
String addColumnSql = generator.generateAddColumn(table, column);
```

## Code Examples

### Complete Schema Definition

```java
import ai.justdb.justdb.schema.*;
import ai.justdb.justdb.JustdbManager;
import ai.justdb.justdb.generator.DBGenerator;
import java.util.Arrays;

public class SchemaExample {
    public static void main(String[] args) {
        // Create Schema
        Justdb justdb = new Justdb();
        justdb.setNamespace("com.example");
        justdb.setId("user-schema");

        // Create user table
        Table usersTable = createUsersTable();

        // Create role table
        Table rolesTable = createRolesTable();

        justdb.setTables(Arrays.asList(usersTable, rolesTable));

        // Generate SQL
        JustdbManager manager = JustdbManager.getInstance();
        DBGenerator generator = new DBGenerator(manager.getPluginManager(), "mysql");

        for (Table table : justdb.getTables()) {
            String sql = generator.generateCreateTable(table);
            System.out.println(sql + ";\n");
        }
    }

    private static Table createUsersTable() {
        Table table = new Table("users");
        table.setComment("User table");
        table.setEngine("InnoDB");
        table.setCharset("utf8mb4");

        // Column definitions
        Column id = new Column();
        id.setName("id");
        id.setType("BIGINT");
        id.setPrimaryKey(true);
        id.setAutoIncrement(true);
        id.setComment("User ID");

        Column username = new Column();
        username.setName("username");
        username.setType("VARCHAR(50)");
        username.setNullable(false);
        username.setComment("Username");

        Column email = new Column();
        email.setName("email");
        email.setType("VARCHAR(100)");
        email.setNullable(false);
        email.setComment("Email");

        Column roleId = new Column();
        roleId.setName("role_id");
        roleId.setType("BIGINT");
        roleId.setComment("Role ID");

        Column createdAt = new Column();
        createdAt.setName("created_at");
        createdAt.setType("TIMESTAMP");
        createdAt.setDefaultValue("CURRENT_TIMESTAMP");
        createdAt.setComment("Creation time");

        table.setColumns(Arrays.asList(id, username, email, roleId, createdAt));

        // Index definitions
        Index idxUsername = new Index();
        idxUsername.setName("idx_username");
        idxUsername.setColumns(Arrays.asList("username"));
        idxUsername.setUnique(true);

        Index idxEmail = new Index();
        idxEmail.setName("idx_email");
        idxEmail.setColumns(Arrays.asList("email"));
        idxEmail.setUnique(true);

        table.setIndexes(Arrays.asList(idxUsername, idxEmail));

        // Foreign key constraint
        Constraint fkRole = new Constraint();
        fkRole.setName("fk_users_role");
        fkRole.setType(Constraint.ConstraintType.FOREIGN_KEY);
        fkRole.setColumns(Arrays.asList("role_id"));
        fkRole.setReferencedTable("roles");
        fkRole.setReferencedColumn("id");

        table.setConstraints(Arrays.asList(fkRole));

        return table;
    }

    private static Table createRolesTable() {
        Table table = new Table("roles");
        table.setComment("Role table");
        table.setEngine("InnoDB");
        table.setCharset("utf8mb4");

        Column id = new Column();
        id.setName("id");
        id.setType("BIGINT");
        id.setPrimaryKey(true);
        id.setAutoIncrement(true);

        Column name = new Column();
        name.setName("name");
        name.setType("VARCHAR(50)");
        name.setNullable(false);
        name.setUnique(true);

        Column description = new Column();
        description.setName("description");
        description.setType("VARCHAR(200)");

        table.setColumns(Arrays.asList(id, name, description));

        return table;
    }
}
```

### Dynamic Schema Building

```java
import ai.justdb.justdb.schema.*;
import java.util.*;

public class DynamicSchemaBuilder {
    public static Table buildTable(String name, List<Map&gt;<String, Object>> columns) {
        Table table = new Table(name);
        List<Column&gt;> columnList = new ArrayList<>();

        for (Map&lt;String, , Object> colDef : columns) {
            Column column = new Column();
            column.setName((String) colDef.get("name"));
            column.setType((String) colDef.get("type"));
            column.setNullable((Boolean) colDef.getOrDefault("nullable", true));

            if (colDef.containsKey("primaryKey")) {
                column.setPrimaryKey((Boolean) colDef.get("primaryKey"));
            }
            if (colDef.containsKey("autoIncrement")) {
                column.setAutoIncrement((Boolean) colDef.get("autoIncrement"));
            }
            if (colDef.containsKey("defaultValue")) {
                column.setDefaultValue((String) colDef.get("defaultValue"));
            }
            if (colDef.containsKey("comment")) {
                column.setComment((String) colDef.get("comment"));
            }

            columnList.add(column);
        }

        table.setColumns(columnList);
        return table;
    }

    public static void main(String[] args) {
        List<Map&gt;<String, Object>> columns = new ArrayList<>();

        Map&lt;String, , Object> idCol = new HashMap<>();
        idCol.put("name", "id");
        idCol.put("type", "BIGINT");
        idCol.put("primaryKey", true);
        idCol.put("autoIncrement", true);
        idCol.put("comment", "Primary key");
        columns.add(idCol);

        Map&lt;String, , Object> nameCol = new HashMap<>();
        nameCol.put("name", "name");
        nameCol.put("type", "VARCHAR(100)");
        nameCol.put("nullable", false);
        nameCol.put("comment", "Name");
        columns.add(nameCol);

        Table table = buildTable("products", columns);

        // Generate SQL
        JustdbManager manager = JustdbManager.getInstance();
        DBGenerator generator = new DBGenerator(manager.getPluginManager(), "mysql");
        System.out.println(generator.generateCreateTable(table));
    }
}
```

## Related Documentation

- [Schema Loader](./schema-loader.md) - Schema loading details
- [Schema Deployer](./schema-deployer.md) - Schema deployment details
- [Schema Diff Calculation](./schema-diff.md) - Schema diff calculation details
- [JDBC Driver](./jdbc-driver.md) - JDBC driver usage guide
