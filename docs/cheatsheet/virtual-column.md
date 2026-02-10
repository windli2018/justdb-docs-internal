# Virtual Column 虚拟列速查

虚拟列（Virtual Column）用于在关联表中提供可读性，无需存储冗余数据。

## 快速示例

### 基本虚拟列

```xml
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>
</Table>

<Table name="user_roles">
    <Column name="user_id" type="BIGINT"/>
    <!-- 虚拟列：运行时查询时解析 -->
    <Column name="username" virtual="true" from="users.username" on="user_id"/>
</Table>
```

**效果**：查询 `SELECT username FROM user_roles` 自动返回用户名。

### 虚拟列 + 可读列（推荐）

```xml
<Table name="user_roles">
    <Column name="user_id" type="BIGINT" noMigrate="true"/>
    <!-- 同时支持预制数据和运行时查询 -->
    <Column name="username"
            type="VARCHAR(255)"
            virtual="true"
            preferColumn="true"
            from="users.username"
            on="user_id"/>
</Table>

<Data table="user_roles">
    <Row username="alice"/>  <!-- 自动解析为 user_id -->
</Data>
```

## 常用场景

### 场景 1: 预制数据可读性

```xml
<Data table="user_roles">
    <!-- 使用可读值而非 ID -->
    <Row username="alice" rolename="admin"/>
    <Row username="bob" rolename="viewer"/>
</Data>
```

### 场景 2: 运行时查询

```sql
-- 查询虚拟列（自动解析）
SELECT username, rolename FROM user_roles;
-- 返回: alice, admin

-- 混合查询
SELECT user_id, username FROM user_roles;
-- 返回: 1, alice
```

### 场景 3: INSERT 自动解析

```sql
-- 插入可读值，自动转换为 ID
INSERT INTO user_roles (username) VALUES ('alice');
-- 转换为: INSERT INTO user_roles (user_id) VALUES (1);
```

### 场景 4: UPDATE 双向同步

```sql
-- 更新虚拟列，同步物理列
UPDATE user_roles SET username='bob' WHERE id=1;
-- 转换为: UPDATE user_roles SET user_id=2 WHERE id=1;
```

## 属性说明

| 属性 | 类型 | 说明 | 必填 |
|------|------|------|------|
| `virtual` | Boolean | 标记为虚拟列 | 是 |
| `from` | String | 引用表和字段（格式: `table.field`） | 是 |
| `on` | String | 当前表的外键列名 | 是 |
| `preferColumn` | Boolean | 同时支持预制数据解析 | 否 |
| `type` | String | 列类型（可选） | 否 |

## 属性组合

| type | virtual | preferColumn | DDL 包含 | 预制数据 | 运行时查询 |
|------|---------|-------------|---------|---------|-----------|
| ✅ | false | false | ✅ | ❌ | ❌ |
| ✅ | false | true | ✅ | ✅ | ❌ |
| ✅ | true | false | ❌ | ❌ | ✅ |
| ✅ | true | true | ❌ | ✅ | ✅ |
| ❌ | true | false | ❌ | ❌ | ✅ |
| ❌ | true | true | ❌ | ✅ | ✅ |

## 环境特定列 (noMigrate)

标记列值为环境特定，不支持跨环境迁移。

```xml
<Column name="user_id" type="BIGINT" noMigrate="true"/>
<Column name="username" type="VARCHAR(50)" preferColumn="true" from="users.username" on="user_id"/>
```

**行为规则**：

| 场景 | 行为 |
|------|------|
| 只提供 preferColumn | 解析为 ID，插入数据库 |
| 只提供 noMigrate 列值 | 直接使用该值 |
| 同时提供两者 | **优先 preferColumn** |

## 计算列生成策略

通过 `--computed-column` 参数控制 DDL 生成方式。

### 策略选项

| 选项 | 说明 | 数据库支持时 | 数据库不支持时 |
|------|------|-------------|---------------|
| `auto` (默认) | 支持时生成 | 生成计算列 | 不生成（运行时解析） |
| `always` | 必然生成 | 生成计算列 | 生成物理列 |
| `never` | 不生成 | 不生成（运行时解析） | 不生成 |

### 命令行使用

```bash
# 推荐：数据库支持时生成计算列
justdb migrate --computed-column auto

# 强制生成（数据库不支持时生成物理列）
justdb migrate --computed-column always

# 从不生成（完全依赖运行时解析）
justdb migrate --computed-column never
```

### 配置文件

```xml
<!-- justdb-config.xml -->
<Configuration>
    <Migrate computedColumn="auto"/>
</Configuration>
```

## DDL 生成示例

### MySQL 8.0+ (computedColumn="auto")

```sql
CREATE TABLE user_roles (
    user_id BIGINT,
    username VARCHAR(255) AS (SELECT username FROM users WHERE users.id = user_id) STORED
);
```

### MySQL 5.7 (computedColumn="auto")

```sql
CREATE TABLE user_roles (
    user_id BIGINT
);
-- username 不包含，运行时解析
```

### 任意数据库 (computedColumn="never")

```sql
CREATE TABLE user_roles (
    user_id BIGINT
);
-- username 始终运行时解析
```

## 注意事项

### 1. 虚拟列判断标准

```xml
<!-- ✅ 虚拟列：virtual=true -->
<Column name="username" virtual="true" from="users.username" on="user_id"/>

<!-- ❌ 非虚拟列：有 type，无 virtual 属性 -->
<Column name="username" type="VARCHAR(50)" from="users.username" on="user_id"/>
```

### 2. 引用表必须存在

```xml
<!-- ❌ 错误：users 表不存在 -->
<Column name="username" virtual="true" from="users.username" on="user_id"/>

<!-- ✅ 正确：先定义 users 表 -->
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>
</Table>
```

### 3. 外键列必须存在

```xml
<!-- ❌ 错误：user_id 列不存在 -->
<Column name="username" virtual="true" from="users.username" on="user_id"/>

<!-- ✅ 正确：先定义 user_id -->
<Column name="user_id" type="BIGINT"/>
<Column name="username" virtual="true" from="users.username" on="user_id"/>
```

### 4. preferColumn 优先级

```xml
<Data table="user_roles">
    <!-- preferColumn 优先于 noMigrate 列值 -->
    <Row user_id="999" username="alice"/>
    <!-- 结果：user_id=1（从 alice 解析），999 被忽略 -->
</Data>
```

## 进阶技巧

### 技巧 1: 多虚拟列

```xml
<Table name="user_roles">
    <Column name="user_id" type="BIGINT"/>
    <Column name="role_id" type="BIGINT"/>
    <Column name="username" virtual="true" from="users.username" on="user_id"/>
    <Column name="rolename" virtual="true" from="roles.rolename" on="role_id"/>
</Table>
```

### 技巧 2: 级联引用

```xml
<Table name="orders">
    <Column name="user_id" type="BIGINT"/>
    <Column name="username" virtual="true" from="users.username" on="user_id"/>
    <Column name="company_name" virtual="true" from="companies.name" on="user_id"/>
</Table>
```

### 技巧 3: 双向存储

```xml
<Table name="user_roles">
    <!-- 两个列都存储 -->
    <Column name="user_id" type="BIGINT"/>
    <Column name="username" type="VARCHAR(50)" preferColumn="true" from="users.username" on="user_id"/>
</Table>

<Data table="user_roles">
    <!-- 插入后两列都有值 -->
    <Row username="alice"/>
    <!-- 结果：user_id=1, username='alice' -->
</Data>
```

## 参考链接

- [Column 参考](../reference/schema/column.md)
- [Data 预制数据](../reference/data/)
