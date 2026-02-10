---
icon: python
title: JustDB vs SQLAlchemy
order: 3
category:
  - Guide
  - Comparison
tag:
  - comparison
  - SQLAlchemy
---

# JustDB vs SQLAlchemy (Python)

## Core Differences

| Dimension | JustDB | SQLAlchemy |
|:---|:---|:---|
| **Language** | Java | Python |
| **Design Philosophy** | Declarative file | Code definition |
| **Schema Definition** | XML/YAML/JSON/SQL/TOML | Python classes |
| **Type Safety** | Partial | ✅ |
| **ORM Integration** | ❌ | ✅ |

## Code Comparison

**JustDB - Multi-format declarative schema:**

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
:::

**SQLAlchemy - Python ORM with code-defined schema:**

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

# Create tables
engine = create_engine('sqlite:///users.db')
Base.metadata.create_all(engine)
```
:::

## Pros and Cons

**JustDB Advantages**:
- ✅ Language agnostic: Works with any JVM language
- ✅ File format: Easy version control and review
- ✅ Multi-database: Supports 30+ databases
- ✅ AI Integration: Natural language operations
- ✅ JDBC Driver: Standard JDBC interface

**SQLAlchemy Advantages**:
- ✅ Type safety: Python type hints
- ✅ ORM Integration: Complete ORM features
- ✅ Code first: For Python developers
- ✅ Expressiveness: Python's expressiveness

## Use Cases

- **Choose JustDB**: Java projects, multi-language teams, file-first
- **Choose SQLAlchemy**: Python projects, ORM needs, type safety
