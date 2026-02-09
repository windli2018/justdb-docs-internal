---
icon: code-branch
title: JustDB vs Flyway
order: 1
category:
  - 指南
  - 对比
tag:
  - 对比
  - Flyway
---

# JustDB vs Flyway

## 核心差异

| 维度 | JustDB | Flyway |
|:---|:---|:---|
| **设计理念** | 声明式 | 命令式 |
| **Schema 定义** | YAML/JSON/XML | SQL 脚本 |
| **变更方式** | 修改 Schema 文件 | 新增 SQL 脚本 |
| **版本管理** | 自动 | 手动管理版本号 |
| **差异计算** | 自动 | 手动编写 |

## 代码对比

<CodeGroup>
<CodeGroupItem title="JustDB">

```yaml
# schema.yaml - 声明期望状态
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
      - name: email
        type: VARCHAR(100)

# 修改时只需更新文件
# JustDB 自动计算差异
```

</CodeGroupItem>

<CodeGroupItem title="Flyway">

```sql
-- V1__create_users_table.sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100)
);

-- V2__add_phone_column.sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- V3__add_avatar_column.sql
ALTER TABLE users ADD COLUMN avatar VARCHAR(500);

-- 每次变更都需要新脚本
```

</CodeGroupItem>
</CodeGroup>

## 优缺点对比

**JustDB 优势**：
- ✅ 简洁：一个文件描述完整 Schema
- ✅ 智能：自动计算差异和变更
- ✅ 文档化：Schema 即文档
- ✅ 灵活：支持多种格式
- ✅ AI 集成：自然语言操作

**Flyway 优势**：
- ✅ 成熟：广泛使用，社区活跃
- ✅ 精确控制：完全控制 SQL 执行
- ✅ 企业级：支持团队、审计等高级功能
- ✅ 兼容性：支持所有 SQL 数据库

## 适用场景

- **选择 JustDB**：快速迭代、敏捷开发、文档优先
- **选择 Flyway**：复杂 SQL、精细控制、企业级需求

## 迁移路径

### 从 Flyway 迁移到 JustDB

```bash
# 1. 从现有数据库提取 Schema
justdb db2schema \
    -u jdbc:mysql://localhost:3306/myapp \
    -o schema.yaml

# 2. 查看差异
justdb diff -c database -s schema.yaml

# 3. 开始使用 JustDB
justdb migrate

# 4. （可选）删除旧的 Flyway 脚本
rm -rf src/main/resources/db/migration
```
