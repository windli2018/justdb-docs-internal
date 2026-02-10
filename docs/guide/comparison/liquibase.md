---
icon: database
title: JustDB vs Liquibase
order: 2
category:
  - 指南
  - 对比
tag:
  - 对比
  - Liquibase
---

# JustDB vs Liquibase

## 核心差异

| 维度 | JustDB | Liquibase |
|:---|:---|:---|
| **设计理念** | 声明式 | 命令式（抽象 SQL） |
| **Schema 定义** | XML/YAML/JSON/SQL/TOML | XML/JSON/YAML/SQL |
| **变更方式** | 修改 Schema 文件 | 新增 changeSet |
| **版本管理** | 自动 | 手动管理 ID/Author |
| **数据库独立性** | 自动 | 通过抽象 SQL |

## 代码对比

**JustDB - 声明期望状态，选择你喜欢的格式：**

::: code-tabs
@tab XML
```xml
<!-- schema.xml -->
<Justdb>
    <Table name="users">
        <Column name="id" type="BIGINT" primaryKey="true"/>
        <Column name="username" type="VARCHAR(50)"/>
        <Index name="idx_username" unique="true">
            <IndexColumn name="username"/>
        </Index>
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
      - name: username
        type: VARCHAR(50)
    Index:
      - name: idx_username
        columns: [username]
        unique: true
```

@tab JSON
```json
{
  "Table": [
    {
      "name": "users",
      "Column": [
        {"name": "id", "type": "BIGINT", "primaryKey": true},
        {"name": "username", "type": "VARCHAR(50)"}
      ],
      "Index": [
        {"name": "idx_username", "columns": ["username"], "unique": true}
      ]
    }
  ]
}
```

@tab SQL
```sql
-- schema.sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50),
    UNIQUE KEY idx_username (username)
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

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"

[[Table.Index]]
name = "idx_username"
unique = true

[[Table.Index.IndexColumn]]
name = "username"
```

@tab Properties
```properties
table.users.name=users
table.users.column.id.name=id
table.users.column.id.type=BIGINT
table.users.column.id.primaryKey=true
table.users.column.username.name=username
table.users.column.username.type=VARCHAR(50)
table.users.index.idx_username.unique=true
table.users.index.idx_username.columns=username
```
:::

**Liquibase - 命令式 changeSet：**

::: code-tabs
@tab XML
```xml
<databaseChangeLog>
  <changeSet id="1" author="john">
    <createTable tableName="users">
      <column name="id" type="BIGINT">
        <constraints primaryKey="true"/>
      </column>
      <column name="username" type="VARCHAR(50)"/>
    </createTable>
  </changeSet>

  <changeSet id="2" author="john">
    <addUniqueConstraint
      tableName="users"
      columnNames="username"
      constraintName="idx_username"/>
  </changeSet>
</databaseChangeLog>
```

@tab YAML
```yaml
databaseChangeLog:
  - changeSet:
      id: 1
      author: john
      changes:
        - createTable:
            tableName: users
            columns:
              - column:
                  name: id
                  type: BIGINT
                  constraints:
                    primaryKey: true
              - column:
                  name: username
                  type: VARCHAR(50)
  - changeSet:
      id: 2
      author: john
      changes:
        - addUniqueConstraint:
            tableName: users
            columnNames: username
            constraintName: idx_username
```
:::

## 优缺点对比

**JustDB 优势**：
- ✅ 更简洁：无需管理 changeSet
- ✅ 更直观：表结构一目了然
- ✅ 自动版本：无需手动编号
- ✅ 多格式：原生支持 8 种格式
- ✅ JDBC 驱动：独有的 JDBC 驱动支持

**Liquibase 优势**：
- ✅ 更灵活：支持混用多种格式
- ✅ 更成熟：企业级功能完善
- ✅ 可扩展：支持自定义变更类型
- ✅ 强大：支持复杂的条件执行

## 适用场景

- **选择 JustDB**：简洁优先、快速开发、文档驱动
- **选择 Liquibase**：复杂变更、企业级需求、混合格式

## 迁移路径

### 从 Liquibase 迁移到 JustDB

```bash
# 类似流程，JustDB 可以读取现有数据库状态
justdb db2schema -u <database-url> -o schema.yaml
```
