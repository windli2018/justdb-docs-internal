---
title: API 参考概述
icon: 📚
description: JustDB 核心 API 概览、模块结构和快速导航
order: 1
---

# API 参考概述

JustDB 提供了丰富的 Java API，支持 Schema 定义、加载、部署、迁移和差异计算等核心功能。本文档提供了 API 的概览和快速导航。

## 核心模块

### 1. Schema 定义 API
定义数据库 Schema 的核心模型类。

- **[Justdb](./java-api.md)** - Schema 根容器
- **[Table](./java-api.md)** - 表定义
- **[Column](./java-api.md)** - 列定义
- **[Index](./java-api.md)** - 索引定义
- **[Constraint](./java-api.md)** - 约束定义
- **[Sequence](./java-api.md)** - 序列定义
- **[View](./java-api.md)** - 视图定义

### 2. 格式加载 API
从各种格式加载 Schema 定义。

- **SchemaLoaderFactory** - Schema 加载器工厂
- **ISchemaLoader** - Schema 加载器接口
- **SchemaLoadConfig** - 加载配置

### 3. 部署 API
将 Schema 部署到数据库。

- **[SchemaDeployer](./schema-deployer.md)** - Schema 部署器
- **SchemaMigrationService** - Schema 迁移服务

### 4. 迁移 API
计算和应用 Schema 差异。

- **[CanonicalSchemaDiff](./schema-diff.md)** - Schema 差异计算
- **ChangeType** - 变更类型枚举

### 5. JDBC 驱动
通过标准 JDBC 接口访问 JustDB。

- **[JustdbDriver](./jdbc-driver.md)** - JDBC 驱动实现
- **JustdbConnection** - JDBC 连接
- **JustdbStatement** - JDBC 语句
- **JustdbResultSet** - JDBC 结果集

## 快速开始

### 1. 定义 Schema

```java
// 创建 Schema
Justdb justdb = new Justdb();
justdb.setNamespace("com.example");

// 创建表
Table usersTable = new Table("users");
usersTable.setComment("用户表");

// 创建列
Column idColumn = new Column();
idColumn.setName("id");
idColumn.setType("BIGINT");
idColumn.setPrimaryKey(true);
idColumn.setAutoIncrement(true);

Column nameColumn = new Column();
nameColumn.setName("username");
nameColumn.setType("VARCHAR(50)");
nameColumn.setNullable(false);

usersTable.setColumns(Arrays.asList(idColumn, nameColumn));
justdb.setTables(Arrays.asList(usersTable));
```

### 2. 加载 Schema

```java
// 从文件加载
JustdbManager manager = JustdbManager.getInstance();
Loaded<Justdb> result = SchemaLoaderFactory.load("schema.json", manager);
Justdb justdb = result.getData();

// 从类路径加载
Loaded<Justdb> result = SchemaLoaderFactory.load("classpath:schema.xml", manager);
```

### 3. 部署 Schema

```java
// 创建部署器
Connection connection = DriverManager.getConnection("jdbc:mysql://localhost:3306/mydb");
SchemaDeployer deployer = new SchemaDeployer(connection);

// 部署 Schema
deployer.deploy(justdb);
```

### 4. 计算 Schema 差异

```java
// 计算差异
Justdb currentSchema = ...; // 当前 Schema
Justdb targetSchema = ...;  // 目标 Schema

CanonicalSchemaDiff diff = new CanonicalSchemaDiff(currentSchema, targetSchema);
diff.calculateAll();

// 获取变更
List<TableChange> tableChanges = diff.getTableChanges();
List<ColumnChange> columnChanges = diff.getColumnChanges();
```

### 5. 使用 JDBC 驱动

```java
// 注册驱动（自动注册）
// Class.forName("org.verydb.justdb.jdbc.JustdbDriver");

// 创建连接
Connection connection = DriverManager.getConnection(
    "jdbc:justdb:./schema.json"
);

// 使用标准 JDBC API
Statement stmt = connection.createStatement();
ResultSet rs = stmt.executeQuery("SELECT * FROM users");
```

## API 设计原则

### 1. 数据库无关性
所有数据库特定的逻辑都通过插件和模板系统实现，核心 API 保持数据库无关。

### 2. 双格式序列化
Schema 对象支持 XML 和 JSON/YAML/TOML 等多种格式的序列化和反序列化。

### 3. 扩展性
通过 `UnknownValues` 基类和插件系统，支持动态扩展属性和自定义行为。

### 4. 向后兼容
通过 `@JsonAlias` 注解支持多种命名格式，保持向后兼容性。

## 包结构

```
org.verydb.justdb/
├── schema/           # Schema 模型定义
│   ├── Justdb.java
│   ├── Table.java
│   ├── Column.java
│   ├── Item.java
│   └── ...
├── loader/           # Schema 加载器
│   ├── ISchemaLoader.java
│   └── SchemaLoaderFactory.java
├── generator/        # SQL 生成器
│   └── DBGenerator.java
├── jdbc/             # JDBC 驱动
│   ├── JustdbDriver.java
│   ├── JustdbConnection.java
│   └── ...
├── migration/        # Schema 迁移
│   ├── SchemaMigrationService.java
│   └── CanonicalSchemaDiff.java
└── plugin/           # 插件系统
    ├── JustdbPlugin.java
    └── PluginManager.java
```

## 相关文档

- [Java API 参考](./java-api.md) - 详细的 Java API 文档
- [JDBC 驱动参考](./jdbc-driver.md) - JDBC 驱动使用指南
- [Schema 加载器](./schema-loader.md) - Schema 加载详解
- [Schema 部署器](./schema-deployer.md) - Schema 部署详解
- [Schema 差异计算](./schema-diff.md) - Schema 差异计算详解

## 示例代码

更多示例代码请参考：

- [Schema 定义示例](../examples/)
- [CLI 命令参考](../cli/)
- [数据库支持](../database-support/)
