---
icon: python
title: JustDB vs SQLAlchemy
order: 3
category:
  - 指南
  - 对比
tag:
  - 对比
  - SQLAlchemy
---

# JustDB vs SQLAlchemy (Python)

## 核心差异

| 维度 | JustDB | SQLAlchemy |
|:---|:---|:---|
| **语言** | Java | Python |
| **设计理念** | 声明式文件 | 代码定义 |
| **Schema 定义** | XML/YAML/JSON/SQL/TOML/Properties | Python 类 |
| **类型安全** | 部分 | ✅ |
| **ORM 模型生成** | ✅ (可生成 SQLAlchemy/Django 模型) | 内置 |

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
    </Table>
</Justdb>
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
      ]
    }
  ]
}
```

@tab SQL
```sql
-- schema.sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100)
);
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
```
:::

**SQLAlchemy - Python ORM 与代码定义的 Schema：**

::: code-tabs
@tab Python
```python
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False)
    email = Column(String(100))

# 创建表
engine = create_engine('sqlite:///users.db')
Base.metadata.create_all(engine)
```
:::

## 优缺点对比

**JustDB 优势**：
- ✅ 语言无关：可用于任何 JVM 语言
- ✅ 文件格式：易于版本控制和审查
- ✅ 多数据库：支持 30+ 数据库
- ✅ 多语言 ORM 生成：可生成 JPA、MyBatis、SQLAlchemy、Django、Prisma、GORM 模型
- ✅ ORM 导入：支持从 SQLAlchemy、Django、GORM 等 ORM 导入（orm2schema 命令）
- ✅ AI 集成：自然语言操作
- ✅ JDBC 驱动：标准 JDBC 接口

**SQLAlchemy 优势**：
- ✅ 类型安全：Python 类型提示
- ✅ ORM 集成：完整的 ORM 功能
- ✅ 代码优先：适合 Python 开发者
- ✅ 表达力：Python 的表达能力

## 适用场景

- **选择 JustDB**：Java 项目、多语言团队、文件优先
- **选择 SQLAlchemy**：Python 项目、ORM 需求、类型安全
