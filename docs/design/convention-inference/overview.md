# 约定推断功能概述

## 简介

JustDB 基于约定俗成自动推断 schema 配置，减少用户重复输入。约定推断功能在 schema 加载时自动应用，遵循"配置优于约定"的原则，用户显式设置的值始终优先。

## 核心原则

### 优先级规则

```
用户显式设置 > referenceId 继承 > 约定推断 > 系统默认值
```

1. **用户显式设置**（最高优先级）：用户在 schema 文件中明确指定的值
2. **referenceId 继承**：通过 `referenceId` 从其他 item 继承的值
3. **约定推断**：基于命名约定的自动推断
4. **系统默认值**（最低优先级）：框架默认值

### 执行时机

约定推断在 schema 加载流程的以下阶段执行：

```
1. resolveReferences(justdb)    // 解析 referenceId，继承属性
2. generateAutoIds(justdb, ...)  // 生成自动 ID
3. applyConventions(justdb)      // 应用约定推断
```

**重要**：约定推断必须在 `referenceId` 解析**之后**执行，确保继承的值不会被覆盖。

---

## 约定列表

### A组 - 类型默认值

| # | 约定 | 自动推断 | 示例 |
|---|------|---------|------|
| A1 | `VARCHAR` | `VARCHAR(256)` | `<Column name="username" type="VARCHAR"/>` → `VARCHAR(256)` |
| A2 | `CHAR` | `CHAR(1)` | `<Column name="flag" type="CHAR"/>` → `CHAR(1)` |
| A3 | `NVARCHAR` | `NVARCHAR(256)` | `<Column name="name" type="NVARCHAR"/>` → `NVARCHAR(256)` |
| A4 | `DECIMAL` | `DECIMAL(10,2)` | `<Column name="price" type="DECIMAL"/>` → `DECIMAL(10,2)` |
| A5 | `NUMERIC` | `NUMERIC(10,2)` | `<Column name="amount" type="NUMERIC"/>` → `NUMERIC(10,2)` |
| A6 | `TIMESTAMP` | 添加 `DEFAULT CURRENT_TIMESTAMP` | `<Column name="created_at" type="TIMESTAMP"/>` |
| A7 | `DATETIME` | 添加 `DEFAULT CURRENT_TIMESTAMP` | `<Column name="updated_at" type="DATETIME"/>` |

**注意**：只对未指定长度/精度的类型应用推断。如果用户已指定（如 `VARCHAR(100)`），则不会覆盖。

### B组 - 主键命名约定

| # | 约定 | 自动推断 | 示例 |
|---|------|---------|------|
| B1 | 列名 `id` | `primaryKey=true`, `nullable=false` | `<Column name="id" type="BIGINT"/>` |
| B2 | 列名 `[table]_id` | `primaryKey=true`, `nullable=false` | `<Column name="user_id" type="BIGINT"/>` (在 `users` 表中) |

**注意**：
- 列名匹配不区分大小写（`id`、`ID`、`Id` 都匹配）
- 如果用户显式设置 `primaryKey="false"`，则不应用推断

### D组 - 布尔命名约定

| # | 约定 | 自动推断 | 示例 |
|---|------|---------|------|
| D1 | 列名 `is_*` | `BOOLEAN DEFAULT FALSE` | `<Column name="is_active"/>` → `BOOLEAN DEFAULT FALSE` |
| D2 | 列名 `has_*` | `BOOLEAN DEFAULT FALSE` | `<Column name="has_permission"/>` |
| D3 | 列名 `can_*` | `BOOLEAN DEFAULT FALSE` | `<Column name="can_edit"/>` |

### E组 - 其他命名约定

| # | 约定 | 自动推断 | 示例 |
|---|------|---------|------|
| E1 | 列名 `*_date` | `DATE` | `<Column name="birth_date"/>` → `DATE` |
| E2 | 列名 `*_time` | `TIME` | `<Column name="start_time"/>` → `TIME` |
| E3 | 列名 `*_status` | `VARCHAR(50)` | `<Column name="order_status"/>` → `VARCHAR(50)` |
| E4 | 列名 `*_count` | `INT DEFAULT 0` | `<Column name="view_count"/>` → `INT DEFAULT 0` |
| E5 | 列名 `email` | `VARCHAR(256)` | `<Column name="email"/>` → `VARCHAR(256)` |

