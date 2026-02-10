# ORM 集成

JustDB 支持将 Schema 定义转换为多种编程语言的 ORM 模型，包括 Python (SQLAlchemy/Django)、TypeScript (Prisma/TypeORM) 和 Go (GORM/sqlx)。

## 支持的 ORM 框架

| 语言 | 框架 | 特点 | 文档 |
|------|------|------|------|
| **Python** | SQLAlchemy | 功能强大、灵活、数据库无关 | [SQLAlchemy 指南](python.md) |
| **Python** | Django ORM | 简单易用、与 Django 深度集成 | [Django 指南](python.md) |
| **TypeScript** | Prisma | 类型安全、自动生成、开发体验极佳 | [Prisma 指南](typescript.md) |
| **TypeScript** | TypeORM | 装饰器模式、类似 Hibernate | [TypeORM 指南](typescript.md) |
| **Go** | GORM | 全功能 ORM、链式调用 | [GORM 指南](go.md) |
| **Go** | sqlx | 轻量扩展、类型安全 | [sqlx 指南](go.md) |

## 快速开始

### 1. 定义 Schema

创建 `schema.md`:

```markdown
# 用户表 (users)

| Column | Type | Nullable | PK | Default | Comment |
|--------|------|----------|-----|---------|---------|
| id | BIGINT | false | true | AUTO_INCREMENT | 用户ID |
| username | VARCHAR(50) | false | false | NULL | 用户名 |
| email | VARCHAR(100) | true | false | NULL | 邮箱 |
| created_at | TIMESTAMP | false | false | CURRENT_TIMESTAMP | 创建时间 |
```

### 2. 生成 ORM 模型

```bash
# Python SQLAlchemy
justdb schema2orm --input schema.md --type sqlalchemy --output models/

# Python Django
justdb schema2orm --input schema.md --type django --output models/

# TypeScript Prisma
justdb schema2orm --input schema.md --type prisma --output prisma/schema.prisma

# TypeScript TypeORM
justdb schema2orm --input schema.md --type typeorm --output src/entities/

# Go GORM
justdb schema2orm --input schema.md --type gorm --output models/

# Go sqlx
justdb schema2orm --input schema.md --type sqlx --output models/
```

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

| 特性 | SQLAlchemy | Django | Prisma | TypeORM | GORM | sqlx |
|------|-----------|--------|--------|---------|------|------|
| 类型安全 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 自动迁移 | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| 关系映射 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 查询构建器 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 性能 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 学习曲线 | 中 | 低 | 低 | 中 | 中 | 低 |

## 选择建议

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

- [Python ORM 指南](python.md) - SQLAlchemy 和 Django ORM 详细使用
- [TypeScript ORM 指南](typescript.md) - Prisma 和 TypeORM 详细使用
- [Go ORM 指南](go.md) - GORM 和 sqlx 详细使用

## 参考资源

- [Schema 定义](../reference/schema/)
- [格式支持](../reference/formats/)
- [CLI 命令](../../reference/cli/commands.md)
