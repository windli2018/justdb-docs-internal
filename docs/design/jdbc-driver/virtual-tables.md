---
icon: table
title: 虚拟表
order: 3
category:
  - 设计文档
  - JDBC 驱动
tag:
  - jdbc
  - virtual-table
---

# 虚拟表

虚拟表是 JustDB JDBC 驱动的核心功能，允许通过标准 SQL 查询 Schema 定义。

## 系统虚拟表

### information_schema.tables

查询所有表定义。

### information_schema.columns

查询所有列定义。

### information_schema.indexes

查询所有索引定义。

## 使用示例

```sql
-- 查询所有表
SELECT * FROM information_schema.tables;

-- 查询指定表的列
SELECT * FROM information_schema.columns WHERE table_name = 'users';
```
