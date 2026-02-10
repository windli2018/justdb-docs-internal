---
icon: code
title: JDBC 驱动实现
order: 2
category:
  - 设计文档
  - JDBC 驱动
tag:
  - jdbc
  - implementation
---

# JDBC 驱动实现

## 核心类

### JustdbDriver

JDBC 驱动主入口类，负责驱动注册和连接创建。

### JustdbDataSource

数据源实现，支持连接池配置。

### JustdbConnection

连接实现，管理事务和语句创建。

### JustdbPreparedStatement

预编译语句实现，支持参数绑定。

### JustdbResultSet

结果集实现，支持数据遍历和类型转换。

## 连接 URL 格式

```
jdbc:justdb:memory:/schema.yaml
jdbc:justdb:file:/path/to/schema.yaml
jdbc:justdb:classpath:/schema.yaml
```
