---
icon: rocket
date: 2024-01-01
title: 应用场景
order: 4
category:
  - 指南
  - 场景
tag:
  - 场景
  - 案例
  - 实践
---

# 应用场景

JustDB 适用于多种数据库开发场景，从简单的个人项目到复杂的企业级应用。以下是典型的应用场景和最佳实践。

## 1. 敏捷开发团队

### 场景描述

快速迭代的 Web 应用，频繁需要添加新表、修改字段、调整索引。

### 痛点

- 手写 SQL 脚本耗时且容易出错
- 需要管理大量迁移脚本文件
- 多人协作时容易出现脚本冲突
- Schema 变更文档维护困难

### JustDB 解决方案

```yaml
# schema/users.yaml
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
      - name: avatar
        type: VARCHAR(500)  # 新增字段
```

```bash
# 开发者修改 Schema
vim schema/users.yaml

# 应用变更
justdb migrate

# Git 提交
git add schema/users.yaml
git commit -m "添加用户头像字段"
git push

# 团队成员拉取后执行
justdb migrate
```

**收益**：
- 变更时间从 10 分钟缩短到 2 分钟
- 无需维护迁移脚本版本
- Git 冲突解决简单
- Schema 即文档

## 2. 微服务架构

### 场景描述

每个微服务独立管理自己的数据库，需要版本控制和独立部署。

### 痛点

- 每个服务需要独立的数据库迁移策略
- 服务间数据库 Schema 可能不一致
- 部署时数据库迁移容易失败
- 难以追踪每个服务的 Schema 版本

### JustDB 解决方案

```
user-service/
├── src/main/resources/
│   └── justdb/
│       └── users.yaml
├── pom.xml
└── application.yml

order-service/
├── src/main/resources/
│   └── justdb/
│       └── orders.yaml
├── pom.xml
└── application.yml
```

```yaml
# user-service/application.yml
justdb:
  enabled: true
  locations: classpath:justdb
  baseline-on-migrate: true  # 基线版本管理
```

```java
// user-service 启动时自动迁移用户数据库
@SpringBootApplication
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
        // 用户数据库已自动迁移到最新状态
    }
}
```

**收益**：
- 每个服务独立管理 Schema
- 自动基线版本管理
- 部署时自动执行迁移
- Schema 版本清晰可追溯

## 3. 多环境一致性

### 场景描述

开发、测试、预发布、生产环境需要保持数据库结构一致。

### 痛点

- 不同环境的 Schema 容易出现差异
- 手动执行 SQL 脚本容易遗漏
- 环境间数据迁移困难
- 生产环境发布风险高

### JustDB 解决方案

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
  password: ${DB_PASSWORD}  # 从环境变量读取
```

```bash
# 开发环境
justdb migrate -c config/dev.yaml

# 测试环境
justdb migrate -c config/test.yaml

# 生产环境（先预览）
justdb migrate -c config/prod.yaml --dry-run

# 确认无误后执行
justdb migrate -c config/prod.yaml
```

**收益**：
- 所有环境使用同一套 Schema 定义
- 变更前可预览生成的 SQL
- 降低生产环境发布风险
- 环境切换简单快捷

## 4. 数据库文档化

### 场景描述

需要维护数据库设计文档，供团队成员查阅。

### 痛点

- 数据库文档与实际 Schema 不同步
- 维护文档需要额外工作量
- 新人了解数据库结构困难
- 可视化图表需要手动更新

### JustDB 解决方案

```yaml
# Schema 即文档
Table:
  - id: orders
    name: 订单表
    comment: |
      存储所有订单信息，包括订单状态、金额、客户信息等。
      订单状态流转：待支付 -> 已支付 -> 已发货 -> 已完成
    Column:
      - name: order_no
        comment: 订单号，格式：YYYYMMDD + 序号
      - name: customer_id
        comment: 客户ID，关联 customers.id
      - name: total_amount
        comment: 订单总金额（单位：分）
      - name: status
        comment: 订单状态：pending/paid/shipped/completed
