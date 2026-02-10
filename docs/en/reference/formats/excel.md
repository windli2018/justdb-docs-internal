---
icon: file-spreadsheet
title: Excel Format
order: 18
category:
  - Reference
  - Format Support
tag:
  - excel
  - xlsx
  - format
---

# Excel Format

Excel (.xlsx) format is a business-friendly table format particularly suitable for non-technical personnel to edit database Schema.

## Format Specification

### File Extensions

- `.xlsx` - Recommended (Excel 2007+)
- `.xls` - Legacy Excel format

### Worksheet Structure

JustDB Excel files contain multiple worksheets (Sheets), each representing a Schema object:

#### 1. Justdb Worksheet

Root configuration information:

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| id | Yes | Schema identifier | myapp |
| namespace | No | Namespace | com.example |
| description | No | Description | E-commerce application database |

#### 2. Table Worksheet

Table definitions:

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| name | Yes | Table name | users |
| id | No | Table ID | table_users |
| comment | No | Table comment | User table |
| expectedRecordCount | No | Expected record count | 1000000 |
| expectedGrowthRate | No | Expected growth rate | 10000 |

#### 3. Column Worksheet

Column definitions:

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| tableName | Yes* | Owner table name | users |
| id | No | Column ID | col_users_id |
| name | Yes | Column name | id |
| type | Yes | Data type | BIGINT |
| referenceId | No | Referenced column ID | global_id |
| nullable | No | Whether nullable | false |
| defaultValue | No | Default value | 0 |
| defaultValueComputed | No | Computed default value | CURRENT_TIMESTAMP |
| primaryKey | No | Whether primary key | true |
| autoIncrement | No | Whether auto-increment | true |
| unique | No | Whether unique | true |
| comment | No | Column comment | User ID |

* tableName can be omitted if column definition immediately follows table definition

#### 4. Index Worksheet

Index definitions:

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| tableName | Yes* | Owner table name | users |
| name | Yes | Index name | idx_users_username |
| columns | Yes | Index columns | username |
| unique | No | Whether unique index | true |
| comment | No | Index comment | Username unique index |

#### 5. Constraint Worksheet

Constraint definitions:

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| tableName | Yes* | Owner table name | orders |
| name | Yes | Constraint name | fk_orders_user_id |
| type | Yes | Constraint type | FOREIGN_KEY |
| columns | Yes | Constraint columns | user_id |
| referencedTable | Yes* | Referenced table | users |
| referencedColumn | Yes* | Referenced column | id |
| onDelete | No | Delete strategy | RESTRICT |
| onUpdate | No | Update strategy | CASCADE |

#### 6. View Worksheet

View definitions:

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| name | Yes | View name | active_users |
| content | Yes | View SQL | SELECT * FROM users... |
| comment | No | View comment | Active users view |

#### 7. Sequence Worksheet

Sequence definitions:

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| name | Yes | Sequence name | seq_user_id |
| startValue | No | Start value | 1 |
| increment | No | Increment | 1 |
| minValue | No | Minimum value | 1 |
| maxValue | No | Maximum value | 999999 |
| cycle | No | Whether cycle | false |

## Naming Conventions

### Worksheet Naming

- Use PascalCase: `Table`, `Column`, `Index`
- Singular form: `Table` instead of `Tables`

### Column Naming

- Use camelCase: `tableName`, `referenceId`
- Boolean values use is prefix or direct: `nullable`, `autoIncrement`

### Value Naming

- Table and column names use snake_case: `users`, `user_id`
- IDs use descriptive names: `global_id`, `col_users_id`

## Data Type Mapping

### Common Types

| Excel Type | Maps To | Description |
|------------|---------|-------------|
| Text | VARCHAR | String type, can specify length |
| Number | INTEGER/DECIMAL | Integer or decimal |
| Date | TIMESTAMP | Date time |
| Boolean | BOOLEAN | Boolean value |

### Database-Specific Types

In the Type column, you can directly specify database types:

```excel
VARCHAR(255)
BIGINT
DECIMAL(10,2)
TIMESTAMP
TEXT
BLOB
JSON
```

## Complete Example

### E-commerce Database Schema

