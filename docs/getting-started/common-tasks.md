---
icon: checklist
title: 常见任务
order: 7
category:
  - 快速开始
  - 任务
tag:
  - 任务
  - 示例
  - 实践
---

# 常见任务

本文档收集了 JustDB 的常见使用场景和解决方案。

## 创建表

### 基本表

```yaml
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

### 带注释的表

```yaml
Table:
  - name: orders
    comment: 订单表，存储所有订单信息
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        comment: 订单ID
      - name: order_no
        type: VARCHAR(50)
        comment: 订单号
```

### 多表创建

```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)

  - name: orders
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: user_id
        type: BIGINT
```

## 添加列

### 单列添加

```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
      - name: email         # 新增
        type: VARCHAR(100)  # 新增
```

### 多列添加

```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
      - name: email         # 新增
        type: VARCHAR(100)  # 新增
      - name: phone         # 新增
        type: VARCHAR(20)   # 新增
      - name: address       # 新增
        type: TEXT          # 新增
```

### 添加带约束的列

```yaml
Column:
  - name: email
    type: VARCHAR(100)
    unique: true           # 唯一约束
    nullable: false        # 非空约束
    comment: 邮箱地址
```

## 修改列

### 修改列类型

```yaml
Column:
  - name: username
    type: VARCHAR(100)     # 从 VARCHAR(50) 改为 VARCHAR(100)
```

### 修改列名（重命名）

```yaml
Column:
  - name: user_name        # 新名称
    formerNames: [username]  # 旧名称
    type: VARCHAR(50)
```

### 添加约束

```yaml
Column:
  - name: email
    type: VARCHAR(100)
    unique: true           # 新增唯一约束
    nullable: false        # 新增非空约束
```

### 修改默认值

```yaml
Column:
  - name: status
    type: VARCHAR(20)
    defaultValue: active   # 新增默认值
```

## 删除列

### 删除单列

```yaml
# 从 Schema 文件中移除列定义
# JustDB 会自动检测并删除
Column:
  - name: id
    type: BIGINT
    primaryKey: true
  # - name: phone        # 删除此列
  #   type: VARCHAR(20)
```

### 安全删除

```bash
# 使用安全删除模式（重命名而不是直接删除）
justdb migrate --safe-drop
```

## 创建索引

### 普通索引

```yaml
Index:
  - name: idx_username
    columns: [username]
    comment: 用户名索引
```

### 唯一索引

```yaml
Index:
  - name: idx_email
    columns: [email]
    unique: true
    comment: 邮箱唯一索引
```

### 复合索引

```yaml
Index:
  - name: idx_user_status
    columns: [user_id, status]
    comment: 用户状态复合索引
```

### 全文索引

```yaml
Index:
  - name: idx_content_fulltext
    columns: [content]
    type: FULLTEXT
    comment: 内容全文索引
```

## 删除索引

```yaml
# 从 Schema 文件中移除索引定义
# JustDB 会自动检测并删除
Index:
  # - name: idx_old       # 删除此索引
  #   columns: [field]
```

## 外键关系

### 创建外键

```yaml
Table:
  - name: orders
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: user_id
        type: BIGINT
        nullable: false
    Constraint:
      - name: fk_orders_user
        type: FOREIGN_KEY
        referencedTable: users
        referencedColumn: id
        foreignKey: user_id
        onDelete: CASCADE
```

### 级联操作

```yaml
Constraint:
  - type: FOREIGN_KEY
    referencedTable: users
    referencedColumn: id
    foreignKey: user_id
    onDelete: CASCADE      # 级联删除
    onUpdate: RESTRICT     # 更新限制
```

## 表重命名

### 基本重命名

```yaml
Table:
  - name: users           # 新名称
    formerNames: [user]   # 旧名称
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```

### 批量重命名

```yaml
Table:
  - name: user_profiles          # 新名称
    formerNames: [profiles]      # 旧名称
    Column: []

  - name: order_items            # 新名称
    formerNames: [items]         # 旧名称
    Column: []
