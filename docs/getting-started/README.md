---
date: 2024-01-01
icon: rocket
title: 快速开始
order: 1
category:
  - 快速开始
  - 入门
tag:
  - 入门
  - 快速开始
---

# 快速开始

欢迎来到 JustDB！本指南将帮助你在 5 分钟内快速上手 JustDB。

## 什么是 JustDB？

JustDB 是一个**所见即所得的数据库开发套件**，你只需要：

1. 用 XML/YAML/JSON/SQL/TOML 声明你期望的数据库结构
2. JustDB 自动计算并执行变更
3. 完成！

**核心特性**：
- ✅ 声明式 Schema 定义
- ✅ 自动差异计算和迁移
- ✅ 支持 30+ 数据库
- ✅ AI 集成
- ✅ JDBC 驱动
- ✅ Spring Boot 集成

## 5 分钟快速体验

### 环境准备

::: tip 环境要求
- **Java**: JDK 1.8 或更高版本
- **数据库**: 任意支持的数据库（MySQL、PostgreSQL、H2 等）
- **构建工具**: Maven 3.6+（可选）
:::

### 第一步：创建第一个 Schema

创建 Schema 文件：

::: code-tabs
@tab XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- users.xml -->
<Justdb namespace="com.example">
    <Table id="users" name="用户表" comment="存储系统用户信息">
        <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"
                comment="用户ID，主键自增"/>
        <Column name="username" type="VARCHAR(50)" nullable="false"
                comment="用户名，不能为空"/>
        <Column name="email" type="VARCHAR(100)" comment="邮箱地址"/>
        <Column name="created_at" type="TIMESTAMP" nullable="false"
                defaultValueComputed="CURRENT_TIMESTAMP" comment="创建时间"/>
        <Index id="idx_username" unique="true" comment="用户名唯一索引">
            <IndexColumn name="username"/>
        </Index>
        <Index id="idx_email" unique="true" comment="邮箱唯一索引">
            <IndexColumn name="email"/>
        </Index>
    </Table>
</Justdb>
```

@tab YAML
```yaml
# users.yaml
namespace: com.example
Table:
  - id: users
    name: 用户表
    comment: 存储系统用户信息
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
        comment: 用户ID，主键自增
      - name: username
        type: VARCHAR(50)
        nullable: false
        comment: 用户名，不能为空
      - name: email
        type: VARCHAR(100)
        comment: 邮箱地址
      - name: created_at
        type: TIMESTAMP
        nullable: false
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: 创建时间
    Index:
      - id: idx_username
        columns:
          - username
        unique: true
        comment: 用户名唯一索引
      - id: idx_email
        columns:
          - email
        unique: true
        comment: 邮箱唯一索引
```

@tab JSON
```json
{
  "namespace": "com.example",
  "Table": [
    {
      "id": "users",
      "name": "用户表",
      "comment": "存储系统用户信息",
      "Column": [
        {
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true,
          "autoIncrement": true,
          "comment": "用户ID，主键自增"
        },
        {
          "name": "username",
          "type": "VARCHAR(50)",
          "nullable": false,
          "comment": "用户名，不能为空"
        },
        {
          "name": "email",
          "type": "VARCHAR(100)",
          "comment": "邮箱地址"
        },
        {
          "name": "created_at",
          "type": "TIMESTAMP",
          "nullable": false,
          "defaultValueComputed": "CURRENT_TIMESTAMP",
          "comment": "创建时间"
        }
      ],
      "Index": [
        {
          "id": "idx_username",
          "columns": ["username"],
          "unique": true,
          "comment": "用户名唯一索引"
        },
        {
          "id": "idx_email",
          "columns": ["email"],
          "unique": true,
          "comment": "邮箱唯一索引"
        }
      ]
    }
  ]
}
```

@tab SQL
```sql
-- users.sql
-- JustDB 也支持 SQL 格式的 Schema 定义

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID，主键自增',
    username VARCHAR(50) NOT NULL COMMENT '用户名，不能为空',
    email VARCHAR(100) COMMENT '邮箱地址',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY idx_username (username) COMMENT '用户名唯一索引',
    UNIQUE KEY idx_email (email) COMMENT '邮箱唯一索引'
) COMMENT '用户表';
```

@tab TOML
```toml
namespace = "com.example"

[[Table]]
id = "users"
name = "用户表"
comment = "存储系统用户信息"

[[Table.Column]]
name = "id"
type = "BIGINT"
primaryKey = true
autoIncrement = true
comment = "用户ID，主键自增"

[[Table.Column]]
name = "username"
type = "VARCHAR(50)"
nullable = false
comment = "用户名，不能为空"

