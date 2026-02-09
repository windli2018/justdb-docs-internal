---
title: Schema 系统概述
icon: database
order: 1
category: 设计文档
tags:
  - schema
  - architecture
  - design
---

# Schema 系统概述

## 文档概述

JustDB Schema 是一个用于描述数据库结构的声明式框架，支持多种数据库类型（MySQL、PostgreSQL、Oracle、H2 等），并提供统一的 DSL（领域特定语言）来定义表、视图、索引、约束等数据库对象。

**版本**: 1.0
**最后更新**: 2026-02-09
**维护者**: Wind Li

## 核心特性

- **数据库无关性**: 同一份 Schema 可生成多种数据库的 DDL
- **声明式定义**: 描述"是什么"而非"怎么做"
- **继承与复用**: 支持 `referenceId` 实现组件复用
- **生命周期管理**: 提供完整的 before/after 钩子支持
- **条件执行**: 支持基于数据库类型的条件 SQL 执行
- **演进追踪**: 内置 Schema 变更追踪机制

## 支持的数据库对象

| 对象类型 | 说明 | 状态 |
|---------|------|------|
| Database | 数据库定义 | ✓ |
| Table | 表定义 | ✓ |
| Column | 列定义 | ✓ |
| View | 视图定义 | ✓ |
| Index | 索引定义 | ✓ |
| Constraint | 约束定义 | ✓ |
| Trigger | 触发器定义 | ✓ |
| Sequence | 序列定义 | ✓ |
| Procedure | 存储过程定义 | ✓ |
| Query | 命名查询定义 | ✓ |
| Data | 数据导出定义 | ✓ |

## 设计理念

### 核心原则

#### 1. 简洁性 (Simplicity)
- 优先选择最简洁的表达方式
- 避免冗余的配置选项
- 提供合理的默认值

#### 2. 一致性 (Consistency)
- 统一的命名规范
- 统一的类型系统
- 统一的生命周期钩子命名

#### 3. 可扩展性 (Extensibility)
- 通过 `UnknownValues` 基类支持动态属性
- 通过插件系统支持数据库特定扩展
- 开放的继承层次结构

#### 4. 向后兼容 (Backward Compatibility)
- 通过 `@JsonAlias` 支持旧字段名
- 提供平滑的迁移路径

## 类型层次结构

```
Item (基础项)
├── UnknownValues (动态扩展机制)
├── SchemaSense (上下文持有者)
├── QueryAble (生命周期钩子)
│   ├── Table (表)
│   ├── View (视图)
│   └── Query (查询)
├── Column (列)
├── Index (索引)
├── Constraint (约束)
├── Trigger (触发器)
├── Sequence (序列)
└── Procedure (存储过程)

Justdb (Schema 根节点)
└── SchemaSense
```

## Schema 根节点结构

```
Justdb (namespace)
├── Database[]        - 数据库定义
├── Import[]          - 前置导入
├── Property[]        - Schema 属性
├── Column[]          - 全局列定义
├── Table[]           - 表定义
├── View[]            - 视图定义
├── Query[]           - 查询定义
├── Index[]           - 全局索引定义
├── Constraint[]      - 全局约束定义
├── Trigger[]         - 触发器定义
├── Sequence[]        - 序列定义
├── Procedure[]       - 存储过程定义
├── Data[]            - 数据导出定义
├── Include[]         - 后置导入
├── Report[]          - 迁移报告
├── tableScopes       - 表范围过滤器
└── databaseScopes    - 数据库范围过滤器
```

## 核心子系统

### 1. 类型层次系统

详细的类型层次结构请参考：[类型层次结构](./type-hierarchy.md)

### 2. 别名系统

支持多种命名格式的别名，保持向后兼容。详见：[别名系统](./alias-system.md)

### 3. Schema 演进

通过 `referenceId` 和 `formerNames` 实现 Schema 演进追踪。详见：[Schema 演进](./schema-evolution.md)

### 4. 扩展点系统

通过 `UnknownValues` 和插件系统实现动态扩展。详见：[扩展点系统](./extension-points.md)

### 5. 生命周期钩子

支持完整的 DDL 生命周期钩子，允许在操作前后执行自定义 SQL。

