---
home: true
title: JustDB
icon: home
titleTemplate: false

heroImage: /logo.png

heroText: JustDB
tagline: 所见即所得数据库开发套件

actions:
  - text: 快速开始
    link: /getting-started/
    type: primary

  - text: 项目介绍
    link: /guide/what-is-justdb.html
    type: secondary

features:
  - title: 声明式 Schema 定义
    details: 通过 YAML、JSON、XML 等格式定义数据库结构，支持多数据库方言自动转换
    link: /reference/formats/

  - title: 智能差异迁移
    details: 自动计算 Schema 差异，生成安全的增量迁移脚本
    link: /design/migration-system/

  - title: 多数据库支持
    details: 支持 MySQL、PostgreSQL、Oracle、SQL Server 等 30+ 数据库
    link: /reference/databases/

  - title: 完整 JDBC 驱动
    details: 提供 JDBC 4.2 标准驱动，可直接在应用中使用
    link: /reference/api/jdbc-driver.html

  - title: AI 集成
    details: 支持自然语言操作数据库 Schema，智能生成迁移方案
    link: /reference/ai/

  - title: 插件系统
    details: 灵活的插件架构，支持自定义模板、类型映射和扩展点
    link: /development/plugin-development/

footer: MIT Licensed | Copyright © 2024-present JustDB Team
---

## 什么是 JustDB？

JustDB 是一个创新的**所见即所得数据库开发套件**，开发者只需编写期望的数据库 Schema 和字典数据，工具将自动管理和维护数据库的升级，确保始终按照开发者的意愿完成数据库部署。

### 核心价值

- **简化数据库开发**：告别手写 SQL 脚本，使用声明式 Schema 定义
- **版本控制友好**：Schema 文件是纯文本，可以纳入 Git 版本控制
- **跨数据库兼容**：一次定义，支持多种数据库方言
- **智能迁移**：自动计算差异，生成安全的增量迁移脚本
- **开箱即用**：提供完整的 JDBC 驱动和 Spring Boot 集成

### 典型应用场景

- **微服务架构**：每个服务独立管理自己的数据库 Schema
- **多租户系统**：支持分库分表，灵活的 Schema 演进
- **CI/CD 集成**：自动化数据库部署和升级
- **开发测试**：快速搭建和重置测试数据库

## 快速上手

```bash
# 安装 CLI 工具
npm install -g @justdb/cli

# 创建第一个 Schema
justdb init

# 部署到数据库
justdb migrate
```

<CodeGroup>
<CodeGroupItem title="YAML">

```yaml
id: mydb
namespace: com.example
Table:
  - id: users
    name: 用户表
    Column:
      - id: user_id
        name: id
        type: BIGINT
        primaryKey: true
        autoIncrement: true
      - id: user_name
        name: username
        type: VARCHAR(255)
        nullable: false
```

</CodeGroupItem>

<CodeGroupItem title="JSON">

```json
{
  "id": "mydb",
  "namespace": "com.example",
  "Table": [
    {
      "id": "users",
      "name": "用户表",
      "Column": [
        {
          "id": "user_id",
          "name": "id",
          "type": "BIGINT",
          "primaryKey": true,
          "autoIncrement": true
        },
        {
          "id": "user_name",
          "name": "username",
          "type": "VARCHAR(255)",
          "nullable": false
        }
      ]
    }
  ]
}
```

</CodeGroupItem>
</CodeGroup>

## 下一步

- [了解 JustDB 的设计理念](./design-philosophy.md)
- [查看快速开始指南](../getting-started/)
- [探索参考文档](../reference/)
- [阅读设计文档](../design/)