[[Table.Column]]
name = "email"
type = "VARCHAR(100)"
comment = "邮箱地址"

[[Table.Column]]
name = "created_at"
type = "TIMESTAMP"
nullable = false
defaultValueComputed = "CURRENT_TIMESTAMP"
comment = "创建时间"

[[Table.Index]]
id = "idx_username"
unique = true
comment = "用户名唯一索引"

[[Table.Index.IndexColumn]]
name = "username"

[[Table.Index]]
id = "idx_email"
unique = true
comment = "邮箱唯一索引"

[[Table.Index.IndexColumn]]
name = "email"
```
:::

### 第二步：部署到数据库

#### 方式一：使用 Java API

```java
import ai.justdb.justdb.FormatFactory;
import ai.justdb.justdb.SchemaDeployer;
import ai.justdb.justdb.schema.Justdb;

import java.sql.Connection;
import java.sql.DriverManager;

public class QuickStart {
    public static void main(String[] args) throws Exception {
        // 加载 Schema
        Justdb schema = FormatFactory.loadFromFile("users.xml");

        // 连接数据库
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/myapp", "root", "password")) {

            // 部署 Schema
            SchemaDeployer deployer = new SchemaDeployer(conn);
            deployer.deploy(schema);

            System.out.println("数据库部署成功！");
        }
    }
}
```

#### 方式二：使用 CLI 工具

```bash
# 直接指定文件
justdb migrate users.xml

# 或使用自动发现（将文件放到 justdb/ 目录）
mkdir justdb
mv users.xml justdb/
justdb migrate
```

#### 方式三：使用 Spring Boot

```yaml
# application.yml
justdb:
  enabled: true
  locations: classpath:justdb
  dry-run: false

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myapp
    username: root
    password: password
```

```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        // 数据库已自动迁移！
    }
}
```

### 第三步：验证结果

连接数据库验证表已创建：

```sql
mysql> USE myapp;
mysql> SHOW TABLES;
+----------------+
| Tables_in_myapp |
+----------------+
| users           |
+----------------+

mysql> DESC users;
+-------------+--------------+------+-----+---------+----------------+
| Field       | Type         | Null | Key | Default | Extra          |
+-------------+--------------+------+-----+---------+----------------+
| id          | bigint(20)   | NO   | PRI | NULL    | auto_increment |
| username    | varchar(50)  | NO   | MUL | NULL    |                |
| email       | varchar(100) | YES  | MUL | NULL    |                |
| created_at  | timestamp    | NO   |     | CURRENT_TIMESTAMP |                |
+-------------+--------------+------+-----+---------+----------------+
```

## 增量迁移

### 添加新字段

修改 Schema 文件：

::: code-tabs
@tab XML
```xml
<!-- users.xml -->
<Table id="users">
    <Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column name="username" type="VARCHAR(50)" nullable="false"/>
    <Column name="email" type="VARCHAR(100)"/>
    <Column name="phone" type="VARCHAR(20)" comment="联系电话"/> <!-- 新增 -->
    <Column name="created_at" type="TIMESTAMP" nullable="false"
            defaultValueComputed="CURRENT_TIMESTAMP"/>
</Table>
```

@tab YAML
```yaml
# users.yaml
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
  - name: phone              # 新增
    type: VARCHAR(20)        # 新增
    comment: 联系电话         # 新增
  - name: created_at
    type: TIMESTAMP
    nullable: false
    defaultValueComputed: CURRENT_TIMESTAMP
```

@tab JSON
```json
{
  "Column": [
    {"name": "id", "type": "BIGINT", "primaryKey": true, "autoIncrement": true},
    {"name": "username", "type": "VARCHAR(50)", "nullable": false},
    {"name": "email", "type": "VARCHAR(100)"},
    {"name": "phone", "type": "VARCHAR(20)", "comment": "联系电话"},
    {"name": "created_at", "type": "TIMESTAMP", "nullable": false, "defaultValueComputed": "CURRENT_TIMESTAMP"}
  ]
}
```

@tab SQL
```sql
-- users.sql - 修改后 - 添加了 phone 字段
-- JustDB 解析 SQL 格式的 Schema 定义并计算差异

ALTER TABLE users ADD COLUMN phone VARCHAR(20) COMMENT '联系电话';
```

@tab TOML
```toml
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

[[Table.Column]]
name = "phone"           # 新增
type = "VARCHAR(20)"
comment = "联系电话"

[[Table.Column]]
name = "created_at"
type = "TIMESTAMP"
nullable = false
defaultValueComputed = "CURRENT_TIMESTAMP"
```
:::

执行迁移：

```bash
justdb migrate

