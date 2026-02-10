---
icon: file-code
title: XML Format
order: 14
category:
  - Reference
  - Format Support
tag:
  - xml
  - format
---

# XML Format

XML (eXtensible Markup Language) is a configuration format commonly used in enterprise applications, especially suitable for Java enterprise applications.

## Format Specification

### File Extension

- `.xml`

### Basic Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="myapp" namespace="com.example">
  <Table name="users" comment="User table">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="username" type="VARCHAR(50)" nullable="false"/>
  </Table>
</Justdb>
```

## Syntax Features

### XML Declaration

```xml
<?xml version="1.0" encoding="UTF-8"?>
```

### Elements and Attributes

```xml
<!-- Element content -->
<Column>
  <name>id</name>
  <type>BIGINT</type>
</Column>

<!-- Attributes -->
<Column name="id" type="BIGINT" primaryKey="true"/>
```

### Comments

```xml
<!-- This is a comment -->
<Table name="users">
  <!-- comment: User table -->
  <Column name="id" type="BIGINT"/>
</Table>
```

### Escape Characters

| Character | Escape Sequence |
|-----------|----------------|
| `<` | `<` |
| `>` | `>` |
| `&` | `&` |
| `'` | `&apos;` |
| `"` | `&quot;` |

```xml
<content>SELECT * FROM &quot;users&quot;</content>
```

### CDATA Sections

Use CDATA for special characters:

```xml
<View name="active_users">
  <content><![CDATA[
    SELECT *
    FROM users
    WHERE status = 'active'
  ]]></content>
</View>
```

## JAXB Annotation Mapping

JustDB uses JAXB annotations for XML serialization:

```java
@XmlRootElement(name = "Justdb")
public class Justdb {
    @XmlElement
    private String id;

    @XmlElement
    private String namespace;

    @XmlElementWrapper(name = "Table")
    @XmlElement(name = "Table")
    private List<Table&gt;> tables;
}
```

## Complete Examples

### Simple Schema

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="myapp" namespace="com.example">

  <!-- User table -->
  <Table name="users" comment="User table">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true" comment="User ID"/>
    <Column name="username" type="VARCHAR(50)" nullable="false" comment="Username"/>
    <Column name="email" type="VARCHAR(100)" comment="Email"/>
    <Column name="created_at" type="TIMESTAMP" nullable="false"
            defaultValueComputed="CURRENT_TIMESTAMP" comment="Creation time"/>

    <Index name="idx_users_username" columns="username" unique="true"
           comment="Unique username index"/>
    <Index name="idx_users_email" columns="email" unique="true"
           comment="Unique email index"/>
  </Table>

</Justdb>
```

### Complex Schema

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="ecommerce" namespace="com.example.ecommerce">

  <!-- Global column definitions -->
  <Column id="global_id" name="id" type="BIGINT"
          primaryKey="true" autoIncrement="true" comment="Primary key ID"/>

  <Column id="global_created_at" name="created_at" type="TIMESTAMP"
          nullable="false" defaultValueComputed="CURRENT_TIMESTAMP" comment="Creation time"/>

  <Column id="global_updated_at" name="updated_at" type="TIMESTAMP"
          nullable="false" defaultValueComputed="CURRENT_TIMESTAMP" comment="Update time"/>

  <!-- User table -->
  <Table id="table_users" name="users" comment="User table"
         expectedRecordCount="1000000" expectedGrowthRate="10000">

    <Column id="col_users_id" referenceId="global_id" name="id"/>

    <Column name="username" type="VARCHAR(50)" nullable="false" comment="Username"/>

    <Column name="email" type="VARCHAR(100)" comment="Email"/>

    <Column name="password_hash" type="VARCHAR(255)" nullable="false" comment="Password hash"/>

    <Column name="status" type="VARCHAR(20)" defaultValue="active" comment="Status"/>

    <Column id="col_users_created_at" referenceId="global_created_at" name="created_at"/>

    <Column id="col_users_updated_at" referenceId="global_updated_at" name="updated_at"/>

    <Index name="idx_users_username" columns="username" unique="true"
           comment="Unique username index"/>

    <Index name="idx_users_email" columns="email" unique="true"
           comment="Unique email index"/>

    <Index name="idx_users_status" columns="status" comment="Status index"/>
  </Table>

  <!-- Order table -->
  <Table id="table_orders" name="orders" comment="Order table">

    <Column id="col_orders_id" referenceId="global_id" name="id"/>

    <Column name="user_id" type="BIGINT" nullable="false" comment="User ID"/>

    <Column name="order_no" type="VARCHAR(50)" nullable="false" comment="Order number"/>

    <Column name="status" type="VARCHAR(20)" defaultValue="pending" comment="Order status"/>

    <Column name="total_amount" type="DECIMAL(10,2)" defaultValue="0.00" comment="Order total amount"/>

    <Column id="col_orders_created_at" referenceId="global_created_at" name="created_at"/>

    <Column id="col_orders_updated_at" referenceId="global_updated_at" name="updated_at"/>

    <Constraint name="fk_orders_user_id" type="FOREIGN_KEY"
                referencedTable="users" referencedColumn="id"
                columns="user_id" onDelete="RESTRICT" comment="User foreign key"/>

    <Index name="idx_orders_user_id" columns="user_id" comment="User ID index"/>

    <Index name="idx_orders_order_no" columns="order_no" unique="true"
           comment="Unique order number index"/>
  </Table>

  <!-- View definition -->
  <View name="active_users" comment="Active users view">
    <content><![CDATA[
      SELECT
        u.id,
        u.username,
        u.email,
        COUNT(o.id) AS order_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.status = 'active'
      GROUP BY u.id, u.username, u.email
    ]]></content>
  </View>

</Justdb>
```

## Namespaces

### Using Namespaces

```xml
<?xml version="1.0" encoding="UTF-8"?>
<justdb:Justdb xmlns:justdb="http://www.verydb.org/justdb"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              id="myapp"
              namespace="com.example">

  <justdb:Table name="users">
    <justdb:Column name="id" type="BIGINT"/>
  </justdb:Table>

</justdb:Justdb>
```

## XML Schema Validation

### Validate with XSD

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="myapp"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="justdb.xsd">
  <!-- Schema content -->
</Justdb>
```

## Best Practices

### 1. Use Attributes for Simple Values

```xml
<!-- Recommended -->
<Column name="id" type="BIGINT" primaryKey="true"/>

<!-- Not recommended -->
<Column>
  <name>id</name>
  <type>BIGINT</type>
  <primaryKey>true</primaryKey>
</Column>
```

### 2. Use Elements for Complex Values

```xml
<!-- Recommended: Complex content uses elements -->
<View name="active_users">
  <content><![CDATA[
    SELECT * FROM users
  ]]></content>
</View>
```

### 3. Add Comments

```xml
<!-- Global primary key definition -->
<Column id="global_id" name="id" type="BIGINT"
        primaryKey="true" autoIncrement="true"/>
```

### 4. Use Formatting

```xml
<!-- Recommended: Formatted XML -->
<Table name="users">
  <Column name="id" type="BIGINT"/>
  <Column name="username" type="VARCHAR(50)"/>
</Table>
```

## Related Documentation

- [YAML Format](./yaml.md)
- [JSON Format](./json.md)
- [Format Support Overview](./README.md)
