---
icon: file-code
title: HCL 格式支持
order: 9
category:
  - 参考文档
  - 格式支持
tag:
  - hcl
  - atlas
  - terraform
---

# HCL 格式支持

JustDB 支持 HCL (HashiCorp Configuration Language) 格式的 Schema 定义，特别是导入 Atlas 数据库描述的能力。

## 概述

HCL 是 HashiCorp 开发的配置语言，被 Terraform、Vault、Consul 等工具广泛使用。Atlas 使用 HCL 格式来定义数据库 Schema。

### 支持范围

**Phase 1 (MVP)**:
- 读取 Atlas HCL schema 文件
- 支持 Table, Column, Index, PrimaryKey, ForeignKey
- 基本类型映射

**Phase 2 (Future)**:
- 支持 View, Trigger, Sequence
- 支持 Check constraints
- 数据库特定特性

## 依赖

```xml
<dependency>
    <groupId>com.bertramlabs.plugins</groupId>
    <artifactId>hcl4j</artifactId>
    <version>0.9.8</version>
</dependency>
```

## 文件扩展名

JustDB 识别以下 HCL 文件扩展名：

| 扩展名 | 说明 |
|--------|------|
| `.hcl` | 通用 HCL 文件 |
| `.my.hcl` | MySQL 特定 HCL |
| `.pg.hcl` | PostgreSQL 特定 HCL |

## Atlas HCL 到 JustDB 映射

### Schema 结构映射

```
Atlas HCL                    →  JustDB
─────────────────────────────────────────
schema "name" {}             →  SchemaSense (schema/catalog)
table "name" {}              →  Table
column "name" {}             →  Column
index "name" {}              →  Index
primary_key {}               →  Constraint (primaryKey)
foreign_key "name" {}        →  Constraint (foreignKey)
```

### 类型映射

| Atlas HCL 类型 | JustDB 类型 | 说明 |
|----------------|-------------|------|
| `varchar(n)` | `VARCHAR(n)` | 字符串类型 |
| `text` | `TEXT` | 文本类型 |
| `int` | `INTEGER` | 整数类型 |
| `bigint` | `BIGINT` | 长整数类型 |
| `smallint` | `SMALLINT` | 短整数类型 |
| `tinyint` | `TINYINT` | 微整数类型 |
| `boolean`/`bool` | `BOOLEAN` | 布尔类型 |
| `decimal(p,s)` | `DECIMAL(p,s)` | 十进制类型 |
| `float(p)` | `FLOAT(p)` | 浮点类型 |
| `double` | `DOUBLE` | 双精度类型 |
| `date` | `DATE` | 日期类型 |
| `time(p)` | `TIME(p)` | 时间类型 |
| `datetime(p)` | `DATETIME(p)` | 日期时间类型 |
| `timestamp(p)` | `TIMESTAMP(p)` | 时间戳类型 |
| `json` | `JSON` | JSON 类型 |
| `jsonb` | `JSONB` | PostgreSQL JSON 类型 |
| `uuid` | `UUID` | UUID 类型 |
| `binary(n)` | `BINARY(n)` | 二进制类型 |
| `blob` | `BLOB` | Blob 类型 |

### 属性映射

| Atlas HCL | JustDB | 说明 |
|-----------|--------|------|
| `null = true/false` | `nullable` | 列可空性 |
| `default = "value"` | `defaultValue` | 默认值 |
| `comment = "text"` | `comment` | 注释 |
| `unique = true` | Index unique flag | 唯一索引 |
| `auto_increment = true` | `autoIncrement` | 自增 |
| `unsigned = true` | `unsigned` | 无符号整数 |
| `charset = "utf8mb4"` | `charset` | 字符集 |
| `collate = "..."` | `collate` | 排序规则 |
| `engine = "InnoDB"` | Extension attribute | 表引擎 |

## 示例

### MySQL Schema