# 输出：
# [INFO] Calculating schema diff...
# [INFO] Adding column: users.phone
# [INFO] JustDB migration completed successfully
```

JustDB 自动生成并执行：

```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20) COMMENT '联系电话';
```

### 重命名字段

使用 `formerNames` 标识旧名称：

::: code-tabs
@tab XML
```xml
<Column name="user_name" formerNames="username" type="VARCHAR(50)" nullable="false"/>
```

@tab YAML
```yaml
Column:
  - name: user_name           # 新名称
    formerNames: [username]   # 旧名称
    type: VARCHAR(50)
    nullable: false
```

@tab JSON
```json
{
  "Column": [
    {
      "name": "user_name",
      "formerNames": ["username"],
      "type": "VARCHAR(50)",
      "nullable": false
    }
  ]
}
```

@tab SQL
```sql
-- users.sql - 修改后 - 重命名字段
-- JustDB 解析 SQL 格式的 Schema 定义并计算差异

ALTER TABLE users CHANGE COLUMN username user_name VARCHAR(50) NOT NULL COMMENT '用户名';
```

@tab TOML
```toml
[[Table.Column]]
name = "user_name"
formerNames = ["username"]
type = "VARCHAR(50)"
nullable = false
```
:::

执行迁移：

```bash
justdb migrate

# JustDB 自动生成：
# ALTER TABLE users CHANGE COLUMN username user_name VARCHAR(50) NOT NULL;
```

## 使用 AI 快速创建 Schema

```bash
# 启动交互式模式
justdb

# 使用 AI 创建表
> /ai 创建一个商品表，包含商品ID、名称、价格、库存、分类ID和状态

# AI 会生成 Schema 并自动加载
# 您可以直接 /migrate 部署
```

## 多格式支持

JustDB 支持多种格式，选择最适合你的：

<VPCard
  title="XML"
  desc="企业级配置格式，结构清晰，推荐使用"
/>

<VPCard
  title="YAML"
  desc="人类友好的配置格式"
/>

<VPCard
  title="JSON"
  desc="机器可读的数据交换格式"
/>

<VPCard
  title="SQL"
  desc="标准 SQL DDL 语句格式"
/>

<VPCard
  title="TOML"
  desc="现代应用配置格式"
/>

::: code-tabs
@tab XML
```xml
<Justdb>
  <Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
  </Table>
</Justdb>
```

@tab YAML
```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```

@tab JSON
```json
{
  "Table": [
    {
      "name": "users",
      "Column": [
        {
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true
        }
      ]
    }
  ]
}
```

@tab SQL
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY
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
```
:::

## 常用命令

```bash
# 部署 Schema
justdb migrate

# 预览变更（不执行）
justdb migrate --dry-run

# 验证 Schema
justdb validate

# 格式转换
justdb convert -f yaml -t json schema.yaml > schema.json

# 从数据库提取 Schema
justdb db2schema -u jdbc:mysql://localhost:3306/myapp -o schema.yaml

# 生成文档
justdb doc -f markdown -o DATABASE.md

# AI 助手
justdb ai "创建一个订单表"
```

## 下一步

### 深入学习

<VPCard
  title="第一个 Schema"
  desc="深入学习 Schema 定义语法"
  link="/getting-started/first-schema.html"
/>

<VPCard
  title="迁移基础"
  desc="了解 Schema 迁移的详细机制"
  link="/getting-started/migration-basics.html"
/>

<VPCard
  title="Spring Boot 集成"
  desc="在 Spring Boot 项目中使用 JustDB"
  link="/getting-started/spring-boot-integration.html"
/>

### 实用指南

<VPCard
  title="常见任务"
  desc="查看常见的数据库操作示例"
  link="/getting-started/common-tasks.html"
/>

<VPCard
  title="安装指南"
  desc="详细的安装和配置说明"
  link="/getting-started/installation.html"
/>

### 了解更多

<VPCard
  title="什么是 JustDB"
  desc="了解 JustDB 的核心概念"
  link="/guide/what-is-justdb.html"
/>

<VPCard
  title="为什么选择 JustDB"
  desc="对比其他工具，了解 JustDB 优势"
  link="/guide/why-justdb.html"
/>

## 获取帮助

- **文档**: [https://justdb.github.io/justdb](https://justdb.github.io/justdb)
- **GitHub**: [https://github.com/justdb/justdb](https://github.com/justdb/justdb)
- **问题反馈**: [GitHub Issues](https://github.com/justdb/justdb/issues)
