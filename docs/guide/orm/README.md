# ORM 集成

JustDB 支持将 Schema 定义转换为多种编程语言的 ORM 模型，包括 Python (SQLAlchemy/Django)、TypeScript (Prisma/TypeORM) 和 Go (GORM/sqlx)。

## 支持的 ORM 框架

| 语言 | 框架 | 特点 | 文档 |
|------|------|------|------|
| **Java** | JPA/Hibernate | 企业级标准、功能强大、成熟稳定 | [JPA/Hibernate 指南](java.md) |
| **Java** | MyBatis | SQL 控制、灵活映射、广泛应用 | [MyBatis 指南](java.md) |
| **Python** | SQLAlchemy | 功能强大、灵活、数据库无关 | [SQLAlchemy 指南](python.md) |
| **Python** | Django ORM | 简单易用、与 Django 深度集成 | [Django 指南](python.md) |
| **TypeScript** | Prisma | 类型安全、自动生成、开发体验极佳 | [Prisma 指南](typescript.md) |
| **TypeScript** | TypeORM | 装饰器模式、类似 Hibernate | [TypeORM 指南](typescript.md) |
| **Go** | GORM | 全功能 ORM、链式调用 | [GORM 指南](go.md) |
| **Go** | sqlx | 轻量扩展、类型安全 | [sqlx 指南](go.md) |

## 快速开始

### 1. 定义 Schema

JustDB 支持多种格式定义 Schema。选择最适合你的格式：

::: code-tabs
@tab XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Justdb namespace="com.example">
    <Table name="users" comment="用户表">
        <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true" comment="用户ID"/>
        <Column name="username" type="VARCHAR(50)" nullable="false" comment="用户名"/>
        <Column name="email" type="VARCHAR(100)" comment="邮箱"/>
        <Column name="created_at" type="TIMESTAMP" nullable="false" defaultValueComputed="CURRENT_TIMESTAMP" comment="创建时间"/>
    </Table>
</Justdb>
```

@tab YAML
```yaml
namespace: com.example
Table:
  - name: users
    comment: 用户表
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
        comment: 用户ID
      - name: username
        type: VARCHAR(50)
        nullable: false
        comment: 用户名
      - name: email
        type: VARCHAR(100)
        comment: 邮箱
      - name: created_at
        type: TIMESTAMP
        nullable: false
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: 创建时间
```

@tab JSON
```json
{
  "namespace": "com.example",
  "Table": [
    {
      "name": "users",
      "comment": "用户表",
      "Column": [
        {
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true,
          "autoIncrement": true,
          "comment": "用户ID"
        },
        {
          "name": "username",
          "type": "VARCHAR(50)",
          "nullable": false,
          "comment": "用户名"
        },
        {
          "name": "email",
          "type": "VARCHAR(100)",
          "comment": "邮箱"
        },
        {
          "name": "created_at",
          "type": "TIMESTAMP",
          "nullable": false,
          "defaultValueComputed": "CURRENT_TIMESTAMP",
          "comment": "创建时间"
        }
      ]
    }
  ]
}
```

@tab SQL
```sql
-- JustDB SQL 格式
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    email VARCHAR(100) COMMENT '邮箱',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) COMMENT '用户表';
```

@tab TOML
```toml
namespace = "com.example"

[[Table]]
name = "users"
comment = "用户表"

