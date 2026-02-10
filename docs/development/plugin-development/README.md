---
icon: puzzle-piece
title: 插件开发概述
order: 1
category:
  - 插件开发
  - 开发指南
tag:
  - 插件
  - 扩展
  - 开发
---

# 插件开发概述

JustDB 的插件系统允许开发者扩展其功能，包括添加新数据库支持、自定义 SQL 模板、扩展点定义等。

## 什么是插件？

插件 (Plugin) 是一个包含以下扩展的打包单元：

```
JustdbPlugin
├── DatabaseAdapter[]     # 数据库适配器
├── GenericTemplate[]     # SQL/代码生成模板
├── ExtensionPoint[]      # 扩展点定义
├── TemplateHelper[]      # Handlebars 辅助函数
└── SchemaFormat[]        # Schema 序列化格式
```

## 插件类型

### 1. 内置插件

内置插件位于 `justdb-core/src/main/resources/default-plugins.xml`，自动加载：

- `sql-standard-root` - SQL 标准根插件
- `mysql` - MySQL 支持
- `postgresql` - PostgreSQL 支持
- `oracle` - Oracle 支持
- 等 20+ 数据库插件

### 2. 外部插件

外部插件通过 JAR 包提供，使用 Java ServiceLoader 发现：

```
META-INF/services/ai.justdb.justdb.plugin.JustdbPlugin
```

## 插件发现机制

### 加载顺序

1. **内置插件**: 从 `default-plugins.xml` 加载
2. **外部插件**: 通过 ServiceLoader 从 classpath 发现
3. **用户插件**: 从配置文件或编程方式注册

### 插件继承

插件可以继承其他插件的模板和配置：

```xml
<plugin id="mysql" dialect="mysql" ref-id="sql-standard-root">
    <!-- 继承 sql-standard-root 的模板 -->
</plugin>
```

## 开发场景

### 场景 1: 添加新数据库支持

为新数据库添加适配器、JDBC 驱动和 SQL 模板。

### 场景 2: 自定义 SQL 模板

覆盖默认模板，自定义 SQL 生成逻辑。

### 场景 3: 扩展 Schema 属性

添加数据库特有的表或列属性。

### 场景 4: 自定义序列化格式

支持新的 Schema 文件格式（如 HOCON、Properties）。

## 快速开始

### 创建插件项目

```bash
# 创建 Maven 项目
mvn archetype:generate -DgroupId=com.example \
    -DartifactId=justdb-myplugin \
    -DarchetypeArtifactId=maven-archetype-quickstart

cd justdb-myplugin
```

### 配置依赖

```xml
<dependencies>
    <dependency>
        <groupId>ai.justdb.justdb</groupId>
        <artifactId>justdb-core</artifactId>
        <version>1.0.0</version>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

### 实现插件类

```java
package com.example.justdb;

import ai.justdb.justdb.plugin.*;

public class MyDatabasePlugin extends JustdbPlugin {
    @Override
    public String getId() {
        return "my-database";
    }

    @Override
    public String getName() {
        return "My Database Plugin";
    }

    @Override
    public DatabaseAdapter[] getDatabaseAdapters() {
        return new DatabaseAdapter[] {
            createAdapter()
        };
    }

    private DatabaseAdapter createAdapter() {
        DatabaseAdapter adapter = new DatabaseAdapter();
        adapter.setDbType("mydb");
        adapter.setDriverClass("com.example.jdbc.Driver");
        adapter.setUrlPattern("jdbc:mydb://*");
        return adapter;
    }
}
```

### 注册插件

创建 `META-INF/services/ai.justdb.justdb.plugin.JustdbPlugin`：

```
com.example.justdb.MyDatabasePlugin
```

## 插件配置

### XML 方式

在 `default-plugins.xml` 或自定义插件文件中：

```xml
<plugin id="my-plugin" version="1.0.0" name="My Plugin">
    <adapters>
        <DatabaseAdapter dbType="mydb" driverClass="com.example.Driver">
            <urlPatterns>
                <UrlPattern>jdbc:mydb://*</urlPatterns>
            </urlPatterns>
        </DatabaseAdapter>
    </adapters>
    <templates>
        <template id="create-table" name="create-table" type="SQL" category="db">
            <content>CREATE TABLE {{name}} (...)</content>
        </template>
    </templates>
</plugin>
```

### 编程方式

```java
JustdbManager manager = JustdbManager.getInstance();

// 创建插件
JustdbPlugin plugin = new JustdbPlugin();
plugin.setId("my-plugin");

// 注册
manager.getPluginManager().registerPlugin(plugin);
```

## 下一步

- [数据库适配器开发](./database-adapter.md) - 添加新数据库支持
- [自定义模板](./custom-templates.md) - 创建 SQL 模板
- [扩展点开发](./extension-points.md) - 定义扩展属性
- [模板辅助函数](./template-helpers.md) - 编写 Handlebars 辅助函数
- [Schema 格式开发](./schema-formats.md) - 支持新文件格式