| 钩子 | 执行时机 | 对象级别 |
|------|---------|---------|
| `beforeCreates` | CREATE TABLE/VIEW/INDEX 等 | Table/View/Index |
| `afterCreates` | CREATE TABLE/VIEW/INDEX 等 | Table/View/Index |
| `beforeDrops` | DROP TABLE/VIEW/INDEX 等 | Table/View/Index |
| `afterDrops` | DROP TABLE/VIEW/INDEX 等 | Table/View/Index |
| `beforeAlters` | ALTER TABLE/VIEW/COLUMN 等 | Table/View/Column |
| `afterAlters` | ALTER TABLE/VIEW/COLUMN 等 | Table/View/Column |
| `beforeAdds` | ADD COLUMN/INDEX/CONSTRAINT | Table/View |
| `afterAdds` | ADD COLUMN/INDEX/CONSTRAINT | Table/View |

## 完整 Schema 示例

```xml
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;Justdb id="ecommerce-schema" namespace="com.example.ecommerce"&gt;

    &lt;!-- 全局列定义 --&gt;
    &lt;Column id="global_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/&gt;
    &lt;Column id="global_created_at" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/&gt;
    &lt;Column id="global_updated_at" name="updated_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/&gt;

    &lt;!-- 用户表 --&gt;
    &lt;Table id="table_users" name="users" comment="用户表"&gt;
        &lt;Column id="col_users_id" referenceId="global_id" name="id"/&gt;
        &lt;Column id="col_users_username" name="username" type="VARCHAR(50)" nullable="false"/&gt;
        &lt;Column id="col_users_email" name="email" type="VARCHAR(100)" nullable="false"/&gt;
        &lt;Column id="col_users_created_at" referenceId="global_created_at" name="created_at"/&gt;
        &lt;Column id="col_users_updated_at" referenceId="global_updated_at" name="updated_at"/&gt;

        &lt;!-- 唯一索引 --&gt;
        &lt;Index id="idx_users_username" name="idx_users_username" unique="true" columns="username"/&gt;
        &lt;Index id="idx_users_email" name="idx_users_email" unique="true" columns="email"/&gt;

        &lt;!-- PostgreSQL 专用创建索引钩子 --&gt;
        &lt;afterCreates&gt;
            &lt;ConditionalSqlScript dbms="postgresql"&gt;
                CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);
            &lt;/ConditionalSqlScript&gt;
        &lt;/afterCreates&gt;
    &lt;/Table&gt;

    &lt;!-- 订单表 --&gt;
    &lt;Table id="table_orders" name="orders" comment="订单表"&gt;
        &lt;Column id="col_orders_id" referenceId="global_id" name="id"/&gt;
        &lt;Column id="col_orders_user_id" name="user_id" type="BIGINT" nullable="false"/&gt;
        &lt;Column id="col_orders_status" name="status" type="VARCHAR(20)" defaultValue="'pending'"/&gt;
        &lt;Column id="col_orders_total_amount" name="total_amount" type="DECIMAL(10,2)" defaultValue="0.00"/&gt;
        &lt;Column id="col_orders_created_at" referenceId="global_created_at" name="created_at"/&gt;
        &lt;Column id="col_orders_updated_at" referenceId="global_updated_at" name="updated_at"/&gt;

        &lt;!-- 外键约束 --&gt;
        <Constraint id="fk_orders_user_id" name="fk_orders_user_id" type="FOREIGN_KEY"
                    referencedTable="users" referencedColumn="id">
            user_id
        &lt;/Constraint&gt;

        &lt;!-- 状态索引 --&gt;
        &lt;Index id="idx_orders_status" name="idx_orders_status" columns="status"/&gt;
    &lt;/Table&gt;

    &lt;!-- 数据导出定义 --&gt;
    <Data id="data_users" name="users" table="users" dataExportStrategy="PARTIAL_DATA"
          maxExportRecords="1000" exportOrderField="created_at" exportOrderAsc="false">
        &lt;dataFilterCondition&gt;status = 'active'&lt;/dataFilterCondition&gt;
    &lt;/Data&gt;

    &lt;!-- 表范围过滤器 --&gt;
    &lt;tableScopes&gt;
        &lt;includes&gt;users*, orders*&lt;/includes&gt;
        &lt;excludes&gt;*_temp, *_bak&lt;/excludes&gt;
    &lt;/tableScopes&gt;

&lt;/Justdb&gt;
```

## 相关文档

- [类型层次结构](./type-hierarchy.md) - 详细的类型层次说明
- [别名系统](./alias-system.md) - 字段命名和别名支持
- [Schema 演进](./schema-evolution.md) - Schema 变更追踪机制
- [扩展点系统](./extension-points.md) - 动态扩展机制
- [模板系统设计](../template-system/overview.md) - SQL 生成模板系统
