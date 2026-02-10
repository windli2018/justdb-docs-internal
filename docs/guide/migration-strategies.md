---
icon: route
date: 2024-01-01
title: 迁移策略
order: 8
category:
  - 指南
  - 迁移
tag:
  - 迁移
  - 策略
  - 最佳实践
---

# 迁移策略

学习如何安全、高效地执行数据库迁移，确保数据安全和系统稳定。

## 基础迁移

### 首次迁移

首次迁移用于创建全新的数据库结构。

```bash
# 创建 Schema 文件
cat > schema.yaml << EOF
namespace: com.example
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
EOF

# 执行首次迁移
justdb migrate schema.yaml

# 输出：
# [INFO] Current database state: empty
# [INFO] Target schema: 1 table(s)
# [INFO] Changes to apply:
# [INFO]   + Create table: users
# [INFO] Executing migration...
# [INFO] Migration completed successfully
```

### 增量迁移

增量迁移用于在已有数据库基础上应用变更。

```yaml
# 修改 Schema，添加新字段
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
        nullable: false
      - name: email
        type: VARCHAR(100)
      - name: phone        # 新增字段
        type: VARCHAR(20)  # 新增字段
```

```bash
# 执行增量迁移
justdb migrate

# 输出：
# [INFO] Current database state: 1 table(s)
# [INFO] Target schema: 1 table(s)
# [INFO] Changes to apply:
# [INFO]   ~ Modify table: users
# [INFO]     + Add column: phone
# [INFO] Executing migration...
# [INFO] Migration completed successfully
```

## 零停机迁移

### 在线添加字段

添加字段时使用 `nullable` 和默认值，避免锁表。

```yaml
Table:
  - name: users
    Column:
      - name: phone
        type: VARCHAR(20)
        nullable: true        # 允许 NULL，避免全表更新
        defaultValue: NULL
```

**迁移步骤**：

```bash
# 1. 添加字段（nullable）
justdb migrate

# 2. 应用层填充数据
# 通过后台任务逐步填充 phone 字段

# 3. 设置非空约束
# 修改 Schema，设置 nullable: false
justdb migrate
```

### 在线修改字段类型

使用临时列进行类型转换。

```yaml
Table:
  - name: users
    Column:
      - name: status_code      # 新字段
        type: INT
        nullable: true
      - name: status           # 旧字段
        type: VARCHAR(20)
    beforeAlters:
      - sql: |
          -- 1. 复制数据到新字段
          UPDATE users
          SET status_code = CASE status
            WHEN 'active' THEN 1
            WHEN 'inactive' THEN 0
            ELSE -1
          END;
    afterAlters:
      - sql: |
          -- 2. 删除旧字段
          ALTER TABLE users DROP COLUMN status;
          -- 3. 重命名新字段
          ALTER TABLE users CHANGE COLUMN status_code status VARCHAR(20);
```

### 在线创建索引

使用 `ALGORITHM=INPLACE` 避免锁表。

```yaml
Table:
  - name: users
    Index:
      - name: idx_email
        columns: [email]
        unique: true
        algorithm: INPLACE    # MySQL 在线创建索引
```

**对于大表，分批创建索引**：

```sql
-- 使用 pt-online-schema-change（Percona Toolkit）
pt-online-schema-change \
  --alter "ADD INDEX idx_email(email)" \
  --charset=utf8mb4 \
  --critical-load="Threads_running=50" \
  --execute \
  D=myapp,t=users
```

## 数据迁移

### 数据类型转换

```yaml
Table:
  - name: users
    Column:
      - name: status_code
        type: INT
        formerNames: [status]
    beforeAlters:
      - sql: |
          -- 转换数据
          UPDATE users
          SET status = CASE status
            WHEN 'active' THEN 1
            WHEN 'inactive' THEN 0
            ELSE -1
          END
          WHERE status NOT IN ('1', '0', '-1');
```

### 数据迁移脚本

使用 `afterCreates` 钩子导入初始数据。

```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
    afterCreates:
      - sql: |
          -- 插入默认管理员
          INSERT INTO users (id, username) VALUES (1, 'admin');
```

### 大数据量迁移

使用分批处理避免长时间锁表。

```yaml
Table:
  - name: orders
    Column:
      - name: status
        type: VARCHAR(20)
        formerNames: [order_status]
    beforeAlters:
      - sql: |
          -- 分批更新，每次 10000 条
          UPDATE orders SET status = order_status WHERE id BETWEEN 1 AND 10000;
          UPDATE orders SET status = order_status WHERE id BETWEEN 10001 AND 20000;
          -- ... 继续分批
```

