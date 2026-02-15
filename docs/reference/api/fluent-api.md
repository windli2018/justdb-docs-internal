---
icon: code
title: Fluent API
order: 5
category:
  - 参考文档
  - API 参考
tag:
  - fluent-api
  - builder
  - dsl
---

# Fluent API

JustDB Fluent API 是一套 SQL 风格的流式 API，用于程序化构建 JustDB 数据库 Schema。该 API 提供类型安全的方法链式调用，支持定义表、列、索引和视图等数据库对象。

**包路径**: `ai.justdb.justdb.fluent`

## 设计目标

1. **SQL 风格语法**：提供接近 SQL DDL 的编程体验
2. **类型安全**：编译时类型检查，减少运行时错误
3. **方法链式调用**：流畅的 API 设计，支持连续操作
4. **向后兼容**：纯新增 API，不修改现有 Schema 类

## 入口类 Schema

提供静态工厂方法作为 API 入口点。

```java
import ai.justdb.justdb.fluent.Schema;
import ai.justdb.justdb.schema.Justdb;

// 创建命名 schema
Justdb justdb = Schema.create("mydb");

// 创建匿名 schema
Justdb justdb = Schema.create();
```

## SchemaBuilder

Schema 级别的构建器，用于设置 schema 属性和创建表、视图。

```java
Schema.create("myapp")
    .namespace("com.example.model")
    .comment("My application database")
    .table("users")
        .column("id").bigInt().primaryKey()
    .build();
```

**方法说明**：

| 方法 | 说明 |
|------|------|
| `namespace(String ns)` | 设置代码生成命名空间 |
| `comment(String comment)` | 设置 schema 注释 |
| `table(String tableName)` | 开始创建表 |
| `view(String viewName)` | 开始创建视图 |
| `build()` | 构建并返回 Justdb 对象 |

## TableBuilder

用于定义表结构，包括列、索引和约束。

```java
Schema.create("mydb")
    .table("users")
        .comment("用户表")
        .column("id").bigInt().primaryKey().autoIncrement()
        .column("username").varchar(50).notNull()
        .column("email").varchar(100).notNull()
        .index("idx_email").onColumn("email")
    .end()
    .build();
```

**方法说明**：

| 方法 | 说明 |
|------|------|
| `comment(String comment)` | 设置表/列注释（智能判断上下文） |
| `column(String columnName)` | 开始创建列 |
| `index(String indexName)` | 开始创建索引 |
| `primaryKey()` | 标记最后一列为 PK |
| `autoIncrement()` | 启用最后一列自增 |
| `notNull()` / `nullable()` | 设置最后一列可空性 |
| `defaultValue(String value)` | 设置最后一列默认值 |
| `unique()` / `unique(String name)` | 添加唯一约束 |
| `end()` | 结束表定义，返回 SchemaBuilder |
| `build()` | 构建并返回 Justdb 对象 |

## ColumnBuilder

提供完整的数据类型 DSL，用于定义列的数据类型。

### 整数类型

```java
.column("id").bigInt()          // BIGINT
.column("count").int_()         // INT
.column("status").smallInt()    // SMALLINT
.column("flag").tinyInt()       // TINYINT
.column("enabled").boolean_()   // BOOLEAN
```

### 字符串类型

```java
.column("name").varchar(255)    // VARCHAR(255)
.column("code").char_(10)       // CHAR(10)
.column("description").text()   // TEXT
```

### 数值类型

```java
.column("price").decimal(10, 2) // DECIMAL(10,2)
.column("rate").float_()         // FLOAT
.column("score").double_()      // DOUBLE
```

### 日期时间类型

```java
.column("created_at").timestamp() // TIMESTAMP
.column("birth_date").date()      // DATE
.column("event_time").time()      // TIME
```

### 二进制类型

```java
.column("data").blob(1024)        // BLOB(1024)
```

### 自定义类型

```java
.column("enum_col").type("ENUM('A','B','C')")
.column("json_col").type("JSON")
```

### 约束方法

