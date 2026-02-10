---
icon: code-branch
date: 2024-01-01
title: Schema 演进
order: 7
category:
  - 指南
  - schema
tag:
  - schema
  - 演进
  - 迁移
---

# Schema 演进

学习如何管理数据库 Schema 随时间的变化，确保数据安全和系统稳定性。

## Schema 变更类型

JustDB 自动检测以下四种 Schema 变更类型：

### ADDED（新增）

```yaml
# 修改前
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true

# 修改后
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username    # 新增
        type: VARCHAR(50) # 新增
```

**生成的 SQL**：
```sql
ALTER TABLE users ADD COLUMN username VARCHAR(50);
```

### REMOVED（删除）

```yaml
# 修改前
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
      - name: username    # 将被删除
        type: VARCHAR(50)

# 修改后
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
```

**生成的 SQL**：
```sql
ALTER TABLE users DROP COLUMN username;
```

### MODIFIED（修改）

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
      - name: username
        type: VARCHAR(100)  # 类型修改
        nullable: false     # 约束修改
```

**生成的 SQL**：
```sql
ALTER TABLE users MODIFY COLUMN username VARCHAR(100) NOT NULL;
```

### RENAMED（重命名）

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

**生成的 SQL**：
```sql
ALTER TABLE users RENAME COLUMN username TO user_name;
```

## 重命名检测

### 自动重命名检测

JustDB 通过 `formerNames` 属性智能检测重命名操作，避免数据丢失。

```yaml
# 场景 1：列重命名
Column:
  - name: user_name           # 新名称
    formerNames: [username]   # 旧名称
    type: VARCHAR(50)

# 场景 2：表重命名
Table:
  - name: users                   # 新名称
    formerNames: [user]           # 旧名称
    Column:
      - name: id
        type: BIGINT
        primaryKey: true

# 场景 3：索引重命名
Index:
  - name: idx_user_new            # 新名称
    formerNames: [idx_user_old]   # 旧名称
    columns: [user_id]
```

### 多个曾用名

一个对象可以追踪多个曾用名：

```yaml
Column:
  - name: full_name
    formerNames: [name, username, user_name]
    type: VARCHAR(100)
```

### 重命名 vs 删除+新增

**使用 formerNames（推荐）**：
```yaml
# JustDB 识别为重命名
- name: new_name
  formerNames: [old_name]
  type: VARCHAR(50)

# 生成：ALTER TABLE ... RENAME COLUMN old_name TO new_name
# 数据保留 ✓
```

**不使用 formerNames（不推荐）**：
```yaml
# JustDB 识别为删除 + 新增
- name: old_name  # 删除
  type: VARCHAR(50)

- name: new_name  # 新增
  type: VARCHAR(50)

# 生成：
# ALTER TABLE ... DROP COLUMN old_name  # 数据丢失 ✗
# ALTER TABLE ... ADD COLUMN new_name
```

## 兼容性处理

### 向后兼容的变更

**添加字段**：
```yaml
# 新增字段默认为 nullable
Column:
  - name: phone
    type: VARCHAR(20)
    # nullable: true（默认）
```

**扩大字段长度**：
```yaml
Column:
  - name: username
    type: VARCHAR(100)  # 从 50 增加到 100
```

**添加索引**：
```yaml
Index:
  - name: idx_email
    columns: [email]
```

### 需要数据迁移的变更

**缩小字段长度**：
```yaml
# 需要先处理超长数据
Column:
  - name: username
    type: VARCHAR(20)  # 从 50 缩小到 20
```

**修改字段类型**：
```yaml
# 需要考虑数据转换
Column:
  - name: status_code
    type: INT          # 从 VARCHAR 改为 INT
```

**删除字段**：
```yaml
# 需要确认数据已迁移
Column:
  # old_field 被删除
```

### 使用 before/after 钩子处理数据迁移

```yaml
Table:
  - name: users
    beforeAlters:
      - dbms: mysql
        sql: |
          -- 迁移前备份数据
          CREATE TABLE users_backup AS SELECT * FROM users;
    Column:
      - name: status_code
        type: INT
        formerNames: [status]
    afterAlters:
      - dbms: mysql
        sql: |
          -- 迁移后更新数据
          UPDATE users SET status_code = CASE status
            WHEN 'active' THEN 1
            WHEN 'inactive' THEN 0
            ELSE 0
          END;
```

## 迁移策略

### 安全迁移流程

```bash
# 1. 预览变更
justdb migrate --dry-run

# 2. 查看差异
justdb diff

# 3. 验证 Schema
justdb validate

# 4. 备份数据库
justdb backup -o backup.sql

# 5. 执行迁移
justdb migrate

# 6. 验证结果
justdb verify
```

### 生产环境迁移

**分步迁移策略**：

```yaml
# 步骤 1：添加新字段（ nullable）
Column:
  - name: new_field
    type: VARCHAR(100)
    nullable: true

# 步骤 2：填充数据
# 应用层或脚本迁移数据

