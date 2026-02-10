# Serial 自增列速查

Serial（自增列）用于自动生成唯一标识符，常用于主键列。

## 快速示例

### MySQL 自增列

```xml
<Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
```

生成的 SQL：

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT
);
```

### PostgreSQL SERIAL

```xml
<Column name="id" type="BIGINT" primaryKey="true" serial="true"/>
```

生成的 SQL：

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY
);

CREATE SEQUENCE users_id_seq OWNED BY users.id;
ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq');
```

## 常用场景

### 场景 1: 联合主键 + 自增

```xml
<Table name="order_items">
    <Column name="id" type="BIGINT" autoIncrement="true"/>
    <Column name="order_id" type="BIGINT"/>
    <Column name="product_id" type="BIGINT"/>
    <Constraint type="PRIMARY_KEY" name="pk_order_item">
        <column>order_id</column>
        <column>product_id</column>
    </Constraint>
</Table>
```

### 场景 2: 指定自增起始值

```xml
<Table name="users">
    <Column name="id" type="INT" primaryKey="true" autoIncrement="true"/>
    <Data table="users">
        <Row id="1001" username="admin"/>
    </Data>
</Table>
```

### 场景 3: PostgreSQL 序列配置

```xml
<Sequence name="user_id_seq" startWith="1000" incrementBy="1" cache="20"/>

<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true" defaultValue="nextval('user_id_seq')"/>
</Table>
```

## 数据库支持

| 数据库 | 属性 | 语法 |
|--------|------|------|
| MySQL | `autoIncrement="true"` | `AUTO_INCREMENT` |
| PostgreSQL | `serial="true"` | `SERIAL` / `BIGSERIAL` |
| SQL Server | `autoIncrement="true"` | `IDENTITY(1,1)` |
| Oracle | `defaultValue="sequence_name.NEXTVAL"` | Sequence |
| SQLite | `autoIncrement="true"` | `AUTOINCREMENT` |
| H2 | `autoIncrement="true"` | `AUTO_INCREMENT` |

## 属性说明

| 属性 | 类型 | 说明 | 数据库限制 |
|------|------|------|-----------|
| `autoIncrement` | Boolean | 启用自增 | MySQL, SQL Server, SQLite, H2 |
| `serial` | Boolean | 使用 SERIAL 类型 | PostgreSQL |
| `primaryKey` | Boolean | 主键约束 | 所有数据库 |
| `startWith` | Integer | 起始值（仅 Sequence） | PostgreSQL, Oracle |

## 注意事项

### 1. 每表只能有一个自增列

```xml
<!-- ❌ 错误：多个自增列 -->
<Table name="users">
    <Column name="id" type="BIGINT" autoIncrement="true"/>
    <Column name="seq" type="BIGINT" autoIncrement="true"/>
</Table>

<!-- ✅ 正确：使用 Sequence -->
<Sequence name="custom_seq" startWith="1"/>
<Table name="users">
    <Column name="id" type="BIGINT" autoIncrement="true"/>
    <Column name="seq" type="BIGINT" defaultValue="nextval('custom_seq')"/>
</Table>
```

### 2. 自增列必须是键的一部分

```xml
<!-- ❌ 错误：自增列不是键 -->
<Table name="logs">
    <Column name="id" type="BIGINT" autoIncrement="true"/>
    <Column name="message" type="TEXT"/>
</Table>

<!-- ✅ 正确：设为主键 -->
<Table name="logs">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="message" type="TEXT"/>
</Table>
```

### 3. PostgreSQL SERIAL 自动创建 Sequence

```xml
<!-- 使用 serial="true" 自动创建序列 -->
<Column name="id" type="BIGINT" serial="true"/>

<!-- 等价于手动创建 -->
<Sequence name="table_id_seq"/>
<Column name="id" type="BIGINT" defaultValue="nextval('table_id_seq')"/>
```

### 4. 跨数据库兼容性

```xml
<!-- 方案 1: 使用 autoIncrement（推荐） -->
<!-- MySQL: AUTO_INCREMENT, PostgreSQL: 忽略，需手动配置序列 -->
<Column name="id" type="BIGINT" autoIncrement="true"/>

<!-- 方案 2: 使用数据库特定模板 -->
<Column name="id" type="BIGINT">
    <!-- MySQL 模板会处理 autoIncrement -->
</Column>
```

## 进阶技巧

### 技巧 1: 复合序列

```xml
<Sequence name="global_seq" incrementBy="1" cache="100"/>

<Table name="users">
    <Column name="id" type="BIGINT" defaultValue="nextval('global_seq')"/>
</Table>

<Table name="orders">
    <Column name="id" type="BIGINT" defaultValue="nextval('global_seq')"/>
</Table>
```

### 技巧 2: 重置序列值

```xml
<!-- 通过 Data 重置 -->
<Data table="users">
    <Row id="1000" username="admin"/>  <!-- 下一个从 1001 开始 -->
</Data>
```

### 技巧 3: 循环序列

```xml
<Sequence name="cyclic_seq"
          startWith="1"
          maxValue="9999"
          cycle="true"/>
```

## 参考链接

- [Column 参考](../reference/schema/column.md)
- [Sequence 参考](../reference/schema/sequence.md)
- [数据库支持](../reference/databases/)