约束方法可以在类型方法之前调用：

```java
.column("id")
    .primaryKey()
    .autoIncrement()
    .comment("用户ID")
    .bigInt()
```

## IndexBuilder

用于定义表索引。

```java
.table("users")
    .column("id").bigInt().primaryKey()
    .column("email").varchar(100).notNull()
    .column("username").varchar(50).notNull()
    // 单列索引
    .index("idx_email").onColumn("email")
    // 多列唯一索引
    .index("idx_user_name").on("email, username").unique()
.end()
```

**方法说明**：

| 方法 | 说明 |
|------|------|
| `on(String columnNames)` | 设置索引列（逗号分隔多列） |
| `onColumn(String columnName)` | 设置单列索引 |
| `unique()` | 标记为唯一索引 |
| `type(String type)` | 设置索引类型（BTREE, HASH, FULLTEXT, SPATIAL） |
| `comment(String comment)` | 设置索引注释 |
| `end()` | 结束索引定义，返回 SchemaBuilder |
| `build()` | 构建并返回 Justdb 对象 |

## ViewBuilder

用于定义数据库视图。

```java
Schema.create("mydb")
    .table("users")
        .column("id").bigInt().primaryKey()
        .column("username").varchar(50).notNull()
    .end()
    .view("active_users")
        .comment("活跃用户视图")
        .as("SELECT * FROM users WHERE deleted = 0")
    .build();
```

**方法说明**：

| 方法 | 说明 |
|------|------|
| `comment(String comment)` | 设置视图注释 |
| `as(String selectSql)` | 设置 SELECT 查询并添加到 schema |

## 使用示例

### 示例 1：基础表创建

```java
Justdb justdb = Schema.create("mydb")
    .table("users")
        .column("id").bigInt().primaryKey().autoIncrement()
        .column("username").varchar(50).notNull()
        .column("email").varchar(100).notNull()
        .column("created_at").timestamp().defaultValue("CURRENT_TIMESTAMP")
    .build();
```

### 示例 2：多表结构

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

### 示例 3：完整功能（表、索引、视图）

```java
Justdb justdb = Schema.create("blog_app")
    .namespace("com.example.model")
    .comment("博客应用数据库")
    .table("users")
        .comment("用户表")
        .column("id").bigInt().primaryKey().autoIncrement().comment("用户ID")
        .column("username").varchar(50).notNull()
        .column("email").varchar(100).notNull().unique("uk_email")
        .column("created_at").timestamp().defaultValue("CURRENT_TIMESTAMP")
        .index("idx_email").onColumn("email")
    .end()
    .table("posts")
        .comment("文章表")
        .column("id").bigInt().primaryKey().autoIncrement()
        .column("user_id").bigInt().notNull()
        .column("title").varchar(200).notNull()
        .column("content").text()
        .column("created_at").timestamp().defaultValue("CURRENT_TIMESTAMP")
    .end()
    .view("user_posts")
        .comment("用户文章视图")
        .as("SELECT u.id, u.username, p.title, p.created_at " +
            "FROM users u JOIN posts p ON u.id = p.user_id")
    .build();
```

### 示例 4：数据类型全覆盖

```java
Justdb justdb = Schema.create("types_demo")
    .table("data_types")
        // 整数类型
        .column("id").bigInt().primaryKey()
        .column("count").int_().defaultValue("0")
        .column("status").smallInt()
        .column("flag").boolean_()

        // 字符串类型
        .column("name").varchar(255).notNull()
        .column("description").text()
        .column("code").char_(10)

        // 数值类型
        .column("price").decimal(10, 2)
        .column("rate").float_()
        .column("score").double_()

        // 日期时间类型
        .column("created_at").timestamp().defaultValue("CURRENT_TIMESTAMP")
        .column("birth_date").date()
        .column("event_time").time()

        // 二进制类型
        .column("data").blob(1024)
    .build();
```

## API 流程图

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

## 与传统方式的对比

### 传统方式（XML 风格）

