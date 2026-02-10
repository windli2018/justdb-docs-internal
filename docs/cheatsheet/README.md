# 速查手册

本章节提供 JustDB 核心功能的快速参考指南，帮助您快速查找常用语法和配置。

## 目录

- [Serial 自增列](serial.md) - 自增列配置和用法
- [Virtual Column 虚拟列](virtual-column.md) - 虚拟列和可读列
- [Plugin 插件扩展](plugin.md) - 自定义插件开发
- [Type 类型映射](type-mapping.md) - 跨数据库类型映射
- [Lifecycle Hooks 生命周期钩子](lifecycle-hooks.md) - DDL 生命周期钩子
- [Reference System 引用系统](reference-system.md) - 组件复用和继承
- [Migration 迁移操作](migration.md) - Schema 迁移命令

## 快速导航

| 功能 | 文档 | 使用场景 |
|------|------|----------|
| 自增主键 | [Serial](serial.md) | MySQL AUTO_INCREMENT, PostgreSQL SERIAL |
| 关联查询 | [Virtual Column](virtual-column.md) | 预制数据可读性、运行时虚拟列 |
| 数据库适配 | [Plugin](plugin.md) | 新增数据库支持、自定义类型映射 |
| 类型转换 | [Type Mapping](type-mapping.md) | 跨数据库类型兼容 |
| 前后置脚本 | [Lifecycle Hooks](lifecycle-hooks.md) | DDL 执行前后执行自定义 SQL |
| 组件复用 | [Reference System](reference-system.md) | 公共列定义复用 |
| Schema 演进 | [Migration](migration.md) | Schema 版本管理和迁移 |

## 常用配置片段

### MySQL 自增主键

```xml
<Column name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
```

### PostgreSQL SERIAL

```xml
<Column name="id" type="BIGINT" primaryKey="true" serial="true"/>
```

### 虚拟列（关联查询）

```xml
<Column name="username" virtual="true" from="users.username" on="user_id"/>
```

### 外键约束

```xml
<Constraint type="FOREIGN_KEY" name="fk_user_role">
    <column>user_id</column>
    <referencedTable>users</referencedTable>
    <referencedColumn>id</referencedColumn>
</Constraint>
```

## 下一步

- 阅读 [快速开始](../getting-started/quick-start.md) 了解基础用法
- 查看 [参考文档](../reference/) 获取完整 API 说明
- 浏览 [设计文档](../design/) 深入理解架构设计
