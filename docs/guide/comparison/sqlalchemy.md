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
| **Schema 定义** | YAML/JSON/XML | Python 类 |
| **类型安全** | 部分 | ✅ |
| **ORM 集成** | ❌ | ✅ |

## 代码对比

<CodeGroup>
<CodeGroupItem title="JustDB">

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

</CodeGroupItem>

<CodeGroupItem title="SQLAlchemy">

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

</CodeGroupItem>
</CodeGroup>

## 优缺点对比

**JustDB 优势**：
- ✅ 语言无关：可用于任何 JVM 语言
- ✅ 文件格式：易于版本控制和审查
- ✅ 多数据库：支持 30+ 数据库
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
