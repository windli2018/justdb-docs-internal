---
icon: server
title: JustDB vs Atlas
order: 5
category:
  - 指南
  - 对比
tag:
  - 对比
  - Atlas
---

# JustDB vs Atlas

## 核心差异

| 维度 | JustDB | Atlas |
|:---|:---|:---|
| **语言生态** | Java/JVM | 多语言（Go 核心） |
| **设计理念** | 声明式 | 声明式 + GitOps |
| **Schema 定义** | XML/YAML/JSON/SQL/TOML | SQL/HCL/ORM |
| **差异计算** | 自动 | 自动 |
| **AI 集成** | 本地/云端 AI | Atlas Copilot（云端） |
| **JDBC 驱动** | ✅ 独有 | ❌ |
| **部署方式** | CLI/JDBC | CLI/Terraform/K8s |
| **企业功能** | 开源免费 | 云端 SaaS |

## 代码对比

**JustDB - 多格式声明式 Schema：**

::: code-tabs
@tab XML
```xml
<!-- schema.xml -->
<Justdb>
    <Table name="users">
        <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
        <Column name="username" type="VARCHAR(50)" nullable="false"/>
        <Column name="email" type="VARCHAR(100)"/>
        <Index name="idx_username" unique="true">
            <IndexColumn name="username"/>
        </Index>
    </Table>
</Justdb>

<!-- 直接运行迁移 -->
<!-- justdb migrate -->
```

@tab YAML
```yaml
# schema.yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
      - name: username
        type: VARCHAR(50)
        nullable: false
      - name: email
        type: VARCHAR(100)
    Index:
      - name: idx_username
        columns: [username]
        unique: true

# 直接运行迁移
# justdb migrate
```

@tab JSON
```json
{
  "Table": [
    {
      "name": "users",
      "Column": [
        {"name": "id", "type": "BIGINT", "primaryKey": true, "autoIncrement": true},
        {"name": "username", "type": "VARCHAR(50)", "nullable": false},
        {"name": "email", "type": "VARCHAR(100)"}
      ],
      "Index": [
        {"name": "idx_username", "columns": ["username"], "unique": true}
      ]
    }
  ]
}

// 直接运行迁移
// justdb migrate
```

@tab SQL
```sql
-- schema.sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    UNIQUE KEY idx_username (username)
);

-- 直接运行迁移
-- justdb migrate
```

@tab TOML
```toml
[[Table]]
name = "users"

[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true
autoIncrement = true

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"
nullable = false

[[Table.Column]]
name = "email"
type = "VARCHAR(100)"

[[Table.Index]]
name = "idx_username"
unique = true

[[Table.Index.IndexColumn]]
name = "username"

# 直接运行迁移
# justdb migrate
```

@tab Properties
```properties
table.users.name=users
table.users.column.id.name=id
table.users.column.id.type=BIGINT
table.users.column.id.primaryKey=true
table.users.column.id.autoIncrement=true
table.users.column.username.name=username
table.users.column.username.type=VARCHAR(50)
table.users.column.username.nullable=false
table.users.column.email.name=email
table.users.column.email.type=VARCHAR(100)
table.users.index.idx_username.unique=true
table.users.index.idx_username.columns=username

# 直接运行迁移
# justdb migrate
```
:::

**Atlas - GitOps 驱动的 Schema 管理：**

::: code-tabs
@tab HCL
```hcl
# schema.hcl
table "users" {
  schema = schema.public
  column "id" {
    type = serial
    null = false
  }
  column "username" {
    type = varchar(50)
    null = false
  }
  column "email" {
    type = varchar(100)
  }
  primary_key {
    columns = [column.id]
  }
}

# 应用变更
atlas schema apply -u "postgres://user:pass@localhost/db" \
  --to file://schema.hcl
```

@tab SQL
```sql
-- schema.sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100)
);

CREATE UNIQUE INDEX idx_username ON users(username);
```
:::

## 优缺点对比

**JustDB 优势**：
- ✅ **JDBC 驱动**：独特的内存数据库驱动，支持离线开发
- ✅ **多格式支持**：原生支持 8 种数据格式（XML/YAML/JSON/TOML/Properties 等）
- ✅ **AI 集成**：支持本地 LLM 和多种云端 AI
- ✅ **Java 生态**：深度集成 Java/JVM 生态
- ✅ **模板系统**：灵活的模板引擎支持自定义 SQL 生成
- ✅ **开源免费**：完全开源，无企业功能付费墙
- ✅ **ORM 导入**：支持从多种 ORM 框架导入 Schema（orm2schema 命令）
- ✅ **Atlas 集成**：可与 Atlas ORM 导入工具配合使用

**Atlas 优势**：
- ✅ **GitOps 原生**：专为 GitOps/CI-CD 设计
- ✅ **Terraform 集成**：官方 Terraform provider 支持
- ✅ **多语言友好**：支持从任何语言项目的 SQL/HCL
- ✅ **Linting 验证**：强大的 Schema 变更验证
- ✅ **Atlas Cloud**：企业级平台（付费）
- ✅ **ORM 集成**：内置 ORM 导入（Ent/GORM/Prisma 等）

**Atlas 劣势**：
- ❌ **自有 HCL 格式**：需要学习 Atlas HCL DSL，增加学习成本
- ❌ **无 JDBC 驱动**：不提供内存数据库驱动
- ❌ **企业功能付费**：高级功能需要 Atlas Cloud 订阅

## 适用场景

- **选择 JustDB**：Java 项目、需要 JDBC 驱动、多格式支持、本地 或云端 AI
- **选择 Atlas**：DevOps/GitOps 优先、Terraform 用户、需要云端企业功能