# 步骤 3：设置非空约束
Column:
  - name: new_field
    type: VARCHAR(100)
    nullable: false

# 步骤 4：删除旧字段
# old_field 被删除
```

### 大表迁移

**使用批处理**：

```sql
-- 分批更新大表
UPDATE users SET new_field = 'value' WHERE id BETWEEN 1 AND 10000;
UPDATE users SET new_field = 'value' WHERE id BETWEEN 10001 AND 20000;
-- ...
```

**使用临时表**：

```yaml
Table:
  - name: users_new
    comment: 新表结构
    Column: [...]

  - name: users
    beforeAlters:
      - sql: |
          -- 创建新表
          CREATE TABLE users_new LIKE users;
          -- 批量复制数据
          INSERT INTO users_new SELECT * FROM users;
    afterAlters:
      - sql: |
          -- 重命名表
          RENAME TABLE users TO users_old, users_new TO users;
```

## 回滚策略

### 使用 formerNames 保留历史

```yaml
# 保留完整的重命名历史
Column:
  - name: current_name
    formerNames: [old_name, original_name]
    type: VARCHAR(50)
```

### 手动回滚

```bash
# 回滚到指定版本
justdb rollback 002

# 查看回滚计划
justdb rollback --dry-run 002

# 回滚最近一次
justdb rollback --last
```

### 数据备份恢复

```bash
# 迁移前备份
justdb backup -o backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复备份
mysql -u root -p myapp < backup_20240115_103000.sql
```

## 冲突解决

### 并发修改冲突

**场景**：两个开发者同时修改同一个表

**开发者 A**：
```yaml
Table:
  - name: users
    Column:
      - name: email
        type: VARCHAR(100)
      - name: phone       # A 添加
        type: VARCHAR(20)
```

**开发者 B**：
```yaml
Table:
  - name: users
    Column:
      - name: email
        type: VARCHAR(100)
      - name: address     # B 添加
        type: VARCHAR(200)
```

**合并后**：
```yaml
Table:
  - name: users
    Column:
      - name: email
        type: VARCHAR(100)
      - name: phone       # A 的修改
        type: VARCHAR(20)
      - name: address     # B 的修改
        type: VARCHAR(200)
```

### Schema 不一致检测

```bash
# 检测 Schema 与数据库的差异
justdb diff

# 检测多个 Schema 文件的一致性
justdb validate --all
```

## 版本控制

### Git 工作流

```bash
# 1. 创建特性分支
git checkout -b feature/add-phone-field

# 2. 修改 Schema
vim justdb/users.yaml

# 3. 提交变更
git add justdb/users.yaml
git commit -m "Add phone field to users table"

# 4. 推送并创建 PR
git push origin feature/add-phone-field
```

### Schema 审查清单

**代码审查时检查**：
- [ ] 字段类型是否合适
- [ ] 是否设置了必要的约束
- [ ] 索引是否合理
- [ ] 注释是否完整
- [ ] 是否使用了 formerNames（重命名时）
- [ ] 是否考虑了数据迁移

## 最佳实践

### 1. 使用 formerNames 追踪重命名

```yaml
# 好的做法
- name: user_name
  formerNames: [username]
  type: VARCHAR(50)

# 避免
- name: user_name
  type: VARCHAR(50)  # 没有追踪旧名称
```

### 2. 保持向后兼容

```yaml
# 好的做法：先添加 nullable 字段
- name: phone
  type: VARCHAR(20)
  # nullable: true（默认）

# 后续再设置非空
- name: phone
  type: VARCHAR(20)
  nullable: false
```

### 3. 小步快跑

```yaml
# 好的做法：每次只修改一个字段
commit 1: 添加 phone 字段
commit 2: 为 phone 添加索引
commit 3: 设置 phone 为非空

# 避免：一次性做多个修改
commit: 添加 phone、email、address 字段及其索引
```

### 4. 完整的注释

```yaml
# 好的做法
Table:
  - name: users
    comment: 用户表，存储系统用户信息
    Column:
      - name: phone
        type: VARCHAR(20)
        comment: 手机号，11位数字

# 避免
Table:
  - name: users
    Column:
      - name: phone
        type: VARCHAR(20)
```

### 5. 测试环境先验证

```bash
# 1. 开发环境测试
justdb migrate -c dev-config.yaml

# 2. 测试环境验证
justdb migrate -c test-config.yaml

# 3. 预生产环境演练
justdb migrate -c staging-config.yaml --dry-run

# 4. 生产环境执行
justdb migrate -c prod-config.yaml
```

## 下一步

<VPCard
  title="迁移策略"
  desc="了解详细的迁移策略和最佳实践"
  link="/guide/migration-strategies.html"
/>

<VPCard
  title="团队协作"
  desc="在团队中使用 JustDB 的最佳实践"
  link="/guide/team-collaboration.html"
/>

<VPCard
  title="配置参考"
  desc="完整的配置选项说明"
  link="/guide/config-reference.html"
/>