```

```bash
# 生成文档
justdb doc -f markdown -o DATABASE.md
justdb doc -f html -o DATABASE.html

# 生成 ER 图（需要 graphviz）
justdb erd -o erd.png
```

**收益**：
- Schema 和文档始终保持同步
- 支持多种文档格式
- 可视化 ER 图自动生成
- 新人快速了解数据库结构

## 5. CI/CD 集成

### 场景描述

在持续集成/持续部署流程中自动管理数据库。

### 痛点

- 需要手动执行数据库迁移
- 迁移失败时回滚困难
- 无法自动验证 Schema 变更
- 部署流程复杂

### JustDB 解决方案

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: testdb
        ports:
          - 3306:3306

    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK
        uses: actions/setup-java@v3
        with:
          java-version: '11'

      - name: Cache Maven packages
        uses: actions/cache@v3
        with:
          path: ~/.m2
          key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}

      - name: Migrate database (dry-run)
        run: justdb migrate --dry-run

      - name: Migrate database
        run: justdb migrate

      - name: Run tests
        run: mvn test

      - name: Validate schema
        run: justdb validate
```

```yaml
# .github/workflows/cd.yml
name: CD

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        run: |
          justdb migrate --dry-run
          justdb migrate
        env:
          DB_URL: ${{ secrets.DB_URL }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
```

**收益**：
- 自动执行数据库迁移
- 迁移前预览变更
- 失败时自动回滚
- 部署流程自动化

## 6. 跨数据库平台

### 场景描述

需要支持多种数据库（MySQL、PostgreSQL、Oracle 等），或需要在不同数据库间切换。

### 痛点

- 需要维护多套 SQL 脚本
- SQL 方言差异导致兼容性问题
- 数据库切换成本高
- 需要了解多种数据库语法

### JustDB 解决方案

```yaml
# 一套 Schema 定义，支持所有数据库
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true  # 自动适配不同数据库
      - name: username
        type: VARCHAR(50)
      - name: created_at
        type: TIMESTAMP
        defaultValueComputed: CURRENT_TIMESTAMP
```

```bash
# MySQL
justdb migrate -d mysql

# PostgreSQL
justdb migrate -d postgresql

# Oracle
justdb migrate -d oracle

# JustDB 自动生成对应数据库的 SQL
```

**收益**：
- 一套 Schema 支持所有数据库
- 自动处理方言差异
- 数据库切换零成本
- 降低学习成本

## 7. 数据库重构

### 场景描述

需要重构现有数据库结构，拆分大表、合并小表、优化索引。

### 痛点

- 需要手写复杂的 ALTER TABLE 脚本
- 数据迁移容易出错
- 重构过程难以回滚
- 需要停机维护

### JustDB 解决方案

```yaml
# 拆分大表
Table:
  - name: users_profile
    formerNames: [users]  # 从 users 重命名
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: username
        type: VARCHAR(50)
      - name: avatar
        type: VARCHAR(500)
      - name: bio
        type: TEXT

  - name: users_auth
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
      - name: user_id
        type: BIGINT
        referencedTable: users_profile
        referencedColumn: id
      - name: password_hash
        type: VARCHAR(255)
      - name: email
        type: VARCHAR(100)
```

```bash
# JustDB 自动生成重构 SQL
justdb migrate

# 生成的 SQL：
# 1. CREATE TABLE users_auth ...
# 2. INSERT INTO users_auth SELECT id, password_hash, email FROM users;
# 3. ALTER TABLE users RENAME TO users_profile;
# 4. ALTER TABLE users_auth ADD FOREIGN KEY ...
```

**收益**：
- 声明式定义重构目标
- 自动生成重构 SQL
- 支持增量迁移
- 可预览变更内容

## 8. AI 辅助开发

### 场景描述

通过自然语言快速创建和修改数据库 Schema。

### 痛点

- 不熟悉 JustDB Schema 语法
- 需要频繁查阅文档
- Schema 设计效率低

### JustDB 解决方案

