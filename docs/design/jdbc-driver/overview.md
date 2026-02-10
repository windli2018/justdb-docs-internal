---
icon: plug
title: JDBC 驱动概述
order: 1
category:
  - 设计文档
  - JDBC 驱动
tag:
  - jdbc
  - driver
---

# JDBC 驱动概述

JustDB JDBC 驱动提供标准的 JDBC 接口，允许 Java 应用程序以声明式方式使用 JustDB。

## 核心功能

- **标准 JDBC 接口**：实现完整的 JDBC 规范
- **内存数据库**：支持内存模式，无需真实数据库
- **SQL 查询**：支持 SELECT、INSERT、UPDATE、DELETE
- **事务管理**：完整的事务支持（ACID）
- **元数据查询**：DatabaseMetaData 接口

## 相关文档

- [MySQL 协议](./mysql-protocol.md) - MySQL 协议服务实现
