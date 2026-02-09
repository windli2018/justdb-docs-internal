---
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

1. 用 YAML/JSON/XML 声明你期望的数据库结构
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

创建文件 `users.yaml`：

```yaml
id: myapp
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
      - name: idx_username
        columns:
          - username
        unique: true
        comment: 用户名唯一索引
      - name: idx_email
        columns:
          - email
        unique: true
        comment: 邮箱唯一索引
```

### 第二步：部署到数据库

#### 方式一：使用 Java API

```java
import org.verydb.justdb.FormatFactory;
import org.verydb.justdb.SchemaDeployer;
import org.verydb.justdb.schema.Justdb;

import java.sql.Connection;
import java.sql.DriverManager;

public class QuickStart {
    public static void main(String[] args) throws Exception {
        // 加载 Schema
        Justdb schema = FormatFactory.loadFromFile("users.yaml");

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
justdb migrate users.yaml

# 或使用自动发现（将文件放到 justdb/ 目录）
mkdir justdb
mv users.yaml justdb/
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

修改 `users.yaml`：

```yaml
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

```yaml
Column:
  - name: user_name           # 新名称
    formerNames: [username]   # 旧名称
    type: VARCHAR(50)
    nullable: false
```

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
  title="YAML"
  desc="人类友好的配置格式，推荐使用"
/>

<VPCard
  title="JSON"
  desc="机器可读的数据交换格式"
/>

<VPCard
  title="XML"
  desc="企业级配置格式"
/>

&lt;CodeGroup&gt;
&lt;CodeGroupItem title="YAML"&gt;
```yaml
Table:
  - name: users
    Column:
      - name: id
        type: BIGINT
        primaryKey: true
```
&lt;/CodeGroupItem&gt;

&lt;CodeGroupItem title="JSON"&gt;
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
&lt;/CodeGroupItem&gt;

&lt;CodeGroupItem title="XML"&gt;
```xml
&lt;Justdb&gt;
  &lt;Table name="users"&gt;
    &lt;Column name="id" type="BIGINT" primaryKey="true"/&gt;
  &lt;/Table&gt;
&lt;/Justdb&gt;
```
&lt;/CodeGroupItem&gt;
&lt;/CodeGroup&gt;

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

- **文档**: [https://verydb.github.io/justdb](https://verydb.github.io/justdb)
- **GitHub**: [https://github.com/verydb/justdb](https://github.com/verydb/justdb)
- **问题反馈**: [GitHub Issues](https://github.com/verydb/justdb/issues)
