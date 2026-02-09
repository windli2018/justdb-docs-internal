---
icon: arrows-rotate
title: 迁移基础
order: 5
category:
  - 快速开始
  - 迁移
tag:
  - 迁移
  - Schema
  - 版本管理
---

# 迁移基础

了解 JustDB 的 Schema 迁移机制，让你的数据库变更更加安全和可控。

## 什么是迁移

迁移（Migration）是将数据库从一个状态转换到另一个状态的过程。JustDB 采用**声明式迁移**方式：

```mermaid
flowchart LR
    A[定义目标 Schema] --> B[JustDB 提取<br/>当前数据库状态]
    B --> C[计算差异 Diff]
    C --> D[生成 SQL]
    D --> E[执行变更]
    E --> F[记录历史]
```

**传统迁移 vs JustDB 迁移**：

| 维度 | 传统方式（Flyway/Liquibase） | JustDB |
|:---|:---|:---|
| **定义方式** | 命令式（写 SQL） | 声明式（定义状态） |
| **变更检测** | 手动编写脚本 | 自动计算差异 |
| **版本管理** | 手动管理版本号 | 自动版本追踪 |
| **回滚** | 手动编写回滚脚本 | 自动生成回滚 |
| **冲突处理** | 手动解决 | 自动合并 |

## 基本迁移

### 首次迁移

```bash
# 创建 Schema
cat > users.yaml << EOF
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
EOF

# 执行迁移
justdb migrate users.yaml

# 输出：
# [INFO] Loading schema from: users.yaml
# [INFO] Connecting to database: jdbc:mysql://localhost:3306/myapp
# [INFO] Current database state: empty
# [INFO] Target schema: 1 table(s)
# [INFO] Changes to apply:
# [INFO]   + Create table: users
# [INFO] Generated SQL:
# [INFO]   CREATE TABLE users (
# [INFO]     id BIGINT NOT NULL,
# [INFO]     username VARCHAR(50),
# [INFO]     PRIMARY KEY (id)
# [INFO]   );
# [INFO] Executing migration...
# [INFO] Migration completed successfully
```

### 增量迁移

```bash
# 修改 Schema，添加新字段
cat > users.yaml << EOF
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
      - name: email              # 新增字段
        type: VARCHAR(100)       # 新增字段
EOF

# 执行迁移
justdb migrate

# 输出：
# [INFO] Current database state: 1 table(s)
# [INFO] Target schema: 1 table(s)
# [INFO] Changes to apply:
# [INFO]   ~ Modify table: users
# [INFO]     + Add column: email
# [INFO] Generated SQL:
# [INFO]   ALTER TABLE users ADD COLUMN email VARCHAR(100);
# [INFO] Executing migration...
# [INFO] Migration completed successfully
```

## 迁移命令

### 基本命令

```bash
# 执行迁移
justdb migrate

# 指定配置文件
justdb migrate -c config.yaml

# 指定 Schema 文件
justdb migrate schema.yaml

# 预览变更（不执行）
justdb migrate --dry-run

# 详细输出
justdb migrate --verbose
```

### 命令选项

| 选项 | 说明 |
|:---|:---|
| `--dry-run` | 预览变更，不执行 |
| `--verbose` | 显示详细信息 |
| `--force` | 强制执行，跳过确认 |
| `--baseline` | 设置基线版本 |
| `--validate` | 只验证，不执行 |
| `-c, --config` | 指定配置文件 |
| `-d, --dialect` | 指定数据库方言 |

## 差异计算

### 支持的变更类型

JustDB 自动检测以下变更：

| 变更类型 | 说明 | 示例 SQL |
|:---|:---|:---|
| **ADDED** | 新增表/列/索引 | `CREATE TABLE`, `ALTER TABLE ADD` |
| **REMOVED** | 删除表/列/索引 | `DROP TABLE`, `ALTER TABLE DROP` |
| **MODIFIED** | 修改列/索引 | `ALTER TABLE MODIFY` |
| **RENAMED** | 重命名表/列 | `ALTER TABLE RENAME`, `ALTER TABLE CHANGE` |

### 查看差异

```bash
# 查看当前数据库与 Schema 的差异
justdb diff

# 指定 Schema 文件
justdb diff -s schema.yaml

# 输出格式：json/yaml
justdb diff -f json

# 保存差异到文件
justdb diff > diff.txt
```

### 差异输出示例

```
Schema Differences:
===================

Table: users
  Columns:
    + ADDED: email VARCHAR(100)
    ~ MODIFIED: username VARCHAR(50) -> VARCHAR(100)
    - REMOVED: phone

  Indexes:
    + ADDED: idx_email (email)
    - REMOVED: idx_phone

Table: orders
  + ADDED: new table
```

## 重命名检测

### 自动重命名检测

JustDB 通过 `formerNames` 属性智能检测重命名：

```yaml
# 修改前
Table:
  - name: users
    Column:
      - name: username
        type: VARCHAR(50)

# 修改后
Table:
  - name: users
    Column:
      - name: user_name           # 新名称
        formerNames: [username]   # 旧名称
        type: VARCHAR(50)
```

```bash
# 迁移时自动生成重命名 SQL
justdb migrate

# 生成：ALTER TABLE users CHANGE COLUMN username user_name VARCHAR(50);
```

