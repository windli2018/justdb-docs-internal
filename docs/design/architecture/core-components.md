# JustDB Schema Extractor 架构说明

## 概述

JustDB Schema Extractor 是一个模块化、可扩展的数据库 schema 反向工程框架。

### 设计原则

1. **JDBC 通用优先** - 主要功能用标准 JDBC metadata API 实现
2. **SQL 模板扩展** - 数据库特定功能优先使用 SQL 模板
3. **小接口组合** - 功能拆分成多个小接口，独立可选
4. **无冲突设计** - 接口互不依赖，可以单独实现
5. **最小代码原则** - 只在 SQL 无法处理时编写 Java 代码

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    CompositeSchemaExtractor                │
│                     (组合式提取器)                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────────┐
        │         CapabilityRegistry              │
        │         (能力注册表)                      │
        │  - TableExtractor                      │
        │  - ColumnExtractor                     │
        │  - PrimaryKeyExtractor                 │
        │  - IndexExtractor                      │
        │  - ForeignKeyExtractor                 │
        │  - ViewExtractor                       │
        │  - VersionExtractor                    │
        │  - SequenceExtractor                   │
        └──────────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
    ┌───────────┐  ┌───────────┐  ┌───────────┐
    │   JDBC    │  │  SQL 模板  │  │ 自定义    │
    │   实现    │  │  提取器    │  │  实现    │
    └───────────┘  └───────────┘  └───────────┘
         通用          特定优化         完全控制
```

## 核心接口

### 1. TableExtractor - 表提取器

```java
public interface TableExtractor {
    List&lt;Table&gt; extractTables(Connection connection, ExtractConfig config) throws SQLException;
    default boolean supports(String dialect) { return true; }
}
```

### 2. ColumnExtractor - 列提取器

```java
public interface ColumnExtractor {
    List&lt;Column&gt; extractColumns(Connection connection, String tableName, String schema) throws SQLException;
    default boolean supports(String dialect) { return true; }
}
```

### 3. PrimaryKeyExtractor - 主键提取器

```java
public interface PrimaryKeyExtractor {
    interface PrimaryKeyColumn {
        String getColumnName();
        int getSequence();
        String getKeyName();
    }

    List&lt;PrimaryKeyColumn&gt; extractPrimaryKeys(Connection connection, String tableName, String schema) throws SQLException;
    default boolean supports(String dialect) { return true; }
}
```

### 4. IndexExtractor - 索引提取器

```java
public interface IndexExtractor {
    interface IndexInfo {
        String getIndexName();
        String getColumnName();
        boolean isUnique();
        int getSequence();
        String getIndexType();
        boolean isPrimary();
    }

    List&lt;IndexInfo&gt; extractIndexes(Connection connection, String tableName, String schema) throws SQLException;
    default boolean supports(String dialect) { return true; }
}
```

### 5. ForeignKeyExtractor - 外键提取器

```java
public interface ForeignKeyExtractor {
    interface ForeignKey {
        String getFkName();
        String getColumn();
        String getReferencedTable();
        String getReferencedColumn();
        int getSequence();
    }

    List&lt;ForeignKey&gt; extractForeignKeys(Connection connection, String tableName, String schema) throws SQLException;
    default boolean supports(String dialect) { return true; }
}
```

### 6. ViewExtractor - 视图提取器

```java
public interface ViewExtractor {
    List&lt;View&gt; extractViews(Connection connection, String schema) throws SQLException;
    String getViewDefinition(Connection connection, String viewName, String schema) throws SQLException;
    default boolean supports(String dialect) { return true; }
}
```

### 7. VersionExtractor - 版本提取器

```java
public interface VersionExtractor {
    String getVersion(Connection connection) throws SQLException;
    int getMajorVersion(Connection connection) throws SQLException;
    int getMinorVersion(Connection connection) throws SQLException;
    default boolean supports(String dialect) { return true; }
}
```

### 8. SequenceExtractor - 序列提取器

```java
public interface SequenceExtractor {
    interface Sequence {
        String getSequenceName();
        String getSchema();
        Long getStartValue();
        Long getIncrement();
        Long getCurrentValue();
        Long getMinValue();
        Long getMaxValue();
        Boolean isCycle();
    }

    List&lt;Sequence&gt; extractSequences(Connection connection, String schema) throws SQLException;
    default boolean supports(String dialect) {
        return !"mysql".equals(dialect) && !"tidb".equals(dialect);
    }
}
```

## 使用方式

### 方式 1: 使用内置 JDBC 实现（默认）

```java
// 直接使用 CompositeSchemaExtractor
SchemaExtractorStrategy extractor = new CompositeSchemaExtractor();
Justdb schema = extractor.extractSchema(connection, config);
```

### 方式 2: 注册 SQL 模板实现

在 `META-INF/justdb/mydb-extractors.xml` 中定义：

```xml
&lt;plugins&gt;
  &lt;plugin id="mydb-extractors"&gt;
    &lt;extractors&gt;
      &lt;extractor id="extract-tables" dialect="mydb"&gt;
        &lt;sql&gt;
          SELECT table_name, table_schema
          FROM information_schema.tables
          WHERE table_type = 'BASE TABLE'
        &lt;/sql&gt;
      &lt;/extractor&gt;
    &lt;/extractors&gt;
  &lt;/plugin&gt;
&lt;/plugins&gt;
```

### 方式 3: 实现单个接口

```java
public class MyIndexExtractor implements IndexExtractor {
    @Override
    public List&lt;IndexInfo&gt; extractIndexes(Connection conn, String table, String schema) {
        // 使用 SQL 模板或直接查询
    }

    @Override
    public boolean supports(String dialect) {
        return "mydb".equals(dialect);
    }
}