```java
Table table = new Table("users");
table.setComment("用户表");

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

### Fluent API 方式

```java
Justdb justdb = Schema.create("mydb")
    .table("users")
        .comment("用户表")
        .column("id").bigInt().primaryKey().autoIncrement()
        .column("username").varchar(50).notNull()
    .build();
```

## 设计模式

### 类型方法返回 TableBuilder

类型方法（`bigInt()`, `varchar()` 等）返回 `TableBuilder`，允许在设置类型后链式调用约束方法：

```java
.column("id").bigInt().primaryKey().autoIncrement()
```

这等同于：
```java
.column("id").primaryKey().autoIncrement().bigInt()
```

### IndexBuilder 延迟提交

`on()` 和 `onColumn()` 方法返回 `IndexBuilder`，允许继续配置索引属性：

```java
.index("idx_user_slug")
    .on("user_id, slug")
    .unique()      // 在 on() 之后调用
    .type("BTREE") // 在 on() 之后调用
.end()          // 显式结束索引，返回 SchemaBuilder
```

### end() 方法的行为

- `TableBuilder.end()` - 添加表到 schema，返回 `SchemaBuilder`
- `IndexBuilder.end()` - 添加索引到表，并调用 `TableBuilder.end()` 完成表
- `ViewBuilder.as()` - 添加视图到 schema，返回 `SchemaBuilder`

### build() 方法的级联

`IndexBuilder.build()` 会自动完成索引和表，然后构建 schema：

```java
.table("users")
    .column("id").bigInt().primaryKey()
    .index("idx_id").onColumn("id")
.build()  // 自动完成索引、表，然后构建 schema
```

## 命名规范

### 方法命名（camelCase）

- 类型方法使用 camelCase：`bigInt()`, `varchar()`, `decimal()`
- 约束方法使用 camelCase：`primaryKey()`, `autoIncrement()`, `notNull()`
- 避免与 Java 关键字冲突：`int_()`, `char_()`, `float_()`, `boolean_()`

### SQL 术语

- 使用 SQL 标准术语：`primaryKey()`, `autoIncrement()`, `notNull()`
- 索引用 `on()` 而非 `onColumns()`
- 视图用 `as()` 表示查询定义

## 向后兼容性

Fluent API 是纯新增功能，不影响现有代码：

- 不修改现有 Schema 类（`Justdb`, `Table`, `Column`, `View`, `Index`）
- 现有 XML/JSON/YAML Schema 文件继续工作
- 现有 `new Table()` / `new Column()` 方式继续工作
- Fluent API 创建的对象与传统方式创建的对象完全相同

## 扩展性

如需添加新数据类型，在 `ColumnBuilder` 中添加方法：

```java
public TableBuilder json() {
    column.setType("JSON");
    return finishColumn();
}
```

如需添加新的索引类型，在 `IndexBuilder` 中添加方法：

```java
public IndexBuilder fulltext() {
    index.setType("FULLTEXT");
    return this;
}
```

## 包结构

```
ai.justdb.justdb.fluent/
├── Schema.java           # 入口类
├── SchemaBuilder.java    # Schema 构建器
├── TableBuilder.java     # 表构建器（含列约束方法）
├── ColumnBuilder.java    # 列构建器（含类型 DSL）
├── IndexBuilder.java     # 索引构建器
├── ViewBuilder.java      # 视图构建器
└── package-info.java     # 包文档
```

## 测试覆盖

Fluent API 包含 21 个测试用例，覆盖：

1. 基础表创建
2. 多表结构
3. Schema 与视图
4. 所有整数类型
5. 字符串类型
6. 数值类型
7. 日期时间类型
8. 二进制类型
9. 自定义类型
10. 约束（primaryKey、notNull、nullable、defaultValue）
11. 列注释
12. 单列索引
13. 多列索引
14. 唯一索引
15. 多索引
16. 表注释
17. 匿名 Schema
18. 索引类型和注释
19. 完整 Schema
20. 数据类型全覆盖
21. 约束顺序