```

## 数据导出

### 导出为 SQL

```bash
justdb migrate --dry-run > migration.sql
```

### 导出 Schema

```bash
# 导出为 YAML
justdb db2schema -u jdbc:mysql://localhost:3306/myapp -o schema.yaml

# 导出为 JSON
justdb db2schema -u jdbc:mysql://localhost:3306/myapp -f json -o schema.json
```

### 生成文档

```bash
# 生成 Markdown 文档
justdb doc -f markdown -o DATABASE.md

# 生成 HTML 文档
justdb doc -f html -o DATABASE.html
```

## 格式转换

### YAML 转 JSON

```bash
justdb convert -f yaml -t json schema.yaml > schema.json
```

### JSON 转 XML

```bash
justdb convert -f json -t xml schema.json > schema.xml
```

### XML 转 YAML

```bash
justdb convert -f xml -t yaml schema.xml > schema.yaml
```

## 验证和检查

### 验证 Schema

```bash
# 验证 Schema 文件
justdb validate schema.yaml

# 验证数据库一致性
justdb validate
```

### 查看差异

```bash
# 查看当前数据库与 Schema 的差异
justdb diff

# 保存差异到文件
justdb diff > diff.txt
```

### 生成 ER 图

```bash
# 生成 ER 图（需要 graphviz）
justdb erd -o erd.png

# 生成 SVG 格式
justdb erd -f svg -o erd.svg
```

## AI 助手

### 创建表

```bash
justdb ai "创建一个商品表，包含商品ID、名称、价格、库存和分类"
```

### 优化建议

```bash
justdb ai "分析当前 Schema 并给出优化建议"
```

### 生成文档

```bash
justdb ai "为当前 Schema 生成详细的文档说明"
```

## 批量操作

### 批量迁移

```bash
# 迁移多个 Schema 文件
justdb migrate justdb/*.yaml
```

### 批量验证

```bash
# 验证多个 Schema 文件
justdb validate justdb/*.yaml
```

### 批量转换

```bash
# 批量转换格式
for file in justdb/*.yaml; do
    justdb convert -f yaml -t json "$file" > "output/$(basename $file .yaml).json"
done
```

## 环境管理

### 开发环境

```bash
justdb migrate -c config/dev.yaml
```

### 测试环境

```bash
justdb migrate -c config/test.yaml
```

### 生产环境

```bash
# 先预览
justdb migrate -c config/prod.yaml --dry-run

# 确认后执行
justdb migrate -c config/prod.yaml
```

## 故障恢复

### 回滚迁移

```bash
# 回滚到指定版本
justdb rollback 002

# 回滚最近一次
justdb rollback --last
```

### 修复失败的迁移

```bash
# 修复并继续
justdb migrate --repair
```

### 重置数据库

```bash
# 危险操作！慎用
justdb migrate --reset
```

## 脚本自动化

### 部署脚本

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Starting database migration..."

# 预览变更
justdb migrate --dry-run

# 确认
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 执行迁移
    justdb migrate
    echo "Migration completed successfully!"
else
    echo "Migration cancelled."
    exit 1
fi
```

### CI/CD 脚本

```yaml
# .github/workflows/migrate.yml
name: Database Migration

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup JustDB
        run: |
          wget https://github.com/verydb/justdb/releases/latest/download/justdb.tar.gz
          tar -xzf justdb.tar.gz

      - name: Migrate database
        run: |
          justdb migrate --dry-run
          justdb migrate
        env:
          DB_URL: ${{ secrets.DB_URL }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
```

## 性能优化

### 批量迁移

```yaml
justdb:
  batch-size: 100
```

### 连接池配置

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 10
      connection-timeout: 30000
```

### 并行执行

```bash
# 并行执行多个 Schema 迁移
justdb migrate --parallel
```

## 下一步

<VPCard
  title="CLI 参考"
  desc="命令行工具完整参考"
  link="/reference/cli.html"
/>

<VPCard
  title="Java API"
  desc="深入了解 JustDB Java API"
  link="/reference/java-api.html"
/>

<VPCard
  title="设计文档"
  desc="了解更多设计细节"
  link="/guide/design-philosophy.html"
/>