## 多环境迁移

### 环境隔离

```yaml
# config/dev.yaml
database:
  url: jdbc:mysql://dev-db:3306/myapp_dev
  username: dev_user
  password: dev_pass

# config/test.yaml
database:
  url: jdbc:mysql://test-db:3306/myapp_test
  username: test_user
  password: test_pass

# config/prod.yaml
database:
  url: jdbc:mysql://prod-db:3306/myapp
  username: prod_user
  password: ${DB_PASSWORD}  # 环境变量
```

### 迁移流程

```bash
# 1. 开发环境
justdb migrate -c config/dev.yaml

# 2. 测试环境
justdb migrate -c config/test.yaml

# 3. 预生产环境（试运行）
justdb migrate -c config/staging.yaml --dry-run

# 4. 生产环境
justdb migrate -c config/prod.yaml
```

### 数据同步

```bash
# 从生产环境提取 Schema
justdb db2schema \
  -u jdbc:mysql://prod-db:3306/myapp \
  -o prod-schema.yaml

# 比对差异
justdb diff -s prod-schema.yaml

# 应用到开发环境
justdb migrate -c config/dev.yaml
```

## 回滚策略

### 自动回滚

```bash
# 迁移失败时自动回滚
justdb migrate --auto-rollback

# 手动回滚
justdb rollback 002
```

### 手动回滚

```yaml
Table:
  - name: users
    Column:
      - name: username
        type: VARCHAR(50)
        formerNames: [name]  # 保留历史名称
```

```bash
# 使用 formerNames 回滚
# 将 name 改回 username
justdb migrate

# JustDB 识别为重命名：
# ALTER TABLE users RENAME COLUMN username TO name;
```

### 数据备份恢复

```bash
# 迁移前备份
justdb backup -o backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复备份
mysql -u root -p myapp < backup_20240115_103000.sql
```

## 最佳实践

### 1. 迁移前检查清单

```bash
# 迁移前检查
justdb validate              # 1. 验证 Schema
justdb diff                  # 2. 查看差异
justdb migrate --dry-run     # 3. 试运行
justdb backup                # 4. 备份数据
justdb migrate               # 5. 执行迁移
justdb verify                # 6. 验证结果
```

### 2. 幂等性

确保迁移可以重复执行。

```yaml
Table:
  - name: users
    beforeCreates:
      - sql: |
          -- 使用 IF NOT EXISTS
          CREATE TABLE IF NOT EXISTS users_backup LIKE users;
```

```bash
# 使用幂等模式
justdb migrate --idempotent
```

### 3. 安全删除

避免误删除数据。

```yaml
# 使用 safe-drop 模式
# 删除操作会重命名而不是直接删除
```

```bash
justdb migrate --safe-drop

# users -> users_deleted_20240115103000
```

### 4. 分步迁移

将大迁移分解为小步骤。

```yaml
# 步骤 1：添加字段
Column:
  - name: new_field
    type: VARCHAR(100)
    nullable: true

# 步骤 2：填充数据
# 应用层处理

# 步骤 3：设置非空
Column:
  - name: new_field
    type: VARCHAR(100)
    nullable: false

# 步骤 4：删除旧字段
# old_field 被删除
```

### 5. 监控和日志

```bash
# 详细日志
justdb migrate --verbose

# 保存日志
justdb migrate 2>&1 | tee migration.log
```

## 常见场景

### 添加字段

```yaml
Column:
  - name: phone
    type: VARCHAR(20)
    nullable: true        # 首先允许 NULL
```

### 修改字段类型

```yaml
Column:
  - name: status_code
    type: INT
    formerNames: [status]  # 保留旧名称
```

### 删除字段

```yaml
# 先确认数据已迁移
# 然后从 Schema 中删除字段
Column:
  # old_field 被删除
```

### 重命名表

```yaml
Table:
  - name: users_new
    formerNames: [users]
    Column: [...]
```

### 添加索引

```yaml
Index:
  - name: idx_email
    columns: [email]
    unique: true
    algorithm: INPLACE    # 在线创建索引
```

## 下一步

<VPCard
  title="团队协作"
  desc="在团队中使用 JustDB 的最佳实践"
  link="/guide/team-collaboration.html"
/>

<VPCard
  title="性能优化"
  desc="优化迁移性能的建议"
  link="/guide/performance.html"
/>

<VPCard
  title="CI/CD 集成"
  desc="将 JustDB 集成到 CI/CD 流程"
  link="/guide/cicd.html"
/>