```
Worksheet: Justdb
┌────────────────────────────────────────┐
│ id         │ namespace    │ description │
├────────────┼──────────────┼─────────────┤
│ ecommerce  │ com.example  │ E-commerce DB│
└────────────┴──────────────┴─────────────┘

Worksheet: Table
┌────────────┬─────────────────┬──────────────────────┐
│ name       │ comment         │ expectedRecordCount  │
├────────────┼─────────────────┼──────────────────────┤
│ users      │ User table      │ 1000000              │
│ orders     │ Orders table    │ 5000000              │
│ products   │ Products table  │ 100000               │
└────────────┴─────────────────┴──────────────────────┘

Worksheet: Column
┌───────────┬─────────┬───────────┬──────────┬───────────┬────────────┬─────────┬──────────────┬──────────┐
│ tableName │ id      │ name      │ type     │ nullable │ primaryKey │ autoInc │ comment      │ refId   │
├───────────┼─────────┼───────────┼──────────┼──────────┼────────────┼─────────┼──────────────┼──────────┤
│ users     │ uid     │ id        │ BIGINT   │ false    │ true       │ true    │ User ID      │         │
│ users     │         │ username  │ VARCHAR(50)│ false │            │         │ Username     │         │
│ users     │         │ email     │ VARCHAR(100)│ true │            │         │ Email        │         │
│ users     │         │ created_at│ TIMESTAMP│ false  │            │         │ Creation time│         │
│ orders    │ oid     │ id        │ BIGINT   │ false   │ true       │ true    │ Order ID     │         │
│ orders    │         │ user_id   │ BIGINT   │ false   │            │         │ User ID      │         │
│ orders    │         │ order_no  │ VARCHAR(50)│ false │            │         │ Order number │         │
│ orders    │         │ amount    │ DECIMAL(10,2)│ false│         │         │ Order amount │         │
└───────────┴─────────┴───────────┴──────────┴──────────┴────────────┴─────────┴──────────────┴──────────┘

Worksheet: Index
┌───────────┬─────────────────────┬───────────┬────────┬──────────────────────┐
│ tableName │ name                │ columns   │ unique │ comment              │
├───────────┼─────────────────────┼───────────┼────────┼──────────────────────┤
│ users     │ idx_users_username  │ username  │ true   │ Username unique index│
│ users     │ idx_users_email     │ email     │ true   │ Email unique index    │
│ orders    │ idx_orders_user_id  │ user_id   │ false  │ User ID index        │
│ orders    │ idx_orders_order_no │ order_no  │ true   │ Order number unique  │
└───────────┴─────────────────────┴───────────┴────────┴──────────────────────┘

Worksheet: Constraint
┌───────────┬──────────────────┬─────────────┬───────────┬─────────────────┬──────────────────┬───────────┬───────────┐
│ tableName │ name             │ type        │ columns   │ referencedTable │ referencedColumn │ onDelete  │ onUpdate  │
├───────────┼──────────────────┼─────────────┼───────────┼─────────────────┼──────────────────┼───────────┼───────────┤
│ orders    │ fk_orders_user   │ FOREIGN_KEY │ user_id   │ users           │ id               │ RESTRICT  │ CASCADE  │
└───────────┴──────────────────┴─────────────┴───────────┴─────────────────┴──────────────────┴───────────┴───────────┘

Worksheet: View
┌────────────────┬─────────────────────────────────────────────────────────────┬────────────────────┐
│ name           │ content                                                     │ comment            │
├────────────────┼─────────────────────────────────────────────────────────────┼────────────────────┤
│ active_users   │ SELECT u.id, u.username, COUNT(o.id) as order_count        │ Active users view  │
│                │ FROM users u                                                │                    │
│                │ LEFT JOIN orders o ON u.id = o.user_id                     │                    │
│                │ WHERE u.status = 'active'                                   │                    │
│                │ GROUP BY u.id, u.username                                   │                    │
└────────────────┴─────────────────────────────────────────────────────────────┴────────────────────┘
```

## Reading Excel

### CLI Commands

```bash
# Load Excel Schema
justdb convert schema.xlsx

# Convert to other formats
justdb convert -f xlsx -t yaml schema.xlsx > schema.yaml
justdb convert -f xlsx -t json schema.xlsx > schema.json
justdb convert -f xlsx -t xml schema.xlsx > schema.xml
```

### Java API

```java
import org.verydb.justdb.loader.SchemaLoader;
import org.verydb.justdb.schema.Justdb;

// Load Excel file
Loaded&lt;Justdb&gt; loaded = SchemaLoader.loadFromFile("schema.xlsx");
Justdb schema = loaded.getMainSchema();

// Access Schema
List<Table&gt;> tables = schema.getTables();
for (Table table : tables) {
    System.out.println("Table: " + table.getName());
    for (Column column : table.getColumns()) {
        System.out.println("  Column: " + column.getName() + " - " + column.getType());
    }
}
```

