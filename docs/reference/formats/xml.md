---
icon: file-code
title: XML 格式
order: 14
category:
  - 参考文档
  - 格式支持
tag:
  - xml
  - format
---

# XML 格式

XML（eXtensible Markup Language）是企业级应用中常用的配置格式，特别适合 Java 企业应用。

## 格式规范

### 文件扩展名

- `.xml`

### 基本结构

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="myapp" namespace="com.example">
  <Table name="users" comment="用户表">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="username" type="VARCHAR(50)" nullable="false"/>
  </Table>
</Justdb>
```

## 语法特性

### XML 声明

```xml
<?xml version="1.0" encoding="UTF-8"?>
```

### 元素和属性

```xml
<!-- 元素内容 -->
<Column>
  <name>id</name>
  <type>BIGINT</type>
</Column>

<!-- 属性 -->
<Column name="id" type="BIGINT" primaryKey="true"/>
```

### 注释

```xml
<!-- 这是注释 -->
<Table name="users">
  <!-- comment: 用户表 -->
  <Column name="id" type="BIGINT"/>
</Table>
```

### 转义字符

| 字符 | 转义序列 |
|------|---------|
| `<` | `<` |
| `>` | `>` |
| `&` | `&` |
| `'` | `&apos;` |
| `"` | `&quot;` |

```xml
<content>SELECT * FROM &quot;users&quot;</content>
```

### CDATA 区块

包含特殊字符时使用 CDATA：

```xml
<View name="active_users">
  <content><![CDATA[
    SELECT *
    FROM users
    WHERE status = 'active'
  ]]></content>
</View>
```

## JAXB 注解映射

JustDB 使用 JAXB 注解支持 XML 序列化：

```java
@XmlRootElement(name = "Justdb")
public class Justdb {
    @XmlElement
    private String id;

    @XmlElement
    private String namespace;

    @XmlElementWrapper(name = "Table")
    @XmlElement(name = "Table")
    private List<Table> tables;
}
```

## 完整示例

### 简单 Schema

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="myapp" namespace="com.example">

  <!-- 用户表 -->
  <Table name="users" comment="用户表">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true" comment="用户ID"/>
    <Column name="username" type="VARCHAR(50)" nullable="false" comment="用户名"/>
    <Column name="email" type="VARCHAR(100)" comment="邮箱"/>
    <Column name="created_at" type="TIMESTAMP" nullable="false"
            defaultValueComputed="CURRENT_TIMESTAMP" comment="创建时间"/>

    <Index name="idx_users_username" columns="username" unique="true"
           comment="用户名唯一索引"/>
    <Index name="idx_users_email" columns="email" unique="true"
           comment="邮箱唯一索引"/>
  </Table>

</Justdb>
```

### 复杂 Schema

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="ecommerce" namespace="com.example.ecommerce">

  <!-- 全局列定义 -->
  <Column id="global_id" name="id" type="BIGINT"
          primaryKey="true" autoIncrement="true" comment="主键ID"/>

  <Column id="global_created_at" name="created_at" type="TIMESTAMP"
          nullable="false" defaultValueComputed="CURRENT_TIMESTAMP" comment="创建时间"/>

  <Column id="global_updated_at" name="updated_at" type="TIMESTAMP"
          nullable="false" defaultValueComputed="CURRENT_TIMESTAMP" comment="更新时间"/>

  <!-- 用户表 -->
  <Table id="table_users" name="users" comment="用户表"
         expectedRecordCount="1000000" expectedGrowthRate="10000">

    <Column id="col_users_id" referenceId="global_id" name="id"/>

    <Column name="username" type="VARCHAR(50)" nullable="false" comment="用户名"/>

    <Column name="email" type="VARCHAR(100)" comment="邮箱"/>

    <Column name="password_hash" type="VARCHAR(255)" nullable="false" comment="密码哈希"/>

    <Column name="status" type="VARCHAR(20)" defaultValue="active" comment="状态"/>

    <Column id="col_users_created_at" referenceId="global_created_at" name="created_at"/>

    <Column id="col_users_updated_at" referenceId="global_updated_at" name="updated_at"/>

    <Index name="idx_users_username" columns="username" unique="true"
           comment="用户名唯一索引"/>

    <Index name="idx_users_email" columns="email" unique="true"
           comment="邮箱唯一索引"/>

    <Index name="idx_users_status" columns="status" comment="状态索引"/>
  </Table>

  <!-- 订单表 -->
  <Table id="table_orders" name="orders" comment="订单表">

    <Column id="col_orders_id" referenceId="global_id" name="id"/>

    <Column name="user_id" type="BIGINT" nullable="false" comment="用户ID"/>

    <Column name="order_no" type="VARCHAR(50)" nullable="false" comment="订单号"/>

    <Column name="status" type="VARCHAR(20)" defaultValue="pending" comment="订单状态"/>

    <Column name="total_amount" type="DECIMAL(10,2)" defaultValue="0.00" comment="订单总额"/>

    <Column id="col_orders_created_at" referenceId="global_created_at" name="created_at"/>

    <Column id="col_orders_updated_at" referenceId="global_updated_at" name="updated_at"/>

    <Constraint name="fk_orders_user_id" type="FOREIGN_KEY"
                referencedTable="users" referencedColumn="id"
                columns="user_id" onDelete="RESTRICT" comment="用户外键"/>

    <Index name="idx_orders_user_id" columns="user_id" comment="用户ID索引"/>

    <Index name="idx_orders_order_no" columns="order_no" unique="true"
           comment="订单号唯一索引"/>
  </Table>

  <!-- 视图定义 -->
  <View name="active_users" comment="活跃用户视图">
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

## 命名空间

### 使用命名空间

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

## XML Schema 验证

### 使用 XSD 验证

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb id="myapp"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="justdb.xsd">
  <!-- Schema 内容 -->
</Justdb>
```

## 最佳实践

### 1. 使用属性表示简单值

```xml
<!-- 推荐 -->
<Column name="id" type="BIGINT" primaryKey="true"/>

<!-- 不推荐 -->
<Column>
  <name>id</name>
  <type>BIGINT</type>
  <primaryKey>true</primaryKey>
</Column>
```

### 2. 使用元素表示复杂值

```xml
<!-- 推荐：复杂内容使用元素 -->
<View name="active_users">
  <content><![CDATA[
    SELECT * FROM users
  ]]></content>
</View>
```

### 3. 添加注释

```xml
<!-- 全局主键定义 -->
<Column id="global_id" name="id" type="BIGINT"
        primaryKey="true" autoIncrement="true"/>
```

### 4. 使用格式化

```xml
<!-- 推荐：格式化的 XML -->
<Table name="users">
  <Column name="id" type="BIGINT"/>
  <Column name="username" type="VARCHAR(50)"/>
</Table>
```

## 相关文档

- [YAML 格式](./yaml.md)
- [JSON 格式](./json.md)
- [格式支持概述](./README.md)