[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true
autoIncrement = true
comment = "用户ID"

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"
nullable = false
comment = "用户名"

[[Table.Column]]
name = "email"
type = "VARCHAR(100)"
comment = "邮箱"

[[Table.Column]]
name = "created_at"
type = "TIMESTAMP"
nullable = false
defaultValueComputed = "CURRENT_TIMESTAMP"
comment = "创建时间"
```

@tab Markdown
```markdown
# 用户表 (users)

| Column | Type | Nullable | PK | Default | Comment |
|--------|------|----------|-----|---------|---------|
| id | BIGINT | false | true | AUTO_INCREMENT | 用户ID |
| username | VARCHAR(50) | false | false | NULL | 用户名 |
| email | VARCHAR(100) | true | false | NULL | 邮箱 |
| created_at | TIMESTAMP | false | false | CURRENT_TIMESTAMP | 创建时间 |
```
:::

### 2. 生成 ORM 模型

JustDB 支持任意格式的 Schema 作为输入：

::: code-tabs
@tab XML
```bash
# 从 XML Schema 生成
justdb schema2orm --input schema.xml --type jpa-entity --output src/main/java/

# Java JPA/Hibernate Entity
justdb schema2orm --input schema.xml --type jpa-entity --output src/main/java/

# Java MyBatis Bean
justdb schema2orm --input schema.xml --type mybatis-bean --output src/main/java/
```

@tab YAML
```bash
# 从 YAML Schema 生成
justdb schema2orm --input schema.yaml --type jpa-entity --output src/main/java/

# Python SQLAlchemy
justdb schema2orm --input schema.yaml --type sqlalchemy --output models/

# Python Django
justdb schema2orm --input schema.yaml --type django --output models/
```

@tab JSON
```bash
# 从 JSON Schema 生成
justdb schema2orm --input schema.json --type jpa-entity --output src/main/java/

# TypeScript Prisma
justdb schema2orm --input schema.json --type prisma --output prisma/schema.prisma

# TypeScript TypeORM
justdb schema2orm --input schema.json --type typeorm --output src/entities/
```

@tab SQL
```bash
# 从 SQL Schema 生成
justdb schema2orm --input schema.sql --type jpa-entity --output src/main/java/

# Go GORM
justdb schema2orm --input schema.sql --type gorm --output models.go
```

@tab TOML
```bash
# 从 TOML Schema 生成
justdb schema2orm --input schema.toml --type mybatis-bean --output src/main/java/

# Go sqlx
justdb schema2orm --input schema.toml --type sqlx --output models.go
```

@tab Markdown
```bash
# 从 Markdown Schema 生成
justdb schema2orm --input schema.md --type jpa-entity --output src/main/java/

# Python SQLAlchemy
justdb schema2orm --input schema.md --type sqlalchemy --output models/
```
:::

### 3. 使用生成的模型

每个语言的详细使用方法请参考对应的指南文档。

## 工作流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  数据库     │────▶│   JustDB    │────▶│  ORM 模型   │
│  MySQL/PG   │     │ Schema2ORM  │     │  Python/TS/Go│
└─────────────┘     └─────────────┘     └─────────────┘
```

## 从现有数据库生成

```bash
# 1. 从数据库提取 Schema
justdb db2schema \
  --db-url "jdbc:mysql://localhost:3306/mydb" \
  --username root \
  --password password \
  --output schema.xml

# 2. 转换为 ORM 模型
justdb schema2orm --input schema.xml --type sqlalchemy --output models/
```

## 从 ORM 导入 Schema

JustDB 支持从现有 ORM 模型导入 Schema，让你轻松将现有项目迁移到 JustDB。

### 使用 orm2schema 命令

```bash
justdb orm2schema [options]

选项:
  --input, -i <path>      输入源（ORM 文件或目录）
  --orm, -t <type>        ORM 类型或导入器 ID
  --output, -o <file>     输出 JustDB Schema 文件
  --dialect, -d <type>    数据库方言（默认: mysql）
  --format <fmt>          输出格式（yaml, json, xml，默认: yaml）
  --type-map <k=v>        类型映射覆盖
  --no-constraints        排除约束
  --no-indexes            排除索引
  --include-tables        包含的表列表
  --exclude-tables        排除的表列表
  --param <k=v>           额外的导入器参数
  --list-importers        列出所有可用的导入器
  --validate-only         仅验证源而不导入
  --verbose               显示详细信息
```

### 支持的导入类型

JustDB 支持从多种 ORM 框架导入：

| 语言 | 支持的 ORM/框架 |
|------|----------------|
| **Python** | SQLAlchemy、Django、Peewee |
| **TypeScript** | Prisma、TypeORM、Sequelize、Drizzle |
| **Java** | JPA/Hibernate、MyBatis、jOOQ |
| **Go** | GORM、sqlx |
| **C#** | Entity Framework、Dapper |
| **Ruby** | Rails (ActiveRecord) |
| **PHP** | Laravel Eloquent、Doctrine |

### 从 Prisma 导入

```bash
# 从 Prisma schema 导入
justdb orm2schema \
  --input prisma/schema.prisma \
  --orm prisma \
  --output schema.yaml \
  --dialect postgresql
```

### 从 SQLAlchemy 导入

```bash
# 从 SQLAlchemy 模型目录导入
justdb orm2schema \
  --input models/ \
  --orm sqlalchemy \
  --output schema.yaml \
  --dialect mysql
```

### 从 GORM 导入

```bash
# 从 GORM struct 文件导入
justdb orm2schema \
  --input models.go \
  --orm gorm \
  --output schema.yaml \
  --dialect postgresql
```

### 从 Hibernate/JPA 导入

```bash
# 从 JPA 注解的 Java 类导入
justdb orm2schema \
  --input src/main/java/com/example/entities/ \
  --orm hibernate-annotations \
  --output schema.yaml \
  --dialect mysql
```

### Atlas 集成

JustDB 支持与 Atlas ORM 导入工具集成。由于 DDL 格式解析尚在开发中，推荐使用以下工作流：

::: tip Atlas 集成方案

**方案一：直接使用 Atlas（推荐）**

```bash
# 1. 使用 Atlas 从 ORM 生成 DDL
atlas schema diff \
  --from "ent://schema" \
  --to "mysql://user:pass@localhost:3306/mydb" \
  --format '{{ sql . }}' > schema.sql

# 2. 创建临时数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS temp_db;"

# 3. 导入 DDL 到临时数据库
mysql -u root -p temp_db < schema.sql

# 4. 使用 JustDB 提取 Schema
justdb db2schema \
  --db-url "jdbc:mysql://localhost:3306/temp_db" \
  --username root \
  --password password \
  --output schema.yaml
```

**方案二：配置自定义导入器**

如果你的 Atlas provider 可以输出 JSON/YAML 格式，可以配置自定义导入器：

```java
import org.verydb.justdb.orm.importer.external.*;

SchemaImporter importer = ExternalProgramImporter.builder()
    .id("atlas-custom")
    .name("Atlas Custom Provider")
    .command("atlas")
    .defaultArgs("schema", "inspect", "--format", "json")
    .outputFormat(OutputFormat.JSON)
    .supportedInputTypes(InputType.ATLAS_HCL)
    .build();

// 注册导入器
SchemaImporterRegistry registry = new SchemaImporterRegistry();
registry.register(importer);

// 使用自定义导入器
justdb orm2schema \
  --input schema.hcl \
  --orm atlas-custom \
  --output schema.yaml
```

:::

### 列出可用的导入器

```bash
# 查看所有已注册的导入器
justdb orm2schema --list-importers
```

## 命令选项

```bash
justdb schema2orm [options]

选项:
  --input <file>       Schema 输入文件 (.xml, .md, .json, .yaml)
  --type <orm>         ORM 类型: sqlalchemy, django, prisma, typeorm, gorm, sqlx
  --output <dir>       输出目录
  --package <name>     包名（Python/Go）
  --namespace <name>   命名空间（TypeScript）
  --overwrite          覆盖已存在的文件
  --with-relationships 生成关系映射
  --with-methods       生成 CRUD 方法
  --table-prefix <prefix> 表名前缀
```

## 特性对比

| 特性 | JPA | MyBatis | SQLAlchemy | Django | Prisma | TypeORM | GORM | sqlx |
|------|-----|---------|-----------|--------|--------|---------|------|------|
| 类型安全 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 自动迁移 | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| 关系映射 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 查询构建器 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| SQL 控制 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 性能 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 学习曲线 | 中 | 中 | 中 | 低 | 低 | 中 | 中 | 低 |

## 选择建议

### 什么时候使用 Java ORM？

- **JPA/Hibernate**: 企业级应用、需要标准 JPA 规范、复杂关系映射、缓存优化
- **MyBatis**: 需要 SQL 精细控制、现有数据库集成、复杂查询优化

### 什么时候使用 Python ORM？

- **SQLAlchemy**: 复杂业务逻辑、需要精细控制、数据库无关
- **Django ORM**: Django 项目、快速开发、团队熟悉 Django

### 什么时候使用 TypeScript ORM？

- **Prisma**: 全栈 TypeScript 项目、重视类型安全、快速迭代
- **TypeORM**: 传统后端项目、习惯装饰器模式、需要复杂查询

### 什么时候使用 Go ORM？

- **GORM**: 快速开发、需要自动迁移、复杂关联查询
- **sqlx**: 性能敏感、SQL 优先、需要精细控制

## 语言指南

- [Java ORM 指南](java.md) - JPA/Hibernate 和 MyBatis 详细使用
- [Python ORM 指南](python.md) - SQLAlchemy 和 Django ORM 详细使用
- [TypeScript ORM 指南](typescript.md) - Prisma 和 TypeORM 详细使用
- [Go ORM 指南](go.md) - GORM 和 sqlx 详细使用

## 参考资源

- [Schema 定义](../reference/schema/)
- [格式支持](../reference/formats/)
- [CLI 命令](../../reference/cli/commands.md)