---

## 使用示例

### 基础示例

```xml
<Justdb>
    <Table name="users">
        <!-- B1: id 列自动推断为主键 -->
        <Column name="id" type="BIGINT"/>

        <!-- A1: VARCHAR 自动补全为 VARCHAR(256) -->
        <Column name="username" type="VARCHAR"/>

        <!-- E5: email 自动推断为 VARCHAR(256) -->
        <Column name="email"/>

        <!-- D1: is_active 自动推断为 BOOLEAN DEFAULT FALSE -->
        <Column name="is_active"/>

        <!-- A6: TIMESTAMP 自动添加 DEFAULT CURRENT_TIMESTAMP -->
        <Column name="created_at" type="TIMESTAMP"/>
    </Table>
</Justdb>
```

### 禁用特定约定

```xml
<Table name="products">
    <!-- 用户显式设置，禁用主键推断 -->
    <Column name="id" type="BIGINT" primaryKey="false"/>

    <!-- 用户显式指定长度，不应用类型默认值 -->
    <Column name="name" type="VARCHAR(100)"/>
</Table>
```

### referenceId 继承优先

```xml
<Justdb>
    <!-- 定义全局 id 模板 -->
    <Column id="global_id" name="id" type="BIGINT" primaryKey="true" nullable="false"/>

    <Table name="users">
        <!-- 通过 referenceId 继承，不应用约定推断 -->
        <Column name="id" referenceId="global_id"/>
    </Table>
</Justdb>
```

---

## 实现细节

### 相关类

| 类 | 路径 | 说明 |
|---|------|------|
| `ConventionInferrer` | `org.verydb.justdb.util.ConventionInferrer` | 约定推断处理器 |
| `ConventionInferenceResult` | `org.verydb.justdb.util.ConventionInferenceResult` | 推断结果类 |
| `SchemaLoader` | `org.verydb.justdb.util.SchemaLoader` | Schema 加载器（集成推断） |

### 日志示例

```
DEBUG SchemaLoader - Convention inference applied: 1 primary keys, 1 NOT NULL, 3 types, 1 type defaults, 2 default values
DEBUG ConventionInferrer - Primary key inferred for column: id
DEBUG ConventionInferrer - NOT NULL inferred for column: id
DEBUG ConventionInferrer - Type 'BOOLEAN' inferred for column: is_active
DEBUG ConventionInferrer - Default value 'FALSE' set for column: is_active
DEBUG ConventionInferrer - Type 'VARCHAR(256)' inferred for column: email
DEBUG ConventionInferrer - Type default applied: VARCHAR → VARCHAR(256) for column: username
```

---

## 设计决策

### 为什么不在加载前应用约定推断？

约定推断必须在 `referenceId` 解析之后执行，原因如下：

1. **保持继承优先级**：用户通过 `referenceId` 显式继承的配置应该优先于约定推断
2. **避免意外覆盖**：如果先应用约定推断，可能会覆盖用户想要继承的配置
3. **符合直觉**：用户期望"继承 > 约定"的优先级顺序

### 为什么某些约定不实现？

以下约定经过讨论后决定**不实现**：

- **C组 - 时间戳命名约定**（`created_at`、`updated_at`）：用户希望显式控制时间戳行为
- **F组 - 自动索引约定**：索引是性能优化相关，应该由用户明确决定
- **B3 - 外键推断**：外键关系复杂，应该由用户显式定义

---

## 配置与扩展

当前实现不支持配置禁用特定约定。如果需要禁用某个约定，可以通过显式设置相关属性来实现。

---

## 参考文档

- [Column Schema](../../reference/schema/column.md) - Column 定义参考
- [Schema System](../schema-system/overview.md) - Schema 系统概述