```hcl
schema "mydb" {
  charset = "utf8mb4"
  collate = "utf8mb4_unicode_ci"
}

table "users" {
  schema = schema.mydb
  column "id" {
    type = bigint
    auto_increment = true
    null = false
  }
  column "email" {
    type = varchar(255)
    null = false
  }
  column "name" {
    type = varchar(100)
    null = true
    default = "Anonymous"
  }
  column "created_at" {
    type = timestamp
    null = false
    default = sql("CURRENT_TIMESTAMP")
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_email" {
    columns = [column.email]
    unique = true
  }
}

table "posts" {
  schema = schema.mydb
  column "id" {
    type = bigint
    auto_increment = true
    null = false
  }
  column "user_id" {
    type = bigint
    null = false
  }
  column "title" {
    type = varchar(255)
    null = false
  }
  column "content" {
    type = text
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "fk_user" {
    columns = [column.user_id]
    ref_columns = [table.users.column.id]
    on_delete = CASCADE
  }
}
```

### PostgreSQL Schema

```hcl
schema "public" {
}

table "users" {
  schema = schema.public
  column "id" {
    type = integer
    null = false
  }
  column "email" {
    type = varchar(255)
    null = false
  }
  column "status" {
    type = enum.user_status
    null = false
    default = "active"
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_email" {
    type = HASH
    columns = [column.email]
    unique = true
  }
}

enum "user_status" {
  schema = schema.public
  values = ["active", "inactive", "suspended"]
}
```

## 引用语法解析

Atlas 使用引用语法需要特殊处理：

```hcl
table "posts" {
  foreign_key "user_fk" {
    columns = [column.user_id]
    ref_columns = [table.users.column.id]  # ← 引用
  }
}
```

**解析策略**:

1. **第一遍**：收集所有表和列定义
2. **第二遍**：解析引用并构建关系

## Java API

### 加载 HCL 文件

```java
import ai.justdb.justdb.hcl.HclSchemaLoader;

// 创建加载器
HclSchemaLoader loader = new HclSchemaLoader(justdbManager);

// 检查是否支持
if (loader.canLoad("schema.hcl")) {
    // 加载 Schema
    Justdb justdb = loader.load("schema.hcl", new SchemaLoadConfig());
}
```

### 转换器使用

```java
import ai.justdb.justdb.hcl.converter.AtlasToJustdbConverter;

// 创建转换器
AtlasToJustdbConverter converter = new AtlasToJustdbConverter(justdbManager);

// 转换 HCL Schema
Justdb justdb = converter.convert(hclSchema);
```

## 解析器选择

### 可用的解析器

| 解析器 | 优先级 | 说明 |
|--------|--------|------|
| SimpleHclParser | 8 | 推荐：支持函数式类型如 `varchar(255)` |
| AscopesHclParser | 6 | 需要 Java 17+ |
| BertramlabsHclParser | 5 | 有限支持函数式类型 |

### 函数式类型问题

**问题**：部分解析器将 `varchar(255)` 视为函数调用表达式，而非类型声明。

**解决方案**：使用 `SimpleHclParser`，它通过正则表达式正确解析函数式类型：

```java
private String parseType(String typeStr) {
    Pattern typeWithArgsPattern = Pattern.compile("(\\w+)\\(([^)]*)\\)");
    Matcher matcher = typeWithArgsPattern.matcher(typeStr);

    if (matcher.matches()) {
        String baseType = matcher.group(1);
        String args = matcher.group(2);
        return baseType.toUpperCase() + "(" + args + ")";
    }

    return typeStr.toUpperCase();
}
```

## 错误处理

### 解析错误

```java
public class HclParseException extends Exception {
    private final int lineNumber;
    private final String hclFile;

    public HclParseException(String message, int lineNumber, String hclFile) {
        super(String.format("%s at line %d in %s", message, lineNumber, hclFile));
        this.lineNumber = lineNumber;
        this.hclFile = hclFile;
    }
}
```

### 常见验证问题

- 缺少必要属性
- 无效的类型定义
- 循环引用
- 未解析的引用

## 未来增强

1. **HCL 输出**：从 JustDB Schema 生成 Atlas 兼容的 HCL
2. **迁移支持**：从 HCL 差异生成迁移脚本
3. **IDE 支持**：Schema 验证和自动补全
4. **Atlas CLI 集成**：使用 Atlas 进行高级迁移

## 相关资源

- [Atlas HCL 文档](https://atlasgo.io/atlas-schema/sql-resources)
- [hcl4j 仓库](https://github.com/bertramlabs/hcl4j)
- [Schema 结构文档](../../design/schema-system/overview.md)