## Writing Excel

### CLI Commands

```bash
# Convert from other formats to Excel
justdb convert -f yaml -t xlsx schema.yaml > schema.xlsx
justdb convert -f json -t xlsx schema.json > schema.xlsx
justdb convert -f xml -t xlsx schema.xml > schema.xlsx

# Export from database to Excel
justdb db2schema -o schema.xlsx
```

### Java API

```java
import org.verydb.justdb.excel.WriteToExcel;
import org.verydb.justdb.schema.Justdb;
import java.io.File;

// Create Schema
Justdb schema = new Justdb();
schema.setId("myapp");
schema.setNamespace("com.example");

// Add table
Table table = new Table();
table.setName("users");
schema.getTables().add(table);

// Write to Excel
File excelFile = new File("schema.xlsx");
WriteToExcel.write(excelFile, schema);
```

## Best Practices

### 1. Worksheet Organization

```excel
# Recommended: Organize worksheets in logical order
1. Justdb    # Root configuration
2. Column    # Global column definitions
3. Table     # Table definitions
4. Index     # Index definitions
5. Constraint # Constraint definitions
6. View      # View definitions
```

### 2. Use Global Column Definitions

```excel
# Column worksheet: Define reusable columns
┌─────────┬──────────┬─────────┬───────────┬────────────┬───────────┐
│ id      │ name     │ type    │ primaryKey │ autoIncrement │ comment  │
├─────────┼──────────┼─────────┼───────────┼────────────┼───────────┤
│ global  │ id       │ BIGINT  │ true      │ true       │ Primary ID│
│ ts      │ created  │ TIMESTAMP│ false    │            │ Created   │
│ ts      │ updated  │ TIMESTAMP│ false    │            │ Updated   │
└─────────┴──────────┴─────────┴───────────┴────────────┴───────────┘

# Reference in other worksheets
┌──────────┬──────────┬────────────┐
│ tableName│ name     │ referenceId│
├──────────┼──────────┼────────────┤
│ users    │ id       │ global     │
│ users    │ created  │ ts         │
└──────────┴──────────┴────────────┘
```

### 3. Add Comments

```excel
# Use Excel comment feature for additional explanations
# Select cell → Right click → Insert Comment

# Example comments
- "expectedRecordCount: Used for performance optimization recommendations"
- "defaultValueComputed: Use database function to compute default value"
```

### 4. Data Validation

```excel
# Use Excel data validation feature
# Data → Data Validation → Set Rules

# type column: Dropdown list
VARCHAR, INTEGER, BIGINT, TIMESTAMP, DECIMAL, TEXT, BLOB

# nullable column: Dropdown list
true, false

# onDelete column: Dropdown list
CASCADE, RESTRICT, SET NULL, NO ACTION
```

### 5. Conditional Formatting

```excel
# Use conditional formatting to highlight important information
# Primary key columns: Yellow background
# Required columns: Bold
# Foreign key columns: Blue text
```

## Comparison with Other Formats

### Excel Advantages

- **Business Friendly**: Editable by non-technical personnel
- **Visual**: Intuitive table format
- **Collaboration**: Can use shared Excel
- **Tool Support**: Powerful Excel features (sorting, filtering, validation)

### Excel Limitations

- **Not Version Control Friendly**: Binary format, difficult to diff
- **Not for Large Schemas**: Performance and maintainability issues
- **No Comment Support**: Requires using Excel comment feature
- **Format Limitations**: Complex nested structures difficult to express

## Format Conversion

### Excel to YAML

```bash
justdb convert -f xlsx -t yaml schema.xlsx > schema.yaml
```

### YAML to Excel

```bash
justdb convert -f yaml -t xlsx schema.yaml > schema.xlsx
```

### Batch Conversion

```bash
# Convert all Excel files in directory to YAML
for file in *.xlsx; do
    justdb convert -f xlsx -t yaml "$file" > "${file%.xlsx}.yaml"
done
```

## Related Documentation

- [YAML Format](./yaml.md)
- [JSON Format](./json.md)
- [XML Format](./xml.md)
- [Format Support Overview](./README.md)
- [Schema Loading API](../api/schema-loader.md)