### 表重命名

```yaml
Table:
  - name: users                   # 新名称
    formerNames: [user]           # 旧名称
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```

```bash
# 生成：ALTER TABLE user RENAME TO users;
```

## 安全删除

### 安全删除模式

避免误删除数据，使用安全删除模式：

```bash
# 启用安全删除
justdb migrate --safe-drop

# 删除操作会重命名而不是直接删除
# users -> users_deleted_<timestamp>
```

### 确认删除

```bash
# 需要确认的删除操作
justdb migrate

# 输出：
# [WARN] The following objects will be REMOVED:
# [WARN]   - Table: old_table
# [WARN]   - Column: users.phone
# [WARN]   - Index: users.idx_old
# [WARN] Continue? (yes/no):
```

## 迁移历史

### 查看迁移历史

```bash
# 查看所有迁移记录
justdb history

# 查看最近 N 次迁移
justdb history -n 10

# 查看特定迁移详情
justdb history <migration-id>
```

### 历史记录示例

```
Migration History:
===================

ID      | Timestamp           | Description         | Status
--------|---------------------|---------------------|--------
001     | 2024-01-15 10:30:00 | Initial schema      | SUCCESS
002     | 2024-01-16 14:20:00 | Add email column    | SUCCESS
003     | 2024-01-17 09:15:00 | Rename username     | SUCCESS
004     | 2024-01-18 16:45:00 | Add orders table    | SUCCESS
```

### 回滚迁移

```bash
# 回滚到指定版本
justdb rollback 002

# 回滚最近一次迁移
justdb rollback --last

# 预览回滚
justdb rollback --dry-run 002
```

## 版本管理

### 基线版本

对于已有数据库，设置基线版本：

```bash
# 设置基线（不执行迁移，只记录版本）
justdb migrate --baseline

# 后续迁移基于基线进行
justdb migrate
```

### 版本验证

```bash
# 验证数据库版本
justdb validate

# 验证 Schema 文件
justdb validate schema.yaml

# 详细验证信息
justdb validate --verbose
```

## 多环境迁移

### 环境配置

```yaml
# config/dev.yaml
database:
  url: jdbc:mysql://dev-db:3306/myapp
  username: dev_user
  password: dev_pass

# config/test.yaml
database:
  url: jdbc:mysql://test-db:3306/myapp
  username: test_user
  password: test_pass

# config/prod.yaml
database:
  url: jdbc:mysql://prod-db:3306/myapp
  username: prod_user
  password: ${DB_PASSWORD}  # 环境变量
```

### 环境切换

```bash
# 开发环境
justdb migrate -c config/dev.yaml

# 测试环境
justdb migrate -c config/test.yaml

# 生产环境（先预览）
justdb migrate -c config/prod.yaml --dry-run

# 确认后执行
justdb migrate -c config/prod.yaml
```

## 迁移最佳实践

### 1. 先预览再执行

```bash
# 总是先预览
justdb migrate --dry-run

# 检查生成的 SQL
justdb migrate --dry-run --verbose

# 确认无误后执行
justdb migrate
```

### 2. 小步快跑

```yaml
# 好的做法：每次只修改一个表
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
# 提交并迁移

# 然后添加新字段
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
      - name: email        # 新增
        type: VARCHAR(100)  # 新增
# 再次提交并迁移
```

### 3. 使用 Git 版本控制

```bash
# Schema 文件纳入版本控制
git add users.yaml
git commit -m "Add email column to users table"
git push

# 团队成员拉取后迁移
git pull
justdb migrate
```

### 4. 保持幂等性

```yaml
# 使用 idempotent 模式
# 确保重复执行不会出错
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```

```bash
# 启用幂等模式
justdb migrate --idempotent
```

### 5. 生产环境谨慎操作

```bash
# 生产环境检查清单
justdb migrate -c config/prod.yaml --dry-run    # 1. 预览
justdb validate -c config/prod.yaml             # 2. 验证
justdb backup -c config/prod.yaml               # 3. 备份
justdb migrate -c config/prod.yaml              # 4. 迁移
justdb verify -c config/prod.yaml               # 5. 验证
```

## 故障处理

### 迁移失败

```bash
# 迁移失败时的处理
justdb migrate

# 输出：
# [ERROR] Migration failed: Duplicate column name 'email'
# [ERROR] SQL: ALTER TABLE users ADD COLUMN email VARCHAR(100);
# [ERROR] Fix the schema and run: justdb migrate --repair

# 修复后继续
justdb migrate --repair
```

### 手动修复

```bash
# 跳过失败的迁移
justdb migrate --skip-failed

# 标记迁移为成功（慎用）
justdb migrate --mark-success
```

## 下一步

<VPCard
  title="Spring Boot 集成"
  desc="在 Spring Boot 中自动执行迁移"
  link="/getting-started/spring-boot-integration.html"
/>

<VPCard
  title="常见任务"
  desc="查看常见的数据库操作示例"
  link="/getting-started/common-tasks.html"
/>

<VPCard
  title="Schema 定义详解"
  desc="深入了解 Schema 定义语法"
  link="/design/schema-system/definition.html"
/>
