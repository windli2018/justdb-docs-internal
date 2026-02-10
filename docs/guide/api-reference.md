---
icon: code
date: 2024-01-01
title: API 参考
order: 16
category:
  - 指南
  - API
tag:
  - API
  - Java
  - 参考
---

# API 参考

JustDB 核心 API 的完整参考文档。

## 核心 API

### FormatFactory

Schema 格式工厂，用于加载和保存 Schema。

#### 加载 Schema

```java
import org.verydb.justdb.FormatFactory;

// 从文件加载
Justdb schema = FormatFactory.loadFromFile("schema.yaml");

// 从 URL 加载
Justdb schema = FormatFactory.loadFromURL(new URL("http://example.com/schema.yaml"));

// 从字符串加载
Justdb schema = FormatFactory.loadFromString("""
    id: myapp
    Table:
      - name: users
        Column:
          - name: id
            type: BIGINT
""");

// 从输入流加载
try (InputStream is = new FileInputStream("schema.json")) {
    Justdb schema = FormatFactory.loadFromStream(is, "json");
}
```

#### 保存 Schema

```java
// 保存到文件
FormatFactory.saveToFile(schema, "output.yaml");

// 保存为不同格式
FormatFactory.saveToFile(schema, "output.json");
FormatFactory.saveToFile(schema, "output.xml");

// 保存到字符串
String yaml = FormatFactory.saveToString(schema, "yaml");
String json = FormatFactory.saveToString(schema, "json");
```

### SchemaDeployer

Schema 部署器，用于将 Schema 部署到数据库。

#### 基本部署

```java
import org.verydb.justdb.SchemaDeployer;
import java.sql.Connection;

try (Connection conn = DriverManager.getConnection(url, user, pass)) {
    Justdb schema = FormatFactory.loadFromFile("schema.yaml");

    SchemaDeployer deployer = new SchemaDeployer(conn);
    deployer.deploy(schema);
}
```

#### 部署选项

```java
SchemaDeployer deployer = new SchemaDeployer(conn);

// 幂等模式
deployer.setIdempotent(true);

// 安全删除
deployer.setSafeDrop(true);

// 干运行
deployer.setDryRun(true);

// 执行部署
deployer.deploy(schema);
```

### SchemaMigrationService

Schema 迁移服务，用于增量迁移。

#### 基本迁移

```java
import org.verydb.justdb.SchemaMigrationService;

try (Connection conn = DriverManager.getConnection(url, user, pass)) {
    SchemaMigrationService service = new SchemaMigrationService(conn);

    // 执行迁移
    MigrationResult result = service.migrate(schema);

    if (result.isSuccess()) {
        System.out.println("Migration completed");
    }
}
```

#### 迁移配置

```java
SchemaMigrationService service = new SchemaMigrationService(conn);

// 自动差异计算
service.setAutoDiff(true);

// 幂等模式
service.setIdempotent(true);

// 安全删除
service.setSafeDrop(false);

// 设置基线
service.setBaselineOnMigrate(true);
```

### DBGenerator

数据库 SQL 生成器。

#### 生成 SQL

```java
import org.verydb.justdb.generator.DBGenerator;

// 创建生成器
DBGenerator generator = new DBGenerator(
    PluginManager.getInstance(),
    "mysql"
);

// 生成创建表 SQL
String sql = generator.generateCreateTable(table);

// 生成删除表 SQL
String sql = generator.generateDropTable(table);

// 生成修改表 SQL
String sql = generator.generateAlterTable(table, diff);
```

#### 批量生成

```java
// 生成所有 SQL
List&lt;String&gt; sqlList = generator.generateAll(schema);

// 生成指定类型 SQL
List&lt;String&gt; createSQL = generator.generateCreates(schema);
List&lt;String&gt; dropSQL = generator.generateDrops(schema);
```

## Schema 模型

### Justdb

Schema 根对象。

```java
Justdb schema = new Justdb();
schema.setId("myapp");
schema.setNamespace("com.example");

// 添加表
Table table = new Table();
table.setName("users");
schema.addTable(table);
```

### Table

表定义。

