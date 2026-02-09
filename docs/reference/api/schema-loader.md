---
title: Schema 加载器
icon: 📥
description: SchemaLoader API 详细参考，支持多种格式和数据源的 Schema 加载
order: 4
---

# Schema 加载器

JustDB 提供了灵活的 Schema 加载器，支持从多种格式和数据源加载 Schema 定义。本文档详细介绍 Schema 加载器的使用方法。

## 目录

- [加载器概述](#加载器概述)
- [SchemaLoaderFactory](#schemaloaderfactory)
- [支持的格式](#支持的格式)
- [支持的数据源](#支持的数据源)
- [加载选项](#加载选项)
- [代码示例](#代码示例)

## 加载概述

Schema 加载器负责从各种来源读取并解析 Schema 定义。JustDB 提供了统一的加载接口，支持多种格式和数据源。

### 核心接口

**ISchemaLoader** - Schema 加载器接口

```java
public interface ISchemaLoader {
    boolean canLoad(String source);
    Justdb load(ExtensionPointRegistryView registry, String source, SchemaLoadConfig config) throws Exception;
    String[] getSupportedProtocols();
}
```

**SchemaLocation** - Schema 位置处理器（工厂模式使用）

```java
public interface SchemaLocation {
    boolean supports(String location);
    List&lt;Loaded<Justdb&gt;> load(String location, List&lt;String&gt; fileTypes, JustdbManager manager);
}
```

## SchemaLoaderFactory

工厂类，用于从各种位置加载 Schema。

**包路径**: `org.verydb.justdb.util.schema.SchemaLoaderFactory`

### 核心方法

#### load()

从指定位置加载单个 Schema。

```java
public static Loaded&lt;Justdb&gt; load(String location, JustdbManager manager)
```

**参数**:
- `location` - Schema 位置（文件路径、URL 等）
- `manager` - JustdbManager 实例

**返回**: `Loaded&lt;Justdb&gt;` - 封装加载结果

**示例**:

```java
JustdbManager manager = JustdbManager.getInstance();

// 从文件加载
Loaded&lt;Justdb&gt; result = SchemaLoaderFactory.load("schema.json", manager);
if (result.isSuccess()) {
    Justdb justdb = result.getData();
}
```

#### loadAll()

从指定位置加载多个 Schema（支持目录扫描）。

```java
public static List&lt;Loaded<Justdb&gt;> loadAll(String location, List&lt;String&gt; fileTypes, JustdbManager manager)
```

**参数**:
- `location` - Schema 位置
- `fileTypes` - 文件类型过滤（null 表示默认类型）
- `manager` - JustdbManager 实例

**返回**: `List&lt;Loaded<Justdb&gt;>` - 加载结果列表

**默认文件类型**: xml, json, yaml, yml, toml, sql

**示例**:

```java
// 加载目录中的所有 Schema
List&lt;Loaded<Justdb&gt;> results = SchemaLoaderFactory.loadAll("./schemas", null, manager);

// 只加载 JSON 文件
List&lt;Loaded<Justdb&gt;> results = SchemaLoaderFactory.loadAll(
    "./schemas",
    Arrays.asList("json"),
    manager
);
```

#### registerHandler()

注册自定义 Schema 位置处理器。

```java
public static void registerHandler(SchemaLocation handler)
```

#### getHandlers()

获取所有已注册的处理器。

```java
public static List&lt;SchemaLocation&gt; getHandlers()
```

## 支持的格式

JustDB 支持多种 Schema 定义格式，通过文件扩展名自动识别。

### JSON (.json)

```json
{
  "namespace": "com.example",
  "tables": [
    {
      "name": "users",
      "comment": "用户表",
      "columns": [
        {
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true,
          "autoIncrement": true
        },
        {
          "name": "username",
          "type": "VARCHAR(50)",
          "nullable": false
        }
      ]
    }
  ]
}
```

### XML (.xml)

```xml
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;Justdb namespace="com.example"&gt;
  &lt;Table name="users" comment="用户表"&gt;
    &lt;Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/&gt;
    &lt;Column name="username" type="VARCHAR(50)" nullable="false"/&gt;
  &lt;/Table&gt;
&lt;/Justdb&gt;
```

### YAML (.yaml, .yml)

```yaml
namespace: com.example
tables:
  - name: users
    comment: "用户表"
    columns:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
      - name: username
        type: VARCHAR(50)
        nullable: false
```

### TOML (.toml)

```toml
namespace = "com.example"

[[tables]]
name = "users"
comment = "用户表"

[[tables.columns]]
name = "id"
type = "BIGINT"
primaryKey = true
autoIncrement = true

[[tables.columns]]
name = "username"
type = "VARCHAR(50)"
nullable = false
```

## 支持的数据源

### 1. 文件系统

**协议**: `file://` 或空（默认）

**示例**:

```java
// 绝对路径
SchemaLoaderFactory.load("file:///path/to/schema.json", manager);

// 相对路径
SchemaLoaderFactory.load("./schema.json", manager);

// 无协议前缀
SchemaLoaderFactory.load("/path/to/schema.xml", manager);
```

### 2. 类路径资源

**协议**: `classpath:` 或 `resource:`

**示例**:

```java
// classpath 协议
SchemaLoaderFactory.load("classpath:schema.json", manager);

// resource 协议
SchemaLoaderFactory.load("resource:schema.xml", manager);
```

### 3. HTTP/HTTPS

**协议**: `http://` 或 `https://`

**示例**:

```java
SchemaLoaderFactory.load("https://example.com/schema.json", manager);
SchemaLoaderFactory.load("http://localhost:8080/schema.xml", manager);
```

### 4. 项目目录

**协议**: `project:`

**示例**:

```java
// 从项目根目录加载
SchemaLoaderFactory.load("project:schema.json", manager);
```

### 5. Git 仓库

**协议**: `git:`

**示例**:

```java
// 从 Git 仓库加载
SchemaLoaderFactory.load("git:https://github.com/user/repo.git:schema.json", manager);
```

### 6. Maven URL

**协议**: `mvn:`

**示例**:

```java
// 从 Maven 仓库加载
SchemaLoaderFactory.load("mvn:com.example:schemas:1.0.0:schema.json", manager);
```

### 7. 内存 Schema

通过 Schema 注册表使用内存中的 Schema。

**示例**:

```java
// 注册内存 Schema
JustdbDriver.registerSchema("my-schema", justdb);

// 通过 registry 协议访问
SchemaLoaderFactory.load("registry:my-schema", manager);
```

## 加载选项

### SchemaLoadConfig

配置 Schema 加载行为。

**包路径**: `org.verydb.justdb.util.SchemaLoadConfig`

**核心属性**:

| 属性 | 类型 | 描述 |
|------|------|------|
| `validate` | boolean | 是否验证 Schema |
| `resolveReferences` | boolean | 是否解析引用 |
| `processExtensions` | boolean | 是否处理扩展 |
| `failOnError` | boolean | 遇到错误是否失败 |

**示例**:

```java
SchemaLoadConfig config = new SchemaLoadConfig();
config.setValidate(true);
config.setResolveReferences(true);
config.setProcessExtensions(true);
config.setFailOnError(false);

ISchemaLoader loader = new ManagedSchemaLoader();
Justdb justdb = loader.load(registry, "schema.json", config);
```

### 加载结果

**Loaded\&lt;Justdb&gt;** - 封装加载结果

```java
public class Loaded&lt;T&gt; {
    public boolean isSuccess();        // 是否成功
    public T getData();               // 获取数据
    public String getLocation();       // 获取位置
    public Exception getError();       // 获取错误
    public String getErrorMessage();   // 获取错误消息
}
```

**使用示例**:

```java
Loaded&lt;Justdb&gt; result = SchemaLoaderFactory.load("schema.json", manager);

if (result.isSuccess()) {
    Justdb justdb = result.getData();
    System.out.println("Loaded from: " + result.getLocation());
} else {
    System.err.println("Failed to load: " + result.getErrorMessage());
    result.getError().printStackTrace();
}
```

## 代码示例

### 基本加载

```java
import org.verydb.justdb.JustdbManager;
import org.verydb.justdb.util.schema.SchemaLoaderFactory;
import org.verydb.justdb.cli.Loaded;
import org.verydb.justdb.schema.Justdb;

public class BasicLoading {
    public static void main(String[] args) {
        JustdbManager manager = JustdbManager.getInstance();

        // 从文件加载
        Loaded&lt;Justdb&gt; result = SchemaLoaderFactory.load("schema.json", manager);

        if (result.isSuccess()) {
            Justdb justdb = result.getData();
            System.out.println("Schema loaded successfully!");
            System.out.println("Tables: " + justdb.getTables().size());
        } else {
            System.err.println("Failed to load schema: " + result.getErrorMessage());
        }
    }
}
```

### 从多个来源加载

```java
import org.verydb.justdb.JustdbManager;
import org.verydb.justdb.util.schema.SchemaLoaderFactory;
import org.verydb.justdb.cli.Loaded;
import org.verydb.justdb.schema.Justdb;
import java.util.List;

public class MultiSourceLoading {
    public static void main(String[] args) {
        JustdbManager manager = JustdbManager.getInstance();

        // 从文件加载
        Loaded&lt;Justdb&gt; fileResult = SchemaLoaderFactory.load("./schema.json", manager);
        printResult("File", fileResult);

        // 从类路径加载
        Loaded&lt;Justdb&gt; classpathResult = SchemaLoaderFactory.load(
            "classpath:default-schema.xml",
            manager
        );
        printResult("Classpath", classpathResult);

        // 从 HTTP 加载
        Loaded&lt;Justdb&gt; httpResult = SchemaLoaderFactory.load(
            "https://example.com/schema.json",
            manager
        );
        printResult("HTTP", httpResult);
    }

    private static void printResult(String source, Loaded&lt;Justdb&gt; result) {
        if (result.isSuccess()) {
            Justdb justdb = result.getData();
            System.out.println(source + " loaded: " + justdb.getTables().size() + " tables");
        } else {
            System.err.println(source + " failed: " + result.getErrorMessage());
        }
    }
}
```

### 目录扫描

```java
import org.verydb.justdb.JustdbManager;
import org.verydb.justdb.util.schema.SchemaLoaderFactory;
import org.verydb.justdb.cli.Loaded;
import org.verydb.justdb.schema.Justdb;
import java.util.List;

public class DirectoryScan {
    public static void main(String[] args) {
        JustdbManager manager = JustdbManager.getInstance();

        // 扫描目录中的所有 Schema 文件
        List&lt;Loaded<Justdb&gt;> results = SchemaLoaderFactory.loadAll(
            "./schemas",
            null,  // 使用默认文件类型
            manager
        );

        System.out.println("Found " + results.size() + " schemas:");

        for (Loaded&lt;Justdb&gt; result : results) {
            if (result.isSuccess()) {
                Justdb justdb = result.getData();
                System.out.println("  - " + justdb.getId() + " (" +
                    justdb.getTables().size() + " tables)");
            }
        }
    }
}
```

### 自定义加载器

```java
import org.verydb.justdb.JustdbManager;
import org.verydb.justdb.util.schema.SchemaLocation;
import org.verydb.justdb.cli.Loaded;
import org.verydb.justdb.schema.Justdb;
import java.util.Collections;

public class CustomLoaderExample {
    public static void main(String[] args) {
        // 注册自定义加载器
        SchemaLocation customLoader = new SchemaLocation() {
            @Override
            public boolean supports(String location) {
                return location.startsWith("custom:");
            }

            @Override
            public List&lt;Loaded<Justdb&gt;> load(String location, List&lt;String&gt; fileTypes,
                                            JustdbManager manager) {
                // 自定义加载逻辑
                Justdb justdb = loadFromCustomSource(location);
                return Collections.singletonList(Loaded.success(location, justdb));
            }

            private Justdb loadFromCustomSource(String location) {
                // 实现自定义加载逻辑
                return new Justdb();
            }
        };

        // 注册加载器
        SchemaLoaderFactory.registerHandler(customLoader);

        // 使用自定义加载器
        JustdbManager manager = JustdbManager.getInstance();
        Loaded&lt;Justdb&gt; result = SchemaLoaderFactory.load("custom:my-schema", manager);

        if (result.isSuccess()) {
            System.out.println("Loaded using custom loader");
        }
    }
}
```

### 格式转换

```java
import org.verydb.justdb.JustdbManager;
import org.verydb.justdb.util.SchemaLoader;
import org.verydb.justdb.FormatFactory;
import org.verydb.justdb.schema.Justdb;
import java.io.FileOutputStream;

public class FormatConversion {
    public static void main(String[] args) throws Exception {
        JustdbManager manager = JustdbManager.getInstance();

        // 加载 XML 格式
        Justdb justdb = SchemaLoader.loadSchema("./schema.xml", manager);

        // 保存为 JSON 格式
        try (FileOutputStream fos = new FileOutputStream("./schema.json")) {
            FormatFactory.writeValueByExtension(
                manager.getExtensionPointRegistry(),
                fos,
                "schema.json",
                justdb
            );
        }

        // 保存为 YAML 格式
        try (FileOutputStream fos = new FileOutputStream("./schema.yaml")) {
            FormatFactory.writeValueByExtension(
                manager.getExtensionPointRegistry(),
                fos,
                "schema.yaml",
                justdb
            );
        }
    }
}
```

## 高级用法

### 引用解析

```java
import org.verydb.justdb.util.SchemaLoadConfig;

SchemaLoadConfig config = new SchemaLoadConfig();
config.setResolveReferences(true);

ISchemaLoader loader = new ManagedSchemaLoader();
Justdb justdb = loader.load(registry, "schema.json", config);
```

### 验证 Schema

```java
SchemaLoadConfig config = new SchemaLoadConfig();
config.setValidate(true);

// 验证会检查:
// - 必填字段
// - 数据类型
// - 引用完整性
// - 命名规范
```

### 增量加载

```java
// 加载基础 Schema
Loaded&lt;Justdb&gt; baseResult = SchemaLoaderFactory.load("base-schema.json", manager);
Justdb baseSchema = baseResult.getData();

// 加载扩展 Schema
Loaded&lt;Justdb&gt; extResult = SchemaLoaderFactory.load("extension-schema.json", manager);
Justdb extSchema = extResult.getData();

// 合并 Schema
baseSchema.getTables().addAll(extSchema.getTables());
```

## 相关文档

- [Java API 参考](./java-api.md) - 核心 Java API
- [Schema 部署器](./schema-deployer.md) - Schema 部署详解
- [Schema 差异计算](./schema-diff.md) - Schema 差异计算详解
- [JDBC 驱动](./jdbc-driver.md) - JDBC 驱动使用指南