```bash
# 启动交互式模式
justdb

# 使用 AI 创建表
> /ai 创建一个商品表，包含商品ID、名称、价格、库存、分类ID和状态

# AI 生成 Schema
Table:
  - name: products
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
      - name: name
        type: VARCHAR(255)
        nullable: false
      - name: price
        type: DECIMAL(10, 2)
        nullable: false
      - name: stock
        type: INT
        defaultValue: 0
      - name: category_id
        type: BIGINT
      - name: status
        type: VARCHAR(20)
        defaultValue: active
    Index:
      - name: idx_category
        columns: [category_id]
      - name: idx_status
        columns: [status]

# 确认并部署
> /migrate

# AI 优化建议
> /ai 分析当前 Schema 并给出优化建议

# AI 返回：
# 建议 1：为 products.name 添加全文索引以支持搜索
# 建议 2：考虑将 products.status 改为 ENUM 类型
# 建议 3：为 products.price 添加检查约束确保非负
```

**收益**：
- 自然语言交互，降低学习成本
- AI 辅助 Schema 设计
- 智能优化建议
- 提高开发效率

## 9. 教学和学习

### 场景描述

数据库课程教学或学习数据库设计。

### 痛点

- 学生需要学习复杂的 SQL 语法
- 实验环境搭建困难
- 作业批改和反馈困难

### JustDB 解决方案

```yaml
# 学生作业 - 简单直观
Table:
  - name: students
    Column:
      - name: id
        type: INT
        primaryKey: true
      - name: name
        type: VARCHAR(50)
      - name: grade
        type: DECIMAL(4, 2)
```

```bash
# 学生提交作业
git add homework.yaml
git commit -m "作业：学生表设计"
git push

# 教师自动批改
justdb validate homework.yaml
justdb diff homework.yaml solution.yaml
```

**收益**：
- 降低学习门槛
- 专注于设计而非语法
- 自动化作业批改
- 易于版本控制

## 10. 遗留系统迁移

### 场景描述

将遗留系统的数据库迁移到新架构。

### 痛点

- 遗留系统 Schema 复杂
- 缺少文档和设计说明
- 迁移风险高
- 数据迁移困难

### JustDB 解决方案

```bash
# 从遗留数据库提取 Schema
justdb db2schema \
    -u jdbc:mysql://legacy-db:3306/oldapp \
    -o legacy-schema.yaml

# 分析和重构
vim legacy-schema.yaml

# 生成差异报告
justdb diff legacy-schema.yaml new-schema.yaml

# 增量迁移
justdb migrate
```

**收益**：
- 自动提取现有 Schema
- 可视化差异分析
- 增量式迁移
- 降低迁移风险

## 选择指南

### 推荐使用 JustDB

<VPCard
  title="✅ 敏捷开发团队"
  desc="需要频繁变更数据库结构"
/>

<VPCard
  title="✅ 微服务架构"
  desc="每个服务独立管理数据库"
/>

<VPCard
  title="✅ 多环境部署"
  desc="需要保持环境一致性"
/>

<VPCard
  title="✅ CI/CD 集成"
  desc="自动化数据库管理"
/>

<VPCard
  title="✅ 跨数据库平台"
  desc="需要支持多种数据库"
/>

### 需要评估的场景

<VPCard
  title="⚠️ 复杂存储过程"
  desc="JustDB 主要关注 Schema 管理"
/>

<VPCard
  title="⚠️ 大量已有脚本"
  desc="迁移成本需要考虑"
/>

<VPCard
  title="⚠️ 特殊数据库特性"
  desc="可能需要插件扩展"
/>

## 下一步

<VPCard
  title="快速开始"
  desc="5分钟快速上手 JustDB"
  link="/getting-started/quick-start.html"
/>

<VPCard
  title="安装指南"
  desc="安装和配置 JustDB"
  link="/getting-started/installation.html"
/>

<VPCard
  title="Spring Boot 集成"
  desc="在 Spring Boot 中使用 JustDB"
  link="/getting-started/spring-boot-integration.html"
/>
