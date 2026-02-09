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
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;Justdb id="myapp" namespace="com.example"&gt;
  &lt;Table name="users" comment="用户表"&gt;
    &lt;Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/&gt;
    &lt;Column name="username" type="VARCHAR(50)" nullable="false"/&gt;
  &lt;/Table&gt;
&lt;/Justdb&gt;
```

## 语法特性

### XML 声明

```xml
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
```

### 元素和属性

```xml
&lt;!-- 元素内容 --&gt;
&lt;Column&gt;
  &lt;name&gt;id&lt;/name&gt;
  &lt;type&gt;BIGINT&lt;/type&gt;
&lt;/Column&gt;

&lt;!-- 属性 --&gt;
&lt;Column name="id" type="BIGINT" primaryKey="true"/&gt;
```

### 注释

```xml
&lt;!-- 这是注释 --&gt;
&lt;Table name="users"&gt;
  &lt;!-- comment: 用户表 --&gt;
  &lt;Column name="id" type="BIGINT"/&gt;
&lt;/Table&gt;
```

### 转义字符

| 字符 | 转义序列 |
|------|---------|
| `<` | `&lt;` |
| `>` | `&gt;` |
| `&` | `&amp;` |
| `'` | `&apos;` |
| `"` | `&quot;` |

```xml
&lt;content&gt;SELECT * FROM &quot;users&quot;&lt;/content&gt;
```

### CDATA 区块

包含特殊字符时使用 CDATA：

```xml
&lt;View name="active_users"&gt;
  &lt;content&gt;<![CDATA[
    SELECT *
    FROM users
    WHERE status = 'active'
  ]]>&lt;/content&gt;
&lt;/View&gt;
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
    private List&lt;Table&gt; tables;
}
```

## 完整示例

### 简单 Schema

```xml
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;Justdb id="myapp" namespace="com.example"&gt;

  &lt;!-- 用户表 --&gt;
  &lt;Table name="users" comment="用户表"&gt;
    &lt;Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true" comment="用户ID"/&gt;
    &lt;Column name="username" type="VARCHAR(50)" nullable="false" comment="用户名"/&gt;
    &lt;Column name="email" type="VARCHAR(100)" comment="邮箱"/&gt;
    <Column name="created_at" type="TIMESTAMP" nullable="false"
            defaultValueComputed="CURRENT_TIMESTAMP" comment="创建时间"/>

    <Index name="idx_users_username" columns="username" unique="true"
           comment="用户名唯一索引"/>
    <Index name="idx_users_email" columns="email" unique="true"
           comment="邮箱唯一索引"/>
  &lt;/Table&gt;

&lt;/Justdb&gt;
```

### 复杂 Schema