```java
Table table = new Table();
table.setName("users");
table.setComment("用户表");

// 添加列
Column column = new Column();
column.setName("id");
column.setType("BIGINT");
table.addColumn(column);

// 添加索引
Index index = new Index();
index.setName("idx_username");
index.setColumns(Arrays.asList("username"));
table.addIndex(index);

// 添加约束
Constraint constraint = new Constraint();
constraint.setName("fk_orders_user");
constraint.setType(ConstraintType.FOREIGN_KEY);
table.addConstraint(constraint);
```

### Column

列定义。

```java
Column column = new Column();
column.setName("username");
column.setType("VARCHAR(50)");
column.setNullable(false);
column.setDefaultValue("guest");
column.setComment("用户名");

// 主键
column.setPrimaryKey(true);
column.setAutoIncrement(true);

// 唯一约束
column.setUnique(true);
```

### Index

索引定义。

```java
Index index = new Index();
index.setName("idx_email");
index.setColumns(Arrays.asList("email"));
index.setUnique(true);
index.setType("BTREE");
index.setComment("邮箱唯一索引");
```

### Constraint

约束定义。

```java
Constraint constraint = new Constraint();
constraint.setName("fk_orders_user");
constraint.setType(ConstraintType.FOREIGN_KEY);
constraint.setReferencedTable("users");
constraint.setReferencedColumn("id");
constraint.setForeignKey("user_id");
constraint.setOnDelete(ConstraintAction.CASCADE);
constraint.setOnUpdate(ConstraintAction.RESTRICT);
```

## 差异计算

### CanonicalSchemaDiff

Schema 差异对象。

```java
import org.verydb.justdb.diff.CanonicalSchemaDiff;

// 计算差异
CanonicalSchemaDiff diff = SchemaDiffer.calculate(
    currentSchema,
    targetSchema
);

// 检查变更类型
for (TableDiff tableDiff : diff.getTableDiffs()) {
    ChangeType changeType = tableDiff.getChangeType();
    switch (changeType) {
        case ADDED:
            // 新增表
            break;
        case REMOVED:
            // 删除表
            break;
        case MODIFIED:
            // 修改表
            break;
        case RENAMED:
            // 重命名表
            break;
    }
}
```

### SchemaEvolutionManager

Schema 演进管理器。

```java
import org.verydb.justdb.migration.SchemaEvolutionManager;

SchemaEvolutionManager manager = new SchemaEvolutionManager(conn);

// 检测重命名
manager.setRenameDetectionEnabled(true);

// 处理演进
manager.evolve(currentSchema, targetSchema);
```

## 插件系统

### PluginManager

插件管理器。

```java
import org.verydb.justdb.plugin.PluginManager;

// 获取实例
PluginManager pluginManager = PluginManager.getInstance();

// 加载插件
pluginManager.loadPlugins();

// 获取数据库适配器
DatabaseAdapter adapter = pluginManager.getDatabaseAdapter("mysql");

// 获取模板
GenericTemplate template = pluginManager.getTemplate("create-table", "mysql");
```

### DatabaseAdapter

数据库适配器。

```java
// 获取适配器
DatabaseAdapter adapter = pluginManager.getDatabaseAdapter("mysql");

// 获取类型映射
TypeMapping typeMapping = adapter.getTypeMapping();
String sqlType = typeMapping.getSQLType("BIGINT");

// 获取 URL 模式
String urlPattern = adapter.getUrlPattern();

// 获取驱动类
String driverClass = adapter.getDriverClass();
```

## JDBC 驱动

### JustDB 驱动

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.sql.ResultSet;

// 使用 JustDB JDBC 驱动
try (Connection conn = DriverManager.getConnection(
        "jdbc:justdb:schema.yaml",
        null,
        null)) {

    // 执行查询
    try (Statement stmt = conn.createStatement();
         ResultSet rs = stmt.executeQuery("SELECT * FROM users")) {

        while (rs.next()) {
            String username = rs.getString("username");
            System.out.println(username);
        }
    }
}
```

### 连接 URL

```java
// Schema 文件
String url = "jdbc:justdb:schema.yaml";

// 多个 Schema 文件
String url = "jdbc:justdb:schema1.yaml,schema2.yaml";

// 指定目录
String url = "jdbc:justdb:./justdb/";

// 使用配置文件
String url = "jdbc:justdb:?config=justdb-config.yaml";
```

## 使用示例

### 完整示例

```java
import org.verydb.justdb.*;
import org.verydb.justdb.migration.*;
import org.verydb.justdb.generator.*;
import java.sql.Connection;
import java.sql.DriverManager;

