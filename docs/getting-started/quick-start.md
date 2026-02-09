---
icon: play
title: 5 分钟快速上手
order: 2
category:
  - 快速开始
  - 入门
tag:
  - 快速开始
  - 入门
  - 教程
---

# 快速开始

本指南将带你快速上手 JustDB，在 5 分钟内完成从安装到第一个 Schema 的部署。

## 准备工作

::: tip 开始之前
确保你已经安装了：
- **JDK 1.8+**
- **Maven 3.6+**（可选）
- **任意支持的数据库**（MySQL、PostgreSQL、H2 等）

如果还没有安装，请参考 [安装指南](./installation.html)
:::

## 快速体验

### 方式一：Maven 依赖

```xml
&lt;dependency&gt;
    &lt;groupId&gt;org.verydb.justdb&lt;/groupId&gt;
    &lt;artifactId&gt;justdb-core&lt;/artifactId&gt;
    &lt;version&gt;1.0.0&lt;/version&gt;
&lt;/dependency&gt;
```

```java
// QuickStart.java
import org.verydb.justdb.FormatFactory;
import org.verydb.justdb.SchemaDeployer;
import org.verydb.justdb.schema.Justdb;

import java.sql.Connection;
import java.sql.DriverManager;

public class QuickStart {
    public static void main(String[] args) throws Exception {
        // 加载 Schema
        Justdb schema = FormatFactory.loadFromFile("schema.yaml");

        // 部署到数据库
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/myapp", "root", "password")) {
            SchemaDeployer deployer = new SchemaDeployer(conn);
            deployer.deploy(schema);
            System.out.println("部署成功！");
        }
    }
}
```

### 方式二：CLI 工具

```bash
# 下载并安装 JustDB CLI
wget https://github.com/verydb/justdb/releases/download/v1.0.0/justdb-1.0.0-linux.tar.gz
tar -xzf justdb-1.0.0-linux.tar.gz
export PATH=$PATH:$PWD/bin

# 验证安装
justdb --version
```

### 方式三：Spring Boot

```xml
&lt;dependency&gt;
    &lt;groupId&gt;org.verydb.justdb&lt;/groupId&gt;
    &lt;artifactId&gt;justdb-spring-boot-starter&lt;/artifactId&gt;
    &lt;version&gt;1.0.0&lt;/version&gt;
&lt;/dependency&gt;
```

```yaml
# application.yml
justdb:
  enabled: true
  locations: classpath:justdb
```

## 创建第一个 Schema

创建文件 `schema.yaml`：

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
        comment: 用户ID
      - name: username
        type: VARCHAR(50)
        nullable: false
        comment: 用户名
      - name: email
        type: VARCHAR(100)
        comment: 邮箱
      - name: created_at
        type: TIMESTAMP
        nullable: false
        defaultValueComputed: CURRENT_TIMESTAMP
        comment: 创建时间
    Index:
      - name: idx_username
        columns: [username]
        unique: true
```

## 部署 Schema

### 使用 CLI

```bash
# 直接部署
justdb migrate schema.yaml

# 或者预览变更
justdb migrate schema.yaml --dry-run
```

### 使用 Java API

```bash
# 编译并运行
javac -cp justdb-core.jar QuickStart.java
java -cp .:justdb-core.jar QuickStart
```

### 使用 Spring Boot

```bash
# 将 schema.yaml 放到 src/main/resources/justdb/
mkdir -p src/main/resources/justdb
mv schema.yaml src/main/resources/justdb/

# 启动应用
mvn spring-boot:run
```

## 验证结果

连接数据库检查表是否创建：

```sql
-- MySQL
mysql> USE myapp;
mysql> SHOW TABLES;
mysql> DESC users;

-- PostgreSQL
\c myapp
\dt
\d users

-- H2（控制台）
SHOW TABLES;
DESCRIBE users;
```

## 修改 Schema

添加新字段：

```yaml
Column:
  - name: id
    type: BIGINT
    primaryKey: true
  - name: username
    type: VARCHAR(50)
  - name: email
    type: VARCHAR(100)
  - name: phone              # 新增
    type: VARCHAR(20)        # 新增
  - name: created_at
    type: TIMESTAMP
```

重新执行迁移：

```bash
justdb migrate
```

JustDB 会自动计算差异并只执行新增字段的操作：

```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
```

## 使用 AI 助手

```bash
# 启动交互式模式
justdb

# 使用 AI 创建表
> /ai 创建一个订单表，包含订单号、客户ID、金额和状态

# AI 自动生成 Schema，确认后部署
> /migrate
```

## 多格式支持

JustDB 支持多种格式，你可以选择最适合的：

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

格式转换：

```bash
justdb convert -f yaml -t json schema.yaml > schema.json
```

## 常用命令

```bash
# 部署 Schema
justdb migrate

# 预览变更
justdb migrate --dry-run

# 验证 Schema
justdb validate

# 从数据库提取 Schema
justdb db2schema -u jdbc:mysql://localhost:3306/myapp -o schema.yaml

# 生成文档
justdb doc -f markdown -o DATABASE.md

# 查看帮助
justdb --help
justdb migrate --help
```

## 下一步

恭喜你完成了快速开始！接下来可以：

<VPCard
  title="第一个 Schema"
  desc="深入学习 Schema 定义语法和最佳实践"
  link="/getting-started/first-schema.html"
/>

<VPCard
  title="迁移基础"
  desc="了解 Schema 迁移的详细机制"
  link="/getting-started/migration-basics.html"
/>

<VPCard
  title="Spring Boot 集成"
  desc="在 Spring Boot 项目中集成 JustDB"
  link="/getting-started/spring-boot-integration.html"
/>

<VPCard
  title="常见任务"
  desc="查看常见的数据库操作示例"
  link="/getting-started/common-tasks.html"
/>

## 获取帮助

- **文档**: [https://verydb.github.io/justdb](https://verydb.github.io/justdb)
- **GitHub**: [https://github.com/verydb/justdb](https://github.com/verydb/justdb)
- **问题反馈**: [GitHub Issues](https://github.com/verydb/justdb/issues)
