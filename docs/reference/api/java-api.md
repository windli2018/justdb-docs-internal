---
title: Java API 参考
icon: ☕
description: JustDB 核心 Java API 详细参考，包括 Schema 定义、加载和生成
order: 2
---

# Java API 参考

JustDB 提供了一套完整的 Java API，用于定义、加载、生成和部署数据库 Schema。本文档详细介绍核心 API 的使用方法。

## 目录

- [Schema 定义 API](#schema-定义-api)
- [Schema 加载 API](#schema-加载-api)
- [SQL 生成 API](#sql-生成-api)
- [代码示例](#代码示例)

## Schema 定义 API

### Justdb - Schema 根容器

`Justdb` 是 Schema 定义的根元素，包含所有数据库对象。

**包路径**: `org.verydb.justdb.schema.Justdb`

**核心属性**:

| 属性 | 类型 | 描述 |
|------|------|------|
| `namespace` | String | 命名空间，用于代码生成 |
| `tables` | List\<Table\> | 表定义列表 |
| `views` | List\<View\> | 视图定义列表 |
| `sequences` | List\<Sequence\> | 序列定义列表 |
| `indexes` | List\<Index\> | 索引定义列表 |
| `constraints` | List\<Constraint\> | 约束定义列表 |
| `data` | List\<Data\> | 数据导出定义 |
| `properties` | List\<Property\> | Schema 属性 |

**代码示例**:

```java
import org.verydb.justdb.schema.Justdb;
import org.verydb.justdb.schema.Table;
import org.verydb.justdb.schema.Column;
import java.util.Arrays;

// 创建 Schema
Justdb justdb = new Justdb();
justdb.setNamespace("com.example");
justdb.setId("my-schema");

// 创建表
Table usersTable = new Table("users");
usersTable.setComment("用户表");

justdb.setTables(Arrays.asList(usersTable));
```

### Table - 表定义

`Table` 表示数据库表，继承自 `QueryAble`，支持列、索引、约束等子元素。

**包路径**: `org.verydb.justdb.schema.Table`

**核心属性**:

| 属性 | 类型 | 描述 |
|------|------|------|
| `name` | String | 表名 |
| `id` | String | 表 ID |
| `comment` | String | 表注释 |
| `columns` | List\<Column\> | 列定义 |
| `indexes` | List\<Index\> | 索引定义 |
| `constraints` | List\<Constraint\> | 约束定义 |
| `sequences` | List\<Sequence\> | 序列定义 |
| `engine` | String | 存储引擎（MySQL） |
| `charset` | String | 字符集 |
| `collation` | String | 排序规则 |
| `autoIncrement` | Long | 自增值起始值 |
| `changeType` | ChangeType | 变更类型 |
| `formerNames` | List\<String\> | 旧名称列表 |
| `dataExportStrategy` | DataExportStrategy | 数据导出策略 |
| `dataFilterCondition` | String | 数据过滤条件 |

**数据导出策略**:

- `NO_DATA` - 不导出数据
- `ALL_DATA` - 导出所有数据
- `PARTIAL_DATA` - 部分数据（使用 dataFilterCondition）
- `DATA_SQL_ONLY` - 仅导出数据 SQL

**代码示例**:

```java
// 创建表
Table table = new Table("users");
table.setComment("用户信息表");
table.setEngine("InnoDB");
table.setCharset("utf8mb4");

// 设置数据导出策略
table.setDataExportStrategy(Table.DataExportStrategy.PARTIAL_DATA);
table.setDataFilterCondition("status = 'active'");
```

### Column - 列定义

`Column` 表示表中的列，支持所有标准数据类型和约束。

**包路径**: `org.verydb.justdb.schema.Column`

**核心属性**:

| 属性 | 类型 | 描述 |
|------|------|------|
| `name` | String | 列名 |
| `type` | String | 数据类型 |
| `nullable` | Boolean | 是否可为空 |
| `primaryKey` | Boolean | 是否主键 |
| `autoIncrement` | Boolean | 是否自增 |
| `defaultValue` | String | 默认值 |
| `comment` | String | 列注释 |
| `unique` | Boolean | 是否唯一 |
| `length` | Integer | 长度 |
| `precision` | Integer | 精度 |
| `scale` | Integer | 小数位数 |
| `changeType` | ChangeType | 变更类型 |
| `formerNames` | List\<String\> | 旧名称列表 |

**支持的数据类型**:

- 整数: `TINYINT`, `SMALLINT`, `INT`, `BIGINT`
- 浮点: `FLOAT`, `DOUBLE`, `DECIMAL`, `NUMERIC`
- 字符串: `CHAR`, `VARCHAR`, `TEXT`, `LONGTEXT`
- 二进制: `BINARY`, `VARBINARY`, `BLOB`, `LONGBLOB`
- 日期时间: `DATE`, `TIME`, `DATETIME`, `TIMESTAMP`, `YEAR`
- 其他: `BOOLEAN`, `JSON`, `ENUM`

**代码示例**:

```java
// 创建列
Column idColumn = new Column();
idColumn.setName("id");
idColumn.setType("BIGINT");
idColumn.setPrimaryKey(true);
idColumn.setAutoIncrement(true);
idColumn.setComment("主键 ID");

Column nameColumn = new Column();
nameColumn.setName("username");
nameColumn.setType("VARCHAR(50)");
nameColumn.setNullable(false);
nameColumn.setComment("用户名");

Column emailColumn = new Column();
emailColumn.setName("email");
emailColumn.setType("VARCHAR(100)");
emailColumn.setUnique(true);
emailColumn.setComment("邮箱地址");
```

### Index - 索引定义

`Index` 表示表索引。

**包路径**: `org.verydb.justdb.schema.Index`

**核心属性**:

| 属性 | 类型 | 描述 |
|------|------|------|
| `name` | String | 索引名 |
| `tableName` | String | 所属表名 |
| `columns` | List\<String\> | 索引列 |
| `unique` | Boolean | 是否唯一索引 |
| `type` | String | 索引类型 |
| `comment` | String | 索引注释 |
| `changeType` | ChangeType | 变更类型 |

**代码示例**:

```java
// 创建唯一索引
Index uniqueIndex = new Index();
uniqueIndex.setName("idx_username");
uniqueIndex.setTableName("users");
uniqueIndex.setColumns(Arrays.asList("username"));
uniqueIndex.setUnique(true);

// 创建复合索引
Index compositeIndex = new Index();
compositeIndex.setName("idx_email_status");
compositeIndex.setTableName("users");
compositeIndex.setColumns(Arrays.asList("email", "status"));
```

### Constraint - 约束定义

`Constraint` 表示表约束，包括主键、外键、唯一约束、检查约束等。

**包路径**: `org.verydb.justdb.schema.Constraint`

**核心属性**:

| 属性 | 类型 | 描述 |
|------|------|------|
| `name` | String | 约束名 |
| `tableName` | String | 所属表名 |
| `type` | ConstraintType | 约束类型 |
| `columns` | List\<String\> | 约束列 |
| `referencedTable` | String | 引用表（外键） |
| `referencedColumn` | String | 引用列（外键） |
| `checkExpression` | String | 检查表达式 |
| `changeType` | ChangeType | 变更类型 |

**约束类型**:

- `PRIMARY_KEY` - 主键约束
- `FOREIGN_KEY` - 外键约束
- `UNIQUE` - 唯一约束
- `CHECK` - 检查约束

**代码示例**:

```java
// 创建主键约束
Constraint pk = new Constraint();
pk.setName("pk_users_id");
pk.setTableName("users");
pk.setType(Constraint.ConstraintType.PRIMARY_KEY);
pk.setColumns(Arrays.asList("id"));

// 创建外键约束
Constraint fk = new Constraint();
fk.setName("fk_users_role");
fk.setTableName("users");
fk.setType(Constraint.ConstraintType.FOREIGN_KEY);
fk.setColumns(Arrays.asList("role_id"));
fk.setReferencedTable("roles");
fk.setReferencedColumn("id");

// 创建检查约束
Constraint check = new Constraint();
check.setName("chk_users_age");
check.setTableName("users");
check.setType(Constraint.ConstraintType.CHECK);
check.setCheckExpression("age >= 18");
```

### Sequence - 序列定义

`Sequence` 表示数据库序列。

**包路径**: `org.verydb.justdb.schema.Sequence`

**核心属性**:

| 属性 | 类型 | 描述 |
|------|------|------|
| `name` | String | 序列名 |
| `startWith` | Long | 起始值 |
| `incrementBy` | Long | 增量 |
| `minValue` | Long | 最小值 |
| `maxValue` | Long | 最大值 |
| `cycle` | Boolean | 是否循环 |
| `cache` | Long | 缓存大小 |
| `changeType` | ChangeType | 变更类型 |
| `formerNames` | List\<String\> | 旧名称列表 |

**代码示例**:

```java
// 创建序列
Sequence sequence = new Sequence();
sequence.setName("seq_user_id");
sequence.setStartWith(1L);
sequence.setIncrementBy(1L);
sequence.setMinValue(1L);
sequence.setMaxValue(999999999L);
sequence.setCycle(false);
```

## Schema 加载 API

### SchemaLoaderFactory

工厂类，用于从各种来源加载 Schema。

**包路径**: `org.verydb.justdb.util.schema.SchemaLoaderFactory`

**支持的位置协议**:

- `file://` 或空 - 文件系统
- `classpath:` 或 `resource:` - 类路径资源
- `http://` 或 `https://` - HTTP/HTTPS URL
- `project:` - 项目目录

**方法签名**:

```java
public static Loaded&lt;Justdb&gt; load(String location, JustdbManager manager)
public static List<Loaded&gt;<Justdb>> loadAll(String location, List&lt;String&gt; fileTypes, JustdbManager manager)
```

**代码示例**:

```java
JustdbManager manager = JustdbManager.getInstance();

// 从文件加载
Loaded&lt;Justdb&gt; result = SchemaLoaderFactory.load("schema.json", manager);
if (result.isSuccess()) {
    Justdb justdb = result.getData();
}

// 从类路径加载
Loaded&lt;Justdb&gt; result = SchemaLoaderFactory.load("classpath:schema.xml", manager);

// 从 HTTP 加载
Loaded&lt;Justdb&gt; result = SchemaLoaderFactory.load("https://example.com/schema.json", manager);

// 从目录加载所有 Schema
List<Loaded&gt;<Justdb>> results = SchemaLoaderFactory.loadAll("./schemas", null, manager);
```

### Loaded - 加载结果

封装 Schema 加载结果。

**包路径**: `org.verydb.justdb.cli.Loaded`

**方法**:

```java
public boolean isSuccess()        // 是否加载成功
public Justdb getData()           // 获取 Schema 数据
public String getLocation()       // 获取加载位置
public Exception getError()       // 获取错误信息
```

## SQL 生成 API

### DBGenerator

SQL 生成器，根据 Schema 生成数据库特定的 SQL。

**包路径**: `org.verydb.justdb.generator.DBGenerator`

**构造方法**:

```java
public DBGenerator(PluginManager pluginManager, String dbType)
```

**支持的方法**:

```java
// 表操作
public String generateCreateTable(Table table)
public String generateDropTable(Table table)
public String generateRenameTable(Table table)

// 列操作
public String generateAddColumn(Table table, Column column)
public String generateDropColumn(Table table, Column column)
public String generateModifyColumn(Table table, Column column)
public String generateRenameColumn(Table table, Column column)

// 索引操作
public String generateCreateIndex(Table table, Index index)
public String generateDropIndex(Table table, Index index)

// 约束操作
public String generateAddConstraint(Table table, Constraint constraint)
public String generateDropConstraint(Table table, Constraint constraint)

// 序列操作
public String generateCreateSequence(Sequence sequence)
public String generateDropSequence(Sequence sequence)
public String generateRenameSequence(Sequence sequence)
public String generateModifySequence(Sequence sequence)

// 视图操作
public String generateCreateView(View view)
public String generateDropView(View view)
```

**代码示例**:

```java
JustdbManager manager = JustdbManager.getInstance();
DBGenerator generator = new DBGenerator(manager.getPluginManager(), "mysql");

// 生成创建表的 SQL
Table table = ...; // 表定义
String createTableSql = generator.generateCreateTable(table);
System.out.println(createTableSql);

// 生成添加列的 SQL
Column column = ...; // 列定义
String addColumnSql = generator.generateAddColumn(table, column);
```

## 代码示例

### 完整 Schema 定义

```java
import org.verydb.justdb.schema.*;
import org.verydb.justdb.JustdbManager;
import org.verydb.justdb.generator.DBGenerator;
import java.util.Arrays;

public class SchemaExample {
    public static void main(String[] args) {
        // 创建 Schema
        Justdb justdb = new Justdb();
        justdb.setNamespace("com.example");
        justdb.setId("user-schema");

        // 创建用户表
        Table usersTable = createUsersTable();

        // 创建角色表
        Table rolesTable = createRolesTable();

        justdb.setTables(Arrays.asList(usersTable, rolesTable));

        // 生成 SQL
        JustdbManager manager = JustdbManager.getInstance();
        DBGenerator generator = new DBGenerator(manager.getPluginManager(), "mysql");

        for (Table table : justdb.getTables()) {
            String sql = generator.generateCreateTable(table);
            System.out.println(sql + ";\n");
        }
    }

    private static Table createUsersTable() {
        Table table = new Table("users");
        table.setComment("用户表");
        table.setEngine("InnoDB");
        table.setCharset("utf8mb4");

        // 列定义
        Column id = new Column();
        id.setName("id");
        id.setType("BIGINT");
        id.setPrimaryKey(true);
        id.setAutoIncrement(true);
        id.setComment("用户 ID");

        Column username = new Column();
        username.setName("username");
        username.setType("VARCHAR(50)");
        username.setNullable(false);
        username.setComment("用户名");

        Column email = new Column();
        email.setName("email");
        email.setType("VARCHAR(100)");
        email.setNullable(false);
        email.setComment("邮箱");

        Column roleId = new Column();
        roleId.setName("role_id");
        roleId.setType("BIGINT");
        roleId.setComment("角色 ID");

        Column createdAt = new Column();
        createdAt.setName("created_at");
        createdAt.setType("TIMESTAMP");
        createdAt.setDefaultValue("CURRENT_TIMESTAMP");
        createdAt.setComment("创建时间");

        table.setColumns(Arrays.asList(id, username, email, roleId, createdAt));

        // 索引定义
        Index idxUsername = new Index();
        idxUsername.setName("idx_username");
        idxUsername.setColumns(Arrays.asList("username"));
        idxUsername.setUnique(true);

        Index idxEmail = new Index();
        idxEmail.setName("idx_email");
        idxEmail.setColumns(Arrays.asList("email"));
        idxEmail.setUnique(true);

        table.setIndexes(Arrays.asList(idxUsername, idxEmail));

        // 外键约束
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
        table.setComment("角色表");
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

### 动态 Schema 构建

```java
import org.verydb.justdb.schema.*;
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
        idCol.put("comment", "主键");
        columns.add(idCol);

        Map&lt;String, , Object> nameCol = new HashMap<>();
        nameCol.put("name", "name");
        nameCol.put("type", "VARCHAR(100)");
        nameCol.put("nullable", false);
        nameCol.put("comment", "名称");
        columns.add(nameCol);

        Table table = buildTable("products", columns);

        // 生成 SQL
        JustdbManager manager = JustdbManager.getInstance();
        DBGenerator generator = new DBGenerator(manager.getPluginManager(), "mysql");
        System.out.println(generator.generateCreateTable(table));
    }
}
```

## 相关文档

- [Schema 加载器](./schema-loader.md) - Schema 加载详解
- [Schema 部署器](./schema-deployer.md) - Schema 部署详解
- [Schema 差异计算](./schema-diff.md) - Schema 差异计算详解
- [JDBC 驱动](./jdbc-driver.md) - JDBC 驱动使用指南