public class JustdbExample {

    public static void main(String[] args) throws Exception {
        // 1. 加载 Schema
        Justdb schema = FormatFactory.loadFromFile("schema.yaml");

        // 2. 连接数据库
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/myapp",
                "root",
                "password")) {

            // 3. 创建迁移服务
            SchemaMigrationService service = new SchemaMigrationService(conn);

            // 4. 配置迁移
            service.setAutoDiff(true);
            service.setIdempotent(true);
            service.setSafeDrop(false);

            // 5. 执行迁移
            MigrationResult result = service.migrate(schema);

            // 6. 检查结果
            if (result.isSuccess()) {
                System.out.println("Migration completed successfully");
                System.out.println("Applied changes: " + result.getAppliedChanges());
            } else {
                System.err.println("Migration failed: " + result.getError());
            }
        }
    }
}
```

### Spring Boot 集成

```java
import org.verydb.justdb.spring.JustdbProperties;
import org.verydb.justdb.spring.SchemaMigrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class Application {

    @Autowired
    private JustdbProperties properties;

    @Autowired
    private SchemaMigrationService migrationService;

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Bean
    public CommandLineRunner runner() {
        return args -> {
            if (properties.isMigrateOnStartup()) {
                migrationService.migrate();
            }
        };
    }
}
```

## JavaDoc 链接

详细的 API 文档请参考：

- **[在线 JavaDoc](https://verydb.github.io/justdb/apidocs/)**
- **[核心 API](https://verydb.github.io/justdb/apidocs/org/verydb/justdb/core/package-summary.html)**
- **[生成器 API](https://verydb.github.io/justdb/apidocs/org/verydb/justdb/generator/package-summary.html)**
- **[迁移 API](https://verydb.github.io/justdb/apidocs/org/verydb/justdb/migration/package-summary.html)**

## 错误处理

### 异常类型

```java
try {
    schema = FormatFactory.loadFromFile("schema.yaml");
} catch (SchemaParseException e) {
    // Schema 解析错误
    System.err.println("Schema parse error: " + e.getMessage());
} catch (FileNotFoundException e) {
    // 文件未找到
    System.err.println("File not found: " + e.getMessage());
} catch (IOException e) {
    // IO 错误
    System.err.println("IO error: " + e.getMessage());
}

try {
    deployer.deploy(schema);
} catch (MigrationException e) {
    // 迁移错误
    System.err.println("Migration error: " + e.getMessage());
} catch (SQLException e) {
    // SQL 错误
    System.err.println("SQL error: " + e.getMessage());
}
```

### 错误处理示例

```java
public class SafeMigration {

    public void migrateSafely(String schemaFile, Connection conn) {
        try {
            // 1. 加载 Schema
            Justdb schema = FormatFactory.loadFromFile(schemaFile);

            // 2. 验证 Schema
            SchemaValidator validator = new SchemaValidator();
            ValidationResult result = validator.validate(schema);

            if (!result.isValid()) {
                System.err.println("Schema validation failed:");
                for (String error : result.getErrors()) {
                    System.err.println("  - " + error);
                }
                return;
            }

            // 3. 预览变更
            SchemaMigrationService service = new SchemaMigrationService(conn);
            service.setDryRun(true);
            service.migrate(schema);

            // 4. 确认后执行
            System.out.print("Execute migration? (yes/no): ");
            Scanner scanner = new Scanner(System.in);
            if (scanner.nextLine().equalsIgnoreCase("yes")) {
                service.setDryRun(false);
                MigrationResult result = service.migrate(schema);

                if (result.isSuccess()) {
                    System.out.println("Migration completed successfully");
                } else {
                    System.err.println("Migration failed: " + result.getError());
                }
            }

        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
```

## 下一步

<VPCard
  title="CLI 参考"
  desc="命令行界面完整参考"
  link="/guide/cli-reference.html"
/>

<VPCard
  title="配置参考"
  desc="完整的配置选项"
  link="/guide/config-reference.html"
/>

<VPCard
  title="Spring Boot 集成"
  desc="在 Spring Boot 中使用 JustDB"
  link="/guide/spring-boot.html"
/>