```xml
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;Justdb id="ecommerce" namespace="com.example.ecommerce"&gt;

  &lt;!-- 全局列定义 --&gt;
  <Column id="global_id" name="id" type="BIGINT"
          primaryKey="true" autoIncrement="true" comment="主键ID"/>

  <Column id="global_created_at" name="created_at" type="TIMESTAMP"
          nullable="false" defaultValueComputed="CURRENT_TIMESTAMP" comment="创建时间"/>

  <Column id="global_updated_at" name="updated_at" type="TIMESTAMP"
          nullable="false" defaultValueComputed="CURRENT_TIMESTAMP" comment="更新时间"/>

  &lt;!-- 用户表 --&gt;
  <Table id="table_users" name="users" comment="用户表"
         expectedRecordCount="1000000" expectedGrowthRate="10000">

    &lt;Column id="col_users_id" referenceId="global_id" name="id"/&gt;

    &lt;Column name="username" type="VARCHAR(50)" nullable="false" comment="用户名"/&gt;

    &lt;Column name="email" type="VARCHAR(100)" comment="邮箱"/&gt;

    &lt;Column name="password_hash" type="VARCHAR(255)" nullable="false" comment="密码哈希"/&gt;

    &lt;Column name="status" type="VARCHAR(20)" defaultValue="active" comment="状态"/&gt;

    &lt;Column id="col_users_created_at" referenceId="global_created_at" name="created_at"/&gt;

    &lt;Column id="col_users_updated_at" referenceId="global_updated_at" name="updated_at"/&gt;

    <Index name="idx_users_username" columns="username" unique="true"
           comment="用户名唯一索引"/>

    <Index name="idx_users_email" columns="email" unique="true"
           comment="邮箱唯一索引"/>

    &lt;Index name="idx_users_status" columns="status" comment="状态索引"/&gt;
  &lt;/Table&gt;

  &lt;!-- 订单表 --&gt;
  &lt;Table id="table_orders" name="orders" comment="订单表"&gt;

    &lt;Column id="col_orders_id" referenceId="global_id" name="id"/&gt;

    &lt;Column name="user_id" type="BIGINT" nullable="false" comment="用户ID"/&gt;

    &lt;Column name="order_no" type="VARCHAR(50)" nullable="false" comment="订单号"/&gt;

    &lt;Column name="status" type="VARCHAR(20)" defaultValue="pending" comment="订单状态"/&gt;

    &lt;Column name="total_amount" type="DECIMAL(10,2)" defaultValue="0.00" comment="订单总额"/&gt;

    &lt;Column id="col_orders_created_at" referenceId="global_created_at" name="created_at"/&gt;

    &lt;Column id="col_orders_updated_at" referenceId="global_updated_at" name="updated_at"/&gt;

    <Constraint name="fk_orders_user_id" type="FOREIGN_KEY"
                referencedTable="users" referencedColumn="id"
                columns="user_id" onDelete="RESTRICT" comment="用户外键"/>

    &lt;Index name="idx_orders_user_id" columns="user_id" comment="用户ID索引"/&gt;

    <Index name="idx_orders_order_no" columns="order_no" unique="true"
           comment="订单号唯一索引"/>
  &lt;/Table&gt;

  &lt;!-- 视图定义 --&gt;
  &lt;View name="active_users" comment="活跃用户视图"&gt;
    &lt;content&gt;<![CDATA[
      SELECT
        u.id,
        u.username,
        u.email,
        COUNT(o.id) AS order_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.status = 'active'
      GROUP BY u.id, u.username, u.email
    ]]>&lt;/content&gt;
  &lt;/View&gt;

&lt;/Justdb&gt;
```

## 命名空间

### 使用命名空间

```xml
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
<justdb:Justdb xmlns:justdb="http://www.verydb.org/justdb"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              id="myapp"
              namespace="com.example">

  &lt;justdb:Table name="users"&gt;
    &lt;justdb:Column name="id" type="BIGINT"/&gt;
  &lt;/justdb:Table&gt;

&lt;/justdb:Justdb&gt;
```

## XML Schema 验证

### 使用 XSD 验证

```xml
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
<Justdb id="myapp"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="justdb.xsd">
  &lt;!-- Schema 内容 --&gt;
&lt;/Justdb&gt;
```

## 最佳实践

### 1. 使用属性表示简单值

```xml
&lt;!-- 推荐 --&gt;
&lt;Column name="id" type="BIGINT" primaryKey="true"/&gt;

&lt;!-- 不推荐 --&gt;
&lt;Column&gt;
  &lt;name&gt;id&lt;/name&gt;
  &lt;type&gt;BIGINT&lt;/type&gt;
  &lt;primaryKey&gt;true&lt;/primaryKey&gt;
&lt;/Column&gt;
```

### 2. 使用元素表示复杂值

```xml
&lt;!-- 推荐：复杂内容使用元素 --&gt;
&lt;View name="active_users"&gt;
  &lt;content&gt;<![CDATA[
    SELECT * FROM users
  ]]>&lt;/content&gt;
&lt;/View&gt;
```

### 3. 添加注释

```xml
&lt;!-- 全局主键定义 --&gt;
<Column id="global_id" name="id" type="BIGINT"
        primaryKey="true" autoIncrement="true"/>
```

### 4. 使用格式化

```xml
&lt;!-- 推荐：格式化的 XML --&gt;
&lt;Table name="users"&gt;
  &lt;Column name="id" type="BIGINT"/&gt;
  &lt;Column name="username" type="VARCHAR(50)"/&gt;
&lt;/Table&gt;
```

## 相关文档

- [YAML 格式](./yaml.md)
- [JSON 格式](./json.md)
- [格式支持概述](./README.md)