// 注册
CapabilityRegistry.getInstance().register(
    IndexExtractor.class,
    new MyIndexExtractor(),
    "mydb",
    10  // 高优先级
);
```

### 方式 4: 实现所有接口（推荐用于新数据库）

```java
public class MyDatabaseExtractor implements
    TableExtractor,
    ColumnExtractor,
    PrimaryKeyExtractor,
    IndexExtractor,
    ForeignKeyExtractor,
    ViewExtractor,
    VersionExtractor {

    // 实现所有方法...

    public static void register(String dialect) {
        MyDatabaseExtractor extractor = new MyDatabaseExtractor();
        CapabilityRegistry registry = CapabilityRegistry.getInstance();
        registry.register(TableExtractor.class, extractor, dialect, 10);
        registry.register(ColumnExtractor.class, extractor, dialect, 10);
        // ... 注册其他接口
    }
}

// 使用
MyDatabaseExtractor.register("mydb");
```

## SQL 模板配置

### 模板查找顺序

系统按以下顺序查找 SQL 模板：

1. `{dialect}-{templateId}-extractor` - 方言特定
2. `{templateId}-extractor` - 通用提取器模板
3. `{dialect}-{templateId}` - 方言模板
4. `{templateId}` - 通用模板

### 模板参数绑定

```xml
&lt;extractor id="extract-columns" dialect="postgresql"&gt;
  &lt;sql&gt;
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = {{tableName}}
      {{#if schema}}AND table_schema = {{schema}}{{/if}}
    ORDER BY ordinal_position
  &lt;/sql&gt;
&lt;/extractor&gt;
```

调用时传入参数：

```java
Map&lt;String, Object&gt; bindings = new HashMap&lt;&gt;();
bindings.put("tableName", "users");
bindings.put("schema", "public");

List&lt;Map&lt;String, Object&gt;&gt; results = extractor.queryForMaps(conn, "extract-columns", bindings);
```

## 支持的数据库

### 已支持的数据库（通过 JDBC metadata）

- MySQL / MariaDB / TiDB
- PostgreSQL
- Oracle
- SQL Server
- H2
- Derby
- HSQLDB
- DB2
- 等等...

### 数据库特定优化

可通过 SQL 模板为特定数据库优化性能：

| 数据库 | 系统表/视图 |
|--------|-----------|
| MySQL | `information_schema.TABLES`, `information_schema.COLUMNS` |
| PostgreSQL | `information_schema.tables`, `pg_indexes`, `pg_class` |
| Oracle | `all_tables`, `all_tab_columns`, `all_indexes`, `all_constraints` |
| SQL Server | `sys.tables`, `sys.columns`, `sys.indexes`, `sys.foreign_keys` |

## 扩展点

### 1. 添加新的提取器接口

```java
public interface TriggerExtractor {
    interface Trigger {
        String getName();
        String getEvent();
        String getTiming();
        String getBody();
    }

    List&lt;Trigger&gt; extractTriggers(Connection connection, String tableName, String schema) throws SQLException;
    default boolean supports(String dialect) { return true; }
}

// 注册到 CapabilityRegistry
CapabilityRegistry.getInstance().register(TriggerExtractor.class, new JdbcTriggerExtractor());
```

### 2. 覆盖默认实现

```java
// 注册更高优先级的实现，覆盖默认的 JDBC 实现
CapabilityRegistry.getInstance().register(
    ColumnExtractor.class,
    new MyColumnExtractor(),
    "mysql",
    100  // 高优先级，覆盖默认 (priority=0)
);
```

### 3. 条件支持

```java
public class SequenceExtractorImpl implements SequenceExtractor {
    @Override
    public boolean supports(String dialect) {
        // MySQL/TiDB 不支持序列
        return !"mysql".equals(dialect) && !"tidb".equals(dialect);
    }
}
```

## 完整示例

### PostgreSQL 支持

```java
// 1. 创建 SQL 模板配置文件 postgres-extractors.xml
// 2. 放在 META-INF/justdb/ 目录

// 3. 或者使用 AllInOneExtractor 模式
public class PostgresExtractor extends AllInOneExtractor {
    public PostgresExtractor() {
        super("postgresql");
    }

    @Override
    public String getVersion(Connection conn) throws SQLException {
        try (Statement stmt = conn.createStatement()) {
            ResultSet rs = stmt.executeQuery("SELECT version()");
            if (rs.next()) {
                return rs.getString(1);
            }
        }
        return null;
    }

    @Override
    public boolean supports(String dialect) {
        return "postgresql".equals(dialect) || "redshift".equals(dialect);
    }
}

// 注册
PostgresExtractor extractor = new PostgresExtractor();
CapabilityRegistry registry = CapabilityRegistry.getInstance();
registry.register(TableExtractor.class, extractor, "postgresql", 10);
registry.register(ColumnExtractor.class, extractor, "postgresql", 10);
// ... 其他接口
```

## 配置加载

PluginManager 会自动加载：

1. `META-INF/justdb/*.xml` - 来自所有 JAR 包
2. `justdb/*.xml` - 项目根目录
3. 用户指定的配置文件

## 性能考虑

1. **JDBC metadata** - 通用但可能较慢，适合大多数场景
2. **SQL 模板** - 可优化为单次查询获取多表信息
3. **缓存** - TypeRegistry 使用缓存提高类型解析性能
4. **批量处理** - 可以扩展支持批量提取多表信息

## 总结

这个架构提供了：

1. **灵活的扩展方式** - SQL 模板 > 小接口 > 全部实现
2. **最小化代码** - 大多数情况只需 SQL 模板
3. **无冲突** - 接口独立，按需实现
4. **向后兼容** - JDBC metadata 作为默认实现
5. **用户友好** - 可以在一个类中实现所有接口
