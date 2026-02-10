# Reference System 引用系统设计

## 设计文档版本

**版本**: 1.0
**日期**: 2026-02-10
**作者**: JustDB Team
**状态**: 已实现

---------------------------

## 目录

1. [概述](#1-概述)
2. [核心概念](#2-核心概念)
3. [引用语法](#3-引用语法)
4. [属性合并规则](#4-属性合并规则)
5. [作用域规则](#5-作用域规则)
6. [使用场景](#6-使用场景)
7. [最佳实践](#7-最佳实践)

---------------------------

## 1. 概述

### 1.1 设计目标

Reference System（引用系统）允许在 Schema 中定义可复用组件，通过 `referenceId` 实现组件继承和复用。

**解决的问题**：
1. 消除重复定义（如每张表都要定义 id 列）
2. 统一标准列定义（如统一的时间戳列格式）
3. 支持组件继承和覆盖
4. 提高 Schema 可维护性

### 1.2 基本示例

```xml
<!-- 定义可复用列模板 -->
<Column id="global_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
<Column id="global_timestamp" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>

<!-- 引用全局列 -->
<Table name="users">
    <Column referenceId="global_id" name="id"/>
    <Column name="username" type="VARCHAR(50)"/>
    <Column referenceId="global_timestamp" name="created_at"/>
</Table>
```

---------------------------

## 2. 核心概念

### 2.1 引用类型

| 类型 | 说明 | 示例 |
|------|------|------|
| **Column 引用** | 复用列定义 | `<Column referenceId="global_id"/>` |
| **Constraint 引用** | 复用约束定义 | `<Constraint referenceId="fk_user"/>` |
| **Index 引用** | 复用索引定义 | `<Index referenceId="idx_created"/>` |
| **Table 片段引用** | 复用表中的列组 | `<Column referenceId="audit_columns.created_at"/>` |

### 2.2 支持的元素

所有支持 `id` 属性的 Schema 元素都支持引用：

```xml
<!-- Column 引用 -->
<Column id="pk_id" name="id" type="BIGINT" primaryKey="true"/>
<Column referenceId="pk_id"/>

<!-- Constraint 引用 -->
<Constraint id="fk_user" type="FOREIGN_KEY">
    <referencedTable>users</referencedTable>
</Constraint>
<Constraint referenceId="fk_user"/>

<!-- Index 引用 -->
<Index id="idx_created" name="idx_created_at">
    <column>created_at</column>
</Index>
<Index referenceId="idx_created"/>
```

### 2.3 定义位置

#### 全局定义

```xml
<Justdb>
    <!-- 全局定义，所有表都可以引用 -->
    <Column id="global_pk" name="id" type="BIGINT" primaryKey="true"/>

    <Table name="users">
        <Column referenceId="global_pk"/>
    </Table>

    <Table name="orders">
        <Column referenceId="global_pk"/>
    </Table>
</Justdb>
```

#### 局部定义

```xml
<Table name="users">
    <!-- 只在 users 表内可见 -->
    <Column id="local_col" name="status" type="VARCHAR(20)"/>
    <Column referenceId="local_col" name="user_status"/>
</Table>
```

---------------------------

## 3. 引用语法

### 3.1 基本引用

```xml
<!-- 完整引用 -->
<Column referenceId="global_id"/>

<!-- 覆盖名称 -->
<Column referenceId="global_id" name="user_id"/>

<!-- 覆盖多个属性 -->
<Column referenceId="global_id" name="user_id" autoIncrement="false"/>
```

### 3.2 命名空间引用

#### 点表示法

```xml
<!-- 使用点表示法引用命名空间的元素 -->
<Column referenceId="common.pk_id"/>
<Column referenceId="common.ts_created"/>

<!-- 引用抽象表中的列 -->
<Column referenceId="audit_columns.created_at"/>
<Column referenceId="audit_columns.updated_at"/>
```

#### XML 命名空间

```xml
<!-- 使用 xmlns 前缀 -->
<Column referenceId="pk_id" xmlns="common"/>
```

### 3.3 Table 片段引用

引用抽象表中的列：

```xml
<!-- 定义审计列组（抽象表不生成 DDL） -->
<Table id="audit_columns" abstract="true">
    <Column name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
    <Column name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"/>
    <Column name="created_by" type="BIGINT"/>
    <Column name="updated_by" type="BIGINT"/>
</Table>

<!-- 引用审计列 -->
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>
    <!-- 包含审计列 -->
    <Column referenceId="audit_columns.created_at"/>
    <Column referenceId="audit_columns.updated_at"/>
</Table>
```

---------------------------

## 4. 属性合并规则

### 4.1 合并优先级

| 引用属性 | 本地属性 | 合并结果 |
|---------|---------|---------|
| 未设置 | 未设置 | 使用引用定义 |
| 未设置 | 已设置 | **使用本地属性** |
| 已设置 | 未设置 | 使用引用属性 |
| 已设置 | 已设置 | **使用本地属性** |

**规则**：本地属性优先级更高

### 4.2 Column 引用示例

```xml
<!-- 定义 -->
<Column id="username" name="username" type="VARCHAR(50)" nullable="false" comment="User login name"/>

<!-- 完整引用 -->
<Column referenceId="username"/>
<!-- 结果: name=username, type=VARCHAR(50), nullable=false, comment="User login name" -->

<!-- 覆盖 name -->
<Column referenceId="username" name="login_name"/>
<!-- 结果: name=login_name, type=VARCHAR(50), nullable=false, comment="User login name" -->

<!-- 覆盖 type -->
<Column referenceId="username" type="VARCHAR(100)"/>
<!-- 结果: name=username, type=VARCHAR(100), nullable=false, comment="User login name" -->

<!-- 覆盖多个属性 -->
<Column referenceId="username" name="email" type="VARCHAR(255)" comment="Email address"/>
<!-- 结果: name=email, type=VARCHAR(255), nullable=false, comment="Email address" -->
```

### 4.3 Constraint 引用示例

```xml
<!-- 定义 -->
<Constraint id="fk_user" type="FOREIGN_KEY">
    <referencedTable>users</referencedTable>
    <referencedColumn>id</referencedColumn>
    <onDelete>CASCADE</onDelete>
</Constraint>

<!-- 引用并指定列 -->
<Constraint referenceId="fk_user">
    <column>created_by</column>
</Constraint>

<!-- 覆盖引用行为 -->
<Constraint referenceId="fk_user">
    <column>updated_by</column>
    <onDelete>SET NULL</onDelete>
</Constraint>
```

---------------------------

## 5. 作用域规则

### 5.1 作用域类型

#### 全局作用域

```xml
<Justdb>
    <!-- 全局定义，所有表都可以引用 -->
    <Column id="global_pk" name="id" type="BIGINT" primaryKey="true"/>

    <Table name="users">
        <Column referenceId="global_pk"/>
    </Table>

    <Table name="orders">
        <Column referenceId="global_pk"/>
    </Table>
</Justdb>
```

#### 表级作用域

```xml
<Justdb>
    <Table name="users">
        <!-- 只在 users 表内可见 -->
        <Column id="local_col" name="status" type="VARCHAR(20)"/>
        <Column referenceId="local_col" name="user_status"/>
    </Table>

    <Table name="orders">
        <!-- 错误：无法引用 users 表的 local_col -->
        <Column referenceId="local_col"/>  <!-- Error: reference not found -->
    </Table>
</Justdb>
```

### 5.2 引用解析顺序

1. **当前表内查找**：先在当前表的定义中查找
2. **全局查找**：当前表内找不到时，在全局定义中查找
3. **命名空间查找**：使用点表示法时，在指定命名空间中查找

```xml
<Justdb>
    <Column id="global_id" name="id" type="BIGINT"/>

    <Table name="users">
        <Column id="local_id" name="id" type="CHAR(36)"/>
        <!-- 引用当前表的定义 -->
        <Column referenceId="local_id"/>  <!-- 使用 CHAR(36) -->
    </Table>

    <Table name="orders">
        <!-- 引用全局定义 -->
        <Column referenceId="global_id"/>  <!-- 使用 BIGINT -->
    </Table>
</Justdb>
```

### 5.3 循环引用检测

JustDB 自动检测循环引用并报错：

```xml
<!-- ❌ 错误：循环引用 -->
<Column id="a" referenceId="b"/>
<Column id="b" referenceId="a"/>
<!-- Error: Circular reference detected -->

<!-- ✅ 正确：无循环引用 -->
<Column id="base" name="id" type="BIGINT"/>
<Column id="extended" referenceId="base" name="user_id"/>
```

---------------------------

## 6. 使用场景

### 6.1 场景 1: 主键复用

```xml
<!-- 定义标准主键 -->
<Column id="pk_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
<Column id="pk_uuid" name="id" type="CHAR(36)" primaryKey="true"/>

<!-- 使用自增 ID -->
<Table name="users">
    <Column referenceId="pk_id"/>
    <Column name="username" type="VARCHAR(50)"/>
</Table>

<!-- 使用 UUID -->
<Table name="products">
    <Column referenceId="pk_uuid"/>
    <Column name="name" type="VARCHAR(100)"/>
</Table>
```

### 6.2 场景 2: 时间戳列

```xml
<!-- 定义标准时间戳 -->
<Column id="ts_created" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
<Column id="ts_updated" name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"/>
<Column id="ts_deleted" name="deleted_at" type="TIMESTAMP"/>

<!-- 应用到所有表 -->
<Table name="users">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>
    <Column referenceId="ts_created"/>
    <Column referenceId="ts_updated"/>
    <Column referenceId="ts_deleted"/>
</Table>
```

### 6.3 场景 3: 约束模板

```xml
<!-- 定义标准约束 -->
<Constraint id="fk_user" type="FOREIGN_KEY">
    <referencedTable>users</referencedTable>
    <referencedColumn>id</referencedColumn>
    <onDelete>CASCADE</onDelete>
</Constraint>

<Constraint id="uk_email" type="UNIQUE">
    <column>email</column>
</Constraint>

<!-- 使用约束模板 -->
<Table name="orders">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="user_id" type="BIGINT"/>
    <Column name="email" type="VARCHAR(100)"/>

    <Constraint referenceId="fk_user">
        <column>user_id</column>
    </Constraint>
    <Constraint referenceId="uk_email"/>
</Table>
```

### 6.4 场景 4: 索引模板

```xml
<!-- 定义标准索引 -->
<Index id="idx_created" name="idx_created_at">
    <column>created_at</column>
</Index>

<Index id="idx_search" name="idx_search">
    <column>name</column>
    <column>status</column>
</Index>

<!-- 使用索引模板 -->
<Table name="products">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="name" type="VARCHAR(100)"/>
    <Column name="status" type="VARCHAR(20)"/>
    <Column name="created_at" type="TIMESTAMP"/>

    <Index referenceId="idx_created"/>
    <Index referenceId="idx_search"/>
</Table>
```

### 6.5 场景 5: 分层定义

```xml
<!-- 第一层：基础类型 -->
<Column id="base.int" type="INT"/>
<Column id="base.varchar50" type="VARCHAR(50)"/>
<Column id="base.timestamp" type="TIMESTAMP"/>

<!-- 第二层：业务列 -->
<Column id="common.username" referenceId="base.varchar50" nullable="false"/>
<Column id="common.email" referenceId="base.varchar50"/>
<Column id="common.created_at" referenceId="base.timestamp" defaultValue="CURRENT_TIMESTAMP"/>

<!-- 第三层：表特定 -->
<Column id="users.username" referenceId="common.username"/>

<!-- 使用 -->
<Table name="users">
    <Column referenceId="users.username"/>
</Table>
```

---------------------------

## 7. 最佳实践

### 7.1 命名规范

#### 使用前缀区分类型

```xml
<!-- 推荐的命名前缀 -->
<Column id="pk_id"/>           <!-- Primary Key -->
<Column id="fk_user"/>         <!-- Foreign Key -->
<Column id="uk_email"/>        <!-- Unique Key -->
<Column id="idx_created"/>     <!-- Index -->
<Column id="chk_status"/>      <!-- Check -->
```

#### 使用模块前缀

```xml
<!-- 模块化命名 -->
<Column id="auth.username"/>        <!-- Auth 模块 -->
<Column id="common.created_at"/>    <!-- Common 模块 -->
<Column id="user.profile_picture"/> <!-- User 模块 -->
```

### 7.2 组织结构

#### 按用途分组

```xml
<Justdb>
    <!-- 第一组：基础类型 -->
    <Column id="type.int" type="INT"/>
    <Column id="type.varchar50" type="VARCHAR(50)"/>
    <Column id="type.timestamp" type="TIMESTAMP"/>

    <!-- 第二组：标准列 -->
    <Column id="std.id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"/>
    <Column id="std.created_at" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
    <Column id="std.updated_at" name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"/>

    <!-- 第三组：业务列 -->
    <Column id="biz.username" name="username" type="VARCHAR(50)" nullable="false"/>
    <Column id="biz.email" name="email" type="VARCHAR(100)"/>
</Justdb>
```

#### 使用抽象表组织相关列

```xml
<!-- 定义抽象表（不生成 DDL） -->
<Table id="audit_table" abstract="true">
    <Column name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"/>
    <Column name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"/>
    <Column name="created_by" type="BIGINT"/>
    <Column name="updated_by" type="BIGINT"/>
</Table>

<!-- 继承抽象表 -->
<Table name="users" extends="audit_table">
    <Column name="id" type="BIGINT" primaryKey="true"/>
    <Column name="username" type="VARCHAR(50)"/>
</Table>
```

### 7.3 避免过度嵌套

```xml
<!-- ❌ 不推荐：过深的引用链 -->
<Column id="a" name="id" type="BIGINT"/>
<Column id="b" referenceId="a"/>
<Column id="c" referenceId="b"/>
<Column id="d" referenceId="c"/>
<Column referenceId="d"/>  <!-- 难以追踪 -->

<!-- ✅ 推荐：最多 3 层 -->
<Column id="base_id" name="id" type="BIGINT"/>
<Column id="user_id" referenceId="base_id" name="user_id"/>
<Column referenceId="user_id"/>
```

### 7.4 文档化引用

```xml
<!-- 为常用引用添加注释 -->
<!--
  Standard primary key column definitions
  标准主键列定义
-->
<Column id="pk.auto_int_id" name="id" type="BIGINT" primaryKey="true" autoIncrement="true"
        comment="Auto-increment ID (自增 ID)"/>
<Column id="pk.uuid_id" name="id" type="CHAR(36)" primaryKey="true"
        comment="UUID primary key (UUID 主键)"/>

<!--
  Audit columns for tracking record changes
  审计列：跟踪记录变更
-->
<Column id="audit.created_at" name="created_at" type="TIMESTAMP" defaultValue="CURRENT_TIMESTAMP"
        comment="Record creation time (记录创建时间)"/>
<Column id="audit.updated_at" name="updated_at" type="TIMESTAMP" defaultValueComputed="ON UPDATE CURRENT_TIMESTAMP"
        comment="Record update time (记录更新时间)"/>
```

---------------------------

## 附录

### A. 引用系统优势

1. **消除重复**：一次定义，多处使用
2. **统一标准**：确保列定义一致性
3. **易于维护**：修改定义自动影响所有引用
4. **灵活性**：支持属性覆盖
5. **类型安全**：编译时验证引用有效性

### B. 设计原则

1. **DRY 原则**：Don't Repeat Yourself
2. **单一职责**：每个引用定义只负责一个组件
3. **命名清晰**：使用描述性的 id 名称
4. **适度抽象**：避免过度抽象导致难以理解

### C. 与其他特性对比

| 特性 | Reference System | 抽象表继承 | 模板系统 |
|------|-----------------|-----------|---------|
| 作用范围 | 元素级 | 表级 | SQL 级 |
| 复用粒度 | 单个元素 | 多个元素 | SQL 片段 |
| 覆盖支持 | ✓ | ✓ | ✓ |
| 命名空间 | ✓ | ✗ | ✗ |

### D. 参考链接

- [速查手册: Reference System](../../cheatsheet/reference-system.md)
- [Column 参考](../../reference/schema/column.md)
- [Schema 定义](../../reference/schema/)
